// Store the db instance
var db = null;
var collectionName = 'users';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  
  var User = function(product) {
    for(var name in product) {
      this[name] = product[name];
    } 
  }

  User.init = function(callback) {
    callback(null, null);    
  }

  return User;
}

module.exports = init;