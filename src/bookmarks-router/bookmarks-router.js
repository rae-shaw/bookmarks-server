const express = require('express')
const uuid = require('uuid/v4')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
//const store = require('../store')
const BookmarksService = require('../bookmarks-service')


const bookmarksRouter = express.Router()
const bodyParser = express.json()
const serializeBookmark = bookmark => ({
  	id: bookmark.id,
  	title: bookmark.title,
  	url: bookmark.url,
  	description: bookmark.description,
  	rating: bookmark.rating,
})

bookmarksRouter
	.route('/bookmarks')
	.get((req, res, next) => {
		const knexInstance = req.app.get('db')
		BookmarksService.getAllBookmarks(knexInstance)
			.then(bookmarks => {
				res.json(bookmarks)
		})
		.catch(next)
	})

	.post(bodyParser, (req, res, next) => {
		for (const field of ['title', 'url', 'rating']) {
			if (!req.body[field]) {
				logger.error(`${field} is required`)
				return res.status(400).send(`'${field}' is required`)
			}
		}
		const { title, url, description, rating } = req.body

		if (!Number(rating) || rating < 0 || rating > 5) {
			logger.error(`Invalid rating '${rating}' supplied`)
			return res.status(400).send(`'rating' must be a number between 0 and 5`)
		}
		if (!isWebUri(url)) {
			logger.error(`Invalid url '${url}' supplied`)
			return res.status(400).send(`'url' must be a valid URL`)
		}
		const newBookmark = { title, url, description, rating }

	    BookmarksService.insertBookmark(
	      req.app.get('db'),
	      newBookmark
	    )
	      .then(bookmark => {
	        logger.info(`Bookmark with id ${bookmark.id} created.`)
	        res
	          .status(201)
	          .location(`/bookmarks/${bookmark.id}`)
	          .json(serializeBookmark(bookmark))
	      })
	      .catch(next)
	})


bookmarksRouter
	.route('/bookmarks/:id')
	.get((req, res, next) => {
		const knexInstance = req.app.get('db')
		BookmarksService.getById(req.app.get('db'), req.params.bookmark_id)
			.then(bookmark => {
				if (!bookmark) {
					logger.error(`Bookmark with id ${id} not found.`);
					return res
						.status(404)
						.send('Bookmark Not Found');
				}
			res.json(bookmark);
		})
		.catch(next)
	})

	.delete((req, res) => {
		const { id } = req.params;

		const bookmarkIndex = store.bookmarks.findIndex(c => c.id == id);

		if (bookmarkIndex === -1) {
			logger.error(`Bookmark with id ${id} not found.`);
			return res
				.status(404)
				.send('Not found');
		}
	res
		.status(204)
		.end();
	})

module.exports = bookmarksRouter