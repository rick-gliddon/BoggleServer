(function() {
    angular.module('play',[])
    .directive('bogglePlay', function() {
        
        return {
           
            restrict: 'E',
            scope: {},
            templateUrl: 'play/play.html',
            controller: 'BogglePlayController',
            controllerAs: 'playCtrl'
        }            
    })
    .controller('BogglePlayController', 
    ['$rootScope', '$scope', '$http', '$interval', '$window', 'gameStateService', 'keyTypedService', 'wordFinder',
    function playController($rootScope, $scope, $http, $interval, $window, gameStateService, keyTypedService, wordFinder) {
        var KEY_BACKSPACE = 8;
        var KEY_ENTER = 13;
        var KEY_A = 65;
        var KEY_Z = 90;
        
        var pc = this;
        var player;
        var checkinPoint;
        var keyTypedServiceId;
        
        gameStateService.addCallback(
                gameStateService.states.PLAY, startPlay);

        pc.GAME_DURATION = 180000;
//        pc.GAME_DURATION = 30000;
        pc.MAX_POLL_TIME = 20000;

        var width = $window.innerWidth;
        var height = $window.innerHeight;
        var fullbox = width > height ? width / 2 - 20 : height / 2 - 20;
        var box = fullbox;// : 344;
        pc.diceWidth=Math.floor((box - 44) / 4);

        pc.fontSize=Math.floor(pc.diceWidth * 0.75);
        pc.uFontSize=Math.floor(pc.diceWidth * 0.46);

        pc.matrix;
        pc.coords;
        pc.formingDice = [];
        pc.wordList;
        
        var letterCoords;

        pc.timePlaying;
        pc.gameProgress;
        
        pc.uStyle = {
          'line-height' : '6rem',
          'font-size' : '3rem'
        };

        var startPlayTime;
        var playTimer;
        var startPollTime;

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
          addWordImpl();
        };
        
        function addWordImpl() {
          var word = pc.getFormingWord();
          if (word.length < 3) {
            // word too small.  Alert?
            return;
          }
          if (pc.wordList.indexOf(word) < 0) {
            pc.wordList.unshift(word);
          }
          // else already have word.  Alert?
          clearSelections();
        }
        
        function clearSelections() {
          while (pc.formingDice.length > 0) {
            pc.formingDice[0].selected = false;
            pc.formingDice.shift();
          } 
        }

        pc.click = function(die) {
          if (!isGameInPlay()) {
            return;
          }
          var dieIndex = pc.formingDice.indexOf(die);
          if (dieIndex < 0) {
            // Die not already selected.
            // Find last selected in matrix and ensure die is adjacent
            if (wordFinder.isAdjacent(die)) {
              die.selected = true;
              pc.formingDice.push(die);
            }
          } else if (dieIndex === (pc.formingDice.length - 1)) {
            // Die last selected. Unselect.
            die.selected = false;
            pc.formingDice.pop();
          }
        };

        function progressPlay() {
          if (!startPlayTime) {
            startPlayTime = new Date();
          }
          var currentTime = new Date();
          pc.timePlaying = currentTime - startPlayTime;
          pc.gameProgress = Math.floor(pc.timePlaying * 100 / pc.GAME_DURATION);
          if (!isGameInPlay()) {
              keyTypedService.removeCallback(keyTypedServiceId);
              if (pc.getFormingWord().length > 2) {
                  addWordImpl();
              }
              $interval.cancel(playTimer);
              postWords();
          }
        }

        function isGameInPlay() {
          return pc.timePlaying <= pc.GAME_DURATION;
        }
        
        function postWords() {
            var checkinWords = { words: pc.wordList };
            var baseUrl = player === 'guest' ?
                    '/champboggle2015/guest/checkin/' :
                    '/champboggle2015/api/checkin/';        
            $http.post(baseUrl + checkinPoint, checkinWords)
                .error(function() {
                    $window.alert('Error posting word list');
                })
                .success(function(finalResults, status) {
                    if (status === 202) {
                        if (!startPollTime) {
                            startPollTime = new Date();
                        }
                        var currentTime = new Date();
                        if (currentTime - startPollTime <= pc.MAX_POLL_TIME) {
                            console.log('Accepted, polling in 1 second');
                            $interval(postWords, 1000, 1);
                        } else {
                            $window.alert("Boggle Server has taken too long to respond");
                        }
                    } else {
                        console.log('Success, got final result');
                        var resultsContext = {
                           player: player,
                           matrix: pc.matrix,
                           wordList: pc.wordList,
                           finalResults: finalResults
                        };
                        reset();
                        gameStateService.nextState(resultsContext);
                    }
                });
        }
        
        function reset() {
            startPollTime = null;
            startPlayTime = null;
            pc.gameProgress = 0;
            clearSelections();
        }

        function startPlay(context) {
            initialise();
            player = context.player;
            checkinPoint = context.checkinPoint;
            keyTypedServiceId = keyTypedService.addCallback(keyTyped);
          
            var newMatrix = [];
            var letter;
            var die;
            var id;
            for (var i = 0; i < 4; i++) {
              newMatrix[i] = [];
              for (var j = 0; j < 4; j++) {
                letter = context.letters[i * 4 + j];
                id = i.toString() + j.toString();
                die = new Die(id, letter);
                newMatrix[i][j] = die;
                wordFinder.addLetterCoords(letter, i , j);
              }
            }
            pc.matrix = newMatrix;
            wordFinder.setMatrix(newMatrix);
            wordFinder.setFormingDice(pc.formingDice);
            playTimer = $interval(progressPlay, 1000);
        }
        
        function keyTyped(keyCode) {
            
            if (keyCode === KEY_BACKSPACE) {
                if (pc.formingDice.length > 0) {
                    pc.formingDice[pc.formingDice.length - 1].selected = false;
                    pc.formingDice.pop();
                }
                
            } else if (keyCode === KEY_ENTER) {
                pc.addWord();
                
            } else if (keyCode >= KEY_A && keyCode <= KEY_Z) {
                var letter = String.fromCharCode(keyCode).toLowerCase();
                var diceActions = wordFinder.addLetterList(
                        pc.formingDice.slice(), [letter]);
                if (diceActions.length > 0 
                        && diceActions[diceActions.length - 1].success) {
                    diceActions.pop(); // remove the success element
                    diceActions.forEach(function(dieAction) {
                        if (dieAction.added) {
                            dieAction.die.selected = true;
                            pc.formingDice.push(dieAction.die);
                        } else {
                            dieAction.die.selected = false;
                            pc.formingDice.pop();
                        }
                    });
                } else {
                    var letterList = [];
                    diceActions = [];
                    pc.formingDice.forEach(function(die) {
                        diceActions.push({die: die, added: false});
                        letterList.push(die.letter.toLowerCase());
                    });
                    letterList.push(letter);
                    // TODO Need to centralise this code.  True duplication.
                    diceActions = diceActions.concat(
                            wordFinder.addLetterList([], letterList));
                    if (diceActions.length > 0 
                            && diceActions[diceActions.length - 1].success) {
                        diceActions.pop(); // remove the success element
                        diceActions.forEach(function(dieAction) {
                            if (dieAction.added) {
                                dieAction.die.selected = true;
                                pc.formingDice.push(dieAction.die);
                            } else {
                                dieAction.die.selected = false;
                                pc.formingDice.pop();
                            }
                        });
                    }
                    
                }
            }
        }
        
        function initialise() {
            pc.matrix = [];
            pc.coords = {};
            pc.formingDice = [];
            pc.wordList = [];
            letterCoords = {};
            wordFinder.initialise();

            pc.timePlaying = 0;
            pc.gameProgress = 0;

            startPlayTime = null;
            playTimer = null;
            startPollTime = null;
        }
        
        function addLetterCoords(letter, i, j) {
            if (!letterCoords[letter]) {
                letterCoords[letter] = [];
            }
            letterCoords[letter].push({i:i, j:j});
        }

        function Die(id, letter) {
    //      this.letter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
          this.id = id;
          this.letter = letter.toUpperCase();
          this.rotation = Math.floor(Math.random() * 4) * 90;
          this.rplusw = this.rotation + Math.floor(Math.random() * 8) - 4;
          this.selected = false;
          this.underlineStyle = function() {
            return this.letter === 'M'
                || this.letter === 'W'
                || this.letter === 'N'
                || this.letter === 'Z' ? 'underline' : 'none';
          };
          this.style = {
            'background' : 'url(svg/dice' + this.rotation + 'deg.svg)',
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