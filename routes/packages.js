'use strict'

const r = require('koa-router')()
const path = require('path')
const url = require('url')
const packages = require('../lib/packages')
const config = require('../config')
const logger = require('../winston')

function addShaToPath (p, sha) {
  let ext = path.extname(p)
  let filename = path.basename(p, ext)
  p = path.dirname(p)

  p = path.join(p, `${filename}/${sha}${ext}`)
  return p
}

function rewriteTarballURLs (pkg, host, protocol) {
  if (!pkg.versions) {
    let error = new Error('Problem with package data')
    logger.error('Package is not the correct type',pkg,'should be a json object')
    throw error
  }
  for (let version of Object.keys(pkg.versions)) {
    let dist = pkg.versions[version].dist
    let u = url.parse(dist.tarball)
    u.pathname = addShaToPath(u.pathname, dist.shasum)
    u.host = host
    u.protocol = protocol
    dist.tarball = url.format(u)
  }
}

// get package metadata
r.get('/:name', function * () {
  let etag = this.req.headers['if-none-match']
  let pkg = yield packages.get(this.params.name, etag)
  if (pkg === 304) {
    this.status = 304
    return
  }
  if (pkg === 404) {
    this.status = 404
    this.body = {error: 'no such package available'}
    return
  }
  if (pkg === 400) {
    this.status = 400
    this.body = {error: 'Error retrieving package'}
    return
  }
  let cloudfront = this.headers['user-agent'] === 'Amazon CloudFront'
  logger.debug('Type of package:', typeof pkg, this.params.name)
  rewriteTarballURLs(pkg, cloudfront ? config.cloudfrontHost : this.headers.host, this.request.protocol)
  this.set('ETag', pkg.etag)
  this.set('Cache-Control', `public, max-age=${config.cache.packageTTL}`)
  this.body = pkg
})

module.exports = r
