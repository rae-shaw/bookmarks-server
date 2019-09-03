require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const BookmarksService = require('./bookmarks-service')
const logger = require('./logger')
const bookmarksRouter = require('./bookmarks-router/bookmarks-router.js')
const validateBearerToken = require('./validate-bearer-token.js')
const errorHandler = require('./error-handler.js')


const app = express()

const morganOption = (NODE_ENV === 'production')
 	? 'tiny'
 	: 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(validateBearerToken)

app.use(bookmarksRouter)

app.get('/', (req, res) => {
	res.send('Hello, world!')
})

app.use(errorHandler)


module.exports = app