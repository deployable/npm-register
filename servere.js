
const Promise = require('bluebird')
const app = require('express')()
const config = require('./config')
const uuid = require('node-uuid')
const logger = require('winston')

app.name = 'npm-register'
app.port = config.port
app.proxy = config.production

const Ideed = require('./lib/ideed')
const Timer = require('./lib/timer')
const HttpMetaData = require('./lib/http_meta_data')

app.use((req, res, next) => {
  let hmd = new HttpMetaData(req,res,{logger:logger}).start()
  hmd.log_start()
  logger.info({type:'req', id: hmd._id, url: req.url})
  let previous_end = res.end
  res.end = function () {
    previous_end.apply(res, arguments)
    hmd.end()
    hmd.log_end()
  }
  next()
})

const RoutePackages = require('./lib/route-packages')

app.get('/:name', RoutePackages.get)
app.get('/:name/-/:filename', RoutePackages.tarball)
app.get('/:scope?/:name/-/:scope2?/:filename/:sha', RoutePackages.tarball_sha)


app.get('/', (req, res ) => { res.json({message:'hello'}) })
app.get('/delay', (req, res, next) => {
  let ms = req.query.ms || 100
  Promise
    .delay(ms)
    .timeout(1000,"Response timed out")
    .then(() => res.json({message:'hello'}))
})

app.use(function(error, req, res, next){
  logger.error(req.url, error)
  res.json({error:error})
  logger.info(req._hmd.req_id)
})



module.exports = app
