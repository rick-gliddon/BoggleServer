// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var args = process.argv;
var live = !args[2] || args[2] !== 'dev';
if (!live) console.log('DEVELOPMENT MODE');
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var fs         = require('fs');
var path       = require('path');
var expressJwt = require('express-jwt');
var jwt        = require('jsonwebtoken');
var mongoose   = require('mongoose');

if (live) {
    mongoose.connect('mongodb://bogglebot:botboggle@ds051750.mongolab.com:51750/boggledb'); // connect to our database
}

var authRoute = require('./server/routes/auth');
var startgameRoute = require('./server/routes/startgame');
var gueststartgameRoute = require('./server/routes/gueststartgame');
var checkinRoute = require('./server/routes/checkin');
var guestcheckinRoute = require('./server/routes/guestcheckin');

var wordlist = require('./server/engine/wordlist');
var WordTree = require('./server/engine/wordtree');
// Loading words into word tree.
var str = fs.readFileSync('./server/data/common-234.txt', 'utf8');
var words = wordlist.createWordList(str);
var wordTree = new WordTree();
wordTree.addWords(words);
str = fs.readFileSync('./server/data/linux.words', 'utf8');
words = wordlist.createWordList(str);
wordTree.addWords(words);
startgameRoute.setWordTree(wordTree);
guestcheckinRoute.setWordTree(wordTree);

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

// We are going to protect /api routes with JWT
router.use('/api', expressJwt({secret: "bogglesecret"}));

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {  
    res.send(fs.readFileSync('./app/index.html', 'utf8'));
});
router.use('/auth', authRoute);
router.get('/api/identify', function(req, res) {res.send(req.user.name);});
router.use('/api/startgame', startgameRoute);
router.use('/api/checkin', checkinRoute);
router.use('/guest/startgame', gueststartgameRoute);
router.use('/guest/checkin', guestcheckinRoute);

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /champboggle2015
app.use('/champboggle2015', router);

// START THE SERVER
// =============================================================================
console.log('Attempting to listen on port: ' + port);
app.listen(port);
console.log('Boggle engine started on port ' + port);