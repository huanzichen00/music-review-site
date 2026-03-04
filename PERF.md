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
