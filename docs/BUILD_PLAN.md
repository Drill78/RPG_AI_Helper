# RPG AI Helper · 本地交付计划与完成记录

用户于 2026-10-09 授权自主实施、分配 agent、研究内容、生成图片、持续迭代并提交代码。目标是数小时内可体验、视觉精美且有真实内容的本地应用。

## 产品约束

- 实用为主，RPG 为轻量辅助隐喻，不引入战斗数值和复杂装备规则。
- 首期通用 AI 实践与游戏制作人。通用涵盖跨行业方法、日常任务、进阶复用，不能等同新手教程。
- 教程、可编辑提示词、工具资料、可验证成果与学习进度。
- 三人本地工作区：可切换成员，任务与共同目标共享，个人进度独立。此版本不是联网账号系统。
- 未来职业扩展、手机 app 与好友/任务市场留在路线图，界面不提供虚假的可用入口。
- 不接入付费 AI API，不生成虚假 AI 执行结果；提示词供用户在自己的 AI 工具中使用。

## 工程

React + TypeScript + Vite；Node.js 本地 API + SQLite 持久化。源码内容与用户数据分离。仅监听回环地址。前端开发端口 4173，API/生产服务端口 4174。

## 协作所有权

- 主 agent：脚手架、src/types.ts、前端页面/样式、整合、端到端测试、启动文档、提交与推送。
- general_content：src/content/general.ts，通用课程与提示词，相关来源核查。
- game_content：src/content/game.ts，游戏课程/提示词/工具，相关来源核查。
- local_backend：server/ 全部、本地 API 与 SQLite、服务 API 测试、docs/API.md。

## 内容模块导出契约

general.ts 导出 generalLessons: Lesson[], generalPrompts: PromptRecipe[], generalTools: ToolItem[]。
game.ts 导出 gameLessons: Lesson[], gamePrompts: PromptRecipe[], gameTools: ToolItem[]。
类型均从 ../types 导入。ID 前缀 general-/game-。每组至少 6 节细致课程、6 个可编辑的实用提示词。所有来源使用实际查阅的官方资料，标记核查日期；正文为原创教学。

## API 契约

GET /api/state -> AppState（直接对象）。PATCH /api/members/:id -> {name?,role?}；PATCH /api/progress/:memberId -> 部分 Progress 字段（checks/notes 按键合并，completed/bookmarks 全量替换）。
POST /api/tasks；PATCH /api/tasks/:id；DELETE /api/tasks/:id。
POST /api/goals；PATCH /api/goals/:id；DELETE /api/goals/:id。
POST /api/saved-prompts；DELETE /api/saved-prompts/:id。
变更接口返回更新后的整个 AppState。失败返回 {error:string}。GET /api/export 下载 JSON。POST /api/import {state:AppState} 导入并严格校验。
初始成员 ID drill, lin, an；初始无学习完成记录；示例任务和目标应清楚为可编辑起点。有健康检查 GET /api/health。

## 验收和迭代

1. 完整学习/复制/收藏/三人任务基础流程。
2. 高质量响应式视觉、内容来源、键盘交互、空态与失败反馈。
3. 编译/API 测试/桌面与移动端浏览器实际操作；刷新持久化；修复发现的问题。
4. 保存截图、填写验收记录、提交推送、留本地服务和一键启动入口。

## 进度

- 已完成：完整界面与本地数据功能；20 节课程、20 个提示词配方、13 张工具卡；成熟奇幻像素美术；四轮实现与验收修正；无障碍、桌面与移动端布局；使用、接口、内容与未来规划文档。
- 验证：27 项接口/内容检查与 15 项真实浏览器流程均通过；12 个页面视图 axe 扫描零规则命中、零横向溢出、零意外运行错误。
- 本地生产交付已完成：Windows 一键入口实测成功，正式服务在 4174 运行，桌面与手机截图复核通过。源码、内容、美术与交付文档纳入本次 Git 提交；推送状态以 Git 远端记录为准。验证详情见 `VERIFICATION.md`。
- 未来明确未实现：联网账号、多人跨设备同步、原生手机 App、真实 AI 服务调用、公开任务发布。详见 `ROADMAP.md`。

## 最终视觉与可靠性约束

- 用户最终选择成熟的 D&D / CRPG 像素视觉，替换了早期可爱场景。只保留 public/images 下三个最终暗色场景。
- 所有状态响应携带 ETag，客户端 If-Match 写入，数据库事务内拒绝旧版本覆盖。
- 笔记草稿保存 base 与 text；干净编辑器同步新数据，真正冲突需明确选择载入新版或覆盖。不要将整个 progress.notes 对象变化当成无条件重置草稿的信号。
