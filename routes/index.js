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

/*
 * Search
 */
exports.search = function(req, res) {
  // Search parameter
  var search = req.body.search || req.query.search;
  // Get number to skip
  console.dir(req.params)
  var skip = req.params.currentIndex ? parseInt(req.params.currentIndex, 10) : 0;
  
  // Items pr page
  var limit = 10;
  var numberOfPages = 10;

  // Start and current index
  var startIndex = req.params.startIndex ? parseInt(req.params.startIndex, 10) : 0;
  var currentIndex = skip;

  // We pushed next
  if(skip == -2) {
    startIndex = startIndex + (numberOfPages * limit);
    currentIndex = startIndex + limit;
    skip = currentIndex;
  } else if(skip == -1) {
    startIndex = startIndex - (numberOfPages * limit);
    startIndex = startIndex <= 0 ? 0 : startIndex;
    currentIndex = startIndex;
    skip = currentIndex;
  }

  // Current page
  var page = startIndex/limit;

  // Options
  var options = {
      skip: skip
    , limit: limit
  }

  // Perform a search
  Product.search(search, options, function(err, products) {
    if(err) throw err;

    // Get all the basic navigational information
    fetchNavigational(req, res, function(err, context) {
      // Add products to context
      context.products = products;
      context.search = search || "";
      context.startIndex = startIndex;
      context.currentIndex = currentIndex;
      context.page = page;
      // Do we need to adjust the index
      if(skip.toString().substr())

      // Render search view
      res.render('search', context);
    });
  });
}


// -------------------------------------------------------------------
//
// Cart Operations
//
// -------------------------------------------------------------------

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

