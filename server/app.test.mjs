import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createDatabase } from "./db.mjs";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "./app.mjs";
import { startServer } from "./index.mjs";
import { MAX_BODY_BYTES } from "./validation.mjs";

function tempDirectory(t) {
  const directory = mkdtempSync(join(tmpdir(), "rpg-ai-helper-test-"));
  t.after(() => {
    const path = resolve(directory);
    assert.ok(path.startsWith(`${resolve(tmpdir())}${sep}rpg-ai-helper-test-`));
    rmSync(path, { recursive: true, force: true });
  });
  return directory;
}

async function fixture(t, { filename = ":memory:", distDir } = {}) {
  const database = createDatabase(filename);
  const server = createApp({ database, distDir });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((done) => {
      server.closeAllConnections();
      server.close(done);
    });
    database.close();
  });
  const call = async (path, method = "GET", body, extra = {}) => {
    const response = await fetch(`${base}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : {
            body: typeof body === "string" ? body : JSON.stringify(body),
            headers: { "Content-Type": "application/json", ...extra.headers },
          }),
      ...extra,
    });
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
    return { status: response.status, data, headers: response.headers };
  };
  return { database, server, base, call };
}

function rawRequest(url, options = {}, body) {
  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(url, options, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () =>
        resolveRequest({ status: response.statusCode, data }),
      );
    });
    request.on("error", rejectRequest);
    request.end(body);
  });
}

test("seed state is useful but does not invent learning progress", async (t) => {
  const { call } = await fixture(t);
  const health = await call("/api/health");
  assert.equal(health.status, 200);
  assert.equal(health.data.storage, "sqlite");
  const { data, headers } = await call("/api/state");
  assert.equal(headers.get("cache-control"), "no-store");
  assert.deepEqual(
    data.members.map((member) => member.id),
    ["drill", "lin", "an"],
  );
  assert.equal(data.tasks.length, 6);
  assert.ok(data.tasks.every((task) => task.title.startsWith("示例")));
  assert.equal(data.goals.length, 1);
  assert.deepEqual(data.progress.drill, {
    completed: [],
    checks: {},
    bookmarks: [],
    notes: {},
  });
  assert.deepEqual(data.progress.drill, data.progress.lin);
});

test("task lifecycle preserves readonly fields and enforces referential validity", async (t) => {
  const { call } = await fixture(t);
  const created = await call("/api/tasks", "POST", {
    title: "  做一个真正有用的模板  ",
    assignee: "lin",
    dueDate: "2026-10-20",
    priority: "high",
  });
  assert.equal(created.status, 200);
  const task = created.data.tasks[0];
  assert.equal(task.title, "做一个真正有用的模板");
  assert.equal(task.status, "todo");
  assert.equal(task.assignee, "lin");
  const changed = await call(`/api/tasks/${task.id}`, "PATCH", {
    status: "doing",
    description: "用两个不同输入验证结果。",
  });
  assert.equal(changed.data.tasks[0].createdAt, task.createdAt);
  assert.equal(changed.data.tasks[0].status, "doing");
  assert.equal(
    (
      await call(`/api/tasks/${task.id}`, "PATCH", {
        createdAt: "2026-10-01T00:00:00.000Z",
      })
    ).status,
    400,
  );
  assert.equal(
    (await call(`/api/tasks/${task.id}`, "PATCH", { assignee: "stranger" }))
      .status,
    400,
  );
  const removed = await call(`/api/tasks/${task.id}`, "DELETE");
  assert.equal(
    removed.data.tasks.some((entry) => entry.id === task.id),
    false,
  );
  assert.equal((await call(`/api/tasks/${task.id}`, "DELETE")).status, 404);
});

test("goal lifecycle assigns milestone IDs and replaces milestone lists", async (t) => {
  const { call } = await fixture(t);
  const created = await call("/api/goals", "POST", {
    title: "完成一份研究简报",
    milestones: [
      { title: "核对一手来源" },
      { title: "请同伴复核", done: false },
    ],
  });
  assert.equal(created.status, 200);
  const goal = created.data.goals[0];
  assert.equal(goal.milestones.length, 2);
  assert.ok(goal.milestones[0].id);
  assert.equal(goal.milestones[0].done, false);
  const milestone = { ...goal.milestones[0], done: true };
  const changed = await call(`/api/goals/${goal.id}`, "PATCH", {
    milestones: [milestone],
    deadline: "2026-11-01",
  });
  assert.deepEqual(changed.data.goals[0].milestones, [milestone]);
  assert.equal(
    (
      await call(`/api/goals/${goal.id}`, "PATCH", {
        milestones: [milestone, milestone],
      })
    ).status,
    400,
  );
  const removed = await call(`/api/goals/${goal.id}`, "DELETE");
  assert.equal(removed.data.goals.length, 1);
});

test("member changes are minimal and learning progress is independent and merged", async (t) => {
  const { call } = await fixture(t);
  const renamed = await call("/api/members/lin", "PATCH", {
    name: "林同学",
    role: "研究与核查",
  });
  assert.equal(renamed.data.members[1].name, "林同学");
  assert.equal(
    (await call("/api/members/lin", "PATCH", { color: "#ffffff" })).status,
    400,
  );
  await call("/api/progress/drill", "PATCH", {
    completed: ["general-brief"],
    checks: { "general-brief": [0, 2] },
    notes: { "general-brief": "已用真实需求试跑。" },
    bookmarks: ["game-planning"],
  });
  const updated = await call("/api/progress/drill", "PATCH", {
    checks: { "game-planning": [1] },
    notes: { "game-planning": "先做核心循环。" },
  });
  assert.deepEqual(updated.data.progress.drill.checks, {
    "general-brief": [0, 2],
    "game-planning": [1],
  });
  assert.equal(
    updated.data.progress.drill.notes["general-brief"],
    "已用真实需求试跑。",
  );
  assert.deepEqual(updated.data.progress.lin.completed, []);
  assert.deepEqual(updated.data.progress.lin.checks, {});
  const cleared = await call("/api/progress/drill", "PATCH", {
    completed: [],
    bookmarks: [],
    checks: { "general-brief": [] },
    notes: { "general-brief": "" },
  });
  assert.deepEqual(cleared.data.progress.drill.completed, []);
  assert.deepEqual(cleared.data.progress.drill.checks["general-brief"], []);
  assert.deepEqual(cleared.data.progress.drill.checks["game-planning"], [1]);
  assert.equal(
    (await call("/api/progress/stranger", "PATCH", { completed: [] })).status,
    404,
  );
});

test("saved prompts retain owner and source and can be removed", async (t) => {
  const { call } = await fixture(t);
  const saved = await call("/api/saved-prompts", "POST", {
    memberId: "an",
    title: "我的需求澄清模板",
    text: "请先列出缺少的信息，再提出最多三个关键问题。",
    sourceId: "general-brief",
  });
  assert.equal(saved.status, 200);
  const prompt = saved.data.savedPrompts[0];
  assert.equal(prompt.memberId, "an");
  assert.equal(prompt.sourceId, "general-brief");
  assert.ok(prompt.createdAt);
  assert.equal(
    (
      await call("/api/saved-prompts", "POST", {
        memberId: "other",
        title: "x",
        text: "x",
      })
    ).status,
    400,
  );
  assert.equal(
    (await call(`/api/saved-prompts/${prompt.id}`, "DELETE")).data.savedPrompts
      .length,
    0,
  );
});

test("state and export use the same stable strong ETag", async (t) => {
  const { call } = await fixture(t);
  const first = await call("/api/state");
  const tag = first.headers.get("etag");
  assert.match(tag, /^"[a-f0-9]{64}"$/);
  assert.equal((await call("/api/state")).headers.get("etag"), tag);
  assert.equal((await call("/api/export")).headers.get("etag"), tag);
  assert.equal((await call("/api/state", "HEAD")).headers.get("etag"), tag);
  const unchanged = await call(
    "/api/progress/drill",
    "PATCH",
    { bookmarks: [] },
    { headers: { "Content-Type": "application/json", "If-Match": tag } },
  );
  assert.equal(unchanged.status, 200);
  assert.equal(unchanged.headers.get("etag"), tag);
});

test("two tabs cannot overwrite bookmarks or completion arrays from stale snapshots", async (t) => {
  const { call } = await fixture(t);
  const tabA = await call("/api/state");
  const tabB = await call("/api/state");
  const headersA = {
    "Content-Type": "application/json",
    "If-Match": tabA.headers.get("etag"),
  };
  const headersB = {
    "Content-Type": "application/json",
    "If-Match": tabB.headers.get("etag"),
  };
  const responses = await Promise.all([
    call(
      "/api/progress/drill",
      "PATCH",
      { bookmarks: ["general-first"], completed: ["general-first"] },
      { headers: headersA },
    ),
    call(
      "/api/progress/drill",
      "PATCH",
      { bookmarks: ["game-second"], completed: ["game-second"] },
      { headers: headersB },
    ),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 409],
  );
  const winner = responses.find((response) => response.status === 200);
  const conflict = responses.find((response) => response.status === 409);
  assert.equal(
    conflict.data.error,
    "工作区已在其他窗口更新，已为你刷新，请重试本次操作。",
  );
  const refreshed = await call("/api/state");
  assert.deepEqual(refreshed.data, winner.data);
  assert.equal(refreshed.headers.get("etag"), winner.headers.get("etag"));
  assert.notEqual(refreshed.headers.get("etag"), tabA.headers.get("etag"));
  const retried = await call(
    "/api/progress/drill",
    "PATCH",
    {
      bookmarks: ["general-first", "game-second"],
      completed: ["general-first", "game-second"],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "If-Match": refreshed.headers.get("etag"),
      },
    },
  );
  assert.equal(retried.status, 200);
  assert.deepEqual(retried.data.progress.drill.bookmarks, [
    "general-first",
    "game-second",
  ]);
  assert.deepEqual(retried.data.progress.drill.completed, [
    "general-first",
    "game-second",
  ]);
});

test("every mutation, including replacement import, rejects a stale ETag without side effects", async (t) => {
  const { call } = await fixture(t);
  await call("/api/saved-prompts", "POST", {
    memberId: "drill",
    title: "保存的模板",
    text: "内容",
  });
  const original = await call("/api/state");
  const stale = original.headers.get("etag");
  const changed = await call(
    "/api/members/drill",
    "PATCH",
    { name: "另一个窗口的新名称" },
    { headers: { "Content-Type": "application/json", "If-Match": stale } },
  );
  const taskId = original.data.tasks[0].id;
  const goalId = original.data.goals[0].id;
  const promptId = original.data.savedPrompts[0].id;
  const cases = [
    ["/api/members/lin", "PATCH", { name: "旧窗口的改名" }],
    ["/api/progress/an", "PATCH", { completed: ["general-first"] }],
    ["/api/tasks", "POST", { title: "旧窗口的新任务" }],
    [`/api/tasks/${taskId}`, "PATCH", { status: "done" }],
    [`/api/tasks/${taskId}`, "DELETE"],
    ["/api/goals", "POST", { title: "旧窗口的新目标" }],
    [`/api/goals/${goalId}`, "PATCH", { title: "旧窗口改目标" }],
    [`/api/goals/${goalId}`, "DELETE"],
    [
      "/api/saved-prompts",
      "POST",
      { memberId: "an", title: "旧模板", text: "内容" },
    ],
    [`/api/saved-prompts/${promptId}`, "DELETE"],
    ["/api/import", "POST", { state: original.data }],
  ];
  for (const [path, method, body] of cases) {
    const result = await call(path, method, body, {
      headers: { "Content-Type": "application/json", "If-Match": stale },
    });
    assert.equal(result.status, 409, `${method} ${path}`);
    assert.deepEqual((await call("/api/state")).data, changed.data);
  }
  const imported = await call(
    "/api/import",
    "POST",
    { state: original.data },
    {
      headers: {
        "Content-Type": "application/json",
        "If-Match": changed.headers.get("etag"),
      },
    },
  );
  assert.equal(imported.status, 200);
  assert.equal(imported.headers.get("etag"), stale);
  assert.deepEqual(imported.data, original.data);
});

test("invalid values return clear errors without changing persisted state", async (t) => {
  const { call } = await fixture(t);
  const before = (await call("/api/state")).data;
  const cases = [
    ["/api/tasks", null],
    ["/api/tasks", []],
    ["/api/tasks", { title: "   " }],
    ["/api/tasks", { title: "x".repeat(161) }],
    ["/api/tasks", { title: "valid", status: "invalid" }],
    ["/api/tasks", { title: "valid", priority: 1 }],
    ["/api/tasks", { title: "valid", dueDate: "2026-02-30" }],
    ["/api/tasks", { title: "valid", dueDate: "yesterday" }],
    ["/api/tasks", { title: "valid", injected: true }],
    [
      "/api/goals",
      { title: "valid", milestones: [{ title: "x", done: "yes" }] },
    ],
    ["/api/goals", { title: "valid", milestones: [{ title: "" }] }],
    ["/api/saved-prompts", { memberId: "lin", title: "valid", text: "" }],
  ];
  for (const [path, payload] of cases) {
    const result = await call(path, "POST", payload);
    assert.equal(result.status, 400, JSON.stringify(payload));
    assert.equal(typeof result.data.error, "string");
  }
  const progressCases = [
    {},
    { completed: ["a", "a"] },
    { checks: { a: [-1] } },
    { checks: { a: [100] } },
    { checks: { a: [1, 1] } },
    { notes: { a: 1 } },
    { bookmarks: [42] },
    JSON.parse('{"notes":{"__proto__":"x"}}'),
    { notes: { constructor: "x" } },
  ];
  for (const payload of progressCases)
    assert.equal(
      (await call("/api/progress/drill", "PATCH", payload)).status,
      400,
      JSON.stringify(payload),
    );
  assert.deepEqual((await call("/api/state")).data, before);
});

test("export and import round-trip full data and reject invalid backups atomically", async (t) => {
  const { call } = await fixture(t);
  const backup = await call("/api/export");
  assert.match(backup.headers.get("content-disposition"), /attachment/);
  const desired = structuredClone(backup.data);
  desired.members[0].name = "恢复后的成员";
  desired.progress.an.completed = ["general-brief"];
  desired.tasks = [];
  assert.deepEqual(
    (await call("/api/import", "POST", { state: desired })).data,
    desired,
  );
  const corruptions = [
    (state) => {
      state.version = 2;
    },
    (state) => {
      state.members.pop();
    },
    (state) => {
      state.members[1].id = "drill";
    },
    (state) => {
      state.members[0].color = "url(https://bad.example)";
    },
    (state) => {
      delete state.progress.lin;
    },
    (state) => {
      state.progress.other = state.progress.an;
    },
    (state) => {
      state.tasks[0].assignee = "unknown";
    },
    (state) => {
      state.tasks.push(state.tasks[0]);
    },
    (state) => {
      state.tasks[0].createdAt = "tomorrow";
    },
    (state) => {
      state.goals[0].milestones[0].done = 1;
    },
    (state) => {
      state.unrecognized = true;
    },
  ];
  for (const corrupt of corruptions) {
    const state = structuredClone(backup.data);
    corrupt(state);
    assert.equal((await call("/api/import", "POST", { state })).status, 400);
    assert.deepEqual((await call("/api/state")).data, desired);
  }
  assert.equal(
    (await call("/api/import", "POST", { state: desired, unexpected: true }))
      .status,
    400,
  );
});

test("unsupported methods, malformed JSON and request formats fail predictably", async (t) => {
  const { call } = await fixture(t);
  assert.equal((await call("/api/tasks", "POST", "{")).status, 400);
  assert.equal(
    (
      await call(
        "/api/tasks",
        "POST",
        { title: "x" },
        { headers: { "Content-Type": "text/plain" } },
      )
    ).status,
    415,
  );
  const method = await call("/api/state", "DELETE");
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("allow"), "GET, HEAD");
  assert.equal((await call("/api/missing")).status, 404);
  assert.equal(
    (await call("/api/tasks/missing", "PATCH", { status: "done" })).status,
    404,
  );
  assert.equal((await call("/api/%ZZ")).status, 400);
  const head = await call("/api/state", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.data, "");
});

test("host and origin checks block cross-site writes and DNS rebinding", async (t) => {
  const { call, base } = await fixture(t);
  for (const headers of [
    { "Content-Type": "application/json", Origin: "https://evil.example" },
    { "Content-Type": "application/json", Origin: "null" },
    { "Content-Type": "application/json", Origin: "http://localhost:9000" },
    {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:4173@evil.example",
    },
    { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
  ])
    assert.equal(
      (await call("/api/tasks", "POST", { title: "blocked" }, { headers }))
        .status,
      403,
      JSON.stringify(headers),
    );
  assert.equal(
    (
      await rawRequest(
        `${base}/api/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Host: "evil.example:4174",
          },
        },
        '{"title":"blocked"}',
      )
    ).status,
    403,
  );
  const local = await call(
    "/api/tasks",
    "POST",
    { title: "allowed" },
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:4173",
      },
    },
  );
  assert.equal(local.status, 200);
  assert.equal(
    local.headers.get("access-control-allow-origin"),
    "http://localhost:4173",
  );
  assert.equal(local.headers.get("access-control-expose-headers"), "ETag");
  const options = await call("/api/tasks", "OPTIONS", undefined, {
    headers: { Origin: base, "Access-Control-Request-Method": "POST" },
  });
  assert.equal(options.status, 204);
  assert.equal(options.headers.get("access-control-allow-origin"), base);
  assert.match(options.headers.get("access-control-allow-headers"), /If-Match/);
  assert.equal(
    (
      await rawRequest(`${base}/api/state`, {
        headers: { Host: "evil.example" },
      })
    ).status,
    403,
  );
});

