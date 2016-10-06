const app = require('./servere')

app.listen(app.port, function () {
  console.error(`${app.name} express listening on port ${app.port} [${app.env}]`)
})
