'use strict'

const logger = require('../winston')

module.exports = function * (next) {
  try { yield next } catch (err) {
    this.status = err.status || 500
    if (this.status === 500) {
      if (this.opbeat) {
        this.opbeat.captureError(err, {
          user: {username: this.state.username},
          request: this.req
        })
      } else {
        logger.error('this.req',err.stack,this.req.url)
      }
    }
    this.body = {error: err.message}
    this.app.emit('error', err, this)
  }
}
