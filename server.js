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

var wordlist = require('./server/engine/wordlist');
var WordTree = require('./server/engine/wordtree');
var BoggleEngine = require('./server/engine/boggleengine');
var Game = require('./server/models/game');

// Loading words into word tree.  I DON'T EVEN NEED THIS YET!
var str = fs.readFileSync('./server/data/common-234.txt', 'utf8');
var words = wordlist.createWordList(str);
var wordTree = new WordTree();
wordTree.addWords(words);

// Create the Boggle Engine!!!
var engine = new BoggleEngine();

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
//    res.json({ message: 'hooray! welcome to our api!' });   
    res.send(fs.readFileSync('./app/index.html', 'utf8'));
});

// more routes for our API will happen here// on routes that end in /bears
// ----------------------------------------------------
router.route('/startgame')

    // create a game (accessed at GET http://localhost:8080/champboggle2015/game)
    .get(function(req, res) {

        var startTime = new Date();
        var dd = pad(startTime.getDate());
        var MM = pad(startTime.getMonth() + 1);
        var yy = pad(startTime.getFullYear());
        var hh = pad(startTime.getHours());
        var mm = pad(startTime.getMinutes());
        var ss = pad(startTime.getSeconds());
        var mls = pad(startTime.getMilliseconds(), 3);

        var game = new Game(); 		// create a new instance of the Game model
        game.letters = engine.rollDice();  // set the game letters
        game.startTime = startTime;
        game.checkinPoint = game.letters + yy + MM + dd + hh + mm + ss + mls;

        // save the game and check for errors
//	game.save(function(err) {
//
//            if (err) {
//                res.send(err);
//            }

            res.json({ 
                letters: game.letters,
                checkinPoint: game.checkinPoint});
//        });
		
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/champboggle2015', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Boggle engine started on port ' + port);

function pad(num, numDigits) {
    numDigits = numDigits || 2;
    var s = "00" + num;
    return s.substr(s.length - numDigits);
}