const koa = require('koa');
const fs = require('fs');
const koaRoute = require('koa-router');

class KluyLoader {
    removeString(source) {
        const string = 'kluy';
        const index = source.indexOf(string);
        const len = string.length;
        return source.substring(0, index);
    }
    loadConfig() {
        const url = this.removeString(__dirname) + '/config'
        return this.loader(url)
    }
    loader(path) {
        const dir = fs.readdirSync(path)//同步方法无所谓的，因为是在服务器跑起来之前就完成映射，不会有任何性能影响
        return dir.map((filename) => {
            const module = require(path + '/' + filename);
            return { name: filename.split('.')[0], module };
        })
    }

    loadController() {
        const url = this.removeString(__dirname) + '/controller';
        return this.loader(url);
    }

    loadService() {
        const url = this.removeString(__dirname) + '/service';
        return this.loader(url);
    }

}

class Kluy extends koa {
    constructor(props) {
        super(props);
        this.router = new koaRoute();

        this.loader = new KluyLoader();
        const controllers = this.loader.loadController();
        const services = this.loader.loadService()
        this.controller = {};
        controllers.forEach((crl) => {
            this.controller[crl.name] = crl.module;
        })

        this.config = {}
        this.loader.loadConfig().forEach( config => {
            this.config = {
                ...this.config,
                ...config.module
            }
        })

    }

    setRouters() {
        const _setRouters = (app) => {
            const routers = require('../routers')(app);
            const svs = {};
            app.loader.loadService().forEach((service) => {
                svs[service.name] = service.module;
            })
            Object.keys(routers).forEach((key) => {
                const [method, path] = key.split(' ');
                app.router[method](path, (ctx) => {
                    const handler = routers[key];
                    handler(ctx, svs, app);//将app，传递给controller
                })
            })
            return app.router.routes()
        }
        this.use(_setRouters(this));
    }
}

module.exports = Kluy;