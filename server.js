let Koa = require('./index')
let app = new Koa()

let responseData = {}

app.use(async(ctx, next) => {
    throw new Error('ooops')
})

app.on('error', (err) => {
    console.log(err.stack)
})

app.listen(3000, () => {
    console.log('listenging on 3000')
})