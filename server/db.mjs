import { DatabaseSync } from "node:sqlite";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { createSeedState } from "./seed.mjs";
import { ApiError, validateState } from "./validation.mjs";
import { stateEtag } from "./etag.mjs";

export function createDatabase(filename = ":memory:") {
  if (filename !== ":memory:")
    mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  try {
    db.exec("PRAGMA busy_timeout = 3000; PRAGMA synchronous = FULL;");
    if (filename !== ":memory:") db.exec("PRAGMA journal_mode = WAL;");
    const version = db.prepare("PRAGMA user_version").get().user_version;
    if (version > 1)
      throw new Error(
        "数据库版本高于当前程序版本，请先更新程序；现有数据未被修改。",
      );
    db.exec(
      "CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL); PRAGMA user_version = 1;",
    );
    if (!db.prepare("SELECT id FROM workspace WHERE id = 1").get()) {
      db.prepare(
        "INSERT INTO workspace (id, payload, updated_at) VALUES (1, ?, ?)",
      ).run(
        JSON.stringify(validateState(createSeedState())),
        new Date().toISOString(),
      );
    }
    const readState = () =>
      JSON.parse(
        db.prepare("SELECT payload FROM workspace WHERE id = 1").get().payload,
      );
    validateState(readState());
    let closed = false;
    return {
      readState,
      mutate(updater, { ifMatch } = {}) {
        db.exec("BEGIN IMMEDIATE");
        try {
          const previous = readState();
          if (ifMatch !== undefined && ifMatch !== stateEtag(previous)) {
            throw new ApiError(
              409,
              "工作区已在其他窗口更新，已为你刷新，请重试本次操作。",
            );
          }
          const state = validateState(updater(previous) ?? previous);
          db.prepare(
            "UPDATE workspace SET payload = ?, updated_at = ? WHERE id = 1",
          ).run(JSON.stringify(state), new Date().toISOString());
          db.exec("COMMIT");
          return state;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
      close() {
        if (!closed) {
          closed = true;
          db.close();
        }
      },
    };
  } catch (error) {
    db.close();
    throw error;
  }
}
