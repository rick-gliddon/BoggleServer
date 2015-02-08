var express = require('express');
var router = express.Router();
var Game = require('../models/game');
var Player = require('../models/player');

var WAIT_FOR_PLAYERS_MILLISEC = 10000;
var HEARTBEAT_AGE_MILLISEC = 6000;

router.put('/', function(req, res) {
    console.log('user ' + req.user.name + ' heart beat');
    
    var result = {
        playersWaiting: [],  // list of strings
        gameStartedBy: null, // string
        secondsLeft: null    // int
    };
    
    Game.findOne(
        {'startTime':{'$gte': new Date(new Date().getTime() - WAIT_FOR_PLAYERS_MILLISEC)}})
            .select('startTime startedBy')
            .exec(function handleFindGameResult(err, existingGame) {
                if (err) {
                    console.log('Error searching for running game: ' + res);
                    res.status(500).send(err);
                    return;
                }
                if (existingGame) {
                    result.gameStartedBy = existingGame.startedBy;
                    result.secondsLeft = new Date() - existingGame.secondsLeft;
                }
                
                findPlayersWaiting(req.user.name, result, res);
    });
});

function findPlayersWaiting(player, result, res) {
    Player.findAll(
            {
                'heartbeat':{'$gte': new Date(new Date().getTime() - HEARTBEAT_AGE_MILLISEC)},
                'username':{'$ne': player}
            })
            .select('username')
            .exec(function handleFindPlayersWaitingResult(err, playersFound) {
                if (err) {
                    console.log('Error searching for waiting players: ' + res);
                    res.status(500).send(err);
                    return;
                }
                if (playersFound) {
                    result.playersWaiting = playersFound.map(function(pFound) {
                        return pFound.username;
                    });
                }
    });
    res.json(result);
    
    saveHeartbeat(player);
}

function saveHeartbeat(player) {
    Player.update({'player' : player},
                  {$set : {'heartbeat' : new Date()}},
                  function (err) {
                      console.log('Could not save heartbeat for player: ' + player + ': ' + err);
                  });
}

module.exports = router;