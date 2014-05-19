var Product = require('../models/product')()
  , Category = require('../models/category')()
  , Cart = require('../models/cart')()
  , moment = require('moment');

/*
 * List the top 10 products
 */
exports.index = function(req, res) {
  // Category root
  var root = req.params.category || '/';
  // Get the top level categories
  Category.findChildrenOf(root, function(err, path) {
    if(err) throw err;

    // Render the product list
    res.render('index', { 
      path: path
    });
  });
}

//
// Fetch All navigational information
var fetchNavigational = function(req, res, callback) {
  // Category root
  var root = req.params.category || '/';
  // Get the top level categories
  Category.findChildrenOf(root, function(err, path) {
    if(err) return callback(err, null);
    callback(null, { path: path });
  });
}