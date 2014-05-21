var AwsTransform = require('./lib/aws_transform')
  , AwsDump = require('./lib/aws_dump')
  , MongoClient = require('mongodb').MongoClient
  , fs = require('fs');

var PreLoader = function(url) {  

  //
  // Load and transform data
  this.getAndTransform = function(keywords, searchIndex, options, callback) {
    var self = this;
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    // Unpack all the options
    var config = options.config || __dirname + "/../aws-config.json";
    var out = options.out || __dirname + "/../data";
    var interval = options.interval || 100;
    var dataDir = options.dataDir || __dirname + "/../data";
    var categoryPath = options.categoryPath || '/books/';
    var filterKeywords = keywords.slice(0);
    // Make sure we don't destroy existing array
    keywords = keywords.slice(0);

    // Get all the data from Amazon
    this.get(keywords, searchIndex, {
        config: config
      , out: out
      , interval: interval
    }, function(err) {
      if(err) return callback(err);

      // Transform all the operations
      self.transform({
          dataDir: dataDir
        , categoryPath: categoryPath
        , filterKeywords: filterKeywords
      }, function(err) {
        if(err) return callback(err);
        callback(null);
      });
    });
  }

  //
  // Dump the data from amazon
  this.get = function(keywords, searchIndex, options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    // Unpack all the options
    var config = options.config || __dirname + "/../aws-config.json";
    var out = options.out || __dirname + "/../data";
    var interval = options.interval || 100;

    // Create dump
    var dump = new AwsDump({
        config: config
      , out: out
      , interval: interval
    });   

    // Dump the data
    dump.fetch(keywords, searchIndex, function(err) {
      if(err) return callback(err);
      callback(null);
    });
  }

  //
  // Insert into a collection
  var insertIntoCollection = function(url, coll, objects, callback) {
    // Connect to MongoDB and insert into products table
    MongoClient.connect(url, function(err, db) {
      if(err) return callback(err, null);

      db.collection(coll).drop(function(err) {
        db.collection(coll).insert(objects, function(err) {
          if(err) return callback(err, null);
          db.close();
          callback(null);
        });
      });
    });    
  }

  //
  // Preload the data into the db
  this.transform = function(options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    var options = options || {};
    var dataDir = options.dataDir || __dirname + "/../data";
    var categoryPath = options.categoryPath || '/books/';
    var filterKeywords = options.filterKeywords;

    // Create Transformer
    var transformer = new AwsTransform({
        dataDir: dataDir
      , categoryPath: categoryPath
      , filterKeywords: filterKeywords
    });
    
    // Load the data
    var objects = transformer.transform();
    insertIntoCollection(url, 'products', objects, callback);
  }

  //
  // Preload the categories documents
  this.loadCategories = function(file, callback) {
    // Load the categories and parse
    var objects = JSON.parse(fs.readFileSync(file, 'utf8'));
    insertIntoCollection(url, 'categories', objects, callback);
  }
}

//
// Create a preloader
var loader = new PreLoader("mongodb://localhost:27017/ecommerce");
// Load all the basic category documents
loader.loadCategories(__dirname + "/../preload_data/categories.json", function(err, r) {
  // loader.transform({
  //     categoryPath: "/games/"
  //   , filterKeywords: ["xbox360", "pc", "ps3", "ps4", "wiiu"]
  // }, function(err) {
  //   if(err) throw err;
  // });

  loader.transform({
      categoryPath: "/books/"
    // , filterKeywords: ["scifi", "programming", "history", "business", "cooking"]
    , filterKeywords: ["scifi"]
  }, function(err) {
    if(err) throw err;
  });
});


// loader.getAndTransform(["programming"], "Books", {
//   categoryPath: "/books/"
// }, function(err) {
//   if(err) throw err;
// });

// // Load the games
// loader.getAndTransform(["ps3", "pc", "ps4", "xbox360", "wiiu"], "VideoGames", {
//   categoryPath: "/games/"
// }, function(err) {
//   if(err) throw err;
  
//   // Load books
//   loader.getAndTransform(["cooking", "scifi", "programming", "history", "business"], "Books", {
//     categoryPath: "/books/"
//   }, function(err) {
//     if(err) throw err;
//   });
// });

// loader.transform({
//   filterKeywords: ["xbox360"]
// }, function(err) {
//   if(err) throw err;
// });
