
const Promise = require('bluebird')
const app = require('express')()
const config = require('./config')
const uuid = require('node-uuid')
const logger = require('./winston')

const RoutePackages = require('./lib/route-packages')
const ExpressMetaData = require('./lib/express_meta_data')

app.name = 'npm-register'
app.port = config.port
app.proxy = config.production

const emd = new ExpressMetaData({logger:logger})
app.use( emd.middleware() )


app.get('/', (req, res ) => { res.json({message:'hello'}) })
app.get('/delay', (req, res, next) => {
  let ms = req.query.ms || 100
  Promise
    .delay(ms)
    .timeout(1000,"Response timed out")
    .then(() => res.json({message:'hello'}))
})

app.get('/:name', RoutePackages.get)
app.get('/:name/-/:filename', RoutePackages.tarball)
app.get('/:scope?/:name/-/:scope2?/:filename/:sha', RoutePackages.tarball_sha)

app.use(function(error, req, res, next){
  console.error(error)
  logger.error(req.url, error.message, error.stack)
  let statusCode = error.statusCode || 500
  res.status(statusCode).json({error:error, stack:error.stack})
  logger.info(req._hmd.req_id)
})



module.exports = app
