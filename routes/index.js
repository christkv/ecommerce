var Product = require('../models/product')()
  , Category = require('../models/category')();

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
    Product.topProducts({limit: 12}, function(err, products) {
      if(err) throw err;
      
      // Render the product list
      res.render('index', { 
          title: 'Express'
        , products: products 
        , path: path
      });
    });
  });
}