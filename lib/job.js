'use strict'

const config = require('../config')
let captureError = null

if (config.opbeat) {
  const opbeat = require('./opbeat')
  captureError = function(error, data){
    opbeat.captureError(e, {extra: {job: data.name}})
  }
} else {
  const logger = require('../winston')
  captureError = function(error, data){
    logger.error(e, {extra: {job: data.name}})
  }
}

module.exports = fn => {
  return (...args) => {
    fn(...args)
    .catch(e => captureError(e, fn))
  }
}
