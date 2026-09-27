import { defineConfig, devices } from "@playwright/test";

// Smoke tests: sign in, the Tasks board, undo, privacy of dashboard pages.
// They run against a production build with a throwaway SQLite database
// (prisma/test.db, filled with the demo seed) and a test-only passcode, so
// they never touch real data. Run with `npm run test:e2e`.
const PORT = 3100;
export const PASSCODE = "e2e-test-passcode";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://dash.localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 950 }
  },
  webServer: {
    command: `npx prisma db push --skip-generate --force-reset && npx tsx prisma/seed.ts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: "file:./test.db",
      DASHBOARD_PASSWORD: PASSCODE,
      AUTH_SECRET: "e2e-only-signing-secret",
      TURSO_DATABASE_URL: "",
      BLOB_READ_WRITE_TOKEN: ""
    }
  }
});
