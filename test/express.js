const request = require('supertest')
const expect = require('chai').expect
const fs    = require('fs')
const zlib  = require('zlib')

const app = require('../servere')


function binaryParser(res, callback) {
  res.setEncoding('binary')
  res.data = []
  res.on('data', function (chunk) {
    res.data.push(chunk)
  })
  res.on('end', function () {
    callback(null, new Buffer(res.data.join(''), 'binary'))
  })
}


describe('something', function () {
  this.timeout(2000)

  it('requests /', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .end(function(err,res){
        expect(err).to.eql(null)
        expect(res.body).to.eql({message:'hello'})
        done()
    })
  })

  it('requests /delay', function (done) {
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

  it('requests /delay and provides a delay of 20', function (done) {
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


  it('requests package info /lodash.keys', function (done) {
    this.slow(2000)
    this.timeout(6000)
    request(app)
      .get('/lodash.keys')
      .expect(200)
      .end(function(err,res){
        expect(err).to.eql(null)
        expect(res.body).to.contain.keys('name','_id')
        expect(res.body.name).to.equal('lodash.keys')
        expect(res.body._id).to.equal('lodash.keys')
        expect(res.body.versions['4.2.0'].name).to.eql('lodash.keys')
        done()
    })
  })

  it('requests package /lodash.keys tarball', function (done) {
    this.slow(2000)
    this.timeout(5000)
    let shasum = 'a08602ac12e4fb83f91fc1fb7a360a4d9ba35205'
    let req_path = '/lodash.keys/-/lodash.keys-4.2.0'
    let fs_path = './tmp/tarballs/lodash.keys/lodash.keys-4.2.0/a08602ac12e4fb83f91fc1fb7a360a4d9ba35205.tgz'
    try{
      fs.unlinkSync(fs_path)
    }catch(e){
      //if (e.code !== 'ENOENT') throw e
    }
    
    request(app)
      .get(`${req_path}/${shasum}.tgz`)
      .expect(200)
      .buffer()
      .parse(binaryParser)
      .end(function(err,res){
        expect(err).to.eql(null)
        expect(Buffer.isBuffer(res.body)).to.be.ok
        expect(res.body.length).to.eql(4400)
        zlib.gunzip(res.body,(err,result)=>{
          expect(err).to.eql(null)
          expect(result.slice(257,262).toString()).to.equal('ustar')
          done()
        })
    })
  })


  it('requests package /lodash.keys tarball', function (done) {
    this.timeout(1000)

    let shasum = 'a08602ac12e4fb83f91fc1fb7a360a4d9ba35205'
    let req_path = '/lodash.keys/-/lodash.keys-4.2.0'
    request(app)
      .get(`${req_path}/${shasum}.tgz`)
      .expect(200)
      .buffer()
      .parse(binaryParser)
      .end(function(err,res){
        expect(err).to.eql(null)
        expect(Buffer.isBuffer(res.body)).to.be.ok
        expect(res.body.length).to.eql(4400)
        done()
    })
  })


})
