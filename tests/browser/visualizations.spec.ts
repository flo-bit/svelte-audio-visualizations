import { expect, test } from '@playwright/test';

const base = '/svelte-audio-visualizations';

test('demo supports native music, stopping and restarting without duplicate media nodes', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(`${base}/`);
	await expect(page.locator('canvas')).toHaveCount(5);
	await expect(page.locator('audio')).toBeHidden();
	for (let i = 0; i < 2; i++) {
		await page.getByRole('button', { name: 'start music', exact: true }).click();
		await expect(page.getByRole('button', { name: 'stop music', exact: true })).toBeEnabled();
		await expect
			.poll(() => page.locator('audio').evaluate((audio) => !(audio as HTMLAudioElement).paused))
			.toBe(true);
		await page.getByRole('button', { name: 'stop music', exact: true }).click();
		await expect(page.getByRole('button', { name: 'start music', exact: true })).toBeVisible();
	}
	await expect(page.getByRole('alert')).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('microphone permission errors are visible and leave the controls usable', async ({
	page,
	context
}) => {
	await context.clearPermissions();
	await page.goto(`${base}/`);
	await page.getByRole('button', { name: 'start microphone', exact: true }).click();
	await expect(page.getByRole('alert')).toBeVisible();
	await expect(page.getByRole('button', { name: 'start music', exact: true })).toBeEnabled();
});

test.describe('native component lifecycle', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://127.0.0.1:4174/');
		await expect(page.getByRole('button', { name: 'start analyser', exact: true })).toBeVisible();
	});

	test('renders live analyser frames, reacts to options and cleans up without closing borrowed contexts', async ({
		page
	}) => {
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await page.getByRole('button', { name: 'start analyser', exact: true }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		await page.getByRole('button', { name: 'change bands' }).click();
		await expect(page.getByTestId('bands')).toHaveText('8');
		await page.getByRole('button', { name: 'mute gain' }).click();
		await expect(page.getByTestId('level')).toHaveText('0.000');
		await page.getByRole('button', { name: 'toggle mounted' }).click();
		await expect(page.getByTestId('level')).toHaveCount(0);
		await page.getByRole('button', { name: 'inspect ownership' }).click();
		await expect(page.getByTestId('inspection')).toHaveText('running:no-stream');
		await page.getByRole('button', { name: 'toggle mounted' }).click();
		await expect(page.getByTestId('level')).toBeVisible();
		await expect(page.getByTestId('error')).toBeEmpty();
		expect(errors).toEqual([]);
	});

	test('stream analysis never stops caller tracks and can switch back to a borrowed analyser', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'start stream', exact: true }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		await page.getByRole('button', { name: 'toggle mounted' }).click();
		await page.getByRole('button', { name: 'inspect ownership' }).click();
		await expect(page.getByTestId('inspection')).toHaveText('running:live');
		await page.getByRole('button', { name: 'toggle mounted' }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		await page.getByRole('button', { name: 'start analyser', exact: true }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		await page.getByRole('button', { name: 'clear source' }).click();
		await expect(page.getByTestId('level')).toHaveText('0.000');
		await expect(page.getByTestId('error')).toBeEmpty();
	});

	test('suspends inactive loops and restarts on context resume', async ({ page }) => {
		await page.getByRole('button', { name: 'start analyser', exact: true }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		await page.getByRole('button', { name: 'suspend context' }).click();
		await expect(page.getByTestId('level')).toHaveText('0.000');
		await page.getByRole('button', { name: 'resume context' }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		await page.getByRole('button', { name: 'toggle active' }).click();
		await expect(page.getByTestId('level')).toHaveText('0.000');
		await page.getByRole('button', { name: 'toggle active' }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
	});

	test('does not resize backing storage every frame; handles resize and custom values', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'start analyser', exact: true }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		const canvas = page.getByTestId('analysis').locator('canvas');
		await expect(canvas).toHaveAttribute('width', '200');
		const mutations = await canvas.evaluate(async (element) => {
			let count = 0;
			const observer = new MutationObserver((records) => {
				count += records.length;
			});
			observer.observe(element, { attributes: true, attributeFilter: ['width', 'height'] });
			await new Promise((resolve) => setTimeout(resolve, 250));
			observer.disconnect();
			return count;
		});
		expect(mutations).toBe(0);
		await page.getByRole('button', { name: 'resize', exact: true }).click();
		await expect(canvas).toHaveAttribute('width', '300');
		const pure = page.getByTestId('pure').locator('canvas');
		const before = await pure.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
		await page.getByRole('button', { name: 'change values' }).click();
		await expect
			.poll(() => pure.evaluate((element) => (element as HTMLCanvasElement).toDataURL()))
			.not.toBe(before);
	});

	test('honors FPS limits and reduced-motion preferences', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.getByRole('button', { name: 'start analyser', exact: true }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		const canvas = page.getByTestId('analysis').locator('canvas');
		const countDraws = () =>
			canvas.evaluate(async (element) => {
				const context = (element as HTMLCanvasElement).getContext('2d')!;
				const original = context.clearRect;
				let draws = 0;
				context.clearRect = function (...args) {
					draws++;
					original.apply(this, args);
				};
				await new Promise((resolve) => setTimeout(resolve, 600));
				context.clearRect = original;
				return draws;
			});
		const reduced = await countDraws();
		expect(reduced).toBeGreaterThan(0);
		expect(reduced).toBeLessThanOrEqual(7);
		await page.getByRole('button', { name: 'slow down' }).click();
		const limited = await countDraws();
		expect(limited).toBeGreaterThan(0);
		expect(limited).toBeLessThanOrEqual(4);
	});

	test('pauses on page visibility changes and resumes with live values', async ({ page }) => {
		await page.getByRole('button', { name: 'start analyser', exact: true }).click();
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
		await page.evaluate(() => {
			Object.defineProperty(document, 'hidden', { configurable: true, value: true });
			document.dispatchEvent(new Event('visibilitychange'));
		});
		await expect(page.getByTestId('level')).toHaveText('0.000');
		await page.evaluate(() => {
			Object.defineProperty(document, 'hidden', { configurable: true, value: false });
			document.dispatchEvent(new Event('visibilitychange'));
		});
		await expect
			.poll(async () => Number(await page.getByTestId('level').textContent()))
			.toBeGreaterThan(0.1);
	});

	test('multiple glow filters and icon masks have unique IDs', async ({ page }) => {
		const ids = await page
			.locator('filter, mask')
			.evaluateAll((elements) => elements.map((element) => element.id));
		expect(ids).toHaveLength(4);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
