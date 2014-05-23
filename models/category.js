var f = require('util').format
  , ObjectID = require('mongodb').ObjectID;

// Store the db instance
var db = null;
var collectionName = 'categories';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  
  var Category = function(object) {
    for(var name in object) {
      this[name] = object[name];
    } 
  }

  Category.prototype.split = function() {
    var parts = this.category.split("/");
    parts.shift();
    return parts;
  }

  Category.create = function(fields, callback) {
    // TODO
    callback(null, null);
  }

  Category.remove = function(id, callback) {
    // TODO
    callback(null, null);
  }

  Category.init = function(callback) {
    callback()
  }

  Category.all = function(callback) {
    db.collection(collectionName).find().toArray(function(err, categories) {
      if(err) return callback(err);
      callback(null, categories.map(function(cat) { return new Category(cat); }));
    });
  }

  Category.findByParent= function(path, callback) {
    db.collection(collectionName).findOne({parent: path}, function(err, doc) {
      if(err) return callback(err, null);
      if(doc == null) return callback(null, null);
      return callback(null, new Category(doc));
    });
  }

  Category.findByCategory= function(path, callback) {
    db.collection(collectionName).findOne({category: path}, function(err, doc) {
      if(err) return callback(err, null);
      if(doc == null) return callback(null, null);
      return callback(null, new Category(doc));
    });
  }

  Category.findBy = function(path, callback) {
    db.collection(collectionName).findOne({parent: path}, function(err, doc) {
      if(err) return callback(err, null);
      if(doc == null) return callback(null, null);
      return callback(null, new Category(doc));
    });
  }

  Category.findChildrenOf = function(root, options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    callback(null, {
        root: new Category({category: '/', text: '/'})
      , categories: []
    });
  }

  return Category;
}

module.exports = init;