var express = require('express');
var crud = require('mongo-crud');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.render('connect');
});

router.post('/connect', function (req, res, next) {
	//console.log(req.body.connection);
	var host = req.body.connection.host;
	var port = req.body.connection.port;
	var dbname = req.body.connection.name;
	
	var url = "mongodb://" + host + ":" + port + "/" + dbname;
	console.log(url);
	var check = "mongodb://localhost:27017/test";
	
	crud.connect(check, function(err) {
	    if(err) throw err;
	    // Start your application here!
	    console.log(dbname);
	    res.render('management', {req : dbname});
	});
	
});

module.exports = router;