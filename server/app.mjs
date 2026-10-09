import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { stateEtag } from "./etag.mjs";
import {
  ApiError,
  MAX_BODY_BYTES,
  goalValue,
  has,
  identifier,
  memberPatch,
  object,
  progressValue,
  savedPromptValue,
  taskValue,
  validateState,
} from "./validation.mjs";

const MUTATIONS = new Set(["POST", "PATCH", "DELETE", "PUT"]);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
};

function sendJson(response, status, value, head = false) {
  const data = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    "Cache-Control": "no-store",
  });
  response.end(head ? undefined : data);
}

function sendState(response, state, head = false) {
  response.setHeader("ETag", stateEtag(state));
  sendJson(response, 200, state, head);
}

function allowedLocation(host, port) {
  try {
    const url = new URL(`http://${host}`);
    return (
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      [String(port), "4173", "4174"].includes(url.port) &&
      url.host === host.toLowerCase() &&
      url.pathname === "/" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function checkRequest(request, response) {
  const port = request.socket.localPort;
  if (
    typeof request.headers.host !== "string" ||
    !allowedLocation(request.headers.host, port)
  )
    throw new ApiError(403, "此服务只接受本机地址访问。");
  const origin = request.headers.origin;
  if (origin !== undefined) {
    let allowed = false;
    try {
      const url = new URL(origin);
      allowed =
        url.protocol === "http:" &&
        url.origin === origin &&
        allowedLocation(url.host, port);
    } catch {
      /* Invalid origins are rejected below. */
    }
    if (!allowed)
      throw new ApiError(403, "请求来源不受支持，请从本地应用页面操作。");
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Expose-Headers", "ETag");
    response.setHeader("Vary", "Origin");
  }
  if (
    MUTATIONS.has(request.method) &&
    request.headers["sec-fetch-site"] === "cross-site"
  )
    throw new ApiError(403, "已阻止跨站修改请求。");
}

async function readBody(request) {
  if (
    !/^application\/json(?:\s*;|\s*$)/i.test(
      request.headers["content-type"] ?? "",
    )
  )
    throw new ApiError(415, "请使用 application/json 格式提交内容。");
  const declaredLength = request.headers["content-length"];
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) {
    request.resume();
    throw new ApiError(413, "提交内容超过 5 MB 限制。");
  }
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    let failed = false;
    request.on("data", (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        failed = true;
        chunks.length = 0;
        rejectBody(new ApiError(413, "提交内容超过 5 MB 限制。"));
      } else chunks.push(chunk);
    });
    request.on("end", () => {
      if (failed) return;
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        rejectBody(new ApiError(400, "JSON 内容无法解析，请检查文件格式。"));
      }
    });
    request.on("error", () =>
      rejectBody(new ApiError(400, "请求未完整接收，请重试。")),
    );
    request.on("aborted", () =>
      rejectBody(new ApiError(400, "请求已中断，请重试。")),
    );
  });
}

function requireMethod(request, response, methods) {
  if (!methods.includes(request.method)) {
    response.setHeader("Allow", methods.join(", "));
    throw new ApiError(405, "此操作不支持当前请求方法。");
  }
}

function findEntry(entries, id, label) {
  const value = entries.find((entry) => entry.id === id);
  if (!value) throw new ApiError(404, `${label}不存在，可能已被删除。`);
  return value;
}

function normalizeMilestones(items) {
  return items.map((item) => ({
    id: item.id ?? randomUUID(),
    title: item.title.trim(),
    done: item.done ?? false,
  }));
}

