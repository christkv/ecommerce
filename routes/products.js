var Product = require('../models/product')()
  , Category = require('../models/category')()
  , moment = require('moment');

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
        res.render('product/product', { 
            product: product 
          , path: path
          , moment: moment
        });
      });
    });  
  });
}

exports.index = function(req, res) {
  var limit = req.query.limit || 15;
  var skip = req.query.skip || 0;
  // Convert limit and skip to integers
  limit = parseInt(limit, 10);
  skip = parseInt(skip, 10);

  // Get All the categories
  Product.all({limit:limit, skip:skip}, function(err, products) {
    if(err) throw err;
    // Render the product list
    res.render('./product/index', { 
        products: products
      , skip: skip + limit
      , limit: limit
    });
  });
}

exports.remove = function(req, res) {
}

exports.add = function(req, res) {
  res.render('./product/add', {
      fields: {}
    , errors: {}
  });  
}

exports.addProduct = function(req, res) {
}
