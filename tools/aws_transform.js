var fs = require('fs'),
	moment = require('moment');

// Get raw data
var data = fs.readFileSync(__dirname + "/../data.json", 'utf8');
var object = JSON.parse(data);

// Create our own object structure
var objects = [];
var parseToInt = ["NumberOfItems", "NumberOfPages"];
var parseToDate = ["PublicationDate", "ReleaseDate"];
var ignoreFields = ["EANList", "ItemDimensions", "Languages", "Creator"];

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

// Iterate over all the items
object.ItemSearchResponse.Items.forEach(function(item) {

	item.Item.forEach(function(i) {
		console.log("============== item")
		console.dir(i)

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

		objects.push(obj)
	});
});

console.log(JSON.stringify(objects, null, 2))
