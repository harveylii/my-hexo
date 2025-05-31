import { hexo } from '~/utils/hexo'

const Page = async () => {
  const { posts } = await hexo.getPagedPosts({ page: 1, pageSize: 10 })

  console.log(posts)

  return <div className="text-2xl">This is Home Page</div>
}

export default Page
