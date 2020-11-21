const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const bookmarks = require('../store');

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
    })
    .post(bodyParser, (req, res) => {
        const { description, rating, title, url } = req.body;

        if (!description) {
            logger.error(`Description is required`);
            return res
              .status(400)
              .send('Invalid data');
        }
    
        if (!rating) {
            logger.error(`Rating is required`);
            return res
              .status(400)
              .send('Invalid data');
        }
          
        if (!title) {
            logger.error(`Title is required`);
            return res
              .status(400)
              .send('Invalid data');
        }
    
        if (!url) {
            logger.error(`URL is required`);
            return res
              .status(400)
              .send('Invalid data');
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
    .get((req, res) => {
        const { id } = req.params;
        const bookmark = bookmarks.bookmarks.find(bookmark => bookmark.id == id);
    
        //make sure we found a card
        if (!bookmark) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
                .status(404)
                .send('Bookmark not found.')
        }
    
        res.json(bookmark);
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