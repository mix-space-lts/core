#!/usr/bin/env node
/**
 * ============================================
 * Mix Space LTS - 开发环境测试数据初始化（幂等）
 * ============================================
 * 使用方法:
 *   node scripts/seed-dev-data.mjs          # 首次初始化，已有数据则跳过
 *   node scripts/seed-dev-data.mjs --force  # 强制清理并重新初始化
 *
 * 也可以通过 MONGO_URI 环境变量指定 MongoDB:
 *   MONGO_URI=mongodb://localhost:27017/mx-space node scripts/seed-dev-data.mjs
 */

import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/mx-space'
const FORCE_RESET = process.argv.includes('--force')

// ---- 管理员初始账号 ----
const SEED_ADMIN = {
  username: process.env.SEED_ADMIN_USERNAME || 'admin',
  password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
  name: process.env.SEED_ADMIN_NAME || 'Admin',
}

// ---- Shiro 状态函数源码 —— 从 ../snippets/shiro/functions/status.ts 加载，没有则跳过注入 ----
function loadShiroStatusSource() {
  const snippetPath = resolve(__dirname, '../../snippets/shiro/functions/status.ts')
  try {
    return readFileSync(snippetPath, 'utf-8')
  } catch {
    console.warn('   ⚠️  未找到 snippets/shiro/functions/status.ts，跳过状态函数注入')
    console.warn('      将使用 Shiro 内置的 graceful degrade 逻辑（console.warn + 站长弹窗提示）')
    return null
  }
}

// ---- 预定义测试数据 ----

const now = Date.now()
const day = 24 * 60 * 60 * 1000

/** 创建过去 N 天的随机日期 */
function daysAgo(n, offsetHours = 0) {
  return new Date(now - n * day + offsetHours * 60 * 60 * 1000)
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ======== 分类数据 ========
const categories = [
  {
    _id: new ObjectId(),
    name: '技术',
    slug: 'tech',
    type: 0, // Category
    created: daysAgo(60),
  },
  {
    _id: new ObjectId(),
    name: '生活',
    slug: 'life',
    type: 0,
    created: daysAgo(55),
  },
  {
    _id: new ObjectId(),
    name: '笔记',
    slug: 'notes',
    type: 0,
    created: daysAgo(50),
  },
]

// ======== 标签 (type: 1 = Tag) ========
const tagNames = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js',
  'CSS', 'Python', 'Docker', 'Git', 'MongoDB',
  'Redis', 'NestJS', 'Next.js', '前端', '后端',
]

