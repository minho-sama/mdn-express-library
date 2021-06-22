const BookInstance = require('../models/bookinstance');
const {body, validationResult} = require('express-validator')
const Book = require('../models/book');
const bookinstance = require('../models/bookinstance');
// Display list of all BookInstances.
const bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if (err) {return next(err)}
            res.render('bookinstance_list', {title: "Book Instance List", bookinstance_list: list_bookinstances})
        })
        // .then(result => res.render('bookinstance_list', {title: "Book Instance List", bookinstance_list: result}))
        //SAME
};

// Display detail page for a specific BookInstance.
const bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
                .populate('book')
                .exec((err, bookinstance)=> {
                    if(err) return next(err)
                    if(bookinstance == null){
                        const err = new Error('Book copy not found')
                        err.status = 404
                        return next(err)
                    }
                    res.render('bookinstance_detail', {title: `Copy: ${bookinstance.book.title}`, bookinstance})
                })
};

// Display BookInstance create form on GET.
const bookinstance_create_get = (req, res, next) => {
    Book.find({}, 'title')
        .exec((err, books) => {
            if(err) return next(err)
            res.render('bookinstance_form', {title: 'Create Bookinstance', book_list: books})
        })
};

// Handle BookInstance create on POST.
const bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req)
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        })
        if(!errors.isEmpty()){
            Book.find({}, 'title')
                .exec((err, books) => {
                    if(err) return next(err)
                    console.log(bookinstance.book)
                    console.log(books)
                    res.render('bookinstance_form', {title: 'Create bookinstance', book_list: books, selected_book: bookinstance.book_id, errors: errors.array(), bookinstance})
                })
                // return
        } else{
            bookinstance.save(function(err){
                if(err) return next(err)
                res.redirect(bookinstance.url)
            })
        }
    }
];

// Display BookInstance delete form on GET.
const bookinstance_delete_get = (req, res) => {
    res.send('NOT IMPLEMENTED: BookInstance delete GET');
};

// Handle BookInstance delete on POST.
const bookinstance_delete_post = (req, res) => {
    res.send('NOT IMPLEMENTED: BookInstance delete POST');
};

// Display BookInstance update form on GET.
const bookinstance_update_get = (req, res) => {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST.
const bookinstance_update_post = (req, res) => {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};

module.exports = {
    bookinstance_list,
    bookinstance_detail,
    bookinstance_create_get,
    bookinstance_create_post,
    bookinstance_delete_get,
    bookinstance_delete_post,
    bookinstance_update_get,
    bookinstance_update_post
}