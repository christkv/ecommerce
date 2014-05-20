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

/*
 * Show product
 */
exports.product = function(req, res) {
  // Get the product and the category
  Product.findOne(req.params.id, function(err, product) {
    if(err) throw err;

    // Locate the product category root
    Category.findByCategory(product.category, function(err, category) {
      if(err) throw err;

      // Locate Path by category
      Category.findChildrenOf(category.name, function(err, path) {
        if(err) throw err;

        // Render the product list
        res.render('product', { 
            product: product 
          , path: path
          , moment: moment
        });
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