function contained(root, candidate) {
  const path = relative(root, candidate);
  return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function serveStatic(request, response, pathname, distDir) {
  requireMethod(request, response, ["GET", "HEAD"]);
  const parts = pathname.split("/");
  if (
    pathname.includes("\\") ||
    pathname.includes("\0") ||
    parts.some((part) => part.startsWith(".")) ||
    ["server", "data", "src", "node_modules"].includes(parts[1]) ||
    extname(pathname) === ".map"
  )
    throw new ApiError(404, "页面或文件不存在。");
  if (!distDir || !existsSync(distDir))
    throw new ApiError(
      503,
      "页面尚未构建。开发时请打开 4173 端口；正式运行前请先构建前端。",
    );
  const root = realpathSync(distDir);
  let candidate = resolve(root, `.${pathname}`);
  if (!contained(root, candidate))
    throw new ApiError(404, "页面或文件不存在。");
  if (existsSync(candidate) && statSync(candidate).isDirectory())
    candidate = resolve(candidate, "index.html");
  if (!existsSync(candidate) && !extname(pathname))
    candidate = resolve(root, "index.html");
  if (
    !existsSync(candidate) ||
    !statSync(candidate).isFile() ||
    !contained(root, realpathSync(candidate))
  )
    throw new ApiError(404, "页面或文件不存在。");
  const extension = extname(candidate).toLowerCase();
  if (!has(TYPES, extension)) throw new ApiError(404, "页面或文件不存在。");
  response.writeHead(200, {
    "Content-Type": TYPES[extension],
    "Content-Length": statSync(candidate).size,
    "Cache-Control":
      extension === ".html"
        ? "no-store"
        : pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
  });
  if (request.method === "HEAD") return response.end();
  const stream = createReadStream(candidate);
  stream.on("error", () => response.destroy());
  stream.pipe(response);
}

export function createApp({ database, distDir } = {}) {
  if (!database)
    throw new TypeError("createApp requires a database from createDatabase().");
  const server = createServer(async (request, response) => {
    const mutate = (updater) =>
      database.mutate(updater, { ifMatch: request.headers["if-match"] });
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "same-origin");
    try {
      checkRequest(request, response);
      let pathname;
      try {
        pathname = decodeURIComponent((request.url ?? "/").split("?")[0]);
      } catch {
        throw new ApiError(400, "请求地址格式不正确。");
      }
      if (!pathname.startsWith("/") || pathname.startsWith("//"))
        throw new ApiError(400, "请求地址格式不正确。");
      if (request.method === "OPTIONS") {
        if (!pathname.startsWith("/api/"))
          throw new ApiError(404, "接口不存在。");
        response.writeHead(204, {
          "Access-Control-Allow-Methods":
            "GET, HEAD, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, If-Match",
          "Access-Control-Max-Age": "600",
          "Cache-Control": "no-store",
        });
        return response.end();
      }
      if (!pathname.startsWith("/api/"))
        return serveStatic(request, response, pathname, distDir);
      if (pathname === "/api/health") {
        requireMethod(request, response, ["GET", "HEAD"]);
        // The launcher must not report a healthy workspace if storage is unavailable.
        database.readState();
        return sendJson(
          response,
          200,
          { ok: true, app: "rpg-ai-helper", version: 1, storage: "sqlite" },
          request.method === "HEAD",
        );
      }
      if (pathname === "/api/state" || pathname === "/api/export") {
        requireMethod(request, response, ["GET", "HEAD"]);
        if (pathname === "/api/export")
          response.setHeader(
            "Content-Disposition",
            `attachment; filename="rpg-ai-helper-${new Date().toISOString().slice(0, 10)}.json"`,
          );
        return sendState(
          response,
          database.readState(),
          request.method === "HEAD",
        );
      }
      if (pathname === "/api/import") {
        requireMethod(request, response, ["POST"]);
        const body = await readBody(request);
        object(body, "导入请求", ["state"], ["state"]);
        validateState(body.state);
        return sendState(
          response,
          mutate(() => body.state),
        );
      }
      const memberMatch = /^\/api\/members\/([^/]+)$/.exec(pathname);
      if (memberMatch) {
        requireMethod(request, response, ["PATCH"]);
        const id = identifier(memberMatch[1]);
        const patch = memberPatch(await readBody(request));
        return sendState(
          response,
          mutate((state) => {
            const member = findEntry(state.members, id, "成员");
            if (has(patch, "name")) member.name = patch.name.trim();
            if (has(patch, "role")) member.role = patch.role.trim();
          }),
        );
      }
      const progressMatch = /^\/api\/progress\/([^/]+)$/.exec(pathname);
      if (progressMatch) {
        requireMethod(request, response, ["PATCH"]);
        const id = identifier(progressMatch[1]);
        const patch = progressValue(await readBody(request), true);
        return sendState(
          response,
          mutate((state) => {
            findEntry(state.members, id, "成员");
            const progress = state.progress[id];
            for (const key of ["completed", "bookmarks"])
              if (has(patch, key)) progress[key] = patch[key];
            for (const key of ["checks", "notes"])
              if (has(patch, key))
                progress[key] = { ...progress[key], ...patch[key] };
          }),
        );
      }
      const taskMatch = /^\/api\/tasks(?:\/([^/]+))?$/.exec(pathname);
      if (taskMatch) {
        const id = taskMatch[1];
        requireMethod(request, response, id ? ["PATCH", "DELETE"] : ["POST"]);
        if (id) identifier(id);
        const patch =
          request.method === "DELETE"
            ? null
            : taskValue(await readBody(request), { partial: Boolean(id) });
        return sendState(
          response,
          mutate((state) => {
            if (!id)
              state.tasks.unshift({
                id: randomUUID(),
                description: "",
                assignee: "drill",
                status: "todo",
                priority: "normal",
                dueDate: "",
                ...patch,
                title: patch.title.trim(),
                createdAt: new Date().toISOString(),
              });
            else {
              const task = findEntry(state.tasks, id, "任务");
              if (request.method === "DELETE")
                state.tasks = state.tasks.filter((entry) => entry.id !== id);
              else {
                Object.assign(task, patch);
                task.title = task.title.trim();
              }
            }
          }),
        );
      }
      const goalMatch = /^\/api\/goals(?:\/([^/]+))?$/.exec(pathname);
      if (goalMatch) {
        const id = goalMatch[1];
        requireMethod(request, response, id ? ["PATCH", "DELETE"] : ["POST"]);
        if (id) identifier(id);
        const patch =
          request.method === "DELETE"
            ? null
            : goalValue(await readBody(request), { partial: Boolean(id) });
        return sendState(
          response,
          mutate((state) => {
            if (!id)
              state.goals.unshift({
                id: randomUUID(),
                description: "",
                deadline: "",
                milestones: [],
                ...patch,
                title: patch.title.trim(),
                milestones: normalizeMilestones(patch.milestones ?? []),
              });
            else {
              const goal = findEntry(state.goals, id, "共同目标");
              if (request.method === "DELETE")
                state.goals = state.goals.filter((entry) => entry.id !== id);
              else {
                Object.assign(goal, patch);
                goal.title = goal.title.trim();
                if (has(patch, "milestones"))
                  goal.milestones = normalizeMilestones(patch.milestones);
              }
            }
          }),
        );
      }
      const savedMatch = /^\/api\/saved-prompts(?:\/([^/]+))?$/.exec(pathname);
      if (savedMatch) {
        const id = savedMatch[1];
        requireMethod(request, response, id ? ["DELETE"] : ["POST"]);
        if (id) identifier(id);
        const body = id ? null : savedPromptValue(await readBody(request));
        return sendState(
          response,
          mutate((state) => {
            if (!id)
              state.savedPrompts.unshift({
                id: randomUUID(),
                sourceId: "",
                ...body,
                title: body.title.trim(),
                createdAt: new Date().toISOString(),
              });
            else {
              findEntry(state.savedPrompts, id, "提示词");
              state.savedPrompts = state.savedPrompts.filter(
                (entry) => entry.id !== id,
              );
            }
          }),
        );
      }
      throw new ApiError(404, "接口不存在。");
    } catch (error) {
      if (response.headersSent) return response.destroy();
      const known = error instanceof ApiError;
      if (!known)
        console.error("[RPG AI Helper] Request failed:", error.message);
      sendJson(
        response,
        known ? error.status : 500,
        {
          error: known
            ? error.message
            : "保存或读取时出现问题，请稍后重试。现有数据不会被部分覆盖。",
        },
        request.method === "HEAD",
      );
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  server.maxHeadersCount = 32;
  return server;
}
