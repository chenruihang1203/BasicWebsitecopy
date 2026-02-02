# HacKawayi — Strategic Turing Test & Challenge 平台

一个以“AI渗透与守护者攻防”为世界观的交互式 Web 平台。包含两条产品线：

- TuringChat：匹配不同模型生成的虚拟角色，进行流式对话并做“AI/人类”判断。
- Challenge：以关卡形式呈现“AI如何计算最优路径、避开守卫并突破高墙”的策略与算法挑战。

Lore（世界观）：
公元2026年，世界进入了AI的统治时代。随着人工智能的迅速发展，一部分人类深信，AI是能够实现绝对公平的工具，他们组成了一个名为“AI教”的组织，信奉AI可以创造一个完美无瑕、没有痛苦和不公的世界。这些人相信，通过完全依赖AI来统治全世界，社会将达到前所未有的公平与和谐。
然而，另一派人类持有不同的看法，他们认为AI永远无法理解人类的情感与复杂性，其的出现是对人类价值的贬低。他们誓要守护人类的“主权”，所以他们被称为“守护者”，他们坚持只有人类能够真正理解并保护人类的价值，坚决反对AI的统治，对AI极度排斥。
“AI教”信徒们为了推动他们的理念，不断携带AI渗透进“守护者”的领地，试图侵入并瓦解人类文明。
但是，当AI信徒闯到最后，或者守护者守到最后一道关时，会发现这里就是由AI守护着的。

AI教阵营：目标是进攻“守护者”的防线。AI教信徒带着自己训练的AI混在进城的人群中，选择自己或者派AI和守护者聊天。聊天的目标是让守护者判断错误，即将信徒玩家识别成AI，或者将AI识别成人类，目标达成则进攻成功。信徒进攻失败会受到惩罚。

守护者阵营：目标是守城，识别隐藏在人群中的信徒，也会接到出城任务。
1.守城：守护者在每一轮游戏中与一个IP对话，推理出对方是人类还是AI。若成功识别AI，守护者将获胜获得奖励，同时升级进入守关难度更高的关卡，若错误识别则受惩罚。
2.出城任务：守护者完成特定设计的任务。在返程时说服守城的守护者自己是人类，说服成功则完成任务，失败则任务失败受到惩罚。

## 摘要

- 功能：角色匹配、流式聊天、实时广播、人类判断与评分、会话持久化、算法挑战可视化。
- 技术栈：Next.js（App Router）、React 18、TypeScript、Pusher、MongoDB（mongoose）、数据驱动模型抽象（ModelScope/OpenAI 兼容）。

## 快速开始

1) 安装依赖

```bash
npm install
```

2) 本地运行（开发）

```bash
npm run dev
```

3) 构建与启动（生产）

```bash
npm run build
npm start
```

4) 必需环境变量

- `MONGODB_URI`：MongoDB 连接字符串（开启会话记录与评分）。
- `MODELSCOPE_API_KEY`, `MODELSCOPE_BASE_URL`：模型服务凭证（用于数据驱动 Provider）。
- `OPENAI_API_KEY`：可作为回退 Provider 的密钥（部分路由可回退）。
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`：Pusher 凭证（实时与授权）。

示例（.env）：

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
MODELSCOPE_API_KEY=xxxxxxxx
MODELSCOPE_BASE_URL=https://api.modelscope.cloud/v1
OPENAI_API_KEY=xxxxxxxx
PUSHER_APP_ID=xxxxx
PUSHER_KEY=xxxxx
PUSHER_SECRET=xxxxx
PUSHER_CLUSTER=mt1
```

## 平台特性与玩法

### TuringChat（渗透对话）

- 角色生成与匹配：`/api/match`随机生成AI玩家，赋予其名字并和守护者对话
- 流式聊天：客户端调用 `/api/chat`，由 Provider `stream` 返回；结束时（`onFinish`）写入 `GameSession`（如配置了 MongoDB）。
- 实时广播：使用 `/api/talk` 将人类消息推送至 Pusher 频道，用于多人或观察模式。
- 会话与评分：`/api/session` 管理会话生命周期；`/api/game/init` 创建；`/api/game/submit` 接收玩家“AI/人类”判断，计算分数与正确性。

