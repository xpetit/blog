const restify = require('restify')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const server = restify.createServer()
server.use(restify.plugins.bodyParser())
// server.use(restify.CORS())

const rootDir = process.env.ROOT_DIR || `${__dirname}/articles`

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

server.get('/article/:id', asyncWrapper(async ({ params }) =>
	readFile(path.join(rootDir, params.id), 'utf8')))

server.post('/article/:id', asyncWrapper(async ({ params, body }) =>
	writeFile(path.join(rootDir, params.id), body.content, 'utf8')))


server.listen(8080, () => {
  console.log(`${server.name} listening at ${server.url}`)
})