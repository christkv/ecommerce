var Product = require('../models/product')()
  , Category = require('../models/category')()
  , Inventory = require('../models/inventory')()
  , moment = require('moment');

/*
 * Show product
 */
exports.product = function(req, res) {
  // Get the product and the category
  Product.findOneById(req.params.id, function(err, product) {
    if(err) throw err;

    // Locate the inventory
    Inventory.findByProductId(product._id, function(err, inventory) {
      if(err) throw err;

      // Locate the product category root
      Category.findByCategory(product.category, function(err, category) {
        if(err) throw err;

        // Locate Path by category
        Category.findChildrenOf(category.category, function(err, path) {
          if(err) throw err;

          // Render the product list
          res.render('product/product', { 
              product: product 
            , path: path
            , inventory: inventory
            , moment: moment
            , error: req.params.error
          });
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
  Product.remove(req.body.id, function(err, result) {
    if(err) throw err;
    // Render the product list
    exports.index(req, res);
  });
}

exports.add = function(req, res) {
  res.render('./product/add', {
      fields: {}
    , errors: {}
  });  
}

exports.addProduct = function(req, res) {
  Product.create(req.body, function(errors, result) {
    if(errors) {
      // Get All the categories
      Product.all(function(err, categories) {
        if(err) throw err;
        // Render the product list
        res.render('./product/add', { 
            fields: req.body
          , errors: errors
        });
      });
    } else {
      exports.index(req, res);
    }
  });
}
