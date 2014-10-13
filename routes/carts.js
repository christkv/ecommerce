var Cart = require('../models/cart')()
  , Inventory = require('../models/inventory')()
  , Invoice = require('../models/invoice')()
  , product_routes = require('./products')
  , invoice_routes = require('./invoice');

/*
 * List all Items in the Cart
 */
exports.index = function index(req, res) {
  // Get a cart
  createOrRetrieveCart(req.session.cartId, function(err, cart) {
    // Render the product list
    res.render('./cart/index', { 
        cart: cart
      , error: req.params.error
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
    Cart.findActiveByHexId(id, function(err, cart) {
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

/*
 * Update a shopping cart
 */
exports.update = function update(req, res) {
  var body = req.body;
  var products = {};

  // Parse all the items
  for(var name in body) {
    if(name.indexOf('product_quantity_') != -1) {
      products[name.split('product_quantity_')[1]] = body[name];
    }
  }

  // Get a cart
  createOrRetrieveCart(req.session.cartId, function(err, cart) {
    if(err) throw err;
    var productUpdates = [];
    
    // Iterate over all the items to establish what products need updating
    for(var i = 0; i < cart.items.length; i++) {
      var item = cart.items[i];

      // Parse the new quantity
      var newQuantity = parseInt(products[item.product_id.toString()], 10);
      // Check if the item needs to be update
      if(newQuantity != item.quantity) {
        productUpdates.push({
            product_id: item.product_id
          , quantity: item.quantity
          , newQuantity: newQuantity
        });
      }
    }

    // Product updates available, just re-render the cart index
    if(productUpdates.length == 0) {
      return exports.index(req, res);
    }

    // Update the cart for the items that have changed
    cart.updateAll(productUpdates, function(err, result) {
      if(err) {
        req.params.error = err;
      }

      exports.index(req, res); 
    });
  });
}

/*
 * Remove product from shopping cart
 */
exports.remove = function remove(req, res) {
  // Product id
  var id = req.params.id;

  // Get a cart
  createOrRetrieveCart(req.session.cartId, function(err, cart) {
    if(err) throw err;

    // Remove product from cart
    cart.remove(id, function(err, r) {
      if(err) {
        req.params.error = err;
      }

      exports.index(req, res); 
    })
  });
}

/*
 * Cart Checkout
 */
exports.checkout = function checkout(req, res) {
  // Get a cart
  createOrRetrieveCart(req.session.cartId, function(err, cart) {
    if(err) throw err;

    // Render the checkout list
    res.render('./cart/checkout', { 
        cart: cart
      , errors: req.params.errors
    });
  });  
}

/*
 * Cart Fake Payment
 */
exports.pay = function checkout(req, res) {
  // Get a cart
  createOrRetrieveCart(req.session.cartId, function(err, cart) {
    if(err) throw err;
      
    // Get fields
    var fields = {
        items: cart.items
      , name: req.body.name
      , address: req.body.address
      , creditcard_name: req.body.creditcard_name
      , creditcard: req.body.creditcard
    }

    // Attempt to create an invoice
    Invoice.create(fields, function(err, invoice) {
      if(err) {
        req.params.errors = err;
        return exports.checkout(req, res);
      }

      // Commit inventory
      cart.commit(function(err) {
        if(err) throw err;
        // Add the invoice id
        req.params.id = invoice._id.toString();
        // Render invoice view
        invoice_routes.index(req, res);
      });
    });
  });  
}


















