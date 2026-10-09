# 通用 AI 实践 · 内容说明与来源

核查日期：2026-10-09。内容文件：`src/content/general.ts`。

首版包含 10 节课程、10 个提示词配方和 7 个工具入口。教学叙述、任务示例、提示词和验收清单为本项目原创设计；下列官方资料用于核对方法依据及工具能力。来源不构成对任意模型输出的效果保证。

## 通用职业的边界

通用路线收录可以跨领域迁移的工作方法：明确任务、处理资料、核查来源、表达与协作、表格分析、知识复用、小工具自动化和流程评测。它既包含入门课，也包含进阶能力。

划分依据是验收是否需要特定行业知识：

- 从会议中提取承诺、日期和负责人，属于通用。
- 使用表格复算总量与比例，属于通用；解释专业实验、财务或临床指标，应进入相应领域并增加专业审查。
- 批量整理测试文件，属于通用；判断一个游戏角色是否具备可用拓扑和正确骨骼，应进入游戏制作路线。
- 资料检索和引用核查，属于通用；对学术研究方法与论文贡献的判断，应进入研究方向。

未来职业路线可以引用这些通用课程，避免重复维护同一份内容。

## 方法来源

| 官方资料                                                                                              | 本项目使用的有限依据                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [OpenAI 提问与协作](https://learn.chatgpt.com/docs/prompting)                                         | 说明任务目标、相关材料、成果形式与边界；通过具体反馈迭代。                                            |
| [OpenAI 提示词工程](https://developers.openai.com/api/docs/guides/prompt-engineering)                 | 使用恰当输入输出示例和相关上下文。未要求用户使用 API。                                                |
| [Google 资料问答与引用](https://support.google.com/gemininotebook/answer/16179559?hl=en)              | 对选定资料提问，通过引用回到相关材料。引用仍需人工核对。                                              |
| [Microsoft 会议回顾](https://support.microsoft.com/en-us/teams/meetings-events/recap-a-teams-meeting) | 会议摘要可帮助提取行动事项，AI 生成结果可能有误。课程可用普通文字 AI 完成，不要求 Teams 订阅。        |
| [Microsoft Excel 数据分析](https://support.microsoft.com/en-gb/excel/analyze-data-in-excel)           | 单行明确表头、规范的二维表格有利于分析。课程不依赖付费 AI 分析按钮。                                  |
| [Google Sheets UNIQUE](https://support.google.com/docs/answer/10522653?hl=en)                         | 去重结果受文本空格和数值格式影响；先定义记录含义。                                                    |
| [Obsidian 内部链接](https://obsidian.md/help/links)                                                   | 用链接关联笔记与材料；不要求使用 Obsidian 特定插件。                                                  |
| [GitHub Copilot Agent 使用说明](https://docs.github.com/en/copilot/responsible-use/agents)            | 生成代码与审查建议可能出错，需限定任务范围并实际验证。                                                |
| [VS Code 工作区信任](https://code.visualstudio.com/docs/editing/workspaces/workspace-trust)           | 不熟悉代码的工作区应先审查，不能靠取消保护解决执行问题。                                              |
| [Anthropic 构建有效 Agent](https://www.anthropic.com/engineering/building-effective-agents)           | 固定任务可采用简单工作流与检查节点；复杂度应由实际需要决定。引用的是方法，不是文章中的旧工具清单。    |
| [OpenAI 评测方法](https://developers.openai.com/api/docs/guides/evaluation-best-practices)            | 使用任务相关样例和明确标准比较版本，并结合人工核查。只使用方法论，不推荐该页提到的旧 Evals 托管平台。 |

## 工具入口核查

- [ChatGPT 使用说明](https://learn.chatgpt.com/docs/use-chatgpt)：对话、草稿与资料工作；功能按账号能力确定。
- [Claude 方案页](https://claude.com/pricing)：仅记录免费与付费方案并存，不固定价格、额度或可用模型。
- Google 旧 NotebookLM 帮助入口在核查时重定向至 Gemini Notebook，官方正文指向 `notebook.google.com`。应用使用当前官方名称，并说明该入口变化。
- [Obsidian 方案页](https://obsidian.md/pricing)：核心功能免费，可选同步与发布服务付费。
- [VS Code 官方文档](https://code.visualstudio.com/docs)：作为编辑与检查代码的工具，AI 服务由用户另行选择。

## 质量检查

- 实际导入内容模块，检查全部 ID 唯一、课程配方关联存在。
- 检查每节课等级位于 1–5，每节课有 3–5 个验收项。
- 检查全部模板中的变量与编辑字段严格对应，没有缺失或多余字段。
- 教程时长为设计估时，完成速度因材料复杂度而异。
- 内置人物、笔记与 CSV 均标记为练习材料；内容不声称用户已经完成任何进度。
- 数字分析需提供可复算方法或真实执行结果；文件自动化默认预览，要求测试副本与冲突处理。
- 本地应用只帮助准备提示词，不会自动访问外部 AI、上传附件或执行提示词。
