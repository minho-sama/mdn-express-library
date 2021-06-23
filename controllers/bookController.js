const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const async = require('async');
const { body,validationResult } = require('express-validator');


const index = function(req, res) { //doesn't support arrow functions
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
const book_list = (req, res, next) => {
    Book.find({}, 'title author') //returning only title and author (+_id and virtual)
        .populate('author') //replace author id with the all the author's info
        .exec((err, list_books) => { //exec is similar to "then" and "save"
            if (err) {return next(err)}
            res.render('book_list', {title: 'Book List', book_list: list_books})
        })
        //.then(result => res.render('book_list', {book_list: result})) stb...
};

// Display detail page for a specific book.
const book_detail = (req, res, next) => {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback)
        },
        book_instance: function(callback){
            BookInstance.find({'book': req.params.id}) //book-ot nem muszáj stringként
                .exec(callback)
        }
    }, function(err, results){
        if(err) return next(err)
        if(results.book == null){ //no reuslts
            const err = new Error('book not found')
            err.status = 404
            return next(err)
        }
        res.render('book_details', {title: results.book.title, book: results.book, book_instances: results.book_instance})
    })
};

// Display book create form on GET.
const book_create_get = (req, res, next) => {
    async.parallel({ //mivel selection taggel lehet majd kiválasztani a genret meg authort
        authors: function(callback) {
            Author.find(callback)
        },
        genres: function(callback){
            Genre.find(callback)
        }
    }, function(err, results){
        if(err) return next(err);
        res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres })
    })
};

// Handle book create on POST.
const book_create_post = [
    (req, res, next) => {
        console.log(req.body.genre)
        //converting checked genres to strings and create an array, for calling .*.escape()
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre === 'undefined'){
                req.body.genre = []
            }
            else{
                req.body.genre = new Array(req.body.genre)
            }
        }
            next() //mivan ha ezt nem írom ide, próbáld ki -> hát elég kurva bagy baj, meg fog akadni az oldal
    },
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    (req, res, next) => {
        const errors = validationResult(req)
        const book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            }
        );
        if(!errors.isEmpty()){
            async.parallel({
                authors: function (callback){
                    Author.find(callback)
                },
                genres: function(callback) {
                    Genre.find(callback)
                }
            }, function(err, results){
                if(err) return next(err)
                for (let i = 0; i < results.genres.length; i++){
                    if(book.genre.includes(results.genres[i]._id)){
                        results.genres[i].checked = 'true'
                    }
                }
                console.log(book.genre)
                console.log(results.genres)
                console.log(errors.array())
                res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()})
            });
            // return nemtomminek
        } else{
            book.save(function(err){
                if(err) return next(err)
                res.redirect(book.url)
            })
        }
    }
];

// Display book delete form on GET.
const book_delete_get = (req, res, next) => {
    //check for existing bookinstances
    //pass down book and list of instances as prop
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
                .populate('author')
                .exec(callback)
        },
        instances_of_book: function(callback){
            BookInstance.find({"book": req.params.id})
                .populate('book')
                .exec(callback)
        }
    }, (err, results) => {
        if(err) return next(err)
        res.render('book_delete', {title: 'Delete Book', book: results.book, instances_of_book: results.instances_of_book})
    })
};

// Handle book delete on POST.
const book_delete_post = (req, res, next) => {
    Book.findByIdAndRemove(req.body.bookid, (err) => {
        if(err) return next(err)
        res.redirect('/catalog/books')  
    }
)}

// Display book update form on GET. (update book ui)
const book_update_get = (req, res) => {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').populate('genre')
                .exec(callback)
        },
        authors: function(callback){
            Author.find(callback)
        },
        genres: function(callback){
            Genre.find(callback)
        }
    }, (err, results) => {
        if(err) return next(err)
        if(results.book === null){
            const err = new Error('Book not found')
            err.status = 404
            return next(err)
        } else{
            // Mark our selected genres as checked.
            for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
        }
    })
};

// Handle book update on POST.
const book_update_post = [
    //convert the genre to array for validation+sanitization
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre === "undefined"){
                req.body.genre = []
            } else{
                req.body.genre = new Array(req.body.genre)
            }
        }
        next()
    },
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    (req, res, next) => {
        const errors = validationResult(req)
        const book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id:req.params.id //This is required, or a new ID will be assigned!!!
            }
        )
        //azért ilyen bonyi, mert kényelmesek akarunk lenni és megmarad amit beírt a client. ha újra kell írnia akk sokkal egyszerűbb
        if(!errors.isEmpty()){
            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback){    
                    Author.find(callback)
                },
                genres: function(callback){
                    Genre.find(callback)
                }
            }, function(err, results){
                if(err) return next(err)
                for (let i = 0; i < results.genres.length; i++){
                    if(book.genre.includes(results.genres[i]._id)){
                        results.genres[i].checked = 'true'
                    }
                }
                res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()})
            })
        } else{
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook){
                if(err) return next(err)
                res.redirect(thebook.url)
            })
        }
    }

];

module.exports = {
    index,
    book_list,
    book_detail,
    book_create_get,
    book_create_post,
    book_delete_get,
    book_delete_post,
    book_update_get,
    book_update_post
}