var Cart = require('../models/cart')()
  , product_routes = require('./products');

/*
 * List all Items in the Cart
 */
exports.index = function index(req, res) {
  // Get a cart
  createOrRetrieveCart(req.session.cartId, function(err, cart) {
    // Render the product list
    res.render('./cart/index', { 
      cart: cart
    });
  });
}

/*
 * Create or retrieve cart
 */
var createOrRetrieveCart = function createOrRetrieveCart(id, callback) {
  if(id == null) {
    // No cart associated with session yet
    Cart.create(callback);
  } else {
    // Attempt to locate the cart and create a new one if there is none
    Cart.findByHexId(id, function(err, cart) {
      if(err) return callback(err);
      if(cart == null) return Cart.create(callback);
      callback(null, cart);
    });
  }
}

/*
 * Adding an Item to the Cart
 */
exports.add = function add(req, res) {
  // Product id
  var id = req.body.id;
  var quantity = req.body.quantity || 1;
  var err = new Error("not enough quantity available in inventory")

  // Get a cart
  createOrRetrieveCart(req.session.cartId, function(err, cart) {
    if(err) throw err;

    // Update the cartId
    req.session.cartId = cart._id.toString();

    // Add Product by id
    cart.add(id, quantity, function(err, result) {
     
      // We have an error, render the product view with the error
      if(err) req.params.error = err;
      // Add to list of items
      req.params.id = id;

      // Render the product view
      return product_routes.product(req, res);
    });
  });
}