// ======== 文章数据 ========
const posts = [
  {
    title: 'TypeScript 高级类型体操入门',
    slug: 'typescript-advanced-types',
    text: `# TypeScript 高级类型体操入门

TypeScript 的类型系统非常强大，掌握高级类型可以让你的代码更加健壮。

## 条件类型

\`\`\`typescript
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'> // true
type B = IsString<42>      // false
\`\`\`

## 映射类型

\`\`\`typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K]
}
\`\`\`

## 模板字面量类型

\`\`\`typescript
type EventName<T extends string> = \`on\${Capitalize<T>}\`
type ClickEvent = EventName<'click'> // 'onClick'
\`\`\`

更多内容请参考 TypeScript 官方文档。`,
    summary: '深入理解 TypeScript 条件类型、映射类型和模板字面量类型',
    tags: ['TypeScript', '前端'],
    categoryId: categories[0]._id,
    created: daysAgo(30),
    modified: daysAgo(28),
  },
  {
    title: 'NestJS 微服务架构实践',
    slug: 'nestjs-microservices-practice',
    text: `# NestJS 微服务架构实践

## 为什么选择 NestJS

NestJS 提供了一个开箱即用的应用架构，让你可以轻松构建高效、可扩展的 Node.js 服务端应用。

## 核心概念

1. **模块 (Module)** - 组织代码的基本单元
2. **控制器 (Controller)** - 处理 HTTP 请求
3. **提供者 (Provider)** - 业务逻辑和依赖注入
4. **中间件 (Middleware)** - 请求预处理

## 微服务传输层

\`\`\`typescript
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: { host: 'localhost', port: 6379 },
})
\`\`\`

NestJS 支持多种传输层：TCP、Redis、RabbitMQ、Kafka 等。`,
    summary: '使用 NestJS 构建生产级微服务架构的完整指南',
    tags: ['NestJS', 'Node.js', '后端'],
    categoryId: categories[0]._id,
    created: daysAgo(25),
    modified: daysAgo(24),
  },
  {
    title: 'React 19 新特性完全指南',
    slug: 'react-19-new-features',
    text: `# React 19 新特性完全指南

React 19 带来了许多令人兴奋的新特性。

## Server Components

React Server Components 让你可以在服务器端渲染组件，减少客户端 JavaScript 体积。

## Actions

\`\`\`tsx
async function updateName(formData: FormData) {
  'use server'
  const name = formData.get('name')
  await db.update(name)
}
\`\`\`

## use() Hook

新的 \`use()\` hook 让你可以在渲染期间读取资源。

## Document Metadata

现在可以直接在组件中设置 \`<title>\`、\`<meta>\` 等标签。

React 19 正在逐步稳定，建议在非关键项目上开始尝试。`,
    summary: 'React 19 的 Server Components、Actions、use() Hook 等新特性详解',
    tags: ['React', 'JavaScript', '前端'],
    categoryId: categories[0]._id,
    created: daysAgo(20),
    modified: daysAgo(18),
  },
  {
    title: '我的 2024 年度总结',
    slug: '2024-year-review',
    text: `# 我的 2024 年度总结

## 工作

今年换了新工作，加入了新的技术团队，负责前端架构设计。

## 技术

- 深入学习了 Rust 语言
- 开始使用 AI 辅助编程
- 开源了两个项目

## 生活

- 去了 5 个城市旅行
- 读了 20 本书
- 开始学吉他

## 明年计划

1. 出版一本技术书籍
2. 完成马拉松比赛
3. 学习一门新语言（日语）`,
    summary: '回顾 2024 年，展望 2025 年',
    tags: ['生活'],
    categoryId: categories[1]._id,
    created: daysAgo(10),
    modified: daysAgo(9),
  },
  {
    title: 'Docker 容器化部署最佳实践',
    slug: 'docker-deployment-best-practices',
    text: `# Docker 容器化部署最佳实践

## 编写高效的 Dockerfile

### 使用多阶段构建

\`\`\`dockerfile
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
\`\`\`

### 减小镜像体积

1. 使用 \`alpine\` 或 \`slim\` 基础镜像
2. 合并 RUN 命令减少层数
3. 使用 \`.dockerignore\` 排除不需要的文件

## Docker Compose 多服务编排

\`\`\`yaml
services:
  app:
    build: .
    depends_on:
      - db
      - redis
  db:
    image: mongo:7
  redis:
    image: redis:alpine
\`\`\`

## 安全建议

- 不要以 root 用户运行容器
- 定期更新基础镜像
- 扫描镜像漏洞`,
    summary: '从 Dockerfile 编写到生产环境部署的完整最佳实践指南',
    tags: ['Docker', '后端', 'DevOps'],
    categoryId: categories[0]._id,
    created: daysAgo(5),
    modified: daysAgo(4),
  },
  {
    title: '周末烘焙日记：第一次做提拉米苏',
    slug: 'weekend-baking-tiramisu',
    text: `# 周末烘焙日记：第一次做提拉米苏

## 材料

- 马斯卡彭奶酪 250g
- 鸡蛋 3 个
- 细砂糖 60g
- 手指饼干 200g
- 浓缩咖啡 200ml
- 可可粉 适量

## 步骤

1. 蛋黄加糖打至浓稠发白
2. 加入马斯卡彭奶酪搅拌均匀
3. 蛋白打至硬性发泡
4. 将蛋白霜与奶酪糊混合
5. 手指饼干快速浸泡咖啡
6. 一层饼干一层奶酪糊交替铺
7. 冷藏 4 小时后撒可可粉

虽然卖相一般，但味道真的很不错！下次试试抹茶口味。`,
    summary: '记录第一次尝试制作经典意大利甜点的心得',
    tags: ['生活'],
    categoryId: categories[1]._id,
    created: daysAgo(3),
    modified: daysAgo(3),
  },
]

