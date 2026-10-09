import {
  test as base,
  expect,
  type Page,
  type APIRequestContext,
  type Route,
} from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AppState } from "../src/types";

const qaDirectory = resolve("output/qa");
let seed: AppState;

type ConsoleAudit = {
  expectedBookmarkConflict: boolean;
  expectedProgressAbort: boolean;
};
const test = base.extend<{ cleanConsole: ConsoleAudit }>({
  cleanConsole: [
    async ({ context, page }, use, testInfo) => {
      const errors: {
        kind: "runtime" | "console";
        message: string;
        url: string;
      }[] = [];
      const audit = {
        expectedBookmarkConflict: false,
        expectedProgressAbort: false,
      };
      const observed = new Set<Page>();
      const watch = (target: Page) => {
        if (observed.has(target)) return;
        observed.add(target);
        target.on("pageerror", (error) =>
          errors.push({
            kind: "runtime",
            message: error.message,
            url: target.url(),
          }),
        );
        target.on("console", (message) => {
          if (message.type() === "error")
            errors.push({
              kind: "console",
              message: message.text(),
              url: message.location().url,
            });
        });
      };
      watch(page);
      context.on("page", watch);
      await use(audit);
      context.off("page", watch);
      if (errors.length)
        await testInfo.attach("browser-errors", {
          body: JSON.stringify(errors, null, 2),
          contentType: "application/json",
        });
      // Failure stories intentionally reject one exact request. Retain every
      // diagnostic and allow at most one of each explicitly expected error.
      const expectedConflicts = errors.filter(
        (error) =>
          audit.expectedBookmarkConflict &&
          error.kind === "console" &&
          error.message.startsWith(
            "Failed to load resource: the server responded with a status of 409",
          ) &&
          error.url === "http://127.0.0.1:4178/api/progress/drill",
      );
      const expectedAborts = errors.filter(
        (error) =>
          audit.expectedProgressAbort &&
          error.kind === "console" &&
          error.message === "Failed to load resource: net::ERR_FAILED" &&
          error.url === "http://127.0.0.1:4178/api/progress/drill",
      );
      expect
        .soft(
          expectedConflicts.length,
          "at most the single deliberate conflict",
        )
        .toBeLessThanOrEqual(1);
      expect
        .soft(
          expectedAborts.length,
          "at most the single deliberately aborted mutation",
        )
        .toBeLessThanOrEqual(1);
      const unexpected = errors.filter(
        (error) =>
          !expectedConflicts.includes(error) && !expectedAborts.includes(error),
      );
      expect
        .soft(
          unexpected,
          "unexpected browser console and uncaught runtime errors",
        )
        .toEqual([]);
    },
    { auto: true },
  ],
});

async function getState(request: APIRequestContext): Promise<AppState> {
  const response = await request.get("/api/state");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function visit(page: Page, route: string, title: string | RegExp) {
  await page.goto(`/#${route}`);
  await expect(
    page.getByRole("heading", { name: title, level: 1 }),
  ).toBeVisible();
}

async function snapshot(page: Page, filename: string) {
  // Capture fixed-position elements from the real page origin, including the
  // normally offscreen skip link, rather than from an interaction's scroll offset.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode().catch(() => {}))),
    );
  await page.screenshot({
    path: resolve(qaDirectory, filename),
    fullPage: true,
    animations: "disabled",
  });
}

test.beforeAll(async ({ request }) => {
  await mkdir(qaDirectory, { recursive: true });
  const health = await request.get("/api/health");
  expect(await health.json()).toMatchObject({
    ok: true,
    app: "rpg-ai-helper",
    storage: "sqlite",
  });
  // Capture once at server start so a restarted worker cannot adopt an earlier
  // failed test's modified database as its baseline.
  seed = JSON.parse(
    await readFile(resolve(qaDirectory, "e2e-control.json"), "utf8"),
  ).seed;
  expect(seed.members).toHaveLength(3);
});

test.beforeEach(async ({ request }) => {
  const reset = await request.post("/api/import", {
    data: { state: structuredClone(seed) },
  });
  expect(reset.ok(), await reset.text()).toBeTruthy();
});

