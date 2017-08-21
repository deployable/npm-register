'use strict'

const Promise = require('bluebird')
const co = require('co')
const got = require('got')
const needle = Promise.promisifyAll(require('needle'))
const url = require('url')
const config = require('../config')
const redis = require('./redis')
const logger = require('../winston')

let cacheKey = name => `/packages/${name}`

function isEtagFresh (name, etag) {
  if (!redis || !etag) return Promise.resolve(false)
  return redis.get(`${cacheKey(name)}/etag`)
  .then(cache => etag === cache)
  .catch(err => console.error(err.stack))
}

function updateEtag (name, etag) {
  redis.setex(`${cacheKey(name)}/etag`, config.cache.packageTTL, etag)
  .catch(err => console.error(err.stack))
}

function fetchFromCache (name) {
  if (!redis) return Promise.resolve(false)
  return redis.get(cacheKey(name))
  .then(pkg => {
    if (pkg) {
      console.log(`${name} found in cache`)
      return JSON.parse(pkg)
    }
  })
  .catch(err => console.error(err.stack))
}

function updateCache (pkg) {
  if (!redis) return
  return redis.setex(cacheKey(pkg.name), config.cache.packageTTL, JSON.stringify(pkg))
  .catch(err => console.error(err.stack))
}


function get (name, etag) {
  return isEtagFresh(name, etag).then( result => {
    if (result) return 304
    return fetchFromCache(name)
  })
  .then( (result) => {
    // we have a package, we're done
    if (result) return result

    let opts = {timeout: config.timeout, headers: {}}
    if (config.httpAgent) opts.agent = httpAgent
    if (etag) opts.headers['if-none-match'] = etag
    let get_url = url.resolve(config.uplink.href, '/' + name.replace(/\//, '%2F'))
    logger.debug('get',get_url,opts)
    
    return needle.getAsync(get_url, opts).then( (result) => {
      logger.silly('got',result.body,'')

      //pkg = JSON.parse(result.body)
      let pkg = result.body
      pkg.etag = result.headers.etag
      updateCache(pkg)
      return pkg
    })
  })
  .catch( (err) => {
    switch (err.statusCode) {
      case 304:
        if (redis) updateEtag(name, etag)
        return 304
      case 404:
        return 404
      default:
        logger.error('Error getting file', name, etag, err.stack)
        return 400
    }
  })
}

function getTarball (name, filename) {
  return new Promise((resolve, reject) => {
    let opts = {timeout: config.timeout}
    if (config.httpAgent) opts.agent = httpAgent
    let get_url = `${config.uplink.href}${name}/-/${filename}`
    logger.debug('getTarball getting', get_url, opts, '')
    let stream = got.stream(get_url, opts)
    .on('error', reject)
    .on('response', (resp) => {
      logger.silly('getTarball got response', resp.headers.expires, resp.headers.data, resp.headers.etag)
      resolve({resp, stream})
    })
  })
}

function * getDistTags (name) {
  let opts = {timeout: config.timeout, json: true}
  if (config.httpAgent) opts.agent = httpAgent
  let get_url = url.resolve(config.uplink.href, '/-/package/' + encodeURIComponent(name) + '/dist-tags')
  logger.debug('get',get_url,opts)
  let rsp = yield needle.getAsync(get_url, opts)
  return rsp.body
}

module.exports = {
  get: co.wrap(get),
  getDistTags: co.wrap(getDistTags),
  getTarball
}
