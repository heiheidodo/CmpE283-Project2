var express = require('express');
var router = express.Router();
var crud = require('mongo-crud');
var mongo = require('mongodb');

var url = "mongodb://localhost:27017/test";
var db = 'test';

/* GET users listing. */
router.get('/', function(req, res, next) {
	crud.connect(url, function(err) {
	    if(err) throw err;
	    // Start your application here!
	});
    res.render('management');
});

router.post('/add', function (req, res, next) {
	//console.log(req.body.connection);
	console.log(req.body.record);
	var data = JSON.parse(JSONize(req.body.record));
	crud.create(db, data, function (err, result) {
        if (err) throw err;
        
        // process the result here. 
        res.send(record);
    });
	/*crud.connect(url, function(err) {
	    if(err) throw err;
	    // Start your application here!
	    
	    crud.create('test', data, function (err, result) {
	        if (err) throw err;
	        
	        // process the result here. 
	        res.send(record);
	    });
	});*/
	
});

var record = [];
router.post('/get', function (req, res, next) {
	//console.log(req.body.connection);
	//console.log(req.body.record);
	var  all = false;
	var data = '{}';
	if (typeof req.body.record === 'undefined' || req.body.record === null)
	{
		all = true;
		console.log(all);
		data = JSON.parse(JSONize(data));
	}
	else
	{
		data = JSON.parse(JSONize(req.body.record));
	}
	
	console.log(data);
	
	if (all)
    {
    	crud.retrieve(db, function (err, result) {
    	      if (err) throw err;
    	      
    	      // result contains an array with all objects in the collection Foo
    	      record = result;
    	});
    }
    else
    {
    	crud.retrieve(db, data, function (err, result) {
    	      if (err) throw err;
    	      
    	      // result contains an array with all object with peroperty foo == bar in the collection Foo
    	      record = result;
    	});
    }
});

router.get('/getRecord', function (req, res, next) {
    console.log("------");
    res.send(record);
});

router.post('/update', function (req, res, next) {
	//console.log(req.body.connection);
	//console.log(req.body.record);
	var data = JSON.parse(JSONize(req.body.record.record));
	//console.log(data);
	var newData = JSON.parse(JSONize(req.body.record.modify));
	//console.log(newData);
	crud.retrieve(db, data, function (err, result) {
	      if (err) throw err;
	      
	      // for each object returned perform set the property foo == block.
	      for(var i = result.length - 1; i >= 0; i--) {
	      	var foo = result[i]; 
	      	foo[Object.keys(foo)[1]] = newData[Object.keys(newData)[0]];
	        console.log(Object.keys(foo)[1] + " " + Object.keys(newData)[0]);
	        // save the update.
	        crud.update(db, foo, function (err, result) {
	        	// handle any errors here.
	        	console.log(result);
	        });
	      }
	  });
});

router.post('/delete', function (req, res, next) {
	//console.log(req.body.connection);
	console.log(req.body.record);
	var all = false;
	var data = '{}';
	if (typeof req.body.record === 'undefined' || req.body.record == null)
	{
		all = true;
		console.log(all);
		data = JSON.parse(JSONize(data));
	}
	else
	{
		data = JSON.parse(JSONize(req.body.record));
	}
	
	console.log(data);
	
	if (all)
    {
    	crud.delete(db, data, function (err, result) {
    	      if (err) throw err;
    	      
    	      // deletes all documents in the collection Foo
    	      
    	  });
    }
    else
    {
	    crud.delete(db, data, function (err, result) {
	        if (err) throw err;
	        
	        // deletes all documents with peroperty foo == bar in the collection Foo
	        
	    });
    }
	
	/*if (all)
    {
		crud.connect(url, function(err) {
		    if(err) throw err;
		    // Start your application here!		    
		    crud.delete('test', data, function (err, result) {
		   	      if (err) throw err;
		   	      
		   	      // deletes all documents in the collection Foo
		   	      
      	    });
		});
    }
	else
	{
		crud.connect(url, function(err) {
		    if(err) throw err;
		    // Start your application here!		    
		    crud.delete('test', data, function (err, result) {
		   	      if (err) throw err;
		   	      
		   	      // deletes all documents in the collection Foo
		   	      
      	    });
		});
	}*/
	/*crud.connect(url, function(err) {
	    if(err) throw err;
	    // Start your application here!
	    if (all)
	    {
	    	crud.delete('test', data, function (err, result) {
	    	      if (err) throw err;
	    	      
	    	      // deletes all documents in the collection Foo
	    	      
	    	  });
	    }
	    else
	    {
		    crud.delete('test', data, function (err, result) {
		        if (err) throw err;
		        
		        // deletes all documents with peroperty foo == bar in the collection Foo
		        
		    });
	    }
	});*/
});

function JSONize(str) {
	  return str
	    // wrap keys without quote with valid double quote
	    .replace(/([\$\w]+)\s*:/g, function(_, $1){return '"'+$1+'":'})    
	    // replacing single quote wrapped ones to double quote 
	    .replace(/'([^']+)'/g, function(_, $1){return '"'+$1+'"'})         
	}

module.exports = router;
