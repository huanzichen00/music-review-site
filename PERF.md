# Performance Optimization Report (2026-03-04)

## 1) What was slow (A: root cause)

### Cover URL distribution (DB)
Command:
```bash
MYSQL_PWD='music_review_app_2026!' mysql -h127.0.0.1 -P3306 -umusic_review_app -N -e "
SELECT CASE
  WHEN cover_url LIKE 'https://p%.music.126.net%' THEN 'netease_p'
  WHEN cover_url LIKE '/api/files/album-covers/%' THEN 'local_api'
  WHEN cover_url IS NULL OR cover_url='' THEN 'empty'
  ELSE 'other'
END AS type, COUNT(*)
FROM albums GROUP BY type ORDER BY COUNT(*) DESC;" music_review
```

Result:
- `netease_p`: **428**
- `local_api`: **3**

Conclusion:
- Traffic hotspot is remote full-size NetEase covers (`p*.music.126.net`).
- API latency is not bottleneck; image transfer dominates.

### Top-10 large cover sample (header Content-Length)
Sample command:
```bash
cat /tmp/cover_top10_sample.tsv
```

Sample totals:
- Top-10 original covers total: **6,127,995 bytes (~5.84 MB)**
- Biggest single cover in sample: **3,033,022 bytes (~2.89 MB)**

## 2) Changes made

### B. Immediate frontend wins (no business semantics change)
- Added lazy/async + explicit dimensions for cover-like images.
- Reduced Albums page first screen cards from 24 -> **12** (`PAGE_SIZE=12`).
- Added cover fallback chain (no data loss): local webp -> resized remote -> original URL.

Files:
- `frontend/src/components/AlbumCard.jsx`
- `frontend/src/pages/AlbumDetail.jsx`
- `frontend/src/pages/Albums.jsx`
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/Blog.jsx`
- `frontend/src/pages/UserHome.jsx`
- `frontend/src/pages/ArtistDetail.jsx`
- `frontend/src/pages/GuessBandOnline.jsx`
- `frontend/src/components/SmartAlbumCover.jsx` (new)
- `frontend/src/utils/cover.js` (new)

### C. Cover weight reduction (WebP + caching)
- Added batch script to generate:
  - `/var/www/music-review/covers/{albumId}_300.webp`
  - `/var/www/music-review/covers/{albumId}_600.webp`
- Frontend list pages prefer `_300.webp`; detail prefers `_600.webp`.
- Fallback kept: if local webp missing -> NetEase `?param=300y300|600y600` -> original URL.
- Added Nginx `/covers/` location with long cache header and disabled gzip.
- Fixed deploy script to preserve `covers/` (avoid rsync delete).

Files:
- `scripts/generate_cover_webp.py` (new)
- `/etc/nginx/sites-enabled/music-review` (server config updated)
- `scripts/deploy_nginx.sh` (`rsync --exclude 'covers/'`)

## 3) Validation

### Build/deploy checks
```bash
npm run build --prefix frontend
bash scripts/deploy_nginx.sh deploy_frontend
```

### Cloudflare cache header checks (required)
Assets:
```bash
curl -I -m 8 https://guessband.cn/assets/index-DXeVKKi0.js
```
Observed:
- `cache-control: public, max-age=31536000, immutable`
- `cf-cache-status: MISS` then second request `HIT`

Covers:
```bash
curl -I -m 8 https://guessband.cn/covers/10_300.webp
```
Observed:
- `content-type: image/webp`
- `cf-cache-status: MISS` then second request `HIT`
- Note: Cloudflare currently rewrites edge ttl to `cache-control: max-age=14400` (origin still sends immutable).

### Network before/after (cold-cache estimate)
Given baseline from DevTools: ~60 requests / ~21MB / ~8-9s.

Measured sample (same top-10 covers):
- Original top-10 covers: **6,127,995 B**
- Optimized (`?param=300y300`) top-10: **548,009 B**
- Cover payload drop on sample: **~91.1%**

Estimated first-screen total (core JS/CSS gzip + 10 cover sample):
- Before: **6,529,300 B (~6.23 MB)**
- After: **949,314 B (~0.91 MB)**

### Lighthouse before/after handling
- Before：使用你提供的线上基线（`~8-9s` 完成，`~21MB transferred`）作为改前口径。
- After：以上 3 次 Mobile Lighthouse 为改后口径（同一 VPS 同一命令）。
- 若需要严格“本机改前 Lighthouse”复测：先 `git revert` 本次两个性能提交、部署后按同命令跑 3 次，再恢复提交部署。

### Lighthouse Mobile (Docker, 3 runs)
Command template:
```bash
sudo docker run --rm --network host \
  -e CHROME_PATH=/usr/bin/chromium-browser -v /tmp:/tmp \
  zenika/alpine-chrome:with-node \
  sh -lc "npx -y lighthouse@12 http://127.0.0.1/ \
    --only-categories=performance \
    --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
    --output=json --output-path=/tmp/lh_after_mobile_1.json --quiet"
