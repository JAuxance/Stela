// Generates .env from a downloaded Google OAuth client JSON.
// Usage: node scripts/env-from-google-json.mjs <path-to-client_secret_*.json>
// The secret stays local — .env is git-ignored.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node scripts/env-from-google-json.mjs <client_secret.json>");
  process.exit(1);
}
if (!existsSync(jsonPath)) {
  console.error(`File not found: ${jsonPath}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const creds = data.installed ?? data.web;
if (!creds?.client_id || !creds?.client_secret) {
  console.error("JSON missing installed/web client_id or client_secret. Is this a Desktop OAuth client?");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const body = `# Generated from a Google OAuth Desktop client JSON. Do not commit.
VITE_GOOGLE_CLIENT_ID=${creds.client_id}
VITE_GOOGLE_CLIENT_SECRET=${creds.client_secret}
`;
writeFileSync(envPath, body);
console.log(`[env] wrote ${envPath}`);
console.log(`[env] client_id starts with: ${creds.client_id.slice(0, 14)}…`);
