const Author = require('../models/author');

const async = require('async');
const Book = require('../models/book');

const {body, validationResult} = require('express-validator');
const bookinstance = require('../models/bookinstance');

// Display list of all Authors.
const author_list = (req, res, next) => {
    Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) { return next(err); }
      res.render('author_list', { title: 'Author List', author_list: list_authors });
    });
        //   .then(result=> {
        //       res.render('author_list', {title: 'Authors', author_list: result})
        //   })
};

// Display detail page for a specific Author.
const author_detail = (req, res, next) => {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                  .exec(callback)
        },
        author_books: function(callback){
            Book.find({author: req.params.id}, 'title summary')
                .exec(callback)
        }
    }, function(err, results) {
        if(err) return next(err)
        if(results.author == null){
            const err = new Error('author not found')
            err.status = 404
            return next(err)
        }
        res.render('author_details', {title: 'Author Details', author: results.author, author_books: results.author_books})
    })
};

// Display Author create form on GET.
const author_create_get = (req, res) => {
    res.render('author_form', {title: 'Create Author'})
};

// Handle Author create on POST.
const author_create_post = [
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-aplhanumeric characters'),
        body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

    //process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()})
        } else{
            const author = new Author( 
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            )
            author.save(function(err) {
                if(err) return next(err) //itt propagetel az error.pugra
                res.redirect(author.url)
            })
        }

    }
];

// Display Author delete form on GET.
const author_delete_get = (req, res, next) => {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        author_books: function(callback){
            Book.find({author: req.params.id}).exec(callback)
        }
    }, function(err, results){
        if(err) return next(err)
        if(results.author === null){
            res.redirect('catalog/authors')
        }
        res.render('author_delete', {title: 'Author delete', author: results.author, author_books: results.author_books})
    })
};

// Handle Author delete on POST.
const author_delete_post = (req, res, next) => {
    console.log(req.body)
    console.log(req.body.authorid)
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid) //this is a hidden input!
                  .exec(callback)
        },
        author_books: function(callback){
            Book.find({'author': req.body.authorid})
                .exec(callback)
        }
    }, function(err, results){
        if(err) return next(err)
        if(results.author_books.length > 0){
            res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.author_books})
        } else{
            Author.findByIdAndRemove(req.body.authorid, (err) => {
                if(err) return next(err)
                res.redirect('/catalog/authors')
            })
        }
    })
};

// Display Author update form on GET.
const author_update_get = (req, res) => {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
const author_update_post = (req, res) => {
    res.send('NOT IMPLEMENTED: Author update POST');
};

module.exports = {
    author_list,
    author_detail,
    author_create_get,
    author_create_post,
    author_delete_get,
    author_delete_post,
    author_update_get,
    author_update_post
}