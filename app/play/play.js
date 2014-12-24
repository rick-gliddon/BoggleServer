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
    ['$rootScope', '$scope', '$http', '$interval', '$window', 'gameStateService', 'keyTypedService',
    function playController($rootScope, $scope, $http, $interval, $window, gameStateService, keyTypedService) {
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
        var box = isMobileBrowser() ? fullbox : 344;
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
          'line-height' : pc.diceWidth + 'px',
          'font-size' : pc.uFontSize + 'px'
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
            $http.post('/champboggle2015/api/checkin/' + checkinPoint, checkinWords)
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
        }

        function isAdjacent(die, diceList) {
            diceList = diceList || pc.formingDice;
            if (!diceList.length) {
                return true;
            }
            var lastDie = diceList[diceList.length - 1];
            // TODO Make id an object, i,j
            var lasti = Number(lastDie.id[0]);
            var lastj = Number(lastDie.id[1]);
            var newi = Number(die.id[0]);
            var newj = Number(die.id[1]);
          
            return Math.abs(newi - lasti) <= 1 
                && Math.abs(newj - lastj) <= 1;
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
                addLetterCoords(letter, i , j);
              }
            }
            pc.matrix = newMatrix;
            playTimer = $interval(progressPlay, 1000);
        }
        
        function keyTyped(keyCode) {
            if (keyCode === KEY_BACKSPACE) {
                if (pc.formingDice.length > 0) {
                    pc.formingDice[pc.formingDice.length - 1].selected = false;
                    pc.formingDice.pop();
                }
            } else if (keyCode === KEY_ENTER) {
                if (pc.formingDice.length > 2) {
                    pc.addWord();
                }
            } else if (keyCode >= KEY_A && keyCode <= KEY_Z) {
                var letter = String.fromCharCode(keyCode).toLowerCase();
                var diceActions = addLetterListNoBackout(
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
                            addLetterListNoBackout([], letterList));
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
        
        // TODO Rename method
        function addAdjacentDieNoBackout(coordsList, diceList, letterList) {
            if (coordsList.length === 0) {
                // Run out of coordinates.  Return empty list.
                return [];
            }
            // Get the die from the head coords
            var die = pc.matrix[coordsList[0].i][coordsList[0].j];
            // If the die is already selected, try the next coords
//            if (die.selected) {
            if (diceList.indexOf(die) >= 0) {
                return addAdjacentDieNoBackout(
                        coordsList.slice(1), diceList, letterList);
            }
            // If the die is adjacent to the last die in the dice list then call
            // addLetterListNoBackout to continue evaluating letters.
            if (isAdjacent(die, diceList)) {
                var diceListCopy = diceList.slice();
                diceListCopy.push(die);
                var diceActions = [{die: die, added: true}]
                                   .concat(addLetterListNoBackout(diceListCopy, 
                                                         letterList.slice(1)));
                
                // If evaluation was successful, return the dice actions.
                // Otherwise try the next coords
                if (diceActions[diceActions.length - 1].success) {
                    return diceActions;
                } else {
                    return addAdjacentDieNoBackout(
                            coordsList.slice(1), diceList, letterList);
                }
            }
            // Coords were not adjacent so try the next coords
            return addAdjacentDieNoBackout(coordsList.slice(1), diceList, letterList);
        }
        
        // TODO Rename method
        function addLetterListNoBackout(diceList, letterList) {
            // If we've depleted the letter list then, success!
            if (letterList.length === 0) {
                return [{success: true}];
            }
            // Get the next letter and coordinates of the occurences of that
            // letter
            var letter = letterList[0];
            var die = null;
            var coordsList = letterCoords[letter];
            
            // If there are occurences of the letter then add the letters in
            // the list using the coords list.
            if (coordsList) {
                return addAdjacentDieNoBackout(coordsList, diceList, letterList);
            } else {
                return [];
            }
        }
        
        function initialise() {
            pc.matrix = [];
            pc.coords = {};
            pc.formingDice = [];
            pc.wordList = [];
            letterCoords = {};

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
            'background' : 'url(svg/dice' + this.rotation + 'deg.svg)',
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

        function isMobileBrowser() {
            var check = false;
            (function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        }    
    }]);
})();