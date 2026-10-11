# 人工智能训练师 · 四级理论刷题

一个**纯静态**的手机 / 电脑刷题网站，覆盖人工智能训练师**四级**理论知识，共 **500 道**题，按官方《认定要素细目表》的章 + 题库自带的二级知识点分成 4 章 100 节。
不需要登录、不需要后端、不用数据库，可以直接部署在 **GitHub Pages** 上，断网也能用。

![题型](https://img.shields.io/badge/题量-500-blue) ![章节](https://img.shields.io/badge/章节-4章100节-orange) ![部署](https://img.shields.io/badge/部署-GitHub%20Pages-brightgreen) ![依赖](https://img.shields.io/badge/依赖-零构建-lightgrey)

> 题库的历次改动与复核记录见 [更新说明.md](更新说明.md)。

## 功能

- **题库**：只启用《人工智能训练师四级理论题库 500 题（正式版）》一个分区（单选 300 / 多选 100 / 判断 100）
- **多种出题模式**：顺序练习、随机练习、智能优先（错题 → 没做过 → 做过）、只刷没做过的、只刷错题、只刷收藏
- **章节刷题**：4 章 100 节，可以整章刷，也可以只刷某个小节
- **按题型刷题**：只勾「单选题」就能进入纯单选模式；也可以只刷判断题、多选题
- **每次题量可选**：10 / 20 / 50 / 100 / 全部
- **即时判分**：单选题、判断题点选即判分；多选题选完点「提交」。也可以关掉即时判分改成统一判分
- **解析**：500 道题全部带解析，交卷后能看到正确答案、解析和答案来源
- **错题本 / 收藏夹**：做错的题自动进错题本，随时重刷、逐题查看、单题移除
- **答题卡**：一眼看到哪些题答对、答错、没做，点题号直接跳转
- **进度自动保存**：刷新或关掉浏览器都能接着做
- **导出 / 导入备份**：进度存在浏览器本地，可以导出 JSON 换设备导入
- **深色模式**：跟随系统，也可手动切换
- **键盘快捷键**（电脑）：`1`~`5` 或 `A`~`E` 选择，`Enter` 下一题 / 提交，`←` `→` 翻页
- **响应式**：320px 起的手机到桌面宽屏都做过布局验证，无横向溢出

## 本地预览

题库是通过 `fetch` 加载的 JSON，所以**不能直接双击 HTML 打开**（浏览器会拦截本地文件读取）。用任意静态服务器即可：

```bash
cd 本目录
python3 -m http.server 8000
# 然后打开 http://127.0.0.1:8000
```

或者 `npx serve .`、VS Code 的 Live Server 都行。

## 题库数据

站点只加载 **一个** 数据文件：

| 数据文件 | 题量 | 说明 |
| --- | --- | --- |
| `data/questions-now.json` | 500 | 四级理论题库，`id` 形如 `AI4-E01-01`，含章 / 节 / 答案 / 解析 / 难度（`tag`）/ 国标条款（`clause`） |

> 站点**不会请求**仓库里另外三份题库（`data/questions.json`、`data/questions-n9.json`、`data/essence.json`）——它们仍在版本控制中、仍会随 GitHub Pages 一起发布，但浏览器不会下载。多分区框架与「精华题」的代码分支也一并保留在 [assets/js/bank.js](assets/js/bank.js) 里，以后想加回题库，只要往 `Bank.SETS` 里加一条并放回首页「题库」卡片即可。

进度存储（浏览器 localStorage，键名固定）：

| 键 | 用途 |
| --- | --- |
| `qz.stats.v1` / `qz.wrong.v1` / `qz.fav.v1` / `qz.session.v1` | 作答统计 / 错题本 / 收藏夹 / 当前练习 |
| `qz.settings.v1` / `qz.last.v1` | 做题偏好 + 分区 / 上次的筛选条件 |

统计只统计**当前题库里存在的题目 id**。如果浏览器里还留着旧题库（`L3-` / `L4-` / `N9-` 开头）的作答记录，它们不会被计入首页数字、也不会出现在错题本里，但**原始记录不会被删除**；想彻底清掉用设置里的「清空进度」。

## 题库来源

题目来自 `题库/人工智能训练师四级理论题库_500题_正式版.xlsx`（该目录在 [.gitignore](.gitignore) 中，不入版本控制）。

`data/questions-now.json` 由这个 Excel **一次性转换**产出（判断题的「正确/错误」转成 `√/×`，`一级模块` 里「职业道德」「基础知识」按官方细目表归入「基本要求」章）。**仓库里没有对应的构建脚本**——以后若题库 Excel 有更新，需要重新做一次转换，或另写一个 `tools/build_now.py` 固化下来；不要直接跑 `tools/build_all.py`，那套流水线产出的是已下线的 `data/questions.json`。

答案与解析随原始题库一并提供，全部标注为「题库答案」（`src: "bank"`），**未经官方考试机构确认，仅供参考**，请以正式教材和官方考试为准。

## 章节划分

共 4 章 100 节，每节恰好 5 题：

| 章 | 节数 | 题量 |
| --- | --- | --- |
| 基本要求 | 20 | 100 |
| 数据采集和处理 | 20 | 100 |
| 数据标注 | 40 | 200 |
| 智能系统运维 | 20 | 100 |

章名对齐官方《认定要素细目表》，节名沿用该题库自带的二级知识点。首页的章节列表可以整章选中/取消，也可以只勾某一节。章节和题型、出题模式可以任意叠加，例如「数据标注 + 只看单选题 + 随机 20 题」。

## 目录结构

```
.
├── index.html            首页：题库 / 题型 / 模式 / 题量 / 偏好设置
├── practice.html         答题页：判分、翻页、答题卡、交卷成绩
├── wrong.html            错题本 + 收藏夹
├── assets/
│   ├── css/style.css     样式（手机优先 + 深色模式）
│   └── js/
│       ├── store.js      localStorage：进度、错题、收藏、统计、备份
│       ├── ui.js         主题、提示、来源标签、判分等公共逻辑
│       ├── bank.js       题库加载、筛选、组卷（支持多分区，当前只启用一条）
│       ├── home.js       首页逻辑
│       ├── practice.js   答题页逻辑
│       └── wrong.js      错题本 / 收藏夹逻辑
├── data/questions-now.json   站点唯一加载的题库（500 题）
├── tools/                构建与自测脚本（部署时不需要运行，见下）
├── 题库/                 原始题库（不入版本控制）
└── .github/workflows/pages.yml   GitHub Pages 自动部署
```

## 测试

```bash
node tools/selftest.mjs    # 逻辑自测（54 项）
node tools/domtest.mjs     # 页面交互自测（93 项，需先 npm i jsdom --prefix /tmp/domtest）
```

`domtest.mjs` 里「题库分区与老数据兼容」「精华题会话与双写」「精华错题本」三组用例，会在测试内部往 `Bank.SETS` 注入两条合成分区（指向仓库里仍在的旧题库文件），用来覆盖被保留的多分区机制——它们测的不是站点当前的配置。

## 部署到 GitHub Pages

仓库里已经带好 `.github/workflows/pages.yml`，推上去就能自动发布：

```bash
git init                                  # 如果还不是 git 仓库
git add -A
git commit -m "人工智能训练师四级理论刷题网站"
git branch -M main
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git push -u origin main
```

然后在 GitHub 仓库页面：**Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
等 Actions 跑完（约 1 分钟），访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。

> 如果不想用 Actions，也可以把 Source 选成 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`，效果一样。
> 仓库根目录放了 `.nojekyll`，避免 GitHub 的 Jekyll 处理干扰。
> 当前 workflow 用 `path: .` 打包整个仓库，因此 `tools/`、`题库复核材料/` 和另外三份题库 JSON 也会被一起发布（约 9.6 MiB）。站点真正需要的只有 `assets/` + 3 个 HTML + `.nojekyll` + `data/questions-now.json`（约 400KB）；想瘦身就在 upload 步骤前把这几项拷进 `_site/`，再把 `path` 指向它。

## 附：已下线的题库与构建流水线（保留在仓库中）

以下内容**不再被站点使用**，但脚本与数据都还在，可供参考或恢复：

| 文件 | 说明 |
| --- | --- |
| `data/questions.json` | 等级认定题库 2246 题（三级 1496 + 四级 750），按官方细目表分 15 章 |
| `data/questions-n9.json` | 第九届全国职工职业技能大赛公开理论题库 4423 题 |
| `data/essence.json` | 从上面两份题库里筛出的 1000 题精华清单（只存 id 与分组） |

构建流水线（`tools/build_all.py` 编排，详见各脚本 docstring）：

```bash
python3 tools/build_all.py            # 构建 → 补解析 → 应用修正（一步到位，幂等）
python3 tools/build_all.py --with-n9  # 连大赛题库一起重建
```

`tools/fix/*.jsonl` 记录了对旧题库答案/题干/解析的逐条人工裁定，`tools/review/` 与 `题库复核材料/` 是复核过程留档，都可以复查。注意复核链路的中间产物多数由当时的一次性脚本生成，**不能一键重跑**。

## 免责声明

题库版权归原始出题机构所有，本站仅用于个人学习练习，不作商业用途。
