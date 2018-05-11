let http = require('http')
let context = require('./context')
let request = require('./request')
let response = require('./response')
let EventEmitter = require('events')

/**
 * 
 * 
 * @class Application
 */
class Application extends EventEmitter {
    
    constructor() {
        super()
        this.middlewares = []
        // this.callbackFunc
        this.context = context
        this.request = request
        this.response = response 
    }

    listen(...args) {
        let server = http.createServer(this.callback())
        server.listen(...args)
    }
    
    use(middleware) {
        this.middlewares.push(middleware)
    }
    
    compose() {
        return async ctx => {
            function createNext(middleware, oldNext) {
                return async () => {
                    await middleware(ctx, oldNext)
                }
            }

            let len = this.middlewares.length 
            let next = async () => {
                return Promise.resolve()
            }
            for(let i = len - 1; i >= 0; i--) {
                let currentMiddleware = this.middlewares[i]
                next = createNext(currentMiddleware, next)
            }
            await next()
        }
    }
    callback() {
        return (req, res) => {
            let ctx = this.createContext(req, res)
            let respond = () => this.responseBody(ctx)
            let onerror = (err) => this.onerror(err, ctx)
            let fn = this.compose()
            
            return fn(ctx).then(respond).catch(onerror)
        }
    }
    
    onerror(err, ctx) {
        if(err.code === 'ENOENT') {
            ctx.status = 404
        }
        else {
            ctx.status = 500
        }
        let msg = err.message || 'Internal error'
        ctx.res.end(msg)

        this.emit('error', err)
    }
    
    createContext(req, res) {
        let ctx = Object.create(this.context)
        ctx.request = Object.create(this.request)
        ctx.response = Object.create(this.response)

        ctx.req = ctx.request.req = req 
        ctx.res = ctx.response.res = res 
        return ctx
    }

    responseBody(ctx) {
        let content = ctx.body 
        if(typeof content === 'string') {
            ctx.res.end(content)
        }
        else if(typeof content === 'object') {
            ctx.res.end(JSON.stringify(content))
        }
    }
}

module.exports = Application