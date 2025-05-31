---
title: 使用 Next.js 和 Hexo 来搭建我的博客
date: 2025-05-31 23:03:39
tags:
cover: https://i.miji.bid/2025/05/31/b32120e45a883f469219fff4665c9b29.png
excerpt: 工作了许久一直都没有搭建一个自己的博客，这几天不为何心血来潮突然就做了决定，想到之前苏卡卡曾经使用 Next.js 重构了他原本基于 Hexo 的博客，于是我也打算照猫画虎使用相同大致相同的技术栈来搭建我自己的博客，本文参考了苏卡卡的[使用Next.js + Hexo 重构我的博客]。所以让我们开始吧！(WARNING：本文会相当流水账，因为我是在开发这个项目的同时在写这篇文章，因此文章进度和项目进度会是同步的)
---

工作了许久一直都没有搭建一个自己的博客，这几天不为何心血来潮突然就做了决定，想到之前[苏卡卡](https://blog.skk.moe/)曾经使用 Next.js 重构了他原本基于 Hexo 的博客，于是我也打算照猫画虎使用相同大致相同的技术栈来搭建我自己的博客，本文参考了苏卡卡的[使用 Next.js + Hexo 重构我的博客
](https://blog.skk.moe/post/use-nextjs-and-hexo-to-rebuild-my-blog/)。

所以让我们开始吧！(WARNING：本文会相当流水账，因为我是在开发这个项目的同时在写这篇文章，因此文章进度和项目进度会是同步的)

## Step 1: 初始化

首先安装 [Hexo](https://hexo.io/zh-cn/)和[Next.js](https://nextjs.org/)，具体安装过程请参考官网。我的想法是 hexo 项目应该位于 next.js 项目之中，相当于是一个模块。安装完成之后项目结构是这样的（Next.js: 15.3.2, Hexo: 7.3.0）：

```bash
├── hexo
│   ├── _config.landscape.yml
│   ├── _config.yml
│   ├── db.json
│   ├── package-lock.json
│   ├── package.json
│   ├── scaffolds
│   │   ├── draft.md
│   │   ├── page.md
│   │   └── post.md
│   ├── source
│   │   └── _posts
│   │       ├── 使用-Next-js-和-Hexo-来搭建我的博客.md
│   │       └── hello-world.md
│   └── themes
├── LICENSE
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── src
│   └── app
│       ├── layout.tsx
│       └── page.tsx
└── tsconfig.json
```

安装完成之后第一步就是在 Next.js 项目中引入 Hexo，所以：

```base
npm install hexo -D
```

随后尝试在`page.tsx`中引入 Hexo 打印一下我们目前所有的文章：

```typescript
// src/utils/hexo.ts 以后我们有关于 hexo 的所有函数都会放在这里
import Hexo from 'hexo'
import path from 'path'

// 单例
let hexo: Hexo | null = null

export const initHexo = async () => {
  if (hexo) {
    return hexo
  }

  const hexoRoot = path.join(process.cwd(), '/hexo')
  const hexoInstance = new Hexo(hexoRoot, { silent: true })

  await hexoInstance.init()
  await hexoInstance.load()

  hexo = hexoInstance
  return hexo
}
```

```typescript
// src/app/page.tsx
import { initHexo } from '~/utils/hexo'

const Page = async () => {
  const hexo = await initHexo()
  hexo.locals.get('posts').forEach((post) => {
    console.log(post)
  })

  return <div>This is Home Page</div>
}

export default Page
```

随后，`npm run dev`。嗯嗯，结果不出意外地出意外了，报错：

```bash
➜  my-hexo git:(main) ✗ npm run dev

> my-hexo@1.0.0 dev
> next dev

   ▲ Next.js 15.3.2
   - Local:        http://localhost:3000
   - Network:      http://192.168.10.42:3000

 ✓ Starting...
 ✓ Ready in 1497ms
 ○ Compiling / ...
 ⨯ ./node_modules/fsevents/fsevents.node
Module parse failed: Unexpected character '�' (1:0)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
(Source code omitted for this binary file)

Import trace for requested module:
./node_modules/fsevents/fsevents.node
./node_modules/fsevents/fsevents.js
./node_modules/chokidar/lib/fsevents-handler.js
./node_modules/chokidar/index.js
./node_modules/hexo-fs/dist/fs.js
./node_modules/hexo/dist/hexo/index.js
./src/utils/hexo.ts
./src/app/page.tsx
 ⨯ ./node_modules/fsevents/fsevents.node
```

很明显可以看到是因为 hexo 包内的某些原因引起的奇怪错误，而且定位到了一个 `node` 后缀的文件。对于这种错误，一般我们首先把这个包排除我们的构建，搜了一下 next.js 的文档，新建了个配置文件：

```typescript
// next.config.mjs
/** @type { import('next').NextConfig } */

const nextConfig = {
  // 让 next 在构建的时候忽略 hexo
  serverExternalPackages: ['hexo'],
}

export default nextConfig
```

嗯，问题解决了，有点出乎意料的顺利，嘿嘿 😊。接下来我们开始构建我们博客的首页，首先首页应该有一个分页列表列出最近的文档，每一个列表项最基础应该有四个元素：封面、标题、摘要和创建日期。在 hexo 中新建文章的时候我们可以发现，hexo 默认提供文章的标题和创建日期，但是封面和摘要需要我们进一步解决。对于这种查查文档就能解决的问题，为什么我们不问问神奇的 AI 呢？AI 告诉我们可以在每篇博文的 Markdown 文件顶部的 Front-matter 区域添加自定义字段来解决这个问题，虽然没有自动化，但是不失于一种最初的解决办法。

```bash
---
title: 使用 Next.js 和 Hexo 来搭建我的博客
date: 2025-05-31 23:03:39
tags:
// add
cover: https://i.miji.bid/2025/05/31/b32120e45a883f469219fff4665c9b29.png
excerpt: 工作了许久一直都没有搭建一个自己的博客，这几天不为何心血来潮突然就做了决定，想到之前苏卡卡曾经使用 Next.js 重构了他原本基于 Hexo 的博客，于是我也打算照猫画虎使用相同大致相同的技术栈来搭建我自己的博客，本文参考了苏卡卡的[使用Next.js + Hexo 重构我的博客]。所以让我们开始吧！(WARNING：本文会相当流水账，因为我是在开发这个项目的同时在写这篇文章，因此文章进度和项目进度会是同步的)
---
```

再次回到控制台发现 AI 老师没有骗我们，确实获取到了数据。随后我们需要获取最新的 10 篇文章展示在我们的首页，重复以上操作，我们可以编写一个工具函数来帮我们获取指定页码的文章，并重构我们的 `hexo.ts`：

```typescript
// src/utils/hexo.ts
import Hexo from 'hexo'
import path from 'path'

class MyHexo {
  hexo: Hexo | null = null

  constructor() {
    this.initHexo()
  }

  initHexo = async () => {
    if (this.hexo) {
      return
    }

    const hexoRoot = path.join(process.cwd(), '/hexo')
    const hexoInstance = new Hexo(hexoRoot, { silent: true })

    await hexoInstance.init()
    await hexoInstance.load()

    this.hexo = hexoInstance
  }

  getPagedPosts = async (options?: { page: number; pageSize: number }) => {
    await this.initHexo()

    const [page, pageSize] = options ? [options.page, options.pageSize] : [1, 10]
    const allPosts = this.hexo.locals.get('posts').sort('-date')
    const totalPosts = allPosts.length
    const totalPages = Math.ceil(totalPosts / pageSize)
    const skipCount = (page - 1) * pageSize
    const pagedPosts = allPosts.skip(skipCount).limit(pageSize).toArray()

    return {
      // 为什么要做一个 map，首先我只想保留对我有用的东西，其次，直接使用 pagedPosts 会有循环引用的警告，逃...
      posts: pagedPosts.map((post) => ({
        title: post.title,
        date: post.date.toISOString(),
        excerpt: post.excerpt || '',
        cover: post.cover || '',
      })),
      totalPages,
      totalPosts,
    }
  }
}

export const hexo = new MyHexo()
```

OK，到这一步我们可以真正地开始构建我们的 UI 了，我比较喜欢 TailwindCSS，接下来我们引入 TailwindCSS，具体怎么做请参考[官方指引](https://nextjs.org/docs/app/guides/tailwind-css)。
