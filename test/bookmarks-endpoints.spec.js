const { expect, assert } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')



describe('Bookmarks Endpoints', function() {
	let db

	before('make knex instance', () => {
	    db = knex({
	      	client: 'pg',
	      	connection: process.env.TEST_DB_URL
	    })
	    app.set('db', db)
	})

	before('clean the table', () => db('bookmarks_test').truncate())

	afterEach('cleanup', () => db('bookmarks_test').truncate())

	after('disconnect from db', () => db.destroy())

	describe('GET /bookmarks', () => {
	    context(`Given no bookmarks`, () => {
	      it(`responds with 200 and an empty list`, () => {
	        return supertest(app)
	          .get('/bookmarks')
	          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	          .expect(200, [])
	      })
	    })

		context('Given there are bookmarks in the database', () => {	
			const testBookmarks = makeBookmarksArray()

			beforeEach('insert bookmarks', () => {
				return db
					.into('bookmarks_test')
					.insert(testBookmarks)
			})

			it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
				return supertest(app)
					.get('/bookmarks')
					.expect(200, testBookmarks)
					 // TODO: add more assertions about the body
			})
		})
	})

	describe('GET /bookmarks/:id', () => {
	    context(`Given no bookmarks`, () => {
	      it(`responds 404 whe bookmark doesn't exist`, () => {
	        return supertest(app)
	          .get(`/bookmarks/123`)
	          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	          .expect(404, {
	            error: { message: `Bookmark Not Found` }
	          })
	      })
	    })

	    context('Given there are bookmarks in the database', () => {
	      const testBookmarks = makeBookmarksArray()


			it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
				const bookmarkId = 2
				const expectedBookmark = testBookmarks[bookmarkId - 1]
				return supertest(app)
					.get(`/bookmarks/${bookmarkId}`)
					.expect(200, expectedBookmark)
			})
		})
	})

	describe.only('POST /bookmarks', () => {
		it('creates a bookmark, responding with 201 and the new bookmark', function() {
			const newBookmark = {
				title: 'new bookmark title',
				url: 'https://newbookmark.com',
				description: 'Newest bookmark description. So much description',
				rating: 2.5
			}
			return supertest(app)
				.post('/bookmarks')
				.send(newBookmark)
				.expect(201)
				.expect(res => {
					console.log(typeof(res.body.rating))
					expect(res.body.title).to.eql(newBookmark.title)
					expect(res.body.url).to.eql(newBookmark.url)
					expect(res.body.description).to.eql(newBookmark.description)
					expect(res.body.rating).to.equal(String(newBookmark.rating))
					expect(res.body).to.have.property('id')
				})
				.then(res =>
					supertest(app)
					.get(`/bookmarks/${res.body.id}`)
					.expect(res.body)
				)
		})
	})


})