test("desktop workspace renders real content and all primary destinations", async ({
  page,
}) => {
  await visit(page, "home", /你好，Drill/);
  await expect(
    page.getByRole("navigation", { name: "主要导航" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "开启今天的实践" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "选择你的学习公会" }),
  ).toBeVisible();
  await snapshot(page, "desktop-home.png");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "学习公会", exact: true })
    .click();
  await expect(page).toHaveURL(/#guilds$/);
  await expect(
    page.getByRole("heading", { name: "通用，意味着跨领域，而不是只教入门。" }),
  ).toBeVisible();
  await expect(page.getByText("规划中", { exact: true }).first()).toBeVisible();
});

test("course completion requires every check, persists, and is isolated by member", async ({
  page,
  request,
}) => {
  await visit(page, "lesson/general-brief", "把模糊想法变成一张任务卡");
  const finish = page.getByRole("button", {
    name: "完成这个节点",
    exact: true,
  });
  await expect(finish).toBeDisabled();
  const checks = page.getByRole("checkbox");
  const count = await checks.count();
  expect(count).toBeGreaterThan(2);
  const note = page.getByLabel("实践笔记", { exact: true });
  await note.fill("QA 未保存草稿：勾选验收项不能覆盖这段内容。");
  await checks.first().click();
  await expect(checks.first()).toBeChecked();
  await expect(note).toHaveValue("QA 未保存草稿：勾选验收项不能覆盖这段内容。");
  await expect(finish).toBeDisabled();
  for (let index = 1; index < count; index++) {
    await checks.nth(index).click();
    await expect(checks.nth(index)).toBeChecked();
  }
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(
    page.getByRole("button", { name: "已完成 · 重新学习" }),
  ).toBeVisible();
  await page
    .getByLabel("实践笔记", { exact: true })
    .fill("QA 成果：任务目标明确，完成一次实际修订。");
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("实践笔记已保存");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "已完成 · 重新学习" }),
  ).toBeVisible();
  await expect(page.getByLabel("实践笔记", { exact: true })).toHaveValue(
    "QA 成果：任务目标明确，完成一次实际修订。",
  );
  await page.getByRole("button", { name: "切换当前成员" }).click();
  await page.getByRole("button", { name: /小林/ }).click();
  await expect(
    page.getByRole("button", { name: "完成这个节点", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("实践笔记", { exact: true })).toHaveValue("");
  for (const checkbox of await page.getByRole("checkbox").all())
    await expect(checkbox).not.toBeChecked();
  await page.getByRole("button", { name: "切换当前成员" }).click();
  await page.getByRole("button", { name: /Drill/ }).click();
  await expect(
    page.getByRole("button", { name: "已完成 · 重新学习" }),
  ).toBeVisible();
  await page.getByRole("checkbox").first().click();
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "完成这个节点", exact: true }),
  ).toBeDisabled();
  const state = await getState(request);
  expect(state.progress.drill.completed).not.toContain("general-brief");
  expect(state.progress.lin.notes).toEqual({});
});

test("unsaved lesson drafts survive navigation and reload without saving or crossing profiles", async ({
  page,
  request,
}) => {
  const lessonId = "general-brief";
  const original = "QA 已保存版本：明确任务目标。";
  const drillDraft = "QA Drill 草稿：还没有点击保存。";
  const linDraft = "QA 小林草稿：应当仅属于小林。";
  await visit(page, `lesson/${lessonId}`, "把模糊想法变成一张任务卡");
  const note = page.getByLabel("实践笔记", { exact: true });
  await note.fill(original);
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("实践笔记已保存");
  await note.fill(drillDraft);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "工具装备库", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "工具装备库", level: 1 }),
  ).toBeVisible();
  await visit(page, `lesson/${lessonId}`, "把模糊想法变成一张任务卡");
  await expect(note).toHaveValue(drillDraft);
  await page.reload();
  await expect(note).toHaveValue(drillDraft);
  expect((await getState(request)).progress.drill.notes[lessonId]).toBe(
    original,
  );
  await page.getByRole("button", { name: "切换当前成员" }).click();
  await page.getByRole("button", { name: /小林/ }).click();
  await expect(note).toHaveValue("");
  await note.fill(linDraft);
  await page.getByRole("button", { name: "切换当前成员" }).click();
  await page.getByRole("button", { name: /Drill/ }).click();
  await expect(note).toHaveValue(drillDraft);
  await page.reload();
  await expect(note).toHaveValue(drillDraft);
  const beforeSave = await getState(request);
  expect(beforeSave.progress.drill.notes[lessonId]).toBe(original);
  expect(beforeSave.progress.lin.notes[lessonId]).toBeUndefined();
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeDisabled();
  expect((await getState(request)).progress.drill.notes[lessonId]).toBe(
    drillDraft,
  );
  await page.reload();
  await expect(note).toHaveValue(drillDraft);
  await expect(
    page.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "切换当前成员" }).click();
  await page.getByRole("button", { name: /小林/ }).click();
  await expect(note).toHaveValue(linDraft);
  expect(
    (await getState(request)).progress.lin.notes[lessonId],
  ).toBeUndefined();
});

