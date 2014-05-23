var AwsTransform = require('./lib/aws_transform')
  , AwsDump = require('./lib/aws_dump')
  , MongoClient = require('mongodb').MongoClient
  , ObjectID = require('mongodb').ObjectID
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
  var insertIntoCollection = function(url, coll, objects, options, callback) {
    // Connect to MongoDB and insert into products table
    MongoClient.connect(url, function(err, db) {
      if(err) return callback(err, null);

      db.collection(coll).drop(function(err) {
        db.collection('inventories').drop(function(err) {
          db.collection(coll).insert(objects, function(err, docs) {
            if(err) return callback(err, null);
            var total = docs.length;
            // If we have inventory
            if(options.inventory) {
              for(var i = 0; i < docs.length; i++) {
                db.collection('inventories').insert({
                    product_id: docs[i]._id
                  , available: options.inventory
                }, {w:1}, function() {
                  total = total - 1;

                  if(total == 0) {
                    db.close();
                    callback(null);                  
                  }
                })
              }
            } else {
              db.close();
              callback(null);
            }
          });
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
    insertIntoCollection(url, 'products', objects, {inventory: 100}, callback);
  }

  //
  // Preload the categories documents
  this.loadCategories = function(file, callback) {
    // Load the categories and parse
    var objects = JSON.parse(fs.readFileSync(file, 'utf8'));
    insertIntoCollection(url, 'categories', objects, {}, callback);
  }

  var reWrite = function(d) {
    for(var name in d) {
      var v = d[name];

      if(name == '$oid') {
        return new ObjectID(d[name]);
      } else if(name == '$date') {
        return new Date(d[name]);
      }

      if(v != null && typeof v == 'object') {
        d[name] = reWrite(v)
      }
    }

    return d;
  }

  //
  // Preload the categories documents
  this.loadProducts = function(file, callback) {
    // Load the categories and parse
    var objects = fs.readFileSync(file, 'utf8').split(/\n/);
    objects.pop();
    objects = objects.map(function(d) {
      return reWrite(JSON.parse(d));
    })

    // Create dummy inventory entries
    var inventories = objects.map(function(d) {
      return {
        product_id: d._id, available: 100
      }
    });

    insertIntoCollection(url, 'products', objects, {}, function(err) {
      if(err) return callback(err);

      insertIntoCollection(url, 'inventories', inventories, {}, callback);
    });
  }
}

//
// Create a preloader
var loader = new PreLoader("mongodb://localhost:27017/ecommerce");

// Load all the basic category documents
loader.loadCategories(__dirname + "/../preload_data/categories.json", function(err, r) {});
loader.loadProducts(__dirname + "/../preload_data/products.json", function(err, r) {});

  // loader.transform({
  //     categoryPath: "/games/"
  //   , filterKeywords: ["xbox360", "pc", "ps3", "ps4", "wiiu"]
  // }, function(err) {
  //   if(err) throw err;
  // });

  // loader.transform({
  //     categoryPath: "/books/"
  //   , filterKeywords: ["scifi", "programming", "history", "business", "cooking"]
  // }, function(err) {
  //   if(err) throw err;
  // });
