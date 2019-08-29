const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {
	let db

	before('make knex instance', () => {
	    db = knex({
	      client: 'pg',
	      connection: process.env.TEST_DB_URL,
	    })
	    app.set('db', db)
	})

	after('disconnect from db', () => db.destroy())

	before('clean the table', () => db('bookmarks').truncate())

	afterEach('cleanup', () => db('bookmarks').truncate())

	context('Given there are bookmarkss in the database', () => {	

		const testBookmarks = makeBookmarksArray()

		beforeEach('insert bookmarks', () => {
			return db
				.into('bookmarks')
				.insert(testBookmarks)
		})

		it('GET /bookmarks responds with 200 and all of the bookmarkss', () => {
			return supertest(app)
				.get('/bookmarks')
				.expect(200, testBookmarks)
				 // TODO: add more assertions about the body
		})

		it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
			const bookmarkId = 2
			const expectedBookmark = testBookmarks[bookmarkId - 1]
			return supertest(app)
				.get(`/bookmarks/${bookmarkId}`)
				.expect(200, expectedBookmark)
		})
	})

})