// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var fs         = require('fs');
var path       = require('path');
var mongoose   = require('mongoose');
mongoose.connect('mongodb://bogglebot:botboggle@ds051750.mongolab.com:51750/boggledb'); // connect to our database

var startgameRoute = require('./server/routes/startgame');
var checkinRoute = require('./server/routes/checkin');

var wordlist = require('./server/engine/wordlist');
var WordTree = require('./server/engine/wordtree');
// Loading words into word tree.
var str = fs.readFileSync('./server/data/common-234.txt', 'utf8');
var words = wordlist.createWordList(str);
var wordTree = new WordTree();
wordTree.addWords(words);
startgameRoute.setWordTree(wordTree);

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'app')));

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {  
    res.send(fs.readFileSync('./app/index.html', 'utf8'));
});
router.use('/startgame', startgameRoute);
router.use('/checkin', checkinRoute);

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/champboggle2015', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Boggle engine started on port ' + port);