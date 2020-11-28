const { expect } = require("chai")
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const BookmarksService = require('../src/bookmarks-service')
const bookmarksRouter = require("../src/bookmarks/bookmarks-router")
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe(`Bookmarks service object`, function() {
    let db;

    let testBookmarks = makeBookmarksArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
    })

    before(() => db('bookmarks').truncate())

    afterEach(() => db('bookmarks').truncate())

    after(() => db.destroy())


    context(`Given 'bookmarks' has data`, () => {
        beforeEach(() => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })
        it(`getAllArticles() resolves all articles from 'bookmarks' table`, () => {
            return BookmarksService.getAllBookmarks(db)
                .then(actual => {
                    expect(actual).to.eql(testBookmarks)
                })
        })
        it(`getById() resolves an bookmark by id from 'bookmarks'`, () => {
            const thirdId = 3;
            const thirdTestBookmark = testBookmarks[thirdId - 1];
            return BookmarksService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        title: thirdTestBookmark.title,
                        url: thirdTestBookmark.url,
                        description: thirdTestBookmark.description,
                        rating: thirdTestBookmark.rating
                    })
                })
        })
        it(`deleteBookmark() removes a bookmark by id from 'bookmarks`, () => {
            const bookmarkId = 3;
            return BookmarksService.deleteBookmark(db, bookmarkId)
                .then(() => BookmarksService.getAllBookmarks(db))
                .then(allBookmarks => {
                    const expected = testBookmarks.filter(bookmark => bookmark.id !== bookmarkId)
                    expect(allBookmarks).to.eql(expected)
                })
        })
        it(`updateBookmark() updates a bookmark from the 'bookmarks' table`, () => {
            const idOfBookmarkToUpdate = 3;
            const newBookmarkData = {
                title: 'Updated Title',
                url: 'www.updated.com',
                description: 'Gee howdy, I was updated so much!',
                rating: 5
            }
            return BookmarksService.updateBookmark(db, idOfBookmarkToUpdate, newBookmarkData)
                .then(() => BookmarksService.getById(db, idOfBookmarkToUpdate))
                .then(bookmark => {
                    expect(bookmark).to.eql({
                        id: idOfBookmarkToUpdate,
                        ...newBookmarkData
                    })
                })
        })
    })

    context(`Given 'bookmarks' has no data`, () => {
        it(`getAllArticles() resolves an empty array`, () => {
            return BookmarksService.getAllBookmarks(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })
        it(`insertBookmark() inserts a new bookmark and resolves the new bookmark with an id`, () => {
            const newBookmark = {
                title: 'Test new title',
                url: 'www.example.com',
                description: 'Testing testing 1 2 3',
                rating: 1
            }
            return BookmarksService.insertBookmark(db, newBookmark)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        title: 'Test new title',
                        url: 'www.example.com',
                        description: 'Testing testing 1 2 3',
                        rating: 1
                    })
                })
        })
    })
})