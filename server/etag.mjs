import { createHash } from "node:crypto";

export function stateEtag(state) {
  return `"${createHash("sha256").update(JSON.stringify(state), "utf8").digest("hex")}"`;
}
