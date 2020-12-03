const express = require('express');
const xss = require('xss')
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
// const bookmarks = require('../store');
const BookmarksService = require('../bookmarks-service.js')
const jsonParser = express.json()


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
    .post(jsonParser, (req, res, next) => {
        const {title, url, description, rating} = req.body
        const newBookmark = {title, url, description, rating}

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request` }
                })
            }
        }

        if (rating !== (1 || 2 || 3 || 4 || 5)) {
            return res.status(400).json({
                error: {message: `Rating must be a number between 1 and 5`}
            })
        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`)
                    .json({
                        id: bookmark.id,
                        title: xss(bookmark.title),
                        url: xss(bookmark.url),
                        description: xss(bookmark.description),
                        rating: bookmark.rating
                    })
            })
            .catch(next)
    })

bookmarksRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
        const { id } = req.params;
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, id)
            .then(bookmark => {
                if(!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.bookmark = bookmark //save the bookmark for next middleware
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.bookmark.id,
            title: xss(res.bookmark.title),
            url: xss(res.bookmark.url),
            description: xss(res.bookmark.description),
            rating: res.bookmark.rating
        })
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

    module.exports = bookmarksRouter