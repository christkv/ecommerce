var Product = require('../models/product')();

/*
 * List the top 10 products
 */
exports.index = function(req, res) {
	Product.topProducts({limit: 12}, function(err, products) {
		if(err) throw err;
		
		// Render the product list
  	res.render('index', { 
  			title: 'Express'
  		, products: products });
	})
}