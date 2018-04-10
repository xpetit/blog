const restify = require('restify')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const readdir = promisify(fs.readdir)
const server = restify.createServer()
const rootDir = `${__dirname}/articles`

try {
  fs.mkdirSync(rootDir)
} catch (err) {
  if (err.code !== 'EEXIST')
    throw err
}

const asyncWrapper = fn => (req, res, next) => fn(req)
  .then(result => {
    res.send(result)
    next()
  }, err => {
    console.error(err)
    next(err)
  })

const getId = () => readdir(rootDir)
  .then(idList => idList.length
    ? idList.map(Number).sort((a, b) => b - a)[0] + 1
    : 1)

server.use(restify.plugins.bodyParser())

server.get('/', restify.plugins.serveStatic({
  directory: __dirname + '/public/',
  default: './index.html'
}))

server.get('/article/', asyncWrapper(() => readdir(rootDir)))

server.get('/article/:id', asyncWrapper(req =>
  readFile(path.join(rootDir, req.params.id), 'utf8')))

server.post('/article/', asyncWrapper(async req => {
  await writeFile(path.join(rootDir, String(await getId())), req.body.content, 'utf8')
  return 'OK'
}))

server.listen(80, () => {
  console.log(`${server.name} listening at ${server.url}`)
})