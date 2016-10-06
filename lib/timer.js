const Ideed = require('./ideed')

class Timer extends Ideed {
  constructor () {
    super(arguments)
  }
  start () {
    if (this._start) throw new Error('Timer already started')
    this._end = null
    return this._start = Date.now()
  }
  end () {
    if (this._end) throw new Error('Timer already ended') 
    return this._end = Date.now()
  } 
  total () {
    if (!this._start) throw new Error('Timer not started')
    if (!this._end)   throw new Error('Timer not ended') 
    return this._total = this._end - this._start
  }
  current () {
    if (!this._start) throw new Error('Timer not started')
    return Date.now() - this._start
  }
}
module.exports = Timer