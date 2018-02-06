const restify = require('restify')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const readdir = promisify(fs.readdir)
const frontend = restify.createServer()
const backend = restify.createServer()

frontend.get('/\/.*/', restify.plugins.serveStatic({
    directory: __dirname + "/public/",
    default: './index.html'
   })
)

backend.use(restify.plugins.bodyParser())

backend.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "X-Requested-With,content-type")
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.header('Access-Control-Allow-Credentials', true)
    next()
  })

const rootDir = process.env.ROOT_DIR || `${__dirname}/articles`

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

const respond = (req, res, next) => {
  res.send('hello ' + req.params.name)
  next()
}

const getId = () => readdir(rootDir)
  .then(idList => idList
    .map(Number)
    .sort((a, b) => b - a)[0] + 1)

backend.get('/article/', asyncWrapper(({ params }) =>
  readdir(rootDir)))

backend.get('/article/:id', asyncWrapper(({ params }) =>
  readFile(path.join(rootDir, params.id), 'utf8')))

backend.post('/article/:id', asyncWrapper(({ params, body }) =>
  writeFile(path.join(rootDir, params.id), body.content, 'utf8')))

backend.post('/article/', asyncWrapper(async ({ body }) =>
  writeFile(path.join(rootDir, await getId()), body.content, 'utf8')))

backend.listen(8080, () => {
  console.log(`${backend.name} listening at ${backend.url}`)
})

frontend.listen(80)