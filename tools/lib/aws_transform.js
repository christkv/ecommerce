var fs = require('fs'),
  moment = require('moment');

var AwsTransform = function(options) {
  // Unpack options
  var dataDir = options.dataDir || __dirname + "/../../data";
  var categoryPath = options.categoryPath || "";
  var filterKeywords = options.filterKeywords || null;

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
  // Transform list price
  var convertListPrice = function(obj, name, value) {
    if(name.toLowerCase() == 'listprice') {
      obj.price = parseInt(value[0].Amount[0], 10);
      obj.currency = value[0].CurrencyCode[0];
    }
  }

  // 
  // Check data for illegal characters
  var isLegal = function(data) {
    if(Array.isArray(data)) {
      for(var i = 0; i < data.length; i++) {
        var item = data[i];

        if(typeof item == 'object'){
          for(var n in item) {
            if(n.indexOf('$') == 0 || n.indexOf('.') == 0) {
              return false;
            }
          }
        }
      }
    } else if(typeof data == 'object') {
      for(var n in data) {
        if(n.indexOf('$') == 0 || n.indexOf('.') == 0) return false;
      }
    }

    return true;
  }

  //
  // Convert the items form the data
  var convertItems = function(category, object, objects) {
    var parseToInt = ["NumberOfItems", "NumberOfPages"];
    var parseToDate = ["PublicationDate", "ReleaseDate", "publicationdate", "releasedate"];
    var ignoreFields = ["eanlist"
      , "itemdimensions"
      , "languages"
      , "creator"
      , "packagedimensions"
      , "listprice"
      , "tradeinvalue"
      , "manufacturerminimumage"];

    object.ItemSearchResponse.Items.forEach(function(item) {
      item.Item.forEach(function(i) {
        var obj = {};

        // Convert all the images into a map
        convertImages(i, obj);

        // Do we have a EditorialReviews
        if(Array.isArray(i.EditorialReviews) && i.EditorialReviews.length > 0) {
          obj.description = i.EditorialReviews[0].EditorialReview[0].Content;
        }

        // Adds an empty metadata field
        obj.metadata = [];
        // Contains the value
        var value = null;

        // Get all the attributes
        i.ItemAttributes.forEach(function(attr) {
          for(var name in attr) {
            convertListPrice(obj, name, attr[name]);

            if(name.toLowerCase() == "format") {
              value = obj[name.toLowerCase()] = attr[name][0];
            }

            // Skip if on ignore list
            if(ignoreFields.indexOf(name.toLowerCase()) != -1) continue;
            
            // Remove any fields starting with illegal characters
            if(name[0] == '$' || name[0] == '.') continue;
            // Remove any fields with illegal child objects
            if(!isLegal(attr[name])) continue;

            // obj[name] = attr[name];
            if(Array.isArray(attr[name]) && attr[name].length == 1) {
              value = obj[name.toLowerCase()] = attr[name][0];
            } else {
              value = obj[name.toLowerCase()] = attr[name];
            }

            // If we have specific fields parse them
            if(parseToInt.indexOf(name) != -1) {
              value = obj[name.toLowerCase()] = parseInt(obj[name.toLowerCase()], 10);
            }

            if(parseToDate.indexOf(name) != -1) {
              value = obj[name.toLowerCase()] = moment(obj[name.toLowerCase()]).toDate();
            }

            // Push to Metadata object
            obj.metadata.push({
                key: name.toLowerCase()
              , value: value
            })
          }
        });

        // Add category from keyword
        obj.category = categoryPath + category;
        obj.salesrank = i.SalesRank ? parseInt(i.SalesRank[0], 10) : 0;

        // Save to finial object array
        if(obj.format == null) {
          objects.push(obj)          
        } else if(obj.format != null && obj.format[0].toLowerCase().indexOf("kindle") == -1) {
          objects.push(obj)                    
        }
      });
    }); 
  }

  //
  // Transform all the data
  this.transform = function() {
    // Create our own object structure
    var objects = [];

    // Read all the files we need to parse
    var files = fs.readdirSync(dataDir);
    for(var i = 0; i < files.length; i++) {
      var file = files[i];
      var category = file.split(/_/)[0];
      // Only include files we are interested in 
      if(Array.isArray(filterKeywords) && 
        filterKeywords.indexOf(category) == -1) {
        continue;
      }

      // Read raw data
      var data = fs.readFileSync(dataDir + "/" + file, 'utf8');
      // Parse to JSON
      var object = JSON.parse(data);
      // Translate
      convertItems(category, object, objects);
    };

    // Return all the documents
    return objects;
  }
}

module.exports = AwsTransform;