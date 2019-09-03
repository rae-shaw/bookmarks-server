const { expect, assert } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./bookmarks.fixtures')


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
			const testBookmarks = fixtures.makeBookmarksArray()

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
	      const testBookmarks = fixtures.makeBookmarksArray()


			it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
				const bookmarkId = 2
				const expectedBookmark = testBookmarks[bookmarkId - 1]
				return supertest(app)
					.get(`/bookmarks/${bookmarkId}`)
					.expect(200, expectedBookmark)
			})
		})

		context(`Given an XSS attack bookmark`, () => {
      		const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()

      		beforeEach('insert malicious bookmark', () => {
        		return db
          			.into('bookmarks_test')
          			.insert([maliciousBookmark])
      			})

      		it('removes XSS attack content', () => {
        		return supertest(app)
          			.get(`/bookmarks/${maliciousBookmark.id}`)
          			.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
         			.expect(200)
          			.expect(res => {
            			expect(res.body.title).to.eql(expectedBookmark.title)
           				expect(res.body.description).to.eql(expectedBookmark.description)
          				})
      		})
    	})
  })

	describe('POST /bookmarks', () => {
		it(`responds with 400 missing 'title' if not supplied`, () => {
		   	const newBookmarkMissingTitle = {
		   		// title: 'test-title',
		   		url: 'https://test.com',
		    	rating: 1,
		    }
		    return supertest(app)
		    	.post(`/bookmarks`)
		        .send(newBookmarkMissingTitle)
		        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
		        .expect(400, {
		        	error: { message: `'title' is required` }
		        })
		})
		it(`responds with 400 missing 'url' if not supplied`, () => {
	    	const newBookmarkMissingUrl = {
	        	title: 'test-title',
	       	 	// url: 'https://test.com',
	        	rating: 1,
	      	}
	      	return supertest(app)
	        	.post(`/bookmarks`)
	        	.send(newBookmarkMissingUrl)
	        	.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	        	.expect(400, {
	         	 	error: { message: `'url' is required` }
	        	})
	    })
		it(`responds with 400 missing 'rating' if not supplied`, () => {
	    	const newBookmarkMissingRating = {
	        	title: 'test-title',
	        	url: 'https://test.com',
	        	// rating: 1,
	      	}
	      	return supertest(app)
	        	.post(`/bookmarks`)
	        	.send(newBookmarkMissingRating)
	        	.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	        	.expect(400, {
	          		error: { message: `'rating' is required` }
	        })
	    })
	    it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
	      	const newBookmarkInvalidRating = {
	        	title: 'test-title',
	        	url: 'https://test.com',
	        	rating: 'invalid',
	     	 }
	      	return supertest(app)
	        	.post(`/bookmarks`)
	        	.send(newBookmarkInvalidRating)
	        	.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	        	.expect(400, {
	          	error: { message: `'rating' must be a number between 0 and 5` }
	        })
	    })
	    it(`responds with 400 invalid 'url' if not a valid URL`, () => {
	    	const newBookmarkInvalidUrl = {
	        	title: 'test-title',
	        	url: 'htp://invalid-url',
	       		rating: 1,
	      	}
	      	return supertest(app)
	        	.post(`/bookmarks`)
	        	.send(newBookmarkInvalidUrl)
	        	.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	        	.expect(400, {
	          	error: { message: `'url' must be a valid URL` }
	        })
	    })


		it('creates a bookmark, responding with 201 and the new bookmark', function() {
			const newBookmark = {
				title: 'new bookmark title',
				url: 'https://newbookmark.com',
				description: 'Newest bookmark description. So much description',
				rating: 2.5,
			}
			return supertest(app)
				.post('/bookmarks')
				.send(newBookmark)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.expect(201)
				.expect(res => {
					expect(res.body.title).to.eql(newBookmark.title)
					expect(res.body.url).to.eql(newBookmark.url)
					expect(res.body.description).to.eql(newBookmark.description)
					expect(res.body.rating).to.equal(String(newBookmark.rating))
					expect(res.body).to.have.property('id')
					expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
				})
				.then(res =>
					supertest(app)
					.get(`/bookmarks/${res.body.id}`)
					.expect(res.body)
				)
		})
	})

	describe('DELETE /bookmarks/:id', () => {
	    context(`Given no bookmarks`, () => {
	      	it(`responds 404 whe bookmark doesn't exist`, () => {
	        	return supertest(app)
	          	.delete(`/bookmarks/123`)
	          	.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	          	.expect(404, {
	            	error: { message: `Bookmark Not Found` }
	          	})
	      	})
	    })

	    context('Given there are bookmarks in the database', () => {
	      	const testBookmarks = fixtures.makeBookmarksArray()

	      	beforeEach('insert bookmarks', () => {
	        	return db
	          	.into('bookmarks_test')
	          	.insert(testBookmarks)
	      	})

	      	it('removes the bookmark by ID from the store', () => {
	        	const idToRemove = 2
	        	const expectedBookmarks = testBookmarks.filter(bm => bm.id !== idToRemove)
	        	return supertest(app)
	          		.delete(`/bookmarks/${idToRemove}`)
	          		.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	          		.expect(204)
	          		.then(() =>
	            	supertest(app)
	              		.get(`/bookmarks`)
	              		.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
	              		.expect(expectedBookmarks)
	        		)
      		})
    	})
  })



})



