
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

// Connect to MongoDB
MongoClient.connect("mongodb://localhost:27017/ecommerce", function(err, db) {
	if(err) throw err;

	// Map up all the routes
	app.get('/', routes.index);

  // Initialize the models
  require('./models/category')(db)

  // Start http server
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
});

