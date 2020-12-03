const { expect } = require ('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { destroy } = require('../src/logger');
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks endpoints', function () {
    let db;

    before('make next instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`GET /bookmarks`, () => {
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
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        })
        
        context(`Given there are no bookmarks`, () => {
            it (`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })
    })

    describe(`GET /bookmarks/bookmark_id`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
    
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('GET /bookmarks/:bookmark_id responds with 200 and that bookmark', () => {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const evilBookmark = {
                id: 911,
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                url: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: 1
            }
            beforeEach('insert evil bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([evilBookmark])
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${evilBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.url).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
        })

        context('Given the database is empty', () => {
            it ('response with 404', () => {
                const bookmarkId = 1234;
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })
    })
    describe(`POST /bookmarks`, () => {
        context(`Given an XSS attack bookmark`, () => {
            const evilBookmark = {
                id: 911,
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                url: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: 1
            }
            it('removes XSS attack content', () => {
                return supertest(app)
                .post(`/bookmarks`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(evilBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body.url).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                })
            })
        })
        it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'www.test.com',
                description: 'Test new bookmark description',
                rating: 1
            }
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)
                )
        })
        it(`responds with 400 and an error message when the 'title' is missing`, () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    url: 'www.test.com',
                    description: 'Test new bookmark description',
                    rating: 1
                })
                .expect(400, {
                    error: {message: `Missing 'title' in request`}
                })
        })
        it(`responds with 400 and an error message when the 'url' is missing`, () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test new bookmark',
                    description: 'Test new bookmark description',
                    rating: 1
                })
                .expect(400, {
                    error: {message: `Missing 'url' in request`}
                })
        })
        it(`responds with 400 and an error message when the 'description' is missing`, () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test new bookmark',
                    url: 'www.test.com',
                    rating: 1
                })
                .expect(400, {
                    error: {message: `Missing 'description' in request`}
                })
        })
        it(`responds with 400 and an error message when the 'rating' is missing`, () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test new bookmark',
                    url: 'www.test.com',
                    description: 'Test new bookmark description',
                })
                .expect(400, {
                    error: {message: `Missing 'rating' in request`}
                })
        })
        it(`responds with 400 and an error message when 'rating' is between 1 and 5`, () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test new bookmark',
                    url: 'www.test.com',
                    description: 'Test new bookmark description',
                    rating: 100
                })
                .expect(400, {
                    error: {message: `Rating must be a number between 1 and 5`}
                })
        })
        it(`responds with 400 and an error message when 'rating' is not a number`, () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test new bookmark',
                    url: 'www.test.com',
                    description: 'Test new bookmark description',
                    rating: 'potato'
                })
                .expect(400, {
                    error: {message: `Rating must be a number between 1 and 5`}
                })
        })
    })
    describe(`DELETE /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 1234543
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/bookmarks`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks)
                    })
            })
        })
    })
})