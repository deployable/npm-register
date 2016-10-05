'use strict'

const config = require('../../config')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const path = require('path')
const Stream = require('stream')
const logger = require('../../winston')
const crypto = require('crypto')
const random_string = function(len){ return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len) }


class FS extends require('./base') {

  constructor () {
    super()
    this.directory = path.resolve(config.fs.directory)
    logger.info(`Saving files to local filesystem at ${this.directory}`)
    if (!config.fs.directory) logger.error('Set NPM_REGISTER_FS_DIRECTORY to change directory')
  }

  get (key) {
    return fs.readFileAsync(this._genpath(key), 'utf8')
    .catch(err => {
      if (err.code !== 'ENOENT') throw err
    })
  }

  stream (key) {
    let file = this._genpath(key)
    return fs.statAsync(file)
    .then(info => {
      return {
        stream: fs.createReadStream(file),
        size: info.size
      }
    }).catch(err => {
      if (err.code !== 'ENOENT') throw err
    })
  }

  put (key, data) {
    let file = this._genpath(key)
    let suffix = 'tmp' + random_string(4)
    let file_suffix = `${file}.${suffix}`
    logger.info(`fs starting to save file ${file} ${suffix}`)
    return fs.mkdirpAsync(path.dirname(file)).then(function(){
      if (data instanceof Stream) {
        return new Promise((resolve, reject) => {
          let hash = crypto.createHash('sha1')
          hash.setEncoding('hex')
          let output = fs.createWriteStream(`${file}.${suffix}`)
          output.on('error', function(error){
            fs.removeAsync(`${file}.${suffix}`).catch(function(error){ logger.error(`couldnt remove file [${file}.${suffix}]`,error) })
            logger.error('fs output', error)
            reject(error)
          })
          data.pipe(hash)
          data.pipe(output)
          data.on('error', function(error){
            fs.removeAsync(`${file}.${suffix}`).catch(function(error){ logger.error(`couldnt remove file [${file}.${suffix}]`,error) })
            logger.error('data incoming',error)
            reject(error)
          })
          output.on('finish', function(result){
            hash.end()
            logger.info('output finished hash', file, hash.read())
            fs.moveAsync(`${file}.${suffix}`,file).then(function(){
              logger.info('file moved into place',file)
              resolve(result)
            })
            .catch(function(error){
              logger.error(`couldnt move tmp file into place [${file}.${suffix}]`,error) 
              reject(error)
            })
          })
        })
      } else if (data instanceof Buffer) {
        return fs.outputFileAsync(file, data)
      } else {
        data = JSON.stringify(data)
        return fs.outputFileAsync(file, data)
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