test("two-tab note updates refresh clean editors and protect real drafts until a conflict is resolved", async ({
  page,
  context,
  request,
}) => {
  const route = "lesson/general-brief";
  const title = "把模糊想法变成一张任务卡";
  const storageKey = "guild-note-draft-v1:drill:general-brief";
  const original = "QA 版本 A：第一次保存。";
  const versionB = "QA 版本 B：另一窗口更新了内容。";
  const versionC = "QA 版本 C：另一窗口再次更新。";
  const localDraft = "QA 当前窗口确实编辑过的未保存草稿。";
  await visit(page, route, title);
  const firstNote = page.getByLabel("实践笔记", { exact: true });
  await firstNote.fill(original);
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeDisabled();
  const second = await context.newPage();
  await visit(second, route, title);
  const secondNote = second.getByLabel("实践笔记", { exact: true });
  await expect(secondNote).toHaveValue(original);
  await secondNote.fill(versionB);
  await second.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(
    second.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "刷新工作区状态", exact: true })
    .click();
  await expect(firstNote).toHaveValue(versionB);
  await expect(
    page.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), storageKey))
    .toBeNull();
  await page.reload();
  await expect(firstNote).toHaveValue(versionB);
  await firstNote.fill(localDraft);
  await secondNote.fill(versionC);
  await second.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(
    second.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "刷新工作区状态", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "另一窗口更新了这篇笔记。你的草稿已保留",
  );
  await expect(firstNote).toHaveValue(localDraft);
  await expect(
    page.getByRole("button", { name: "确认用草稿替换已保存版本", exact: true }),
  ).toBeEnabled();
  expect((await getState(request)).progress.drill.notes["general-brief"]).toBe(
    versionC,
  );
  await page.reload();
  await expect(firstNote).toHaveValue(localDraft);
  await expect(page.getByRole("alert")).toContainText("另一窗口更新了这篇笔记");
  await page
    .getByRole("button", { name: "载入已保存的新版本", exact: true })
    .click();
  await expect(firstNote).toHaveValue(versionC);
  await expect(
    page.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), storageKey))
    .toBeNull();
  expect((await getState(request)).progress.drill.notes["general-brief"]).toBe(
    versionC,
  );
  await second.close();
});

test("typing while a note save is pending preserves the newer draft without a false conflict", async ({
  page,
  request,
}) => {
  await visit(page, "lesson/general-brief", "把模糊想法变成一张任务卡");
  const note = page.getByLabel("实践笔记", { exact: true });
  const save = page.getByRole("button", { name: "保存笔记", exact: true });
  await note.fill("QA 已保存的起始版本。");
  await save.click();
  await expect(save).toBeDisabled();
  const submitted = "QA 点击保存时提交的内容。";
  const continued =
    "QA 点击保存时提交的内容。\nQA 保存尚未返回时继续输入的新内容。";
  await note.fill(submitted);
  const target = "http://127.0.0.1:4178/api/progress/drill";
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  const delayOneSave = async (route: Route) => {
    const response = await route.fetch();
    await responseGate;
    await route.fulfill({ response });
  };
  await page.route(target, delayOneSave, { times: 1 });
  const finished = page.waitForResponse(
    (response) =>
      response.url() === target && response.request().method() === "PATCH",
  );
  try {
    await save.click();
    await expect
      .poll(
        async () =>
          (await getState(request)).progress.drill.notes["general-brief"],
      )
      .toBe(submitted);
    await expect(save).toBeDisabled();
    await expect(note).toBeEditable();
    await note.fill(continued);
    releaseResponse();
    expect((await finished).status()).toBe(200);
    await expect(save).toBeEnabled();
    await expect(note).toHaveValue(continued);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "确认用草稿替换已保存版本",
        exact: true,
      }),
    ).toHaveCount(0);
    expect(
      (await getState(request)).progress.drill.notes["general-brief"],
    ).toBe(submitted);
  } finally {
    releaseResponse();
    await page.unroute(target, delayOneSave);
  }
  await page.reload();
  await expect(note).toHaveValue(continued);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(save).toBeEnabled();
  await save.click();
  await expect(save).toBeDisabled();
  expect((await getState(request)).progress.drill.notes["general-brief"]).toBe(
    continued,
  );
});

