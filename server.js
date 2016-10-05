'use strict'


const config = require('./config')
const app = require('koa')()
const compress = require('koa-compress')
const routes = require('./routes')
const middleware = require('./middleware')
const logger = require('./winston')

if (config.opbeat) {
  const opbeat = require('./lib/opbeat')
  app.context.opbeat = opbeat
}

app.name = 'npm-register'
app.port = config.port
app.proxy = config.production

app.use(function * (next){
  this.req._npm_register = {}
  this.req._npm_register.time = { start: Date.now(), end: null }
  yield next
  this.req._npm_register.time.end = Date.now()
})
app.use(require('./logger'))
app.use(require('koa-timeout')(config.timeout, logger))
app.use(compress())
app.use(middleware.error)
app.use(routes.routes())
app.use(routes.allowedMethods())
app.use(middleware.notfound)

module.exports = app
