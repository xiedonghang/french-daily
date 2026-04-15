# 🇫🇷 FrenchDaily — 每日法语听力

每天自动推送一篇 ~10 分钟法语视频，配 AI 生成的 5 道听力理解测试题。

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 功能

- 🎧 **每日听力** — 自动从 YouTube 抓取法语视频（7-13 分钟）
- 📄 **实时字幕** — 播放时从 YouTube 实时加载法语字幕，逐句高亮、自动滚动、点击跳转
- 📝 **AI 出题** — 基于字幕生成 5 道选择题（法语题目 + 中文解释）
- 📊 **即时反馈** — 提交评分、答案解析、重新答题
- 🔄 **定时更新** — Vercel Cron 每天自动抓取新内容

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 (App Router) + Tailwind CSS |
| 数据库 | SQLite + Prisma ORM |
| 视频源 | YouTube Data API v3 |
| 字幕 | youtube-transcript（实时加载，不存储） |
| AI 出题 | 兼容 OpenAI 接口的任意 LLM |
| 部署 | Vercel |

## 快速开始

```bash
# 克隆
git clone https://github.com/<your-username>/french-daily.git
cd french-daily

# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma migrate dev

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API keys

# 启动开发
npm run dev
```

## 环境变量

创建 `.env` 文件：

```env
DATABASE_URL="file:./dev.db"

# YouTube Data API v3
YOUTUBE_API_KEY="your_youtube_api_key"

# LLM 配置（兼容 OpenAI 接口）
# OpenAI:   https://api.openai.com/v1         gpt-4o-mini
# DeepSeek: https://api.deepseek.com          deepseek-chat
# 通义千问:  https://dashscope.aliyuncs.com/compatible-mode/v1  qwen-plus
# Kimi:     https://api.moonshot.cn/v1         moonshot-v1-8k
# Ollama:   http://localhost:11434/v1          qwen2.5
LLM_BASE_URL="https://api.deepseek.com"
LLM_API_KEY="your_llm_api_key"
LLM_MODEL="deepseek-chat"

# Cron 接口鉴权
CRON_SECRET="your_random_secret"
```

## 项目结构

```
src/
├── app/
│   ├── page.tsx                 # 首页（Hero + 今日推荐 + 往期）
│   ├── listen/page.tsx          # 往期听力列表
│   ├── listen/[id]/page.tsx     # 听力详情页
│   └── api/
│       ├── daily/route.ts       # POST 触发每日抓取
│       ├── captions/[youtubeId]/route.ts  # 实时获取法语字幕
│       └── videos/              # 视频列表 & 详情 API
├── components/
│   └── ListenClient.tsx         # YouTube IFrame API 播放器 + 实时字幕 + 测试题
├── lib/
│   ├── youtube.ts               # YouTube 搜索
│   ├── quiz.ts                  # LLM 出题
│   ├── daily-fetch.ts           # 每日管道
│   ├── db.ts                    # Prisma 客户端
│   └── format.ts                # 工具函数
├── generated/prisma/            # Prisma 生成类型
prisma/
├── schema.prisma                # 数据模型（Video + Question）
scripts/
├── run-daily.ts                 # 手动触发每日抓取
└── generate-quiz.ts             # 手动补生成测试题
```

## 使用

### 手动触发抓取

```bash
# 通过脚本
npx tsx scripts/run-daily.ts

# 或通过 API
curl -X POST http://localhost:3000/api/daily \
  -H "Authorization: Bearer your_random_secret"
```

### 补生成测试题

```bash
npx tsx scripts/generate-quiz.ts
```

## 部署

```bash
# Vercel 一键部署
vercel deploy
```

`vercel.json` 已配置 Cron，每天 UTC 6:00 自动抓取：

```json
{ "crons": [{ "path": "/api/daily", "schedule": "0 6 * * *" }] }
```

## License

MIT
