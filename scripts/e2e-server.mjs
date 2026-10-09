import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startServer } from "../server/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const controlFile = resolve(root, "output", "qa", "e2e-control.json");
const origin = "http://127.0.0.1:4178";

// This file is also the Playwright global teardown. The private test-only endpoint
// lets Windows close SQLite before removing its temporary directory.
export default async function teardown() {
  if (!existsSync(controlFile)) return;
  const control = JSON.parse(await readFile(controlFile, "utf8"));
  try {
    const response = await fetch(`${origin}/__e2e_shutdown`, {
      method: "POST",
      headers: { "x-e2e-token": control.token },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok)
      throw new Error(`Test server shutdown returned ${response.status}`);
    for (let attempt = 0; attempt < 50 && existsSync(controlFile); attempt++) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
  } catch (error) {
    // Do not remove an open database or any non-test path if shutdown failed.
    console.error(
      "Unable to shut down the isolated test server:",
      error.message,
    );
    throw error;
  }
  if (existsSync(controlFile))
    throw new Error("Isolated test server did not finish cleaning up.");
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "rpg-ai-helper-e2e-"));
  const token = randomUUID();
  let app;
  let closing = false;
  const cleanup = async () => {
    if (closing) return;
    closing = true;
    if (app) await app.close();
    const withinTemp = relative(resolve(tmpdir()), temporaryRoot);
    if (
      !withinTemp ||
      isAbsolute(withinTemp) ||
      withinTemp.startsWith(`..${sep}`) ||
      !withinTemp.startsWith("rpg-ai-helper-e2e-")
    ) {
      throw new Error(
        "Refusing to remove a path outside the isolated test directory.",
      );
    }
    await rm(temporaryRoot, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
    if (existsSync(controlFile)) {
      const saved = JSON.parse(await readFile(controlFile, "utf8"));
      if (saved.token === token) await rm(controlFile);
    }
  };
  try {
    if (!existsSync(resolve(root, "dist", "index.html")))
      throw new Error("Build the frontend before running browser tests.");
    app = await startServer({
      port: 4178,
      databasePath: resolve(temporaryRoot, "workspace.sqlite"),
      distDir: resolve(root, "dist"),
    });
    const handlers = app.server.listeners("request");
    app.server.removeAllListeners("request");
    app.server.on("request", (request, response) => {
      if (request.url === "/__e2e_shutdown") {
        if (
          request.method !== "POST" ||
          request.headers["x-e2e-token"] !== token
        ) {
          response.writeHead(403).end();
          return;
        }
        response
          .writeHead(200, { "Content-Type": "application/json" })
          .end('{"ok":true}');
        setImmediate(
          () =>
            void cleanup().catch((error) => {
              console.error(error);
              process.exitCode = 1;
            }),
        );
        return;
      }
      for (const handler of handlers)
        handler.call(app.server, request, response);
    });
    await mkdir(dirname(controlFile), { recursive: true });
    await writeFile(
      controlFile,
      JSON.stringify({ token, temporaryRoot, seed: app.database.readState() }),
      "utf8",
    );
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(
        signal,
        () =>
          void cleanup().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          }),
      );
    }
    console.log(`Isolated browser-test server ready at ${origin}`);
  } catch (error) {
    await cleanup();
    throw error;
  }
}
