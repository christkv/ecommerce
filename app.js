/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
var category_routes = require('./routes/categories');
var product_routes = require('./routes/products');
var cart_routes = require('./routes/carts');
var invoice_routes = require('./routes/invoice');
var http = require('http');
var path = require('path');

// Get the MongoClient class
var MongoClient = require('mongodb').MongoClient;

// Application instance
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.cookieSession({
  secret: 'diku234243423lkklkl'
}));

app.use(app.router);

// development only
if('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Add a capitalize method to string objects
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

// Initialize models helpers
var initializeModels = function(db, models, callback) {
  var totalModels = models.length;

  for(var i = 0; i < models.length; i++) {
    require(models[i])(db).init(function() {
      totalModels = totalModels - 1;

      if(totalModels == 0) callback();
    });
  }
}

// Connect to MongoDB
MongoClient.connect("mongodb://localhost:27017/ecommerce", function(err, db) {
	if(err) throw err;

	// Map up all the routes
	app.get('/', routes.index);
  app.get('/index/:category', routes.index);

  // Product
  app.get('/product/:id', product_routes.product);  
  app.get('/admin/product', product_routes.index);  
  app.post('/admin/product/delete', product_routes.remove);  
  app.get('/admin/product/add', product_routes.add);  
  app.post('/admin/product/add', product_routes.addProduct);  

  // Category work
  app.get('/admin/category', category_routes.index);
  app.post('/admin/category/delete', category_routes.remove);
  app.get('/admin/category/add', category_routes.add);
  app.post('/admin/category/add', category_routes.addCategory);

  // Cart
  app.get('/cart', cart_routes.index);
  app.post('/cart/add', cart_routes.add);
  app.post('/cart/update', cart_routes.update);
  app.get('/cart/remove/:id', cart_routes.remove);
  app.post('/cart/checkout', cart_routes.checkout);
  app.post('/cart/pay', cart_routes.pay);

  // Invoice
  app.get('/invoice/:id', invoice_routes.index);

  // Initialize all the models
  initializeModels(db, ['./models/category'
    , './models/product'
    , './models/inventory'
    , './models/cart'
    , './models/invoice'], function() {
    
    // Start http server
    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });
  });
});

