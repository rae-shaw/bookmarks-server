const BookmarksService = {
	getAllBookmarks(knex) {
		return knex.select('*').from('bookmarks_test')
	},
	insertBookmark(knex, newBookmark) {
		return knex
			.insert(newBookmark)
			.into('bookmarks_test')
			.returning('*')
			.then(rows => {
				return rows[0]
			})
	},
	getById(knex, id) {
		return knex.from('bookmarks_test').select('*').where({ id }).first()
		// return "foo"
	},
	deleteArticle(knex, id) {
		return knex('bookmarks_test')
			.where({ id })
			.delete()
	},
	updateArticle(knex, id, newBookmarkFields) {
		return knex('bookmarks_test')
			.where({ id })
			.update(newBookmarkFields)
	},
}

module.exports = BookmarksService