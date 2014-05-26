var MongoClient = require('mongodb').MongoClient
  , f = require('util').format;

// Connection url
var url = 'mongodb://localhost:27017/ecommerce';
// Expire delta from current time in seconds
var expiryDelta = 1;
// Calculate cutoff date
var cutOffDate = new Date(); 
cutOffDate.setMinutes(cutOffDate.getMinutes() - expiryDelta);

//
// Connect to the server
MongoClient.connect(url, function(err, db) {
  if(err) throw err;

  // inventory collection
  var inventoryCollection = db.collection('inventories');
  var cartsCollection = db.collection('carts');

  // Get all the expired carts that are still marked as active
  cartsCollection.find({modified_on: { $lte: cutOffDate}, status: 'active'}).toArray(function(err, carts) {
    if(err) throw err;
    if(carts.length == 0) {
      console.log("No expired carts found");
      return db.close();
    }

    console.log("===============================================")
    console.log(f("Found %s expired carts", carts.length));
    console.log("===============================================")

    // Bulk operation
    var inventoryBulk = inventoryCollection.initializeUnorderedBulkOp();
    var cartBulk = cartsCollection.initializeUnorderedBulkOp();

    // Let's build a bulk operation that returns the inventory
    for(var i = 0; i < carts.length; i++) {
      var cart = carts[i];
      console.log(f("Processing cart %s", cart._id));

      // For all orphaned items return them
      for(var j = 0; j < cart.items.length; j++) {
        var item = cart.items[j];
        console.log(f("  Returning %s of item %s ", item.quantity, item.product_id));
        
        // Add to bulk update for the inventory returning all the reserved
        // inventory
        inventoryBulk.find({
            product_id: item.product_id
          , 'reserved.cart_id': cart._id
          , 'reserved.quantity': item.quantity
        }).updateOne({
            $inc: { available: item.quantity }
          , $pull: { reserved: { cart_id: cart._id } }
        });

        // Set the cart to expired
        cartBulk.find({_id: cart._id}).updateOne({status: 'expired'});
      }

      // Execute both bulks
      inventoryBulk.execute(function(err, result) {
        if(err) console.dir(err)
        if(result.hasWriteErrors()) console.dir(result.getRawResponse());

        cartBulk.execute(function(err, result) {
          if(err) console.dir(err)
          if(result.hasWriteErrors()) console.dir(result.getRawResponse());

          // Close the connection
          db.close();
        });
      });
    }
  });
});