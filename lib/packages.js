'use strict'

const npm = require('./npm')
const config = require('../config')
const logger = require('../winston')


class Packages {

  static save (pkg) {
    let key = `packages/${pkg.name}`
    logger.info('Saving package',key)
    return config.storage.put(key, pkg)
  }

  static refreshPkg (npmPkg) {
    return config.storage.getJSON(`packages/${npmPkg.name}`).then( (storagePkg) => {
      if ( !storagePkg || npmPkg._rev !== storagePkg._rev ){
        return Packages.save(npmPkg)
      }
      return undefined
    })
  }

  static get (name, etag) {
    return npm.get(name, etag).then((result)=>{
      if (result === 304) return 304
      if (result === 400) return 400
      if (result === 404) {
        return config.storage.getJSON(`packages/${name}`).then((pkgresult)=>{
          if (!pkgresult) return 404
          return pkgresult
        })
      }
      Packages.refreshPkg(result).catch(err=>logger.error('refreshPkg error',err.stack))
      return result
    })
  }

}

module.exports = Packages
