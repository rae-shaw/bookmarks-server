const BookmarksService = {
	getAllBookmarks(knex) {
		return knex.select('*').from('bookmarks')
	},
	insertArticle(knex, newBookmark) {
		return knex
			.insert(newBookmark)
			.into('bookmarks')
			.returning('*')
			.then(rows => {
				return rows[0]
			})
	},
	getById(knex, id) {
		return knex.from('bookmarks').select('*').where('id', id).first()
	},
	deleteArticle(knex, id) {
		return knex('bookmarks')
			.where({ id })
			.delete()
	},
	updateArticle(knex, id, newBookmarkFields) {
		return knex('bookmarks')
			.where({ id })
			.update(newBookmarkFields)
	},
}

module.exports = BookmarksService