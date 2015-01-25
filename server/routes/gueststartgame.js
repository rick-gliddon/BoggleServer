var express = require('express');
var router = express.Router();
var BoggleEngine = require('../engine/boggleengine');
var Game = require('../models/game');
var Solution = require('../models/solution');
var PlayerInGame = require('../models/playerInGame');
var GameCreator = require('../util/gameCreator');

var WAIT_FOR_PLAYERS_MILLISEC = 10000; // 10 seconds to join

// create a game (accessed at GET http://localhost:8080/champboggle2015/startgame)
// --------------------------------------------------------------------------
router.get('/', function(req, res) {
    console.log('guest is calling startgame');
    
    var game = new GameCreator().createGame();
    
    res.json({ 
        letters: game.letters,
        checkinPoint: game.gameId});
});

module.exports = router;