test("request size limits handle content-length and chunked input", async (t) => {
  const { call, base } = await fixture(t);
  const oversized = JSON.stringify({ title: "x".repeat(MAX_BODY_BYTES) });
  assert.equal((await call("/api/tasks", "POST", oversized)).status, 413);
  const chunked = await new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(
      `${base}/api/tasks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Transfer-Encoding": "chunked",
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () =>
          resolveRequest({ status: response.statusCode, data }),
        );
      },
    );
    request.on("error", rejectRequest);
    request.write('{"title":"');
    for (let index = 0; index < 81; index += 1)
      request.write("x".repeat(65536));
    request.end('"}');
  });
  assert.equal(chunked.status, 413);
  assert.equal((await call("/api/state")).data.tasks.length, 6);
});

test("concurrent creates and progress map patches do not lose updates", async (t) => {
  const { call } = await fixture(t);
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      call("/api/tasks", "POST", { title: `并发任务 ${index}` }),
    ),
  );
  assert.ok(results.every((result) => result.status === 200));
  await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      call("/api/progress/drill", "PATCH", {
        notes: { [`general-note-${index}`]: String(index) },
      }),
    ),
  );
  const state = (await call("/api/state")).data;
  assert.equal(state.tasks.length, 26);
  assert.equal(Object.keys(state.progress.drill.notes).length, 12);
  assert.equal(new Set(state.tasks.map((task) => task.id)).size, 26);
});

test("database survives reopening and rejected transactions roll back", (t) => {
  const directory = tempDirectory(t);
  const filename = join(directory, "nested", "workspace.sqlite");
  const original = createDatabase(filename);
  original.mutate((state) => {
    state.members[0].name = "持久保存";
  });
  assert.throws(
    () =>
      original.mutate((state) => {
        state.members[0].name = "";
      }),
    /成员名称/,
  );
  assert.equal(original.readState().members[0].name, "持久保存");
  original.close();
  original.close();
  const reopened = createDatabase(filename);
  assert.equal(reopened.readState().members[0].name, "持久保存");
  reopened.close();
});

test("SQLite write errors return safe failures, roll back, and allow recovery", async (t) => {
  const directory = tempDirectory(t);
  const filename = join(directory, "workspace.sqlite");
  const { database, call } = await fixture(t, { filename });
  const blocker = new DatabaseSync(filename);
  t.mock.method(console, "error", () => {});
  try {
    const before = (await call("/api/state")).data;
    blocker.exec(
      "CREATE TRIGGER simulated_storage_failure BEFORE UPDATE ON workspace BEGIN SELECT RAISE(ABORT, 'internal-storage-detail'); END;",
    );
    const failed = await call("/api/tasks", "POST", {
      title: "不能部分写入的任务",
    });
    assert.equal(failed.status, 500);
    assert.equal(failed.data.error.includes("internal-storage-detail"), false);
    assert.deepEqual((await call("/api/state")).data, before);
    blocker.exec("DROP TRIGGER simulated_storage_failure;");
    assert.equal(
      (await call("/api/tasks", "POST", { title: "存储恢复后成功" })).status,
      200,
    );
    assert.equal(
      (await call("/api/state")).data.tasks.length,
      before.tasks.length + 1,
    );
  } finally {
    blocker.close();
    database.close();
  }
});

test("health does not advertise readiness when storage has failed", async (t) => {
  const { database, call } = await fixture(t);
  t.mock.method(console, "error", () => {});
  database.close();
  const health = await call("/api/health");
  assert.equal(health.status, 500);
  assert.equal(typeof health.data.error, "string");
  assert.equal((await call("/api/state")).status, 500);
});

test("production server safely serves dist and extensionless SPA routes", async (t) => {
  const directory = tempDirectory(t);
  const distDir = join(directory, "dist");
  mkdirSync(join(distDir, "assets"), { recursive: true });
  writeFileSync(
    join(distDir, "index.html"),
    "<!doctype html><title>测试应用</title>",
  );
  writeFileSync(join(distDir, "assets", "app.js"), 'console.log("safe")');
  writeFileSync(
    join(distDir, "assets", "app.js.map"),
    '{"sourcesContent":["secret"]}',
  );
  writeFileSync(join(directory, "secret.txt"), "do not expose");
  const { call, base } = await fixture(t, { distDir });
  const page = await call("/");
  assert.equal(page.status, 200);
  assert.match(page.data, /测试应用/);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.equal((await call("/guild/game/lesson")).data, page.data);
  const asset = await call("/assets/app.js");
  assert.match(asset.headers.get("content-type"), /javascript/);
  assert.match(asset.headers.get("cache-control"), /immutable/);
  assert.equal((await call("/assets/app.js", "HEAD")).data, "");
  for (const path of [
    "/server/index.mjs",
    "/data/workspace.sqlite",
    "/.env",
    "/assets/app.js.map",
    "/unknown.js",
    "/%2e%2e%5csecret.txt",
  ])
    assert.equal((await call(path)).status, 404, path);
  const rawTraversal = await new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(
      base,
      { path: "/%2e%2e/secret.txt" },
      (response) => {
        response.resume();
        response.on("end", () => resolveRequest(response.statusCode));
      },
    );
    request.on("error", rejectRequest);
    request.end();
  });
  assert.equal(rawTraversal, 404);
  try {
    symlinkSync(
      join(directory, "secret.txt"),
      join(distDir, "linked.txt"),
      "file",
    );
    assert.equal((await call("/linked.txt")).status, 404);
  } catch (error) {
    if (!["EPERM", "EACCES"].includes(error.code)) throw error;
    t.diagnostic(
      "File symlink test unavailable without Windows symlink privilege; lexical traversal test passed.",
    );
  }
});

test("missing frontend build leaves API available with a useful page error", async (t) => {
  const { call } = await fixture(t);
  assert.equal((await call("/")).status, 503);
  assert.equal((await call("/api/health")).status, 200);
});

test("startup uses loopback only and graceful close releases SQLite", async (t) => {
  const directory = tempDirectory(t);
  const filename = join(directory, "workspace.sqlite");
  const app = await startServer({ port: 0, databasePath: filename });
  assert.equal(app.server.address().address, "127.0.0.1");
  const response = await fetch(
    `http://127.0.0.1:${app.server.address().port}/api/state`,
  );
  assert.equal(response.status, 200);
  await response.arrayBuffer();
  await app.close();
  const reopened = createDatabase(filename);
  assert.equal(reopened.readState().members.length, 3);
  reopened.close();
});
