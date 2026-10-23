import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4200',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env['CHROME_BIN'] || '/usr/bin/brave-browser',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        }
      },
    },
  ],
});
