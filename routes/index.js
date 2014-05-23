var Category = require('../models/category')()
  , Product = require('../models/product')()
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

    // Get the top 12 items
    Product.topProducts({limit: 12, category: path.root.category}, function(err, products) {
      if(err) throw err;
      
      // Render the product list
      res.render('index', { 
          products: products 
        , path: path
      });
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