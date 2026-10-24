import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/browser',
	use: { baseURL: 'http://127.0.0.1:4173', ...devices['Desktop Chrome'] },
	webServer: [
		{
			command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
			url: 'http://127.0.0.1:4173/svelte-audio-visualizations/',
			reuseExistingServer: !process.env.CI
		},
		{
			command:
				'npx vite --config tests/browser/vite.config.ts --host 127.0.0.1 --port 4174 --strictPort',
			url: 'http://127.0.0.1:4174/',
			reuseExistingServer: !process.env.CI
		}
	]
});
