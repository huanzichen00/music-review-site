import { expect, test } from '@playwright/test';

const mockArtists = [
  {
    id: 1,
    name: 'The Beatles',
    country: 'UK',
    formedYear: 1960,
    genre: 'Rock',
    memberCount: 4,
    status: '解散',
  },
  {
    id: 2,
    name: 'Queen',
    country: 'UK',
    formedYear: 1970,
    genre: 'Rock',
    memberCount: 4,
    status: '活跃',
  },
  {
    id: 3,
    name: '告五人',
    country: '华语',
    formedYear: 2017,
    genre: 'Indie Pop',
    memberCount: 3,
    status: '活跃',
  },
];

test('guess band page supports autocomplete and renders compare row', async ({ page }) => {
  await page.route('**/api/artists', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockArtists),
    });
  });

  await page.goto('/music/guess-band');
  await expect(page.getByRole('heading', { name: '猜乐队' })).toBeVisible();
  await expect(page.getByText('乐队库 3 支')).toBeVisible();

  const input = page.getByPlaceholder('输入乐队名，例如：Radiohead / Queen / The Beatles');
  await input.fill('Queen');
  await page.getByRole('button', { name: '提交猜测' }).click();

  await expect(page.getByRole('cell', { name: 'Queen' })).toBeVisible();
  await expect(page.getByRole('cell', { name: /活跃/ })).toBeVisible();
});