// ======== 便签数据 ========
const notes = [
  {
    title: '随手记',
    nid: 1,
    text: '今天发现了一个非常好用的 VSCode 插件，推荐给大家！',
    mood: '😊',
    weather: '☀️',
    created: daysAgo(2),
  },
  {
    title: '',
    nid: 2,
    text: '准备重构评论系统的数据层，用 MongoDB 的聚合管道来优化查询性能。',
    mood: '🤔',
    weather: '🌧️',
    created: daysAgo(1),
  },
  {
    title: '想法',
    nid: 3,
    text: '在思考要不要给博客加一个 AI 搜索功能，用向量数据库来做语义搜索。',
    mood: '💡',
    weather: '☁️',
    created: new Date(now - 4 * 60 * 60 * 1000),
  },
  {
    title: '',
    nid: 4,
    text: '看了《奥本海默》，三个小时的片长一点都不觉得长。诺兰的叙事手法真的绝了。',
    mood: '🎬',
    weather: '🌙',
    created: daysAgo(0),
  },
  {
    title: '小确幸',
    nid: 5,
    text: '楼下的桂花开了，整个小区都是香的。秋天的味道。',
    mood: '🌸',
    weather: '☀️',
    created: daysAgo(0, 2),
  },
]

// ======== 页面数据 ========
const pages = [
  {
    title: '关于',
    slug: 'about',
    subtitle: '关于我和这个博客',
    order: 1,
    text: `# 关于我

你好，我是一名全栈开发者，热爱开源技术。

## 技术栈

- **前端**: React, TypeScript, Next.js
- **后端**: Node.js, NestJS, Go
- **数据库**: MongoDB, PostgreSQL, Redis
- **DevOps**: Docker, Kubernetes, CI/CD

## 联系方式

- GitHub: [@mygithub](https://github.com)
- Email: hello@example.com

## 关于本站

基于 Mix Space 构建，一个开源的个人空间系统。`,
    created: daysAgo(50),
  },
  {
    title: '友链',
    slug: 'friends',
    subtitle: '朋友们',
    order: 2,
    text: `# 友链

欢迎交换友链，请先添加本站链接后在评论区留言。

> 名称：My Blog
> 地址：https://example.com
> 头像：https://example.com/avatar.png
> 简介：全栈开发者`,
    created: daysAgo(45),
  },
  {
    title: '隐私政策',
    slug: 'privacy',
    subtitle: '',
    order: 3,
    text: `# 隐私政策

## 我们收集的信息

- 访问日志（IP 地址、浏览器类型、访问时间）
- 评论时提供的昵称、邮箱、网站

## 信息使用

- 用于网站统计分析
- 用于评论通知
- 不会出售或分享给第三方

## Cookie

本站使用 Cookie 用于：
- 记住登录状态
- 统计分析`,
    created: daysAgo(40),
  },
]

// ======== 话题 ========
const topics = [
  {
    _id: new ObjectId(),
    name: '开发日志',
    slug: 'dev-log',
    description: '记录开发过程中的点滴',
    introduce: '这里是我日常开发的记录和思考。',
    created: daysAgo(45),
  },
  {
    _id: new ObjectId(),
    name: '读书笔记',
    slug: 'reading-notes',
    description: '读书心得与摘抄',
    introduce: '阅读是一座随身携带的避难所。',
    created: daysAgo(30),
  },
]

// ======== 友链数据 ========
const links = [
  {
    name: 'Best Friend Blog',
    url: 'https://bestfriend.example.com',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=BF',
    description: '一个很棒的博客',
    created: daysAgo(40),
  },
  {
    name: 'Tech Guru',
    url: 'https://techguru.example.com',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=TG',
    description: '技术大牛的个人网站',
    created: daysAgo(35),
  },
  {
    name: 'Design Lover',
    url: 'https://designlover.example.com',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DL',
    description: '热爱设计的前端开发者',
    created: daysAgo(25),
  },
]

// ======== 测试评论 ========
const commentAuthors = [
  { name: 'Alice', email: 'alice@example.com', url: 'https://alice.dev' },
  { name: 'Bob', email: 'bob@test.com', url: '' },
  { name: 'Charlie', email: 'charlie@demo.com', url: 'https://charlie.me' },
  { name: 'Visitor', email: 'visitor@web.com', url: '' },
  { name: 'Guest', email: 'guest@mail.com', url: '' },
]

