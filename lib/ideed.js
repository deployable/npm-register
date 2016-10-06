const uuid = require('node-uuid')

class Ideed {
  constructor () {
    this.id = uuid.v4()
  }
  get id () {
    return this._id
  }
  set id (uuid) {
    return this._id = uuid
  }
}

module.exports = Ideed
