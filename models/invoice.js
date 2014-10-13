var f = require('util').format
  , ObjectID = require('mongodb').ObjectID;

// Store the db instance
var db = null;
var collectionName = 'invoices';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;

  var Invoice = function(object) {
    for(var name in object) {
      this[name] = object[name];
    } 
  }

  /**
   * Initialize the model at application startup
   */
  Invoice.init = function(callback) {
    callback();
  }

  /**
   * Fetch an invoice by id
   */
  Invoice.fetchOneById = function(id, callback) {
    id = typeof id == 'string' ? new ObjectID(id) : id;

    db.collection(collectionName).findOne({_id: id}, function(err, doc) {
      if(err) return callback(err);
      if(doc == null) return callback(new Error(f("could not locate invoice with id %s", id)));
      callback(null, new Invoice(doc));
    });
  }

  /**
   * Create an Invoice
   */
  Invoice.create = function(fields, callback) {
    var errors = {};
    // Fields cannot be empty
    if(fields.name.length == 0) errors.name = 'Recipients name must be filled in';
    if(fields.address.length == 0) errors.address = 'Address must be filled in';
    if(fields.creditcard.length == 0) errors.creditcard = 'Creditcard must be filled in';
    if(fields.creditcard_name.length == 0) errors.creditcard_name = 'Creditcard name must be filled in';
    if(Object.keys(errors).length > 0) return callback(errors, null);
    
    // Add up all the fields for a total
    var total = 0;
    fields.items.forEach(function(i) {
      total += (i.quantity * i.price);
    });

    // Create the invoice
    db.collection(collectionName).insert({
      // Items in the order
        items: fields.items
      // Payment details
      , payment: {
          type: 'creditcard'
        , name: fields.creditcard_name
        , number: fields.creditcard 
      }
      // Shipping address
      , shipped_to: {
          name: fields.name
        , address: fields.address
      }
      // Total price of order
      , total: total
    }, function(err, result) {
      if(err) return callback(err);
      return callback(null, new Invoice(result.ops[0]));
    });
  }

  return Invoice;
}

module.exports = init;