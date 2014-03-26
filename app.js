
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
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
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Add a capitalize method to string objects
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

var intitalizeTypes = function(types, callback) {
  if(types.length == 0) return callback(null, null);
  types.shift().init(function(err) {
    if(err) return callback(err);
    intitalizeTypes(types, callback);
  });
}

// Connect to MongoDB
MongoClient.connect("mongodb://localhost:27017/ecommerce", function(err, db) {
	if(err) throw err;

	// Map up all the routes
	app.get('/', routes.index);
  app.get('/index/:category', routes.index);
	// app.get('/users', user.list(db));

  // Call init on all the types (setting up indexes etc)
  intitalizeTypes([
      require('./models/product')(db)
    , require('./models/cart')(db)
    , require('./models/category')(db)
    , require('./models/inventory')(db)
    , require('./models/user')(db)
  ], function(err) {
    if(err) throw err;
    // Start http server
    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });
  });
});

