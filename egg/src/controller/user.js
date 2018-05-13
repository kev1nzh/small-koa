module.exports = {
    async getUser(ctx, service, app) {
        app.config.name = 1
        await service.userService.storeInfo()
        ctx.body = 'getUser';
    },
    async getUserInfo() {
        ctx.body = 'getUserInfo';
    }
}