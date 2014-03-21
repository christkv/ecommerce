var fs = require('fs'),
	moment = require('moment'),
	MongoClient = require('mongodb').MongoClient;

//
// Transform the images
var convertImages = function(item, obj) {
	var mapFunction = function(i) {
		return {url: i.URL[0], width: i.Width[0]._, height: i.Height[0]._}
	}

	obj.images = {
		'small': mapFunction(item.SmallImage[0]),
		'medium': mapFunction(item.MediumImage[0]),
		'large': mapFunction(item.LargeImage[0])
	}
}

//
// Convert the items form the data
var convertItems = function(category, object, objects) {
	var parseToInt = ["NumberOfItems", "NumberOfPages"];
	var parseToDate = ["PublicationDate", "ReleaseDate"];
	var ignoreFields = ["EANList", "ItemDimensions", "Languages", "Creator"];

	object.ItemSearchResponse.Items.forEach(function(item) {
		item.Item.forEach(function(i) {
			var obj = {};

			// Convert all the images into a map
			convertImages(i, obj);

			// Do we have a EditorialReviews
			if(Array.isArray(i.EditorialReviews) && i.EditorialReviews.length > 0) {
				obj.description = i.EditorialReviews[0].EditorialReview[0].Content;
			}

			// Get all the attributes
			i.ItemAttributes.forEach(function(attr) {
				for(var name in attr) {
					if(ignoreFields.indexOf(name) != -1) return;
					// obj[name] = attr[name];
					if(Array.isArray(attr[name]) && attr[name].length == 1) {
						obj[name.toLowerCase()] = attr[name][0];
					} else {
						obj[name.toLowerCase()] = attr[name];
					}

					// If we have specific fields parse them
					if(parseToInt.indexOf(name) != -1) {
						obj[name.toLowerCase()] = parseInt(obj[name.toLowerCase()], 10);
					}

					if(parseToDate.indexOf(name) != -1) {
						obj[name.toLowerCase()] = moment(obj[name.toLowerCase()]).toDate();
					}
				}
			});

			console.dir(i)

			// Add category from keyword
			obj.category = category;
			obj.salesrank = i.SalesRank ? parseInt(i.SalesRank[0], 10) : 0;
			// Save to finial object array
			objects.push(obj)
		});
	});	
}

// Create our own object structure
var objects = [];

// Read all the files we need to parse
var files = fs.readdirSync(__dirname + "/../data");
files.forEach(function(file) {
	var category = file.split(/_/)[0];
	// Read raw data
	var data = fs.readFileSync(__dirname + "/../data/" + file, 'utf8');
	// Parse to JSON
	var object = JSON.parse(data);
	// Translate
	convertItems(category, object, objects);
});

// Connect to MongoDB and insert into products table
MongoClient.connect("mongodb://localhost:27017/ecommerce", function(err, db) {
	if(err) throw err;
	db.collection('products').drop(function(err) {
		// if(err) throw err;
	
		db.collection('products').insert(objects, function(err) {
			if(err) throw err;
			db.close();
			process.exit(0);
		});
	});
});

// console.log(JSON.stringify(objects, null, 2))
