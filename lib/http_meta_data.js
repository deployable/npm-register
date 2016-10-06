const Ideed = require('./ideed')
const Timer = require('./timer')
const uuid = require('node-uuid')


class HttpMetaData extends Ideed  {
  constructor ( req, res, options = {} ) {
    super(arguments)
    this.req = req
    this.res = res
    this.logger = ( options.logger ) ? options.logger : console
    this.emd = options.emd
  }
  get emd () {
    return this._emd
  }
  set emd (emd) {
    this._emd = emd
  }
  get req () {
    return this._req
  }
  set req (req) {
    req._hmd = this
    this._req = req
  }
  get res () {
    return this._res
  }
  set res (res) {
    res._hmd = this
    this._res = res
  }
  req_id () {
    return this._req_id
  }
  get timer () {
    return this._timer
  }
  set timer (timer) {
    this._timer = timer
  }
  get req_id () {
    return this._req_id
  }
  set req_id (id) {
    this._req_id = id
  }
  gen_req_id () {
    return this.req_id = uuid.v4()
  }

  start () {
    this._timer = new Timer()
    this._timer.start()
    this.gen_req_id()
    if (this.emd) this.emd.start(this)
    return this
  }
  end () {
    if (this.emd) this.emd.end(this)
    return this._timer.end()
  }
  total_time () {
    return this._timer.total()
  }
  get logger () {
    return this._logger
  }
  set logger (logger) {
    return this._logger = logger
  }
  log_start () {
    this.logger.info('hmd start',{type:'req', id: this._req_id, url: this.req.url, ip: this.req.ip})
  }
  log_end () {
    this.logger.info('hmd  end ',{type:'res', id: this._req_id, status: this.res.statusCode, time_ms: this.total_time()})
  }
}

module.exports = HttpMetaData