test("one failed save preserves saved data and the draft, then reconnect and retry succeed", async ({
  page,
  request,
  cleanConsole,
}) => {
  await visit(page, "lesson/general-brief", "把模糊想法变成一张任务卡");
  const note = page.getByLabel("实践笔记", { exact: true });
  await note.fill("QA 服务端已有的实践笔记。");
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("实践笔记已保存");
  const savedBefore = await getState(request);
  const draft = "QA 断线期间的新笔记：只有重试成功后才能保存。";
  await note.fill(draft);
  const target = "http://127.0.0.1:4178/api/progress/drill";
  let aborted = 0;
  const abortOneSave = async (route: Route) => {
    if (route.request().method() === "PATCH") {
      aborted++;
      await route.abort("failed");
    } else await route.continue();
  };
  cleanConsole.expectedProgressAbort = true;
  await page.route(target, abortOneSave, { times: 1 });
  const failed = page.waitForEvent("requestfailed", {
    predicate: (request) =>
      request.url() === target && request.method() === "PATCH",
  });
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  expect((await failed).failure()?.errorText).toBe("net::ERR_FAILED");
  expect(aborted).toBe(1);
  await expect(page.getByRole("alert")).toContainText(
    "本地服务暂时断开，本次修改尚未保存。请重新连接后重试。",
  );
  await expect(page.getByRole("status")).toContainText("本次修改尚未保存");
  await expect(note).toHaveValue(draft);
  await expect(
    page.getByRole("button", { name: "保存笔记", exact: true }),
  ).toBeEnabled();
  expect(await getState(request)).toEqual(savedBefore);
  await page.unroute(target, abortOneSave);
  await page
    .getByRole("alert")
    .getByRole("button", { name: "重新连接", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(note).toHaveValue(draft);
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("实践笔记已保存");
  expect((await getState(request)).progress.drill.notes["general-brief"]).toBe(
    draft,
  );
  await page.reload();
  await expect(note).toHaveValue(draft);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("prompt variables, manual editing, real clipboard, personal notes and bookmarks work together", async ({
  page,
  request,
}) => {
  await visit(page, "prompt/general-prompt-brief", "任务澄清卡");
  await page
    .getByRole("textbox", { name: "想完成的事", exact: true })
    .fill("QA：完成三人的学习资料交接");
  const result = page.getByLabel("生成的提示词", { exact: true });
  await expect(result).toHaveValue(/QA：完成三人的学习资料交接/);
  const custom = `${await result.inputValue()}\n额外约束：输出一张便于三人复核的清单。`;
  await result.fill(custom);
  await expect(page.getByText("已手动编辑", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "复制提示词", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "已复制", exact: true }),
  ).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.replace(/\r\n/g, "\n")).toBe(custom.replace(/\r\n/g, "\n"));
  await page.getByRole("button", { name: "保存为我的笔记" }).click();
  await expect(page.getByRole("status")).toContainText("已保存到");
  await page.getByRole("button", { name: "收藏配方", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "已收藏配方", exact: true }),
  ).toBeVisible();
  await snapshot(page, "desktop-prompt.png");
  await visit(page, "collection", "我的收藏");
  await expect(
    page.getByRole("heading", { name: "任务澄清卡", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "提示词笔记 1", exact: true }).click();
  await page.getByRole("button", { name: /任务澄清卡/ }).click();
  await expect(page.getByLabel("已保存的提示词")).toHaveValue(custom);
  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "任务澄清卡", exact: true }),
  ).toBeVisible();
  const state = await getState(request);
  expect(
    state.savedPrompts.find((item) => item.sourceId === "general-prompt-brief")
      ?.text,
  ).toBe(custom);
  expect(state.progress.drill.bookmarks).toContain("general-prompt-brief");
  expect(state.progress.lin.bookmarks).not.toContain("general-prompt-brief");
});

