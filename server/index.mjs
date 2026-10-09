import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { createDatabase } from "./db.mjs";
import { createApp } from "./app.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function startServer({
  port = 4174,
  databasePath = resolve(projectRoot, "data", "workspace.sqlite"),
  distDir = resolve(projectRoot, "dist"),
} = {}) {
  const database = createDatabase(databasePath);
  const server = createApp({ database, distDir });
  try {
    await new Promise((resolveStart, rejectStart) => {
      server.once("error", rejectStart);
      server.listen(port, "127.0.0.1", () => {
        server.removeListener("error", rejectStart);
        resolveStart();
      });
    });
  } catch (error) {
    database.close();
    throw error;
  }
  return {
    server,
    database,
    async close() {
      const force = setTimeout(() => server.closeAllConnections(), 5000);
      force.unref();
      try {
        await new Promise((resolveClose, rejectClose) =>
          server.close((error) =>
            error ? rejectClose(error) : resolveClose(),
          ),
        );
      } finally {
        clearTimeout(force);
        database.close();
      }
    },
  };
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const app = await startServer();
    console.log("RPG AI Helper 已启动：http://127.0.0.1:4174");
    console.log("数据保存在 data/workspace.sqlite；按 Ctrl+C 安全退出。");
    let closing = false;
    const stop = async () => {
      if (closing) return;
      closing = true;
      try {
        await app.close();
        process.exitCode = 0;
      } catch (error) {
        console.error("关闭服务失败：", error.message);
        process.exitCode = 1;
      }
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  } catch (error) {
    console.error(
      error.code === "EADDRINUSE"
        ? "4174 端口已被占用。请检查是否已有本项目在运行。"
        : `服务启动失败：${error.message}`,
    );
    process.exitCode = 1;
  }
}
