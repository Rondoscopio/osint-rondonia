import { expect, test } from '@playwright/test';

test('a ilustração decorativa respeita a pausa salva e movimento reduzido', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('./sobre/');
  const artwork = page.locator('[data-artwork="lighthouse"]');
  const beam = artwork.locator('.beam');
  await expect(artwork).toHaveAttribute('aria-hidden', 'true');
  await expect(artwork).toHaveCSS('pointer-events', 'none');
  await expect(beam).toHaveCSS('animation-play-state', 'running');
  const pause = page.getByRole('button', { name: 'Pausar ilustrações' });
  await pause.click();
  await expect(beam).toHaveCSS('animation-play-state', 'paused');
  await page.reload();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await expect(beam).toHaveCSS('animation-play-state', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(beam).toHaveCSS('animation-name', 'none');
  await expect(pause).toBeHidden();
});
