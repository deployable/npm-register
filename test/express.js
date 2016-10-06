let app = require('../servere')
let request = require('supertest')
let expect = require('chai').expect

describe('something', function () {
  this.timeout(2000)

  it('requests', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .end(function(err,res){
        expect(err).to.eql(null)
        expect(res.body).to.eql({message:'hello'})
        done()
    })
  })

  it('requests', function (done) {
    this.slow(215)
    request(app)
      .get('/delay')
      .expect(200)
      .end(function(err,res){
        expect(err).to.eql(null)
        expect(res.body).to.eql({message:'hello'})
        done()
    })
  })

  it('requests', function (done) {
    this.slow(60)
    request(app)
      .get('/delay?ms=20')
      .expect(200)
      .end(function(err,res){
        expect(err).to.eql(null)
        expect(res.body).to.eql({message:'hello'})
        done()
    })
  })

})
