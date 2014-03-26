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
// Get or Create Cart
var getCart = function(session, callback) {
  // No cart for session
  if(session.cartId == null) {

  }
}

/*
 * Add product to current cart
 */
exports.addToCart = function(req, res) {  
  console.log("================= addToCart")
  console.dir(req.session)
  if(req.session.cartId == null) {
    console.log("================= addToCart 1")
    // Create a new cart
    var cart = new Cart();
    // Add a product to the cart
    cart.add(req.params.id, 1);
    // Save the cart
    cart.save(function(err, cart) {
      if(err) throw err;
      console.log("================= addToCart 2")
      console.dir(cart)
      // Save the cart id
      req.session.cartId = cart._id.toString();
      console.log("================= addToCart 3")

      // Get the children
      Category.findChildrenOf('/', function(err, path) {
        if(err) throw err
        console.log("================= addToCart 4")
        // Render the cart view
        res.end('hello')
        // res.render('cart', { 
        //     cart: cart 
        //   , path: path
        //   , moment: moment
        // });      
      });      
    });
  } else {
    Cart.find(req.session.cartId, function(err, cart) {
      if(err) throw err;
      if(cart) {
        console.log("+++++++++++++ FOUND CARD WITH ID " + req.session.cartId)
      } else {
        // Create a new cart
        var cart = new Cart();
        // Add a product to the cart
        cart.add(req.params.id, 1);
        // Save the cart
        cart.save(function(err, cart) {
          console.log("=================================== SAVE")
          console.dir(err)

          if(err) throw err;

          req.session.cartId = cart._id.toString();
          res.end('hello1')
        });        
      }
    });
  }
}

/*
 * Update product quantities in current cart
 */
exports.updateCart = function(req, res) {  
}

/*
 * Remove product from cart
 */
exports.removeFromCart = function(req, res) {  
}

/*
 * Clear cart
 */
exports.clearCart = function(req, res) {  
}

/*
 * Show cart
 */
exports.cart = function(req, res) {  
}

