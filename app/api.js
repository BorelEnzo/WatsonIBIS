var fs 		= require('fs');
var express = require('express');
var api 	= express.Router();

/**
 * The main page. Displays the HTML content
 */
api.get('/display', function(req, res) {
	fs.readFile('client/index.html', function(err, html) {
		if (err) {
			throw err;
		}
		res.writeHeader(200, {'Content-type' : 'text/html'});
		res.write(html);
		res.end();
	});
});

/**
 * Called asynchronously by the client, returns the test content
 * TODO read data from the database
 */
api.get('/getdata', function(req, res) {
	fs.readFile('client/result.json', 'utf-8', function(err, txt) {
		res.send(txt);
	});
});

/**
 * TODO read data, check and insert into the DB. Then, fetch all new
 * publications (by comparing times):
 * 
 * select * from publication, user where user.id = req.body.userid and
 * publication.time > user.lastvisit
 * 
 * Don't forget to escape all characters.
 * 
 * The request has 2 parameters :
 * <ul>
 * 		<li>type: it's the type of the new publication question|answer|argument</li>
 * 		<li>id: parent's id. According to this id, check if the type is coherent:
 * 			<ul>
 * 				<li> if type == question -> id is an arg id or 0 if it's the root (because I
 * 				consider here that an arg can generate a new question)</li>
 * 				<li> if type == answer -> id is a question's id </li>
 * 				<li>if type == argument -> id is an answer's id </li>
 * 			</ul>
 * 		</li>
 * </ul>
 */
api.post('/display', function(req, res) {
	res.redirect('/watson/display');
});

module.exports = {
	'api' : api
}