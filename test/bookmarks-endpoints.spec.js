const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {
	let db

	before('make knex instance', () => {
	    db = knex({
	      client: 'pg',
	      connection: process.env.TEST_DB_URL,
	    })
	    app.set('db', db)
	})

	before('clean the table', () => db('bookmarks').truncate())

	afterEach('cleanup', () => db('bookmarks').truncate())

	after('disconnect from db', () => db.destroy())

	context('Given there are bookmarks in the database', () => {	

		const testBookmarks = makeBookmarksArray()

		beforeEach('insert bookmarks', () => {
			return db
				.into('bookmarks')
				.insert(testBookmarks)
		})

		it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
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

	describe.only(`POST /bookmarks`, () => {
		it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
			return supertest(app)
				.post('./bookmarks')
				.send({
					title: 'new bookmark title',
					URL: 'https//:www.newbookmak.com',
					description: 'Newest bookmark description. So much description',
					rating: '3.4'
				})
			.expect(201)
		})
	})


})


