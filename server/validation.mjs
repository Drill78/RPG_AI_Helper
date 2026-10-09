export const MAX_STATE_BYTES = 4 * 1024 * 1024;
export const MAX_BODY_BYTES = 5 * 1024 * 1024;
export const MEMBER_IDS = ["drill", "lin", "an"];

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fail = (message) => {
  throw new ApiError(400, message);
};
export const has = (value, key) => Object.hasOwn(value, key);

export function object(value, label, allowed, required = []) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(`${label}必须是对象。`);
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) fail(`${label}包含不支持的字段：${key}。`);
  for (const key of required)
    if (!has(value, key)) fail(`${label}缺少字段：${key}。`);
  return value;
}

export function string(value, label, max, min = 0) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    value.trim().length < min ||
    value.includes("\0")
  ) {
    fail(
      `${label}需要是${min ? `至少 ${min} 个、` : ""}最多 ${max} 个字符的文本。`,
    );
  }
  return value;
}

export function identifier(value, label = "标识") {
  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(value)
  )
    fail(`${label}格式不正确。`);
  return value;
}

function array(value, label, max) {
  if (!Array.isArray(value) || value.length > max)
    fail(`${label}必须是最多 ${max} 项的列表。`);
  return value;
}

function unique(values, label) {
  if (new Set(values).size !== values.length) fail(`${label}存在重复项。`);
}

export function memberId(value) {
  if (!MEMBER_IDS.includes(value)) fail("请选择工作区中的有效成员。");
  return value;
}

function date(value, label) {
  if (value === "") return value;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail(`${label}需要使用 YYYY-MM-DD 格式，或留空。`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value ||
    value < "1900-01-01"
  )
    fail(`${label}不是有效日期。`);
  return value;
}

function timestamp(value) {
  if (typeof value !== "string" || value.length > 30)
    fail("创建时间格式不正确。");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value)
    fail("创建时间需要是完整的 UTC 时间。");
}

export function memberPatch(value) {
  object(value, "成员信息", ["name", "role"]);
  if (!Object.keys(value).length) fail("请提供要修改的成员信息。");
  if (has(value, "name")) string(value.name, "成员名称", 40, 1);
  if (has(value, "role")) string(value.role, "成员介绍", 100, 1);
  return value;
}

const progressKeys = ["completed", "checks", "bookmarks", "notes"];
export function progressValue(value, partial = false) {
  object(value, "学习进度", progressKeys, partial ? [] : progressKeys);
  if (partial && !Object.keys(value).length) fail("请提供要更新的学习进度。");
  for (const key of ["completed", "bookmarks"]) {
    if (!has(value, key)) continue;
    array(
      value[key],
      key === "completed" ? "已完成课程" : "收藏",
      2000,
    ).forEach((id) => identifier(id, "内容标识"));
    unique(value[key], "内容列表");
  }
  for (const key of ["checks", "notes"]) {
    if (!has(value, key)) continue;
    const map = value[key];
    if (
      !map ||
      typeof map !== "object" ||
      Array.isArray(map) ||
      Object.keys(map).length > 2000
    )
      fail("进度明细必须是最多 2000 项的对象。");
    for (const [id, item] of Object.entries(map)) {
      identifier(id, "内容标识");
      if (["__proto__", "prototype", "constructor"].includes(id))
        fail("内容标识不受支持。");
      if (key === "notes") string(item, "学习笔记", 20000);
      else {
        array(item, "检查节点", 100).forEach((index) => {
          if (!Number.isInteger(index) || index < 0 || index > 99)
            fail("检查节点需要是 0 至 99 之间的整数。");
        });
        unique(item, "检查节点");
      }
    }
  }
  return value;
}

export const taskFields = [
  "title",
  "description",
  "assignee",
  "status",
  "priority",
  "dueDate",
];
export function taskValue(value, { partial = false, stored = false } = {}) {
  object(
    value,
    "任务",
    stored ? ["id", "createdAt", ...taskFields] : taskFields,
    stored ? ["id", "createdAt", ...taskFields] : partial ? [] : ["title"],
  );
  if (partial && !Object.keys(value).length) fail("请提供要修改的任务内容。");
  if (stored) {
    identifier(value.id);
    timestamp(value.createdAt);
  }
  if (has(value, "title")) string(value.title, "任务标题", 160, 1);
  if (has(value, "description")) string(value.description, "任务说明", 5000);
  if (has(value, "assignee")) memberId(value.assignee);
  if (has(value, "status") && !["todo", "doing", "done"].includes(value.status))
    fail("任务状态不受支持。");
  if (has(value, "priority") && !["normal", "high"].includes(value.priority))
    fail("任务优先级不受支持。");
  if (has(value, "dueDate")) date(value.dueDate, "任务日期");
  return value;
}

