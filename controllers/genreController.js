const Genre = require('../models/genre'); 

const Book = require('../models/book');
const async = require('async');

const {body, validationResult} = require('express-validator');
const genre = require('../models/genre');

// Display list of all Genre.
const genre_list = (req, res, next) => {
    Genre.find()
         .sort([['name', 'ascending']])
         .exec((err, genre_list) => {
            if (err) return next(err)
            res.render('genre_list', {title: 'Genre List', genre_list})
         })
};

// Display detail page for a specific Genre.
const genre_detail = (req, res, next) => {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id)
                 .exec(callback)
        },
        genre_books: function(callback){
            Book.find({'genre': req.params.id})
                .exec(callback)
        },  
    }, function(err, results){
        if(err) {return next(err)}
        if(results.genre == null) { //no results
            const err = new Error('Genre not found')
            err.status = 404
            return next(err) //propagates to error handling code -> not found page
        }
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books})
    }
    )
};

// Display Genre create form on GET.
const genre_create_get = (req, res) => {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
const genre_create_post = [ // an ARRAY of middleware functions
    //validate and sanitize name field (2nd param: error message)
    body('name', 'Genre name required').trim().isLength({min:1}).escape(),
    //Process request after validation and sanitization
    (req, res, next) => {
        //extranct the validation errors from request
        const errors = validationResult(req) //creates an array from the errors, errror msg in: errors.[i].msg

        //create a genre object with escapes and trimmed data
        const genre = new Genre(
            {name: req.body.name}
        )
        if(!errors.isEmpty()){
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', 
                                       genre: genre, 
                                       errors: errors.array()});
        } else{
            //Data form is valid
            //check if genre already exists
            Genre.findOne({'name': req.body.name})
                 .exec((err, found_genre) => {
                     if(err) return next(err)
                     if(found_genre){
                         //genre exists, redirect to its detail page
                         res.redirect(found_genre.url)
                     } else{
                         genre.save(function(err){
                             if(err) return next(err)
                             //Genre saved. redirect ti genre detail page
                             res.redirect(genre.url)
                         })
                     }
                 })
        }
    }
];

// Display Genre delete form on GET.
const genre_delete_get = (req, res, next) => {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback){
            Book.find({genre: req.params.id}).exec(callback) //lol even it's an array, I dont have to loop through it (i guess mongoose handles it for me)
        }
    }, function(err, results){
        if(err) return next(err)
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } )
    })
};
 
// Handle Genre delete on POST.
const genre_delete_post = (req, res) => {
    Genre.findByIdAndRemove(req.body.genreid, (err) => {
        res.redirect('/catalog/genres')
    }
)};

// Display Genre update form on GET.
const genre_update_get = (req, res, next) => {
    Genre.findById(req.params.id)
        .exec((err, genre) => {
            if(err) return next(err)
            res.render('genre_form', {title: 'Update Genre', genre: genre})
        })
};

// Handle Genre update on POST.
const genre_update_post = [
    body('name', 'Genre name required').trim().isLength({min:1}).escape(),
    (req, res, next) => {
        const errors = validationResult(req)
        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        })
        if(!errors.isEmpty()){
            res.render('genre_form', {title: 'Update Genre', errors: errors.array(), genre:genre})
        } else{
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, updatedGenre){
                if(err) return next(err)
                res.redirect(genre.url)
            })
        }

    }
];

module.exports = {
    genre_list,
    genre_detail,
    genre_create_get,
    genre_create_post,
    genre_delete_get,
    genre_delete_post,
    genre_update_get,
    genre_update_post
}
