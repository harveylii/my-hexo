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
