const packages = require('./packages')

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
      if (!tarball) {
        console.log(`Loading ${key} from npm`)
        let request = (scope) ? `${scope}/${name}` : name
        return npm.getTarball(request, filename + path.extname(sha))
        .then( (gottarball) => {
          config.storage.put(key, gottarball.stream, {
            'content-length': gottarball.resp.headers['content-length'],
            'content-type': gottarball.resp.headers['content-type']
          })
          return config.storage.stream(key)
        })
      }
      return tarball
    })
    .then( (tarball) => {
      res.set('Content-Length', tarball.size)
      res.set('Cache-Control', `public, max-age=${config.cache.tarballTTL}`)
      return res.pipe(tarball.stream)    
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
      return res.json(pkg)
    })
    .catch(next)
  }

}

module.exports = RoutePackages