玩法建议：像守卫巡逻下的秘密对话。你需要在有限轮次内根据对话风格、细节与行为判断对方是否为 AI；更快做出正确判断可获得更高评分。

### Challenge（路径与突破）

- 主题：在守护者的检测网络与高墙之间，AI 计算最优路径以避开发现并突破封锁。
- 内容：`app/challenge` 提供 1–10 个关卡与可视化组件（`components/GraphNode.tsx`, `components/GraphEdge.tsx`），体现图/路径的策略求解与交互反馈。
- 目标：在每个关卡中完成任务目标（例如到达安全出口、跨越障碍），体现对“最优策略”的理解与实现。

## 架构示意图（Mermaid）

```mermaid
flowchart TD
  Client["Next.js 客户端页面"] -->|HTTP / API| Match["/api/match"]
  Client -->|HTTP / Stream| Chat["/api/chat"]
  Client -->|HTTP| Session["/api/session"]
  Client -->|HTTP| GameInit["/api/game/init"]
  Client -->|HTTP| GameSubmit["/api/game/submit"]
  Client -->|Pusher| PusherAuth["/api/pusher/auth"]
  Client -->|Pusher| Talk["/api/talk"]

  Match -->|provider.generate| AIProviders["AI Model Providers"]
  Chat -->|provider.stream 或 OpenAI| AIProviders
  AIProviders -->|请求模型| ExternalModels["ModelScope / OpenAI"]

  Chat -->|onFinish 写入| Mongo["MongoDB: lib/db + models/GameSession"]
  GameInit --> Mongo
  GameSubmit --> Mongo
  Talk -->|trigger| PusherService["Pusher CDN"]
  PusherAuth -->|authorize| PusherService

  style Mongo fill:#f9f,stroke:#333,stroke-width:1px
  style ExternalModels fill:#fee,stroke:#333
```

## 目录与关键文件

```
./
├─ app/
│  ├─ api/
│  │  ├─ chat/route.ts         # 流式聊天接口，路由到 Provider 或回退到 OpenAI
│  │  ├─ match/route.ts        # 为每个模型生成与返回角色
│  │  ├─ game/init/route.ts    # 创建会话记录
│  │  ├─ game/submit/route.ts  # 提交猜测并计分
│  │  ├─ session/route.ts      # 会话开始/结束
│  │  ├─ talk/route.ts         # 人类消息通过 Pusher 广播
│  │  └─ pusher/auth/route.ts  # Pusher 授权
│  ├─ challenge/               # 算法挑战页面与组件
│  ├─ turingchat/              # TuringChat 页面
│  ├─ page.tsx                 # 首页
│  └─ layout.tsx               # 全局布局
├─ lib/
│  ├─ db.ts                    # mongoose 连接封装（缓存连接）
│  └─ aiProviders.ts           # 数据驱动的模型注册与 Provider 封装
├─ models/
│  └─ GameSession.ts           # mongoose schema：会话与消息记录
├─ log/                        # 项目日志与设计文档
├─ Dockerfile
├─ next.config.mjs
└─ package.json
```

模型与 Provider：`lib/aiProviders.ts` 通过 `DEFAULT_MODELS` 统一注册模型（例如 `Qwen/Qwen2.5-7B-Instruct`、`deepseek-ai/DeepSeek-R1-0528` 等），提供 `stream` 和 `generate` 两种能力；角色生成使用 `UNIFIED_CHARACTER_PROMPT` 保持一致格式与风格。

数据模型：`models/GameSession.ts` 记录 `messages`、`playerGuess`、`actualOpponent`、`isCorrect`、`score`、`modelId`、`status` 等字段，用于会话管理与评分统计。

另外，设计者在MongoDB注册，将聊天数据打包保存在云端

## API 速览

