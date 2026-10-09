import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const children = new Set();
let shuttingDown = false;
const wait = (duration) => new Promise((done) => setTimeout(done, duration));

async function portIsOpen(port) {
  return new Promise((done) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (open) => {
      socket.destroy();
      done(open);
    };
    socket.setTimeout(500);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

async function hasWorkspaceApi() {
  try {
    const response = await fetch("http://127.0.0.1:4174/api/health", {
      signal: AbortSignal.timeout(1000),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return body.ok === true && body.app === "rpg-ai-helper";
  } catch {
    return false;
  }
}

async function stop(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const owned = [...children];
  for (const child of owned)
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGTERM");
  await Promise.race([
    Promise.all(
      owned.map((child) =>
        child.exitCode !== null || child.signalCode !== null
          ? Promise.resolve()
          : new Promise((done) => child.once("exit", done)),
      ),
    ),
    wait(4000),
  ]);
  for (const child of owned)
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGKILL");
  process.exit(code);
}

function run(name, args) {
  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: true,
  });
  children.add(child);
  child.once("error", (error) => {
    console.error(`${name} 启动失败：${error.message}`);
    void stop(1);
  });
  child.once("exit", (code, signal) => {
    children.delete(child);
    if (!shuttingDown) {
      console.error(
        `${name} 已退出（${signal ?? code ?? "未知原因"}），正在关闭本次启动的其他服务。`,
      );
      void stop(code === 0 ? 0 : 1);
    }
  });
  return child;
}

process.once("SIGINT", () => {
  console.log("\n正在关闭开发服务……");
  void stop(0);
});
process.once("SIGTERM", () => {
  void stop(0);
});

try {
  if (Number(process.versions.node.split(".")[0]) < 24)
    throw new Error("需要 Node.js 24 或更新版本。");
  const vite = resolve(projectRoot, "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(vite))
    throw new Error(
      "尚未安装项目依赖。请先在项目目录运行 pnpm install --frozen-lockfile。",
    );
  if (await portIsOpen(4173))
    throw new Error(
      "4173 端口已被占用。请关闭已有的前端开发服务，或直接访问 http://127.0.0.1:4173。",
    );
  if (await portIsOpen(4174)) {
    if (!(await hasWorkspaceApi()))
      throw new Error(
        "4174 端口被其他程序占用。请自行确认该程序后处理；本脚本不会停止已有服务。",
      );
    console.log("复用已经运行的本地工作区 API；退出开发模式时会保留该服务。");
  } else {
    run("本地工作区 API", ["server/index.mjs"]);
    let ready = false;
    for (let attempt = 0; attempt < 40 && !shuttingDown; attempt += 1) {
      if (await hasWorkspaceApi()) {
        ready = true;
        break;
      }
      await wait(250);
    }
    if (!ready) throw new Error("API 未能按时启动，请查看上方错误信息。");
  }
  run("前端开发服务", [
    vite,
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
    "--strictPort",
  ]);
  console.log("\n开发地址：http://127.0.0.1:4173");
  console.log("学习记录保存在本机。按 Ctrl+C 关闭本次启动的开发服务。\n");
} catch (error) {
  console.error(`\n启动失败：${error.message}\n`);
  await stop(1);
}
