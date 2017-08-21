'use strict'

const config = require('../../config')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const fse = fs
const path = require('path')
const Stream = require('stream')
const crypto = require('crypto')
const logger = require('../../winston')


class FS extends require('./base') {
  constructor () {
    super()
    this.directory = path.resolve(config.fs.directory)
    logger.warn(`Saving files to local filesystem at ${this.directory}`)
    if (!config.fs.directory) logger.warn('Set NPM_REGISTER_FS_DIRECTORY to change directory')
  }

  get (key) {
    let file = this._genpath(key)
    return fs.readFileAsync(file, 'utf8')
      .catch((err) => {
        if (err.code !== 'ENOENT') {
          logger.debug(`fs.get error`, err.stack)
          throw err
        }
      })
  }

  stream (key) {
    let file = this._genpath(key)
    logger.debug('fs.stream stat', file)
    return fs.statAsync(file)
      .then((info) => {
        logger.debug('fs.stream read', file)
        return {
          stream: fs.createReadStream(file),
          size: info.size
        }
      }).catch((err) => {
        if (err.code !== 'ENOENT') {
          logger.debug(`fs.stream error`, err.stack)
          throw err
        }
      })
  }

  put (key, data) {
    let file = this._genpath(key)
    return fse.mkdirpAsync(path.dirname(file)).then(() => {
      if (data instanceof Stream) {
        return new Promise((resolve, reject) => {
          let hash = crypto.createHash('sha1')
          hash.setEncoding('hex')
          logger.info('fs.put Writing stream to',file)
          let output = fs.createWriteStream(file)
          output.on('error', reject)
          data.pipe(output)
          data.pipe(hash)
          data.on('error', reject)
          output.on('finish', (result)=>{
            hash.end()
            let sum = hash.read()
            logger.debug('fs.put got sum',sum,'for file',key)
            resolve(result)
          })
        })
      } else if (data instanceof Buffer) {
        logger.info('fs.put Writing buffer to',file)
        return fse.outputFileAsync(file, data)
      } else {
        logger.info('fs.put Writing json to',file)
        data = JSON.stringify(data)
        return fse.outputFileAsync(file, data)
      }
    })
  }

  delete (key) {
    let file = this._genpath(key)
    return fs.unlinkAsync(file)
  }

  list (prefix) {
    let file = this._genpath(prefix)
    return new Promise((resolve, reject) => {
      let items = []
      fs.walk(file)
      .on('data', item => {
        if (!item.stats.isDirectory()) {
          items.push(item.path.replace(this.directory, ''))
        }
      })
      .on('error', err => {
        if (err.code === 'ENOENT') resolve([])
        else reject(err)
      })
      .on('end', () => resolve(items))
    })
  }

  _genpath (key) {
    return path.join(this.directory, key)
  }
}

module.exports = FS
