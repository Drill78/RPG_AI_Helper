# 游戏制作人内容与来源记录

核查日期：2026-10-09。对应文件：`src/content/game.ts`。

本模块包含 10 节原创实践课程、10 份可编辑提示词和 6 张工具卡。练习、案例、时间估计、面数预算和验收步骤是本项目的教学设计；来源用于校验工具行为，不表示官方对本课程的背书。示例提示词不会自动调用外部 AI，也不会自动生成网格、代码或测试结果。

## 学习路线

| 阶段      | 课程                     | 实际交付物                               |
| --------- | ------------------------ | ---------------------------------------- |
| Lv.1      | 一页小游戏计划           | 有操作、目标、范围与验收标准的计划卡     |
| Lv.2      | 引擎、场景和输入         | 可启动并响应按键的原型                   |
| Lv.3      | 完整一局、证据驱动排错   | 可以得分、结束与重试的玩法循环           |
| Lv.3 可选 | Lofi 低模静态道具        | 源文件、导出文件与引擎检查记录           |
| Lv.4      | 素材整合、三人协作、试玩 | 统一资源、可执行任务和真实反馈           |
| Lv.5      | Demo 交付、版本迭代      | 目标设备实际验证过的试玩版本与下一轮计划 |

等级用于描述成果阶段，不代表职业能力认证。卡片分钟数为一次练习的参考时长，首次接触引擎、编程或建模可能需要明显更久。3D 支线不应成为完成 2D 主线的强制前置条件。

## 工具行为的主要来源

| 官方资料                                                                                                                                         | 用于核验的内容                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [Godot：第一个 2D 游戏](https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html)                                         | 初次实践以简单 2D 游戏为起点；完整项目仍需要一定编程基础。              |
| [Godot：节点与场景](https://docs.godotengine.org/en/stable/getting_started/step_by_step/nodes_and_scenes.html)                                   | 场景组成、实例、主场景与当前场景运行的区别。                            |
| [Godot：输入示例](https://docs.godotengine.org/en/stable/tutorials/inputs/input_examples.html)                                                   | InputMap 的命名动作、事件与连续输入处理。                               |
| [Godot：信号](https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html)                                                  | 通过事件连接对象，而不要求对象彼此直接修改状态。                        |
| [Godot：主游戏场景](https://docs.godotengine.org/en/stable/getting_started/first_2d_game/05.the_main_game_scene.html)                            | 主流程、计时器、计分和结束的组织。                                      |
| [Godot：调试面板](https://docs.godotengine.org/en/stable/tutorials/scripting/debug/debugger_panel.html)                                          | 错误、堆栈、断点、监视和性能工具的实际职责。                            |
| [Blender 4.5：应用变换](https://docs.blender.org/manual/en/4.5/scene_layout/object/editing/apply.html)                                           | 变换与对象数据关系；已有骨骼与动画时不可照搬静态道具流程。              |
| [Blender 4.5：glTF](https://docs.blender.org/manual/en/4.5/addons/import_export/scene_gltf2.html)                                                | glTF 使用可识别的材质节点与贴图；复杂 Blender 材质不保证原样导出。      |
| [Godot：模型导出注意事项](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/model_export_considerations.html) | 轴向、三角化、变换与导入后光照检查。                                    |
| [Godot：版本控制](https://docs.godotengine.org/en/stable/tutorials/best_practices/version_control_systems.html)                                  | 4.1 及以后缓存忽略规则、版本差异、Git LFS 资源管理。                    |
| [GitHub：LFS 协作](https://docs.github.com/en/repositories/working-with-files/managing-large-files/collaboration-with-git-large-file-storage)    | 未配置 LFS 的成员可能只获取指针文件；大文件与源码存储分离。             |
| [Microsoft：游戏可访问性指南](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines)                                                   | 文字、声音、输入、视觉运动等检查方向；指南不是法律合规认证清单。        |
| [Microsoft：对比度](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102)                                      | 关键状态不只依赖颜色；文字与背景需要清晰区分。                          |
| [Godot：导出项目](https://docs.godotengine.org/en/stable/tutorials/export/exporting_projects.html)                                               | 需要导出模板；Export Project 和只导出 PCK/ZIP 的区别。                  |
| [Godot：网页导出](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)                                                | 必须通过网页服务器提供文件；语言、渲染、线程与音频存在平台限制。        |
| [Unity 6：Build Profiles](https://docs.unity3d.com/6000.0/Documentation/Manual/create-build-profile.html)                                        | 添加目标平台配置、安装缺失模块并选择活动配置；复核页面 canonical 地址。 |

大部分页面通过网页浏览工具读取正文。Blender 官方页面在网页工具中返回读取错误后，使用本地 HTTPS 请求获取同一官方网址，收到 200 响应并读取相关正文；没有用第三方教程代替核查。

## 工具卡的官网来源

- [Godot 许可](https://godotengine.org/license/)：引擎免费开源，分发包含版权与许可说明要求；素材另看自己的许可。
- [Unity Personal](https://unity.com/products/unity-personal)：有资格要求的免费方案。界面未硬编码收入门槛或价格，使用时查看当前官方条款。
- [Blender 许可](https://www.blender.org/about/license/)：软件可以用于商业创作；第三方素材与插件另看条件。
- [Krita 官网](https://krita.org/en/)：免费开源绘画工具；具体平台与分发渠道以官网为准。
- [Audacity 官网](https://www.audacityteam.org/)：本体免费开源；可选插件与云服务单独判断。
- [GitHub 价格](https://github.com/pricing)：有免费方案，部分功能有额度或收费；不将 LFS 描述为无限免费存储。

## 内容校验

- 所有内容 ID 以 `game-` 开头，课程、提示词、工具之间没有重复 ID。
- 10 节课程的 `promptId` 均指向存在的提示词。
- 10 份模板中的 `{{key}}` 与变量表严格匹配，无多余或遗漏变量。
- 每节课包含前置条件、工具、解释、练习、四项成果检查与来源。
- 未声称 AI 已经运行用户的游戏、完成建模或通过测试；实际结果必须由学习者在对应工具中验证。
- 未把 3D 资产的面数示例作为通用行业要求；未把一段提示词描述成直接生成可商用成品的保证。
- 所有预填变量均标注“示例，请按实际情况替换”，尤其项目进度与测试状态不能当成用户的真实结果。
- 版本迭代课程要求实际完成一项小改动、前后比较和三条回归检查，成果、练习与完成清单保持一致。
