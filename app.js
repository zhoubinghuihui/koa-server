const serve = require('koa-static');
const Koa = require('koa');
const app = new Koa();
 
// or use absolute paths
const path = require('path')
app.use(serve(__dirname + '/public'));
 
app.listen(3000, () => {
  console.log(path.dirname(p), 'path1113333322')

});
 