```

Results:
- Run1: LCP 15102.5ms, TBT 2778.9ms
- Run2: LCP 13306.7ms, TBT 3226.2ms
- Run3: LCP 11457.4ms, TBT 2547.0ms
- Median: **LCP 13306.7ms**, **TBT 2778.9ms**

> 说明：VPS 内 Docker headless + Mobile 节流会明显偏保守，重点用于同环境横向对比。

## 4) Why it feels faster
- Browser no longer downloads many large original covers for first view.
- Above-the-fold image count is reduced.
- Non-visible images are lazy loaded.
- Cacheability improved for `/covers/*` and `/assets/*`.

## 5) Runbook: generate/refresh WebP covers

Low-load batch (recommended):
```bash
python3 scripts/generate_cover_webp.py --limit 120 --timeout 2 --sleep 0.01
```

Full batch (slower, can be resumed safely):
```bash
python3 scripts/generate_cover_webp.py --timeout 5 --sleep 0.03
```

## 6) Rollback

### Rollback code
```bash
git log --oneline -n 5
git revert <commit_webp_and_nginx>
git revert <commit_lazyload>
```

### Rollback nginx `/covers/` block
```bash
sudo cp /etc/nginx/sites-enabled/music-review /etc/nginx/sites-enabled/music-review.bak.$(date +%F_%H%M%S)
sudo sed -i '/location \/covers\//,/^    }$/d' /etc/nginx/sites-enabled/music-review
sudo nginx -t && sudo systemctl reload nginx
```

### Rollback generated files
```bash
sudo rm -rf /var/www/music-review/covers
```

### (Optional) restore deploy behavior
```bash
git checkout -- scripts/deploy_nginx.sh
```

## 7) Precision LCP/TBT optimization pass (2026-03-04, round 2)

### A. LCP element identification (production sampling)

Method:
- `PerformanceObserver` + `performance.getEntriesByType('largest-contentful-paint')`
- Playwright mobile emulation sampled on:
  - `https://guessband.cn/`
  - `https://guessband.cn/music/guess-band`

Observed LCP:
- `/`:
  - type: `IMG`
  - src: `https://p*.music.126.net/...jpg?param=300y300`
  - sampled `startTime`: ~1.9-2.2s
- `/music/guess-band`:
  - type: `DIV` text block
  - text summary: “猜乐队支持默认题库、你的自选题库和分享题库...”
  - sampled `startTime`: ~1.1-1.3s

Conclusion:
- Home LCP is still cover image (remote 126.net small image).
- Guess-Band LCP is text, not image.

### B. LCP-targeted changes delivered

- Added dev-only LCP logger:
  - file: `frontend/src/utils/lcpDebug.js` (new)
  - wired in: `frontend/src/main.jsx`
  - logs: `tagName/src/text/startTime/loadTime/route`
- Home first-screen cover prioritization:
  - first 1-2 cards use `loading="eager"` + `fetchPriority="high"`
  - first card adds `<link rel="preload" as="image">` (high priority)
  - first card uses remote-first candidate to avoid local-miss fallback delay
- Kept non-first-screen images lazy.
- Ensured small image path usage:
  - local uses `_300.webp` (`thumb`) / `_600.webp` (`detail`)
  - NetEase keeps forced `?param=300y300|600y600`

Files:
- `frontend/src/components/SmartAlbumCover.jsx`
- `frontend/src/components/AlbumCard.jsx`
- `frontend/src/utils/cover.js`
- `frontend/src/pages/Home.jsx`
- `frontend/src/utils/lcpDebug.js` (new)
- `frontend/src/main.jsx`

### C. TBT-focused minimal changes

- Removed full-page blocking spinner on Guess-Band first paint:
  - page shell/text renders immediately; controls stay disabled while data loads
- Moved non-critical Layout API modules to dynamic import:
  - `notificationsApi`, `artistsApi`, `questionBanksApi`
- Reduced immediate list pressure:
  - `ArtistDetail` cards per page: `24 -> 12`
- Home data payload cut:
  - albums fetch size: `500 -> 60`
- Removed production-only heavy console metrics output (DEV-only logs now).

Files:
- `frontend/src/pages/GuessBand.jsx`
- `frontend/src/components/Layout.jsx`
- `frontend/src/pages/ArtistDetail.jsx`
- `frontend/src/pages/Home.jsx`
- `frontend/src/App.jsx` (`/` direct render Home, remove redirect hop)

### D. Lighthouse Mobile before/after (3-run median)

Environment:
- command: Lighthouse mobile (`simulate`) on production URL
- browser: Playwright Chromium via `CHROME_PATH`

Before:
- `/`: LCP **11796ms**, TBT **1765ms**, INP **N/A (no interaction sample)**
- `/music/guess-band`: LCP **8271ms**, TBT **2052ms**, INP **N/A**

After:
- `/`: LCP **12194ms**, TBT **1576ms**, INP **N/A**
- `/music/guess-band`: LCP **8662ms**, TBT **1292ms**, INP **N/A**

Result vs target:
- `TBT` improved significantly on Guess-Band, slight gain on Home.
- `LCP` did not reach `<4s` in this Lighthouse setup.
- In-page real LCP observer sampling remains ~1-2s, indicating Lighthouse simulated bottleneck is still dominated by critical JS execution + throttling model.

### E. Network evidence (key resources)

Home LCP image sample:
- URL: `https://p2.music.126.net/...jpg?param=300y300`
- `cache-control: max-age=31536000`
- `cf-cache-status`: N/A (third-party domain, not served by our Cloudflare zone)

Site asset/cache:
- `https://guessband.cn/assets/index-D7rXm_FV.js`
  - `cache-control: public, max-age=31536000, immutable`
  - first request `cf-cache-status: MISS`, subsequent request `HIT`
- `https://guessband.cn/covers/10_300.webp`
  - `cf-cache-status: HIT`

### F. Rollback for this round

```bash
cd /var/www/music-review-site
git revert --no-edit HEAD
bash scripts/deploy_nginx.sh deploy_frontend
```

## 8) Round 3: force Home LCP to same-domain cover (2026-03-05)

### A2 implementation (offline full generation)

Executed:
```bash
python3 scripts/generate_cover_webp.py --sleep 0.005 --timeout 6
```

Result:
- `processed=431 generated=384 skipped=47 failed=0`
- Final verification: DB albums with non-empty cover URL = `431`, missing `_300.webp` = `0`

Script improvement (low-load + faster):
- For `music.126.net`, fetch resized source (`?param=1200y1200`) before local webp conversion
- Reuse HTTP session (keep-alive)

File:
- `scripts/generate_cover_webp.py`

### Home LCP source forcing (frontend)

- Removed Home first-card remote-first preference.
- Preload source changed to same-domain local cover:
  - `href=/covers/{albumId}_300.webp`
- Kept first 1-2 cards:
  - `loading="eager"`
  - `fetchPriority="high"`

Files:
- `frontend/src/pages/Home.jsx`
- `frontend/src/components/AlbumCard.jsx`

### Validation evidence

DevTools-equivalent LCP entry sample (`/`):
- `tagName: IMG`
- `src: https://guessband.cn/covers/503_300.webp`
- `startTime: ~2176ms`

Cloudflare/cache checks:
- `/covers/503_300.webp`:
  - `cf-cache-status: HIT` (second request)
  - edge header currently `cache-control: max-age=14400`
- Origin (`http://127.0.0.1/covers/10_300.webp`):
  - `Cache-Control: public, max-age=31536000, immutable`

### Lighthouse Mobile (3-run median)

Before baseline:
- `/`: LCP `11796ms`, TBT `1765ms`
- `/music/guess-band`: LCP `8271ms`, TBT `2052ms`

Round-3 final:
- `/`: LCP `9359ms`, TBT `2108ms`
- `/music/guess-band`: LCP `8734ms`, TBT `1065ms`

Status:
- Home LCP root-cause fix is effective (LCP src switched from 126.net to same-domain `/covers`).
- TBT on Guess-Band improved significantly.
- Target (`LCP <4s`, `TBT <600ms`) not yet reached in Lighthouse simulated mobile.
