const config = require('./config')
const winston = require('winston')

let level = config.logLevel || 'warn'

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ timestamp: true, level: level  })
  ]
})
