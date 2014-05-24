var Cart = require('../models/cart')();

/*
 * List all the Categories
 */
exports.index = function index(req, res) {
  // Render the product list
  res.render('./cart/index', { 
    cart: {items: [{
        _id: 1
      , title: 'Dog toy'
      , price: 1000
      , quantity: 2
    }]}
  });
}
