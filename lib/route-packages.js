const packages = require('./packages')
const config = require('../config')
const logger = require('../winston')
const path = require('path')
const npm = require('./npm')
const PassThrough = require('stream').PassThrough;

class RoutePackages {

  static tarball (req, res, next) {
    let {name, filename} = req.params
    let ext = path.extname(filename)
    filename = path.basename(filename, ext)
    return res.redirect(`/${name}/-/${filename}/a${ext}`)
  }

  static tarball_sha (req, res, next) {
    let {scope, name, filename, sha} = req.params
    let key = path.join('tarballs', scope ? `${scope}/${name}` : name, filename, sha)
    config.storage.stream(key)
    .then( (tarball) => {
      if (tarball){
        logger.debug('RoutePackages.tarball_sha got tarball', tarball.size)
        return tarball
      }
      logger.info(`RoutePackages.tarball_sha Loading ${key} from npm`)
      let request = (scope) ? `${scope}/${name}` : name
      return npm.getTarball(request, filename + path.extname(sha))
        .then( (gottarball) => {
          let putstream = new PassThrough()
          let resstream = new PassThrough()
          gottarball.stream.pipe(putstream)
          gottarball.stream.pipe(resstream)
          config.storage.put(key, putstream, {
            'content-length': gottarball.resp.headers['content-length'],
            'content-type': gottarball.resp.headers['content-type']
          }).catch(e=>logger.error('RoutePackages fs.put error',e.stack))
          return {
            stream: resstream,
            size: gottarball.resp.headers['content-length']
          }
        })
    })
    .then( (tarball) => {
      logger.debug('RoutePackages.tarball_sha streaming tarball to client', tarball.size)
      res.set('Content-Length', tarball.size)
      res.set('Cache-Control', `public, max-age=${config.cache.tarballTTL}`)
      return tarball.stream.pipe(res)
    })
    .catch(next)
  }

  static get (req, res, next) {
    let etag = req.headers['if-none-match']
    packages.get(req.params.name, etag).then((pkg)=>{
      if (pkg === 304) {
        return res.status(304)
      }
      if (pkg === 404) {
        return res.status(404).json({error: 'No such package available'})
      }
      res.set('ETag', pkg.etag)
      res.set('Cache-Control', `public, max-age=${config.cache.packageTTL}`)
      logger.debug('pkg.name',pkg.name)
      return res.json(pkg)
    })
    .catch(next)
  }

}

module.exports = RoutePackages