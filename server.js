var express 	= require('express');
var bodyparser 	= require('body-parser');
var api			= require('./app/api.js');
var app 		= express();

app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(bodyparser.json());
app.use('/watson', api.api);
app.use('/client', express.static(__dirname + '/client'));

app.listen(8080, function(err){
	if(err){
		throw err;
	}
	else{
		console.log('Api ready at localhost:8080');
	}
});