// ======== 站点配置 (options) ========
const options = [
  {
    name: 'site_title',
    value: 'My Mix Space',
  },
  {
    name: 'site_description',
    value: '一个基于 Mix Space 的个人空间',
  },
  {
    name: 'site_keywords',
    value: 'blog,技术,生活',
  },
  {
    name: 'site_logo',
    value: '',
  },
  {
    name: 'site_favicon',
    value: '',
  },
  {
    name: 'comment_options',
    value: JSON.stringify({
      antiSpam: true,
      disableComment: false,
      allowMarkdown: true,
    }),
  },
  {
    name: 'mail_options',
    value: JSON.stringify({
      enable: false,
      host: '',
      port: 587,
      user: '',
    }),
  },
  {
    name: 'friend_link_options',
    value: JSON.stringify({
      autoAccept: false,
      description: '欢迎交换友链',
    }),
  },
  {
    name: 'backup_options',
    value: JSON.stringify({
      enable: false,
      secretId: '',
      secretKey: '',
      bucket: '',
    }),
  },
  {
    name: 'theme_options',
    value: JSON.stringify({
      darkMode: 'auto',
      enableAurora: true,
    }),
  },
]

// ======== 生成测试访客数据 ========
const browsers = [
  { name: 'Chrome', version: '120.0.0' },
  { name: 'Firefox', version: '121.0' },
  { name: 'Safari', version: '17.0' },
  { name: 'Edge', version: '120.0.0' },
  { name: 'Opera', version: '105.0' },
]
const osList = [
  { name: 'Windows', version: '10' },
  { name: 'Windows', version: '11' },
  { name: 'macOS', version: '14.0' },
  { name: 'Linux', version: '' },
  { name: 'iOS', version: '17.0' },
  { name: 'Android', version: '14' },
]
const devices = [
  { type: 'desktop', vendor: '', model: '' },
  { type: 'desktop', vendor: '', model: '' },
  { type: 'desktop', vendor: '', model: '' },
  { type: 'mobile', vendor: 'Apple', model: 'iPhone' },
  { type: 'mobile', vendor: 'Samsung', model: 'Galaxy' },
  { type: 'tablet', vendor: 'Apple', model: 'iPad' },
]
const paths = [
  '/posts/hello-world',
  '/posts/typescript-tips',
  '/posts/vue-best-practices',
  '/notes/1',
  '/notes/2',
  '/pages/about',
  '/pages/links',
  '/',
  '/feed',
]
const countries = [
  'CN', 'US', 'JP', 'KR', 'GB', 'DE', 'FR', 'SG', 'HK', 'TW', null,
]

function generateAnalyzeRecord(baseTime) {
  const browser = randomItem(browsers)
  const os = randomItem(osList)
  const device = randomItem(devices)
  return {
    ip: `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}`,
    ua: {
      browser: {
        name: browser.name,
        version: browser.version,
        major: browser.version.split('.')[0],
      },
      os: { name: os.name, version: os.version },
      device: { type: device.type, vendor: device.vendor, model: device.model },
      engine: { name: 'Blink', version: '120.0.0' },
      cpu: { architecture: 'amd64' },
    },
    path: randomItem(paths),
    referer: Math.random() > 0.4
      ? ''
      : `https://www.google.com/search?q=${encodeURIComponent(randomItem(['blog', 'typescript', 'react', 'docker', 'nestjs']))}`,
    country: randomItem(countries),
    timestamp: new Date(
      baseTime + Math.random() * (now - baseTime),
    ),
  }
}

async function printStats(db) {
  const collections = [
    'readers', 'posts', 'notes', 'pages', 'categories', 'comments',
    'topics', 'links', 'options', 'analyzes', 'snippets',
  ]
  console.log('='.repeat(50))
  console.log('📋 数据统计：')
  console.log('='.repeat(50))
  const stats = await Promise.all(
    collections.map(async (col) => {
      try {
        const count = await db.collection(col).countDocuments()
        return { 集合: col, 数量: count }
      } catch {
        return { 集合: col, 数量: 0 }
      }
    }),
  )
  console.table(stats)
}