test("global search and library filters reach matching content and handle empty results", async ({
  page,
}) => {
  await visit(page, "home", /你好，Drill/);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.insertText("任务澄清卡");
  await expect(page.getByLabel("全局搜索", { exact: true })).toHaveValue(
    "任务澄清卡",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /任务澄清卡/ })
    .click();
  await expect(page).toHaveURL(/#prompt\/general-prompt-brief$/);
  await visit(page, "prompts", "提示词工坊");
  await page.getByRole("button", { name: "通用 AI", exact: true }).click();
  await page.getByLabel("提示词难度").selectOption("进阶");
  await page.getByLabel("搜索提示词").fill("工作流");
  await expect(
    page.getByRole("heading", { name: "工作流与提示词版本对照" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "一页小游戏计划" }),
  ).toHaveCount(0);
  await page.getByLabel("搜索提示词").fill("这个词一定不存在_QA_0901");
  await expect(
    page.getByRole("heading", { name: "暂时没有匹配的配方" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await expect(page.getByLabel("搜索提示词")).toHaveValue("");
  await expect(page.getByLabel("提示词难度")).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "一页小游戏计划" }),
  ).toBeVisible();
  await visit(page, "tools", "工具装备库");
  await page.getByRole("button", { name: "游戏制作", exact: true }).click();
  await page.getByLabel("搜索工具").fill("Godot");
  await expect(
    page.getByRole("heading", { name: "Godot", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "前往官方页面" }),
  ).toHaveAttribute("href", "https://godotengine.org/");
});

test("an obsolete stored member recovers to a valid member without crashing", async ({
  page,
  request,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("guild-member-v1", "removed-member-id"),
  );
  await visit(page, "home", /你好，Drill/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("guild-member-v1")))
    .toBe("drill");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "我的收藏", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "我的收藏", level: 1 }),
  ).toBeVisible();
  expect(
    (await getState(request)).members.map((member) => member.id),
  ).toContain("drill");
});

test("two tabs reject a stale bookmark write and preserve both bookmarks after retry", async ({
  page,
  context,
  request,
  cleanConsole,
}) => {
  cleanConsole.expectedBookmarkConflict = true;
  const second = await context.newPage();
  await visit(page, "prompt/general-prompt-brief", "任务澄清卡");
  await visit(second, "prompt/general-prompt-summary", "带出处的一页资料简报");
  await page.getByRole("button", { name: "收藏配方", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "已收藏配方", exact: true }),
  ).toBeVisible();
  const staleResponse = second.waitForResponse(
    (response) =>
      response.url().endsWith("/api/progress/drill") &&
      response.request().method() === "PATCH",
  );
  await second.getByRole("button", { name: "收藏配方", exact: true }).click();
  expect((await staleResponse).status()).toBe(409);
  await expect(second.getByRole("status")).toContainText(/更新|重试/);
  await expect(
    second.getByRole("button", { name: "收藏配方", exact: true }),
  ).toBeVisible();
  expect((await getState(request)).progress.drill.bookmarks).toContain(
    "general-prompt-brief",
  );
  expect((await getState(request)).progress.drill.bookmarks).not.toContain(
    "general-prompt-summary",
  );
  await second.getByRole("button", { name: "收藏配方", exact: true }).click();
  await expect(
    second.getByRole("button", { name: "已收藏配方", exact: true }),
  ).toBeVisible();
  expect((await getState(request)).progress.drill.bookmarks).toEqual(
    expect.arrayContaining(["general-prompt-brief", "general-prompt-summary"]),
  );
  await visit(page, "collection", "我的收藏");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "任务澄清卡", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "带出处的一页资料简报", exact: true }),
  ).toBeVisible();
  await second.close();
});

