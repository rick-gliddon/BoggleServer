var Game = require('../models/game');
var BoggleEngine = require('../engine/boggleengine');

module.exports = function() {
    this.createGame = function() {
        // Create the Boggle Engine!!!
        var engine = new BoggleEngine();

        var startTime = new Date();
        var dd = pad(startTime.getDate());
        var MM = pad(startTime.getMonth() + 1);
        var yy = pad(startTime.getFullYear());
        var hh = pad(startTime.getHours());
        var mm = pad(startTime.getMinutes());
        var ss = pad(startTime.getSeconds());
        var mls = pad(startTime.getMilliseconds(), 3);

        var roll = engine.rollDice();
        var id = roll + yy + MM + dd + hh + mm + ss + mls;

        var game = new Game(); // create a new instance of the Game model
        game.gameId = id; 
        game.letters = roll;
        game.startTime = startTime;
        
        return game;
    };

    function pad(num, numDigits) {
        numDigits = numDigits || 2;
        var s = "00" + num;
        return s.substr(s.length - numDigits);
    }
};