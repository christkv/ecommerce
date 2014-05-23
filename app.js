/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
var category_routes = require('./routes/categories');
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

  // Category work
  app.get('/admin/category', category_routes.index);
  app.post('/admin/category/delete', category_routes.remove);
  app.get('/admin/category/add', category_routes.add);
  app.post('/admin/category/add', category_routes.addCategory);

  // Initialize all the models
  initializeModels(db, ['./models/category'], function() {
    // Start http server
    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });
  });
});

