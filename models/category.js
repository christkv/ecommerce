var f = require('util').format;
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

  Category.init = function(callback) {
    callback(null, null);    
  }

  Category.findChildrenOf = function(root, options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    // Locate the category
    var coll = db.collection(collectionName);
    // Get the category
    coll.findOne({name: root}, function(err, cat) {
      if(err) return callback(err);
      if(cat == null) return callback(new Error(f("category %s does not exist", root)));
      
      // Get the categories directly under the root    
      coll.find({parent: cat.category}).toArray(function(err, docs) {
          if(err) return callback(err);

          // Map the results
          var results = {
              root: new Category(cat)
            , categories: docs.map(function(p) {
              return new Category(p);
            })
          }

          // Return the products but map them to our type first
          callback(null, results);
      });
    });
  }

  return Category;
}

module.exports = init;