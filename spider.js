const Koa = require('koa')
const app = new Koa()
const service = '8090'

const superagent = require('superagent') // 轻量ajax
const charset = require('superagent-charset') // superagent只支持utf-8的网页编码，我们可以使用其扩展的一个npm模块superagent-charset
const cors = require('koa2-cors'); //跨域处理文件koa-cors.js
app.use(cors());
charset(superagent)
const cheerio = require('cheerio') // 用在服务器端需要对DOM进行操作的地方
const Router = require('koa-router'); // 引入koa-router
const router = new Router(); // 创建路由，支持传递参数
// 指定一个url匹配
router.get('/api/weibo', async (ctx) => {
  // 获取请求参数
  console.log(ctx.query.type)
  let result
  if (ctx.query.type === 'sina') {
     result = await getSinaData()
  } else {
     result = await getJianData()
  }
  // ctx.type = 'html';
  // console.log(result)
  ctx.body = result; // 返回结果
})

// 获取新浪热搜列表
const getSinaData = async () => {
  return new Promise((resolve, reject) => {
    superagent.get('https://s.weibo.com/top/summary?cate=realtimehot')
      .end((err, sres) => {
        if (err) return reject('error')
        const $ = cheerio.load(sres.text)
        let hotList = []
        // console.log(sres)
        $("#pl_top_realtimehot table tbody tr").each(function(index) {
          if (index !== 0) {
            const $td = $(this).children().eq(1);
            const link = 'https://s.weibo.com' + decodeURI($td.find("a").attr("href"));
            const text = $td.find("a").text();
            const hotValue = $td.find("span").text();
            const icon = $td.find("img").attr("src")
              ? "https:" + $td.find("img").attr("src")
              : "";
            hotList.push({
              sort: index,
              link,
              text,
              hotValue,
              icon,
            })
          }
        })
        resolve(hotList.filter((e, i) => i < 20))
      })
  })
}

// 获取简书首页文章列表
const getJianData = () => {
  return new Promise((resolve, reject) => {
    superagent.get('https://www.jianshu.com/')
      .charset()
      // .buffer(false)
      .end((err, sres) => {
        if (err) return
        let html = sres.text
        const $ = cheerio.load(html)
        let homeList = []
        $('.note-list .content').each((index, item) => {
          const $element = $(item)
          const t = $element.find('.title')
          const d = $element.find('.abstract')
          const m = $element.find('.meta')
          const p = $element.siblings()
          homeList.push({
            'title': t.text(),
            'url': 'https://www.jianshu.com' + t.attr('href'),
            'descs': d.text(),
            'author': m.find('.nickname').text(),
            'comments': m.find('a').eq(1).text(),
            'likes': m.find('span').eq(1).text(),
            'img': p ? p.find('img').attr('src') || '' : ''
          })
        })
        resolve(homeList)
      })
  })
}

// app.use(async ctx => {
//   const result = await getSinaData()
// 	console.log(result)
//   ctx.body = result;
// });

// 调用router.routes()来组装匹配好的路由，返回一个合并好的中间件
// 调用router.allowedMethods()获得一个中间件，当发送了不符合的请求时，会返回 `405 Method Not Allowed` 或 `501 Not Implemented`
app.use(router.routes());

app.use(router.allowedMethods({ 
    // throw: true, // 抛出错误，代替设置响应头状态
    // notImplemented: () => '不支持当前请求所需要的功能',
    // methodNotAllowed: () => '不支持的请求方式'
}));

app.listen(service, async () => {
  console.log(`success and it is listening at port ${service}`)
})

// 终端启动命令
// $ npm i koa
// $ node spiser.js
// 或者安装nodemon,启动命令为nodemon spiser  不用重启终端命令
