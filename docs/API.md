# 本地工作区 API

当前实现用于同一台电脑上的三人内部工作区。成员切换是本地档案切换，不是登录或身份认证；任一使用这台电脑的人都能修改三人的共享数据。日后发布联网版本时，需要单独加入账户、权限、服务端会话与云端同步，不能把此服务直接开放到公网。

## 启动与数据

- 运行：`node server/index.mjs`，仅监听 `127.0.0.1:4174`。
- Node.js 24，使用内置 `node:http` 与 `node:sqlite`，无服务端第三方依赖。
- SQLite 位于仓库的 `data/workspace.sqlite`；使用 WAL、同步写入与原子事务。路径基于项目目录，不依赖启动时的当前目录。
- 同一进程同时处理多个请求时，写入始终基于事务内读取的最新状态。学习进度的 map 字段合并不会覆盖其他条目。
- 第一次启动创建三位成员 `drill` / `lin` / `an`，显示名为 Drill / 小林 / 阿岚。学习进度为空。六个任务、一个共同目标均明确标为“示例”，可自由修改或删除。
- `Ctrl+C` / SIGTERM 先停止接收连接，再关闭数据库。重复启动时如果端口已被占用，会输出明确提示。
- 前端开发服务使用 4173，并把 `/api` 代理到 4174。构建后服务直接托管 `dist/`，支持前端路由刷新。

## 响应约定

所有成功的业务变更都返回 **HTTP 200 + 完整 `AppState` 对象**，不套额外的 `data` 字段。失败统一返回 `{ "error": "中文提示" }`。API 使用 `Cache-Control: no-store`。

`GET /api/state`、`GET /api/export` 和全部成功变更响应均携带 **ETag**，格式为带双引号的 SHA-256，例如 `"a1b2…"`，由完整状态的 JSON 表示计算，状态不变则标签不变。客户端保存最新标签，在每次变更请求中使用 `If-Match` 原样传回。比较发生在 SQLite 写事务内，读取最新状态之后、应用变更之前，因此多个窗口不会用旧数组覆盖其他窗口的收藏或完成记录。

标签过期时返回 **409**：`{"error":"工作区已在其他窗口更新，已为你刷新，请重试本次操作。"}`。客户端收到 409 后应重新 GET 状态与标签，再提示用户重新操作；不要自动重放旧请求。服务端自身不会主动推送刷新。未提供 `If-Match` 的本地脚本请求仍可工作；此时不提供旧状态覆盖保护。支持的条件格式为本服务返回的单个强 ETag，弱标签、列表和 `*` 不视为匹配。导入备份同样受条件写入保护，数据结构版本仍为 1。

状态结构与 `src/types.ts` 一致：

```ts
type AppState = {
  version: 1;
  members: Member[];
  progress: Record<"drill" | "lin" | "an", Progress>;
  tasks: TeamTask[];
  goals: Goal[];
  savedPrompts: SavedPrompt[];
};
```

POST / PATCH 内容必须使用 `Content-Type: application/json`。未声明、拼错或只读的字段都会被拒绝，而不是静默丢弃。PATCH 至少提供一个可修改字段。

## 接口

