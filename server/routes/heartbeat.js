var express = require('express');
var router = express.Router();
var Game = require('../models/game');
var Player = require('../models/player');

var GAME_RUN_LENGTH_MILLISEC = 180000;
var WAIT_FOR_PLAYERS_MILLISEC = 10000;
var HEARTBEAT_AGE_MILLISEC = 6000;

var STATES = {
    GAME_STARTED: 0, // ctx: {startedBy:String, secondsLeft:int}
    PLAYERS_WAITING: 1, // ctx: {players:[String]}
    GAME_IN_PROGRESS: 2, // ctx: {numGames:int, featuring:[String], secondsLeft:int}
    ALLS_QUIET: 3, // ctx: {}
};

router.put('/', function(req, res) {
    var player = req.user.name;
    console.log(player + ' heart beat');
    
    Player.update(
        {'username' : player},
        {$set : {'heartbeat' : new Date()}},
        function (err) {
            if (err) {
                console.log('Could not save heartbeat for player: ' + player + ': ' + err);
                res.status(500).send(err);
            }
            findRunningGames(player, res)        
        });
});

function findRunningGames(player, res) {
    
    var result = {
        state: null,
        ctx: null
    };
    
    Game.find(
        {'startTime':{'$gte': new Date(new Date().getTime() - GAME_RUN_LENGTH_MILLISEC)}})
            .select('startTime startedBy')
            .exec(function handleFindGameResult(err, runningGames) {
                if (err) {
                    console.log('Error searching for running game: ' + res);
                    res.status(500).send(err);
                    return;
                }
                var startedBy = null;
                var secondsLeft = 9999;
                var featuring = [];
                var numGames = 0;
                var currentTime = new Date().getTime();
                
                // Iterate through the currently running games
                for (var i = 0; i < runningGames.length; i++) {
                    var game = runningGames[i];
                    var gameSecondsLeft = calcSecondsLeft(
                            game.startTime.getTime(), currentTime, WAIT_FOR_PLAYERS_MILLISEC);
                    
                    // If the game has been running less than 10 seconds, there
                    // is still time to join.  Set startedBy and secondsLeft
                    // and break out of here.
                    if (gameSecondsLeft > 0) {
                        startedBy = game.startedBy;
                        secondsLeft = gameSecondsLeft;
                        break;
                    }
                    // Otherwise update the currently running games stats.
                    gameSecondsLeft = calcSecondsLeft(
                            game.startTime.getTime(), currentTime, GAME_RUN_LENGTH_MILLISEC);
                    
                    if (gameSecondsLeft < secondsLeft) {
                        secondsLeft = gameSecondsLeft;
                    }
                    featuring.push(game.startedBy);
                    numGames++;
                }
                
                if (startedBy === null) {
                    if (numGames > 0) {
                        // Could not find a game newly started so set result to the
                        // currently running games stats and go on to find the
                        // waiting players.
                        result.state = STATES.GAME_IN_PROGRESS;
                        result.ctx = {
                            numGames: numGames,
                            featuring: featuring,
                            secondsLeft: secondsLeft
                        };
                    }
                    findPlayersWaiting(player, result, res);
                    
                } else {
                    // We found a newly started game so set result with startedBy
                    // and secondsLeft and send the results to the console.
                    result.state = STATES.GAME_STARTED;
                    result.ctx = {
                        startedBy: startedBy,
                        secondsLeft: secondsLeft
                    };
                    res.json(result);
                }
    });
}

function findPlayersWaiting(player, result, res) {
    Player.find(
            {
                'heartbeat':{'$gte': new Date(new Date().getTime() - HEARTBEAT_AGE_MILLISEC)},
                'username':{'$ne': player}
            })
            .select('username')
            .sort('username')
            .exec(function handleFindPlayersWaitingResult(err, playersFound) {
                if (err) {
                    console.log('Error searching for waiting players: ' + res);
                    res.status(500).send(err);
                    return;
                }
                if (playersFound.length > 0) {
                    result.state = STATES.PLAYERS_WAITING;
                    result.ctx = {
                        players: playersFound.map(function(pFound) {
                            return pFound.username;
                        })
                    };
                } else if (result.state === null) {
                    result.state = STATES.ALLS_QUIET;
                    
                } // else use state defined in caller
                
                res.json(result);
    });
}
    
function calcSecondsLeft(startTime, currentTime, runLength) {
    return Math.floor((startTime + runLength - currentTime) / 1000);
}

module.exports = router;