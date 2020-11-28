const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
// const bookmarks = require('../store');
const BookmarksService = require('../bookmarks-service.js')



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
    .post(bodyParser, (req, res) => {
        const { description, rating, title, url } = req.body;

        if (!description) {
            logger.error(`Description is required`);
            return res
              .status(400)
              .send('Description field missing.');
        }
    
        if (!rating) {
            logger.error(`Rating is required`);
            return res
              .status(400)
              .send('Rating field missing.');
        }
          
        if (!title) {
            logger.error(`Title is required`);
            return res
              .status(400)
              .send('Title field missing.');
        }
    
        if (!url) {
            logger.error(`URL is required`);
            return res
              .status(400)
              .send('URL field missing.');
        }
    
        // get an id
        const id = uuid();
    
        const bookmark = {
            description,
            id,
            rating,
            title,
            url
        };
    
        bookmarks.bookmarks.push(bookmark);
    
        logger.info(`Bookmark with id ${id} created`);
    
        res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json('Bookmark created.');
    })

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res, next) => {
        const { id } = req.params;
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, id)
            .then(bookmark => {
                if(!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.json(bookmark)
            })
            .catch(next)
    })
    .delete((req, res) => {
        const {id} = req.params;

        const bookmarksIndex = bookmarks.bookmarks.findIndex(li => li.id == id);
    
        if(bookmarksIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
                .status(404)
                .send('Not found.')
        }
        
        bookmarks.bookmarks.splice(bookmarksIndex, 1);
    
        logger.info(`Bookmark with id ${id} deleted.`);
        res
            .status(204)
            .end();
    })

    module.exports = bookmarksRouter