const Ideed = require('./ideed')
const HttpMetaData = require('./http_meta_data')


class ExpressMetaData extends Ideed  {

  constructor ( options = {} ) {
    super( options )
    this.running_requests = {}
    this.running_requests_limit = 500
    this.regular() 
    this.logger = ( options.logger ) ? options.logger : console
  }

  start (hmd) {
    this.running_requests[hmd.req_id] = {hmd:hmd}
  }

  end (hmd) {
    delete this.running_requests[hmd.req_id]
  }

  regular() {
    let self = this
    setTimeout( () => {
      self.logger.debug('emd regular running')
      let val = Object.keys(self.running_requests).length
      if ( val > self.running_requests_limit )
        self.logger.warn('emd running_requests value is high',val)
      self.regular()
    }, 30000)
  }

  middleware ( options = {} ) {
    let self = this
    let logger = options.logger || self.logger
    return (req, res, next) => {
      let hmd = new HttpMetaData(req,res,{logger:logger,emd:self}).start()
      hmd.log_start()
      let previous_end = res.end
      res.end = function () {
        previous_end.apply(res, arguments)
        hmd.end()
        hmd.log_end()
      }
      next()
    }
  }

}

module.exports = ExpressMetaData