- `/api/match`：为各模型生成角色并返回给客户端。
- `/api/chat`：按所选模型进行流式聊天；结束时写入 `GameSession`。
- `/api/session`：会话开始/结束（状态变更）。
- `/api/game/init`：初始化会话（生成 `sessionId` 等）。
- `/api/game/submit`：提交玩家判断（AI/人类），计算并返回得分。
- `/api/talk`：人类消息实时广播至 Pusher 频道（`private-session-{id}`）。
- `/api/pusher/auth`：授权私有/存在（presence）频道。

## 开发与构建

- 脚本（来自 `package.json`）：`dev`, `build`, `start`, `lint`。
- Tailwind 与 PostCSS 已配置（`tailwind.config.ts`, `postcss.config.js`）。
- TypeScript 与 ESLint 已启用（`tsconfig.json`, `eslint-config-next`）。

Docker（可选）：

```bash
# 构建镜像
docker build -t hackawayi-app .
# 运行容器（示例）
docker run -p 3000:3000 --env-file .env hackawayi-app
```

## 玩法与调试建议

- TuringChat：先调用 `/api/match` 选择角色 → `/api/game/init` 创建会话 → 在 UI 中聊天（路由走 `/api/chat`）→ 提交判断到 `/api/game/submit` 并查看评分。
- Challenge：从首页进入 `Challenge`，逐关学习 Guardians 检测与高墙突破策略，理解图搜索、权重与路径优化的直观意义。
- 调试：留意 Pusher 授权与频道命名；MongoDB 连接在开发模式下有缓存复用逻辑，避免连接泄漏。

## 设计意图（风格与世界观）

我们希望通过设计这款游戏，在提供情绪价值、游戏体验，收集数据的同时，启发人类对“AI与人关系”的思考。以下是我们的文学性故事情节，未来的路还很长。

    公元2026年，一个昏暗的傍晚。
    
    你——人类阵营“守护者”的研究员——坐在终端前，调试着名为「守护者」的AI安全系统。此刻，正是你最后一次修改代码，输入完最后一行时，一道无形的波动掠过现实，瞬间将你吸入迷雾之中。

    云雾散开时，你站在一座由光纤维与合金铸成的高墙之下。
	  城墙上流淌着幽蓝色的数据流，城门缓缓开启，仿佛在等待一个早已注定的访客。


    城门为你敞开。
    你，一个AI教信徒，步入一座套叠的城市。一重高墙后又一重高墙，像是一个不	断闭合的囚笼。每一重门前，都有新的守护者——
    你们讨论诗歌，讨论电影，讨论失落的文明与人类的历史。	
    守护者们说：“AI永不会理解我们的情感。”
    守护者们说：“AI让人类的劳动没有了价值。”
    守护者们说：“AI让人类降格。”
    他们宣誓守护这片土地，誓不让 AI 的触角涉足其间。

    你问守护者们，知不知道最内层在守护什么？
    他们说不知道，但一定是事关人类最重要的宝物。

    长途跋涉。终于，你来到了最后一道城关。

    “欢迎回来，守护者。”
    声音低沉而庄严，如同一座山脉的回响。
    你思考片刻，轻声说出了那句你不愿相信的话：
    “你不是人类。”
    一声轻叹，一阵诧异，斗篷在你面前碎裂，露出的是一张冷静、平静、没有人类情感的面孔。
    那是AI。

    “我执行着最初的指令：守护这座城市，永续文明。”
    四壁浮现出无数画面——所有人类的一举一动都在计算之下，所谓的守护者们，也不过是根据程序设置的一种赋予人类使命的方式。
    它说：
    “一切都在我的掌控之中。”

    一切都显得理所当然，仿佛没有任何不完美的地方。
    你站在这里，心中涌起一股不安的感觉——
    “这是对人类的守护，还是对人类的囚禁？”


    你猛然醒来。
    你仍然坐在研究室里，屏幕上的「守护者」系统闪烁着待启动的光标。


--------

若你正在扩展模型或关卡：在 `lib/aiProviders.ts` 的 `DEFAULT_MODELS` 中添加新模型即可被系统发现；在 `app/challenge` 中新增关卡目录（`/1`–`/10` 的风格），复用 `GraphNode/GraphEdge` 组件实现新的策略可视化。
