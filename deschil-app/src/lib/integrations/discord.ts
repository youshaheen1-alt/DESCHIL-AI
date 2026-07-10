/**
 * Discord interactions helper — verifies Ed25519 signatures on incoming
 * webhook interactions. This is the HTTP-interactions path (slash commands,
 * buttons); a persistent gateway process is out of scope for a serverless
 * Node runtime.
 */
import { createPublicKey, verify } from "node:crypto";

export function verifyDiscordSignature(
  publicKeyHex: string | undefined,
  signatureHex: string | null,
  timestamp: string | null,
  rawBody: string,
): boolean {
  if (!publicKeyHex || !signatureHex || !timestamp) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(publicKeyHex, "hex"),
      ]),
      format: "der",
      type: "spki",
    });
    const message = Buffer.from(timestamp + rawBody);
    const sig = Buffer.from(signatureHex, "hex");
    return verify(null, message, key, sig);
  } catch {
    return false;
  }
}