async function seedOwner(db, force) {
  const ownerCount = await db.collection('readers').countDocuments({ role: 'owner' })
  if (ownerCount > 0 && !force) {
    console.log('👤 管理员已存在，跳过创建。\n')
    return
  }

  if (force) {
    const existing = await db.collection('readers').findOne({ role: 'owner' })
    if (existing) {
      await db.collection('readers').deleteOne({ _id: existing._id })
      await db.collection('accounts').deleteMany({
        providerId: 'credential',
        userId: { $in: [existing._id, existing._id.toString()] },
      })
      await db.collection('owner_profiles').deleteOne({ readerId: existing._id })
    }
  }

  console.log('👤 创建管理员账号...')
  const readerId = new ObjectId()
  const now = new Date()
  const passwordHash = await bcrypt.hash(SEED_ADMIN.password, 10)
  const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(SEED_ADMIN.name)}`

  // readers
  await db.collection('readers').insertOne({
    _id: readerId,
    name: SEED_ADMIN.name,
    email: SEED_ADMIN.email,
    emailVerified: true,
    image: avatar,
    createdAt: now,
    updatedAt: now,
    role: 'owner',
    handle: SEED_ADMIN.username,
    username: SEED_ADMIN.username,
    displayUsername: SEED_ADMIN.name,
  })

  // accounts
  await db.collection('accounts').insertOne({
    accountId: readerId.toString(),
    providerId: 'credential',
    userId: readerId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  })

  // owner_profiles
  await db.collection('owner_profiles').insertOne({
    readerId,
    mail: SEED_ADMIN.email,
    created: now,
  })

  console.log(`   ✅ 管理员: ${SEED_ADMIN.username} / ${SEED_ADMIN.password}\n`)
}

// ======== 注入 Shiro 配置文件与 Serverless 函数 ========

async function seedShiroSnippets(db, force) {
  console.log('🎨 注入 Shiro 配置...')

  // ---- 1) 主题配置片段 (reference=theme, name=shiro) ----
  // 注入空 YAML，全部由 Shiro 使用缺省默认值
  const themeSnippetExists = await db.collection('snippets').countDocuments({
    name: 'shiro',
    reference: 'theme',
  })

  if (themeSnippetExists > 0 && !force) {
    console.log('   ℹ️  Shiro 主题配置已存在，跳过。')
  } else {
    if (force) {
      await db.collection('snippets').deleteMany({
        name: 'shiro',
        reference: 'theme',
      })
    }

    await db.collection('snippets').insertOne({
      _id: new ObjectId(),
      name: 'shiro',
      reference: 'theme',
      type: 'yaml',
      raw: '# 空配置，全部使用 Shiro 默认值\n',
      private: false,
      builtIn: false,
      enable: true,
      created: new Date(),
      updated: new Date(),
    })
    console.log('   ✅ Shiro 主题配置片段已注入（空配置，使用默认值）')
  }

  // ---- 2) 状态函数片段 (reference=shiro, name=status) ----
  const statusFnExists = await db.collection('snippets').countDocuments({
    name: 'status',
    reference: 'shiro',
    type: 'function',
  })

  if (statusFnExists > 0 && !force) {
    console.log('   ℹ️  Shiro 状态函数已存在，跳过。')
  } else {
    const source = loadShiroStatusSource()
    if (!source) return

    if (force) {
      await db.collection('snippets').deleteMany({
        name: 'status',
        reference: 'shiro',
        type: 'function',
      })
    }

    await db.collection('snippets').insertOne({
      _id: new ObjectId(),
      name: 'status',
      reference: 'shiro',
      type: 'function',
      method: 'ALL',
      raw: source,
      private: false,
      builtIn: false,
      enable: true,
      created: new Date(),
      updated: new Date(),
    })
    console.log('   ✅ Shiro 状态函数 (/fn/shiro/status) 已注入\n')
  }
}

// ======== 主流程 ========

async function main() {
  console.log('🌱 Mix Space LTS - 开发环境数据初始化\n')
  console.log(`📍 MongoDB: ${MONGO_URI}\n`)

  const client = new MongoClient(MONGO_URI)

  try {
    await client.connect()
    console.log('✅ MongoDB 连接成功\n')

    const db = client.db()

    // ---- 幂等检查：已有数据且非强制模式则跳过数据部分，但仍尝试建 owner ----
    const postCount = await db.collection('posts').countDocuments()
    if (postCount > 0 && !FORCE_RESET) {
      console.log('ℹ️  检测到已有测试数据，跳过数据初始化。')
      console.log('   如需重新初始化，请使用: node scripts/seed-dev-data.mjs --force\n')
      await seedOwner(db, false)
      await seedShiroSnippets(db, false)
      await printStats(db)
      return
    }

    if (FORCE_RESET) {
      console.log('🔄 强制模式：将清理并重建所有测试数据\n')
    }

    // -------------------------------------------------
    // 1. 清理旧数据
    // -------------------------------------------------
    console.log('🗑️  清理旧测试数据...')
    const collections = [
      'posts', 'notes', 'pages', 'categories', 'comments',
      'topics', 'links', 'options', 'analyzes', 'snippets',
    ]
    for (const col of collections) {
      try {
        await db.collection(col).drop()
      } catch {
        // 集合不存在则忽略
      }
    }
    console.log('   完成\n')

    // -------------------------------------------------
    // 2. 插入分类
    // -------------------------------------------------
    console.log('📂 插入分类...')
    await db.collection('categories').insertMany(categories)
    console.log(`   ✅ ${categories.length} 个分类\n`)

    // -------------------------------------------------
    // 3. 插入标签 (作为 category type=1)
    // -------------------------------------------------
    const tags = tagNames.map((name) => ({
      _id: new ObjectId(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      type: 1, // Tag
      created: daysAgo(randomInt(20, 60)),
    }))
    await db.collection('categories').insertMany(tags)
    console.log(`   ✅ ${tags.length} 个标签\n`)

    // -------------------------------------------------
    // 4. 插入文章
    // -------------------------------------------------
    console.log('📝 插入文章...')
    const postDocs = posts.map((p) => ({
      ...p,
      _id: new ObjectId(),
      isPublished: true,
      copyright: true,
      allowComment: true,
      commentsIndex: 0,
      contentFormat: 'markdown',
      count: { read: randomInt(50, 5000), like: randomInt(0, 100) },
      images: [],
      meta: {},
    }))
    await db.collection('posts').insertMany(postDocs)
    console.log(`   ✅ ${postDocs.length} 篇文章\n`)

    // -------------------------------------------------
    // 5. 插入便签
    // -------------------------------------------------
    console.log('📒 插入便签...')
    const noteDocs = notes.map((n) => ({
      ...n,
      _id: new ObjectId(),
      isPublished: true,
      contentFormat: 'markdown',
      count: { read: randomInt(10, 1000), like: randomInt(0, 50) },
      images: [],
      meta: {},
      bookmark: Math.random() > 0.5,
      location: randomItem(['北京', '上海', '杭州', '深圳', null, null]),
    }))
    await db.collection('notes').insertMany(noteDocs)
    console.log(`   ✅ ${noteDocs.length} 条便签\n`)

    // -------------------------------------------------
    // 6. 插入页面
    // -------------------------------------------------
    console.log('📄 插入页面...')
    const pageDocs = pages.map((p) => ({
      ...p,
      _id: new ObjectId(),
      contentFormat: 'markdown',
      commentsIndex: 0,
      images: [],
      meta: {},
      created: p.created,
    }))
    await db.collection('pages').insertMany(pageDocs)
    console.log(`   ✅ ${pageDocs.length} 个页面\n`)

    // -------------------------------------------------
    // 7. 插入话题
    // -------------------------------------------------
    console.log('💬 插入话题...')
    await db.collection('topics').insertMany(
      topics.map((t) => ({
        ...t,
        icon: '',
      })),
    )
    console.log(`   ✅ ${topics.length} 个话题\n`)

    // -------------------------------------------------
    // 8. 插入友链
    // -------------------------------------------------
    console.log('🔗 插入友链...')
    const linkDocs = links.map((l) => ({
      ...l,
      _id: new ObjectId(),
      state: 0, // 审核通过
    }))
    await db.collection('links').insertMany(linkDocs)
    console.log(`   ✅ ${linkDocs.length} 个友链\n`)

    // -------------------------------------------------
    // 9. 插入测试评论
    // -------------------------------------------------
    console.log('💬 插入测试评论...')
    const commentDocs = []
    const commentTexts = [
      '写得真好，学习了！',
      '感谢分享，很有帮助 👍',
      '请问可以出一篇关于 Rust 的教程吗？',
      '一直在关注你的博客，加油！',
      '这篇文章解决了我一直以来的困惑，谢谢！',
      'Mark 一下，回头慢慢看',
      '能不能分享一下你的 VSCode 配置？',
      '内容很棒，已收藏',
    ]

    for (const post of postDocs) {
      const numComments = randomInt(1, 4)
      for (let i = 0; i < numComments; i++) {
        const author = randomItem(commentAuthors)
        const parentId = i > 0 && Math.random() > 0.5
          ? commentDocs[commentDocs.length - 1]._id
          : null

        commentDocs.push({
          _id: new ObjectId(),
          ref: post._id,
          refType: 'posts',
          author: author.name,
          mail: author.email,
          url: author.url,
          text: randomItem(commentTexts),
          state: 1, // 已读
          isDeleted: false,
          parentCommentId: parentId,
          replyCount: 0,
          pin: false,
          isWhispers: false,
          avatar: '',
          ip: `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}`,
          created: new Date(
            post.created.getTime() + randomInt(1, 10) * day,
          ),
        })
      }
    }
    await db.collection('comments').insertMany(commentDocs)
    console.log(`   ✅ ${commentDocs.length} 条评论\n`)

    // -------------------------------------------------
    // 10. 插入站点配置
    // -------------------------------------------------
    console.log('⚙️  插入站点配置...')
    await db.collection('options').insertMany(
      options.map((o) => ({ ...o, _id: new ObjectId() })),
    )
    console.log(`   ✅ ${options.length} 项配置\n`)

    // -------------------------------------------------
    // 11. 插入访客统计数据
    // -------------------------------------------------
    console.log('📊 生成访客统计数据 (200条)...')
    const analyzeRecords = []
    const sevenDaysAgo = now - 7 * day
    for (let i = 0; i < 200; i++) {
      analyzeRecords.push(generateAnalyzeRecord(sevenDaysAgo))
    }
    await db.collection('analyzes').insertMany(analyzeRecords)
    console.log(`   ✅ ${analyzeRecords.length} 条访客记录\n`)

    // -------------------------------------------------
    // 12. 创建索引
    // -------------------------------------------------
    console.log('📇 创建索引...')
    await db.collection('posts').createIndex({ slug: 1 }, { unique: true })
    await db.collection('posts').createIndex({ created: -1 })
    await db.collection('posts').createIndex({ categoryId: 1 })
    await db.collection('notes').createIndex({ nid: 1 }, { unique: true })
    await db.collection('notes').createIndex({ created: -1 })
    await db.collection('pages').createIndex({ slug: 1 }, { unique: true })
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true })
    await db.collection('categories').createIndex({ type: 1 })
    await db.collection('comments').createIndex({ ref: 1, refType: 1 })
    await db.collection('analyzes').createIndex({ timestamp: -1 })
    await db.collection('topics').createIndex({ slug: 1 }, { unique: true })
    console.log('   完成\n')

    // -------------------------------------------------
    // 13. 创建管理员
    // -------------------------------------------------
    await seedOwner(db, true)

    // -------------------------------------------------
    // 14. 注入 Shiro 配置片段
    // -------------------------------------------------
    await seedShiroSnippets(db, true)

    // ---- 统计摘要 ----
    await printStats(db)
    console.log('\n� 管理员登录:')
    console.log(`   用户名: ${SEED_ADMIN.username}`)
    console.log(`   密码:   ${SEED_ADMIN.password}`)
    console.log('\n🚀 启动开发服务器：')
    console.log('   cd apps/core && pnpm dev\n')

  } catch (err) {
    console.error('❌ 初始化失败:', err.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

main()