test("tasks support create, assignment filters, status change, editing and confirmed deletion", async ({
  page,
  request,
}) => {
  await visit(page, "team", "小队任务板");
  await page.getByRole("button", { name: "创建任务", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("任务名称", { exact: true })
    .fill("QA 整理三条实测反馈");
  await dialog
    .getByLabel("完成标准与说明")
    .fill("每条反馈包含观察、问题和建议。");
  await dialog
    .getByRole("combobox", { name: "负责人", exact: true })
    .selectOption("lin");
  await dialog
    .getByRole("combobox", { name: "优先级", exact: true })
    .selectOption("high");
  await dialog.getByRole("button", { name: "保存任务" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "QA 整理三条实测反馈" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "只看我的", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "QA 整理三条实测反馈" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "全部任务", exact: true }).click();
  await page.getByLabel("移动任务：QA 整理三条实测反馈").selectOption("doing");
  await expect(page.getByLabel("移动任务：QA 整理三条实测反馈")).toHaveValue(
    "doing",
  );
  await expect
    .poll(
      async () =>
        (await getState(request)).tasks.find(
          (task) => task.title === "QA 整理三条实测反馈",
        )?.status,
    )
    .toBe("doing");
  await page.reload();
  await expect(page.getByLabel("移动任务：QA 整理三条实测反馈")).toHaveValue(
    "doing",
  );
  await page
    .getByRole("button", { name: "编辑任务：QA 整理三条实测反馈", exact: true })
    .click();
  await dialog
    .getByLabel("任务名称", { exact: true })
    .fill("QA 已复核三条反馈");
  await dialog
    .getByRole("combobox", { name: "状态", exact: true })
    .selectOption("done");
  await dialog.getByRole("button", { name: "保存任务" }).click();
  await expect(page.getByLabel("移动任务：QA 已复核三条反馈")).toHaveValue(
    "done",
  );
  await snapshot(page, "desktop-team.png");
  await page
    .getByRole("button", { name: "编辑任务：QA 已复核三条反馈", exact: true })
    .click();
  await dialog.getByRole("button", { name: "删除任务", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "确认删除这个任务" }),
  ).toBeVisible();
  expect(
    (await getState(request)).tasks.some(
      (task) => task.title === "QA 已复核三条反馈",
    ),
  ).toBeTruthy();
  await dialog.getByRole("button", { name: "确认删除这个任务" }).click();
  await expect(
    page.getByRole("heading", { name: "QA 已复核三条反馈" }),
  ).toHaveCount(0);
});

test("shared goals keep milestone state across refresh and editing", async ({
  page,
}) => {
  await visit(page, "team", "小队任务板");
  await page.getByRole("button", { name: "设定目标", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("我们想一起完成什么？").fill("QA 完成第一次共同实践");
  await dialog.getByLabel("目标说明").fill("用两步检查一次真实成果。");
  await dialog.getByLabel("里程碑 1", { exact: true }).fill("QA 约定验收标准");
  await dialog.getByRole("button", { name: "再加一步" }).click();
  await dialog.getByLabel("里程碑 2", { exact: true }).fill("QA 完成三人复核");
  await dialog.getByRole("button", { name: "保存目标" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: "QA 约定验收标准", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "QA 约定验收标准", exact: true }),
  ).toBeChecked();
  const goal = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "QA 完成第一次共同实践",
        exact: true,
      }),
    });
  await expect(goal.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "50",
  );
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "QA 约定验收标准", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "QA 完成三人复核", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("button", {
      name: "编辑目标：QA 完成第一次共同实践",
      exact: true,
    })
    .click();
  await dialog.getByLabel("我们想一起完成什么？").fill("QA 小队共同实践");
  await dialog.getByRole("button", { name: "保存目标" }).click();
  await expect(
    page.getByRole("checkbox", { name: "QA 约定验收标准", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "编辑目标：QA 小队共同实践", exact: true })
    .click();
  await dialog.getByRole("button", { name: "删除目标", exact: true }).click();
  await dialog
    .getByRole("button", { name: "确认删除目标", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA 小队共同实践", exact: true }),
  ).toHaveCount(0);
});

test("backup export and import restore data and update already-open member forms", async ({
  page,
  request,
}) => {
  await visit(page, "settings", "工作区与使用指南");
  let member = page.getByLabel("成员名称：Drill", { exact: true });
  let form = page.locator("form").filter({ has: member });
  await member.fill("QA 备份中的名字");
  await form.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("成员资料已更新");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "导出备份", exact: true }).click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(file).toBeTruthy();
  const backup = JSON.parse(await readFile(file!, "utf8")) as AppState;
  expect(backup.members.find((item) => item.id === "drill")?.name).toBe(
    "QA 备份中的名字",
  );
  member = page.getByLabel("成员名称：QA 备份中的名字", { exact: true });
  form = page.locator("form").filter({ has: member });
  await member.fill("QA 恢复前的名字");
  await form.getByRole("button", { name: "保存", exact: true }).click();
  await expect(
    page.getByLabel("成员名称：QA 恢复前的名字", { exact: true }),
  ).toBeVisible();
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "qa-workspace-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await expect(
    page.getByRole("dialog", { name: "确认恢复工作区备份" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "确认恢复备份", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByLabel("成员名称：QA 备份中的名字", { exact: true }),
  ).toHaveValue("QA 备份中的名字");
  expect(
    (await getState(request)).members.find((item) => item.id === "drill")?.name,
  ).toBe("QA 备份中的名字");
  await page.reload();
  await expect(
    page.getByLabel("成员名称：QA 备份中的名字", { exact: true }),
  ).toHaveValue("QA 备份中的名字");
});

