var Category = require('../models/category')()
  , moment = require('moment');

/*
 * List all the Categories
 */
exports.index = function index(req, res) {
  // Get All the categories
  Category.all(function(err, categories) {
    if(err) throw err;

    // Render the product list
    res.render('./category/index', { 
      categories: categories
    });
  });
}

/*
 * Remove a specific category
 */
exports.remove = function remove(req, res) {
  var id = req.body.id;
  // Remove the category
  Category.remove(id, function(err, result) {
    exports.index(req, res);
  });
}

/*
 * Show the add category form
 */
exports.add = function add(req, res) {
  res.render('./category/add', {
      fields: {}
    , errors: {}
  });  
}

/*
 * Add a category
 */
exports.addCategory = function addCategory(req, res) {
  Category.create(req.body, function(errors, result) {
    if(errors) {
      // Get All the categories
      Category.all(function(err, categories) {
        if(err) throw err;
        // Render the product list
        res.render('./category/add', { 
            fields: req.body
          , errors: errors
        });
      });
    } else {
      exports.index(req, res);
    }
  });
}