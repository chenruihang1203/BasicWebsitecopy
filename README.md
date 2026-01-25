**项目概述**

- **项目名**: HacKawayi — 包含两个小游戏（`turingchat`, `challenge`）
- **描述**: 一个包含两条产品线的实验性 Web 项目：
  - `turingchat`: 多人/单人 Turing 测试游戏（Pusher presence、AI 对手、MongoDB 会话记录、评分）
  # HacKawayi — Strategic Turing Test 游戏平台

  此仓库实现一个用于研究“人类是否能分辨 AI 聊天”的交互式平台（MVP）。前端基于 Next.js（app router），后端以 Next.js API Routes 提供服务，使用 Pusher 做实时消息推送，支持多种 AI 模型（通过数据驱动的 ModelProvider 抽象），并可选把对话记录持久化到 MongoDB。

  **摘要**
  - 功能：匹配虚拟角色（由不同模型生成）、与角色聊天（流式生成响应）、提交猜测（AI/真人），记录并评分会话。
  - 技术栈：`Next.js 14`、`React 18`、`TypeScript`、`Pusher`、`MongoDB`（`mongoose`）、多模型 AI 抽象（ModelScope / OpenAI 兼容）。

  **快速开始**

  1. 安装依赖：

  ```bash
  npm install
  ```

  2. 本地运行：

  ```bash
  npm run dev
  ```

  3. 重要环境变量（示例）：
  - `MONGODB_URI`：MongoDB 连接字符串（可选，用于记录会话与评分）。
  - `MODELSCOPE_API_KEY` / `MODELSCOPE_BASE_URL`：ModelScope 风格的模型服务凭证（用于 `lib/aiProviders.ts`）。
  - `OPENAI_API_KEY`：可作为 fallback 的 OpenAI Key（部分路由会回退到 OpenAI）。
  - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`：Pusher 实时通信凭证。

  请参考仓库根目录的 `.env.example` 或在部署平台上设置对应变量。

  **功能概览**
  - 角色匹配：服务端对 `DEFAULT_MODELS` 中的每个模型生成一个角色（`/api/match`）。
  - 聊天流：客户端通过 `/api/chat` 发起流式对话（支持 ModelScope provider 或 OpenAI fallback），并在生成完成时将消息写入 MongoDB（如果配置了）。
  - 实时消息：`/api/talk` 使用 Pusher 广播人类消息（用于真人对话场景）。
  - 会话生命周期：`/api/session` 用于开始/结束会话；`/api/game/init` 创建会话；`/api/game/submit` 提交玩家猜测并计算分数。

  **架构示意图 (Mermaid)**

  ```mermaid
  flowchart TD
    Client["客户端 (Next.js 页面)"] -->|HTTP / API| Match["/api/match"]
    Client -->|HTTP / Stream| Chat["/api/chat"]
    Client -->|HTTP| Session["/api/session"]
    Client -->|HTTP| GameInit["/api/game/init"]
    Client -->|HTTP| GameSubmit["/api/game/submit"]
    Client -->|Pusher| PusherAuth["/api/pusher/auth"]
    Client -->|Pusher| Talk["/api/talk"]

    Match -->|调用 provider.generate| AIProviders["(AI Model Providers)"]
    Chat -->|调用 provider.stream 或 OpenAI| AIProviders
    AIProviders -->|请求模型| ExternalModels["(ModelScope / OpenAI)"]

    Chat -->|onFinish 写入| Mongo["(MongoDB via lib/db & models/GameSession)"]
    GameInit --> Mongo
    GameSubmit --> Mongo
    Talk -->|trigger| PusherService["(Pusher CDN)"]
    PusherAuth -->|authorize| PusherService

    style Mongo fill:#f9f,stroke:#333,stroke-width:1px
    style ExternalModels fill:#fee,stroke:#333
  ```

  **文件/目录结构（主要项）**

  ```
  ./
  ├─ app/
  │  ├─ api/
  │  │  ├─ chat/route.ts         # 流式聊天接口，路由到 provider 或 OpenAI
  │  │  ├─ match/route.ts        # 为每个模型生成角色（character matching）
  │  │  ├─ game/init/route.ts    # 创建会话记录
  │  │  ├─ game/submit/route.ts  # 提交玩家猜测并计分
  │  │  ├─ session/route.ts      # 会话开始/结束
  │  │  ├─ talk/route.ts         # 人类消息通过 Pusher 广播
  │  │  └─ pusher/auth/route.ts  # Pusher 授权
  │  ├─ challenge/               # 算法挑战页面（静态/交互页面）
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

  **关键文件说明（快速梳理）**
  - `app/page.tsx`：首页 UI，提供入口（Start TuringChat / Algorithm Challenges）与本地简单用户信息（localStorage）。
  - `app/layout.tsx`：Next.js app-level 布局与元数据。
  - `app/api/match/route.ts`：为 `DEFAULT_MODELS` 中的每个模型调用 `createProviderById` 并请求 `UNIFIED_CHARACTER_PROMPT` 生成角色，返回所有角色给客户端（包含 fallback mock）。
  - `app/api/chat/route.ts`：流式聊天入口，优先调用 `createProviderById` 返回的 provider.stream；若不可用则回退到 `openai`。聊天结束时会把消息写入 `GameSession`（若配置了 MongoDB）。
  - `app/api/game/init/route.ts`、`/api/game/submit/route.ts`：分别用于初始化会话与提交玩家的猜测与计分逻辑（包含速度与消息数奖励）。
  - `app/api/talk/route.ts`：将人类消息通过 Pusher 推送到私有频道（`private-session-{sessionId}`），用于实时多人对话。
  - `app/api/pusher/auth/route.ts`：处理 Pusher 私有/presence 频道授权。
  - `lib/aiProviders.ts`：系统中 AI 模型的单一配置中心（`DEFAULT_MODELS`），并封装 `AIModelProvider`，提供 `stream` 与 `generate` 两种能力；同时包含 `UNIFIED_CHARACTER_PROMPT` 模板。
  - `lib/db.ts`：封装 `mongoose.connect` 并在开发期间复用连接以避免连接泄漏。
  - `models/GameSession.ts`：会话消息 schema，包含 `messages`、`playerGuess`、`actualOpponent`、`score` 等字段。

  **数据流与交互要点**
  - 客户端调用 `/api/match` 获取候选角色并展示给玩家；玩家选中后发起 `/api/game/init` 创建会话。
  - 聊天期间，客户端将用户消息发送给 `/api/chat`（流式），服务器调用对应模型 provider 返回流并在结束回调中写入 `GameSession`（如配置了数据库）。
  - 若为人类对话（或需要广播消息），客户端通过 `/api/talk` 将消息触发到 Pusher 实时频道，其他客户端监听此频道。
  - 玩家通过 `/api/game/submit` 提交“AI/人类”猜测，后端基于会话信息计算 `score` 并返回结果。

 
  ---