test("mobile board shows one status at a time and moved tasks appear in the destination tab", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, "team", "小队任务板");
  const tabs = page.locator(".mobile-board-tabs");
  const task = seed.tasks.find((item) => item.status === "todo")!;
  expect(task).toBeTruthy();
  const visibleColumns = page.locator(".kanban-column:visible");
  await expect(tabs).toBeVisible();
  for (const label of ["待开始", "进行中", "已完成", "待开始"]) {
    const tab = tabs.getByRole("button", { name: new RegExp(`^${label}`) });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-pressed", "true");
    await expect(visibleColumns).toHaveCount(1);
    await expect(
      visibleColumns.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: `移动任务：${task.title}`, exact: true })
    .selectOption("doing");
  await expect(page.getByRole("status")).toContainText("任务已移至「进行中」");
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toHaveCount(0);
  await tabs.getByRole("button", { name: /^进行中/ }).click();
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: `移动任务：${task.title}`, exact: true })
    .selectOption("done");
  await expect(page.getByRole("status")).toContainText("任务已移至「已完成」");
  await tabs.getByRole("button", { name: /^已完成/ }).click();
  await expect(visibleColumns).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toBeVisible();
  expect(
    (await getState(request)).tasks.find((item) => item.id === task.id)?.status,
  ).toBe("done");
  await page.reload();
  await tabs.getByRole("button", { name: /^已完成/ }).click();
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toBeVisible();
  await snapshot(page, "mobile-board-completed.png");
  await page.setViewportSize({ width: 760, height: 900 });
  await expect(tabs).toBeVisible();
  await expect(visibleColumns).toHaveCount(1);
  await page.setViewportSize({ width: 761, height: 900 });
  await expect(tabs).not.toBeVisible();
  await expect(visibleColumns).toHaveCount(3);
});

test("390px mobile navigation and key pages fit without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, "home", /你好，Drill/);
  await snapshot(page, "mobile-home.png");
  for (const [name, route, title] of [
    ["学习公会", "guilds", "学习公会"],
    ["提示词工坊", "prompts", "提示词工坊"],
    ["工具装备库", "tools", "工具装备库"],
    ["小队任务板", "team", "小队任务板"],
    ["我的收藏", "collection", "我的收藏"],
  ]) {
    await page.getByRole("button", { name: "打开导航", exact: true }).click();
    await page
      .getByRole("navigation", { name: "主要导航" })
      .getByRole("button", { name: new RegExp(name) })
      .click();
    await expect(page).toHaveURL(new RegExp(`#${route}$`));
    await expect(
      page.getByRole("heading", { name: title, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "关闭导航遮罩" }),
    ).toHaveCount(0);
    const size = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect
      .soft(size.content, `${route} mobile page horizontal width`)
      .toBeLessThanOrEqual(size.viewport + 1);
    if (route === "team") await snapshot(page, "mobile-team.png");
  }
  for (const [route, title] of [
    ["guild/general", "通用 AI 实践"],
    ["lesson/general-brief", "把模糊想法变成一张任务卡"],
    ["prompt/general-prompt-brief", "任务澄清卡"],
    ["settings", "工作区与使用指南"],
  ]) {
    await visit(page, route, title);
    const details = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      overflowing: [...document.querySelectorAll("main *")]
        .filter(
          (element) => element.getBoundingClientRect().right > innerWidth + 1,
        )
        .slice(0, 10)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          text: element.textContent?.slice(0, 80),
        })),
    }));
    if (details.width > details.viewport + 1)
      await testInfo.attach(`overflow-${route.replace("/", "-")}`, {
        body: JSON.stringify(details, null, 2),
        contentType: "application/json",
      });
    expect
      .soft(details.width, `${route} mobile page horizontal width`)
      .toBeLessThanOrEqual(details.viewport + 1);
  }
});
