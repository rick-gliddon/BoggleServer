(function() {
  var app = angular.module('bogglesim',[]);

  app.controller("PlayController", ['$http', '$interval', function($http, $interval) {
    var pc = this;

    pc.GAME_DURATION = 180000;

    pc.diceWidth=75;
    pc.fontSize=Math.floor(pc.diceWidth * 0.75);
    pc.uFontSize=Math.floor(pc.diceWidth * 0.46);

    pc.matrix = [];
    pc.coords = {};
    pc.formingDice = [];
    pc.wordList = [];

    pc.timePlaying = 0;
    pc.gameProgress = 0;

    pc.uStyle = {
      'line-height' : pc.diceWidth + 'px',
      'font-size' : pc.uFontSize + 'px'
    };

    var startTime;
    var playTimer = $interval(progressPlay, 1000);
    
    $http.get('/champboggle2015/startgame')
        .success(startGame)
        .error(function() {
            console.log('Error contacting server');
    });

    pc.getFormingWord = function() {
      return pc.formingDice
        .reduce(function(acc, curr, i, a) {
          var appending = curr.letter.toLowerCase();
          if (curr.letter === 'Q') {
            appending += 'u';
          }
          return acc + appending;
        }, '');
    };

    pc.addWord = function() {
      if (!isGameInPlay()) {
        return;
      }
      var word = pc.getFormingWord();
      if (word.length < 3) {
        // word too small.  Alert?
        return;
      }
      if (pc.wordList.indexOf(word) < 0) {
        pc.wordList.unshift(word);
      }
      // else already have word.  Alert?
      while (pc.formingDice.length > 0) {
        pc.formingDice[0].selected = false;
        pc.formingDice.shift();
      }
    };

    pc.click = function(die) {
      if (!isGameInPlay()) {
        return;
      }
      var dieIndex = pc.formingDice.indexOf(die);
      if (dieIndex < 0) {
        // Die not already selected.
        // Find last selected in matrix and ensure die is adjacent
        if (isAdjacent(die)) {
          die.selected = true;
          pc.formingDice.push(die);
        }
      } else if (dieIndex === (pc.formingDice.length - 1)) {
        // Die last selected. Unselect.
        die.selected = false;
        pc.formingDice.pop();
      }
    };

    pc.keyTyped = function($event) {
      console.log("Key typed: " + $event.keyCode);
    };

    function progressPlay() {
      if (!startTime) {
        startTime = new Date();
      }
      var currentTime = new Date();
      pc.timePlaying = currentTime - startTime;
      pc.gameProgress = Math.floor(pc.timePlaying * 100 / pc.GAME_DURATION);
      if (!isGameInPlay()) {
        $interval.cancel(playTimer);
      }
    }

    function isGameInPlay() {
      return pc.timePlaying <= pc.GAME_DURATION;
    }

    function isAdjacent(die) {
      if (!pc.formingDice.length) {
        return true;
      }
      var lastDie = pc.formingDice[pc.formingDice.length - 1];
      var found = false;
      var i, j;
      for (i = 0; i < pc.matrix.length; i++) {
        for (j = 0; j < pc.matrix[i].length; j++) {
          if (pc.matrix[i][j] === lastDie) {
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      }

      var isAdjacent = false;
      if (found) {
        for (var di = -1; !isAdjacent && di <= 1; di++) {
          for (var dj = -1; !isAdjacent && dj <= 1; dj++) {
            if (di === 0 && dj === 0) {
              continue;
            }
            var posi = i + di;
            var posj = j + dj;
            isAdjacent = posi >= 0 && posi < pc.matrix.length
                && posj >= 0 && posj < pc.matrix[posi].length
                && die === pc.matrix[posi][posj];
          }
        }
      }
      return isAdjacent;
    }

    function startGame(data) {
      console.log(data.letters);
      console.log(data.checkinPoint);
      
      var newMatrix = [];
      for (var i = 0; i < 4; i++) {
        newMatrix[i] = [];
        for (var j = 0; j < 4; j++) {
          newMatrix[i][j] = new Die(data.letters[i * 4 + j]);
        }
      }
      pc.matrix = newMatrix;
    }

    function Die(letter) {
//      this.letter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
      this.letter = letter.toUpperCase();
      this.rotation = Math.floor(Math.random() * 4) * 90;
      this.rplusw = this.rotation + Math.floor(Math.random() * 7) - 3;
      this.selected = false;
      this.underlineStyle = function() {
        return this.letter === 'M'
            || this.letter === 'W'
            || this.letter === 'N'
            || this.letter === 'Z' ? 'underline' : 'none';
      };
      this.style = {
        'width' : pc.diceWidth + 'px',
        'height' : pc.diceWidth + 'px',
        'background' : 'url(dice' + this.rotation + 'deg.svg)',
        'background-size' : pc.diceWidth + 'px ' + pc.diceWidth + 'px',
        'line-height' : pc.diceWidth + 'px',
        'font-size' : pc.fontSize + 'px',
        '-ms-transform' : 'rotate(' + this.rplusw + 'deg)',
        '-webkit-transform' : 'rotate(' + this.rplusw + 'deg)',
        'transform' : 'rotate(' + this.rplusw + 'deg)',
        'text-decoration' : this.underlineStyle()
      };
      this.isQ = function() {
        return this.letter === 'Q';
      };
    }

  }]);

})();