export function goalValue(value, { partial = false, stored = false } = {}) {
  const keys = ["title", "description", "deadline", "milestones"];
  object(
    value,
    "共同目标",
    stored ? ["id", ...keys] : keys,
    stored ? ["id", ...keys] : partial ? [] : ["title"],
  );
  if (partial && !Object.keys(value).length) fail("请提供要修改的目标内容。");
  if (stored) identifier(value.id);
  if (has(value, "title")) string(value.title, "目标标题", 160, 1);
  if (has(value, "description")) string(value.description, "目标说明", 5000);
  if (has(value, "deadline")) date(value.deadline, "目标日期");
  if (has(value, "milestones")) {
    array(value.milestones, "里程碑", 50).forEach((item) => {
      object(
        item,
        "里程碑",
        ["id", "title", "done"],
        stored ? ["id", "title", "done"] : ["title"],
      );
      if (has(item, "id")) identifier(item.id, "里程碑标识");
      string(item.title, "里程碑标题", 200, 1);
      if (has(item, "done") && typeof item.done !== "boolean")
        fail("里程碑完成状态必须是布尔值。");
    });
    unique(
      value.milestones.filter((item) => has(item, "id")).map((item) => item.id),
      "里程碑",
    );
  }
  return value;
}

export function savedPromptValue(value, stored = false) {
  const keys = ["memberId", "title", "text", "sourceId"];
  object(
    value,
    "保存的提示词",
    stored ? ["id", "createdAt", ...keys] : keys,
    stored ? ["id", "createdAt", ...keys] : ["memberId", "title", "text"],
  );
  if (stored) {
    identifier(value.id);
    timestamp(value.createdAt);
  }
  memberId(value.memberId);
  string(value.title, "提示词标题", 160, 1);
  string(value.text, "提示词正文", 40000, 1);
  if (has(value, "sourceId") && value.sourceId !== "")
    identifier(value.sourceId, "来源标识");
  return value;
}

export function validateState(state) {
  const keys = [
    "version",
    "members",
    "progress",
    "tasks",
    "goals",
    "savedPrompts",
  ];
  object(state, "备份", keys, keys);
  if (state.version !== 1) fail("备份版本不受支持，需要 version: 1。");
  array(state.members, "成员", 3);
  if (state.members.length !== 3) fail("备份需要包含全部三位工作区成员。");
  state.members.forEach((member) => {
    object(
      member,
      "成员",
      ["id", "name", "role", "color"],
      ["id", "name", "role", "color"],
    );
    memberId(member.id);
    string(member.name, "成员名称", 40, 1);
    string(member.role, "成员介绍", 100, 1);
    if (
      typeof member.color !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(member.color)
    )
      fail("成员颜色必须是六位十六进制颜色。");
  });
  unique(
    state.members.map((member) => member.id),
    "成员",
  );
  object(state.progress, "成员学习进度", MEMBER_IDS, MEMBER_IDS);
  MEMBER_IDS.forEach((id) => progressValue(state.progress[id]));
  array(state.tasks, "任务", 1000).forEach((task) =>
    taskValue(task, { stored: true }),
  );
  array(state.goals, "共同目标", 100).forEach((goal) =>
    goalValue(goal, { stored: true }),
  );
  array(state.savedPrompts, "保存的提示词", 1000).forEach((prompt) =>
    savedPromptValue(prompt, true),
  );
  for (const field of ["tasks", "goals", "savedPrompts"])
    unique(
      state[field].map((entry) => entry.id),
      field,
    );
  if (Buffer.byteLength(JSON.stringify(state), "utf8") > MAX_STATE_BYTES)
    fail("工作区数据超过 4 MB，请先导出备份并清理部分内容。");
  return state;
}
