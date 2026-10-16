import { createClient } from "@libsql/client";
import { TEST_DATABASE_URL } from "../playwright.config";

// Removes every passkey from the test server's database, so a spec that enrolls one cannot
// leak it into the next spec. The server reads passkeys on every request, so this takes
// effect at once, without a restart.
export async function clearPasskeys() {
  const client = createClient({ url: TEST_DATABASE_URL });
  try {
    await client.execute(`DELETE FROM "Passkey"`);
  } finally {
    client.close();
  }
}