| 方法与路径                      | 内容 / 行为                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /api/health`               | `{ok:true, app:"rpg-ai-helper", version:1, storage:"sqlite"}`；用于启动器确认当前端口属于本应用 |
| `GET /api/state`                | 读取完整状态                                                                                    |
| `PATCH /api/members/:id`        | `{name?, role?}`；不能修改 ID 或颜色                                                            |
| `PATCH /api/progress/:memberId` | `{completed?, checks?, bookmarks?, notes?}`                                                     |
| `POST /api/tasks`               | `{title, description?, assignee?, status?, priority?, dueDate?}`                                |
| `PATCH /api/tasks/:id`          | 修改上述任意可编辑字段                                                                          |
| `DELETE /api/tasks/:id`         | 删除任务                                                                                        |
| `POST /api/goals`               | `{title, description?, deadline?, milestones?}`                                                 |
| `PATCH /api/goals/:id`          | 修改上述任意可编辑字段                                                                          |
| `DELETE /api/goals/:id`         | 删除目标及其中的里程碑                                                                          |
| `POST /api/saved-prompts`       | `{memberId, title, text, sourceId?}`                                                            |
| `DELETE /api/saved-prompts/:id` | 删除个人保存的提示词                                                                            |
| `GET /api/export`               | 下载当前完整状态 JSON；文件名含日期                                                             |
| `POST /api/import`              | `{state: AppState}`；严格校验后整体替换当前状态                                                 |

`GET` 接口也支持 `HEAD`。已知路径不支持的方法返回 405 和 `Allow` 响应头；未知路径或对象返回 404。

### 学习进度

- `completed: string[]`：全量替换已完成课程 ID。
- `bookmarks: string[]`：全量替换收藏 ID。
- `checks: Record<string, number[]>`：按课程 ID 合并；同一 ID 的检查数组全量替换。索引为 0 至 99 的整数，不可重复。
- `notes: Record<string, string>`：按内容 ID 合并；空字符串表示清空该条笔记。
- 清空某门课程检查节点使用 `{checks:{"general-example":[]}}`。
- 仅改变一位成员的进度，其他两位成员不受影响。
- 内容 ID 允许未来新增课程，因此不与某次构建的课程清单硬绑定。格式校验始终生效；成员引用则必须指向三位已存在成员。

### 任务与目标

任务标题必填。缺省：`description:''`、`assignee:'drill'`、`status:'todo'`、`priority:'normal'`、`dueDate:''`。状态只能为 `todo | doing | done`，优先级只能为 `normal | high`。ID 和创建时间由服务端生成，不允许 PATCH。

目标标题必填，说明与截止日期默认空，里程碑默认空列表。里程碑结构为 `{id?, title, done?}`，新条目未传 ID 时服务端自动生成，`done` 默认 false。PATCH `milestones` **替换整个里程碑列表**，修改已有条目时请带回原 ID；同一个目标内不允许重复 ID。

日期字段允许空字符串，否则必须为真实存在的 `YYYY-MM-DD` 日期（不早于 1900-01-01）。不会给示例内容编造临近截止时间。

### 备份与恢复

导出包含三位成员的全部学习进度、笔记、收藏、共享任务、目标和已保存提示词；不包含静态教程源码。导入会整体替换当前工作区，因此 UI 应先说明影响，并提供导出入口。

导入校验版本、完整字段、字段类型、长度、数量、重复 ID、三位成员及完整的进度映射、任务与提示词的成员引用、颜色、真实日期和创建时间。未知字段会拒绝。无效导入不会部分覆盖原数据。

## 限制与本地保护

- 请求正文最多 5 MiB；序列化工作区最多 4 MiB，保证可以重新导入已导出的状态。
- 最多 1,000 个任务、100 个目标、每目标 50 个里程碑、1,000 条保存提示词。
- 每位成员最多 2,000 个完成项、2,000 个收藏项，检查与笔记映射各最多 2,000 项。
- 标题最多 160 字符、说明最多 5,000 字符、单条笔记最多 20,000 字符、提示词正文最多 40,000 字符；名称最多 40 字符，成员介绍最多 100 字符。
- 无身份系统，无 API 密钥需求，也不会调用付费 AI 服务。
- 只接受 `localhost` / `127.0.0.1` 的本地 Host；允许当前服务端口与 4173 / 4174 的本地 HTTP 来源。外部 Origin、跨站修改、DNS 重绑定 Host 会返回 403。命令行无 Origin 的本地请求允许使用。
- 前端只从 `dist/` 提供文件；检查真实路径包含关系，阻止目录穿越、符号链接逃逸、隐藏文件、源码映射及源码/数据库路径。不存在的资源不会返回其他目录文件。
- 400 表示输入不合法；403 为来源被拒；404 为找不到；405 为方法错误；409 为工作区已更新、需要刷新重试；413 为正文过大；415 为内容类型错误；500 为内部保存/读取失败。

## 自动验证

运行 `node --test server/*.test.mjs`。测试通过真实 HTTP 请求覆盖状态与完整 CRUD、个人进度隔离及合并、导出导入、输入与成员引用校验、畸形 JSON、跨站/Host 保护、正文大小（含 chunked）、并发修改、双窗口条件写入避免收藏/完成记录覆盖、所有变更接口的过期标签拒绝、SQLite 重开持久化、事务回滚、真实数据库写入失败及恢复、存储失效时的健康检查、静态页面/路由与路径穿越保护、优雅退出。

测试使用内存数据库或独立临时目录，不接触真实工作区。`createDatabase(filename)`、`createApp({database,distDir})` 和 `startServer({port,databasePath,distDir})` 可用于其他集成测试。
