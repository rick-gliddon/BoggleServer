(function() {
    angular.module('play',[])
    .directive('bogglePlay', function() {
        
        return {
           
            restrict: 'E',
            scope: {
                nextstate: '&',
                letters: '=',
                checkinpoint: '='
            },
            templateUrl: 'play/play.html',
            controller: 'BogglePlayController',
            controllerAs: 'playCtrl'
        }            
    })
    .controller('BogglePlayController', ['$rootScope', '$scope', '$http', '$interval', '$window',
      function playController($rootScope, $scope, $http, $interval, $window) {
        var pc = this;

//        pc.GAME_DURATION = 180000;
        pc.GAME_DURATION = 30000;

        var width = $window.innerWidth;
        var height = $window.innerHeight;
        var fullbox = width > height ? width / 2 - 20 : height / 2 - 20;
        var box = isMobileBrowser() ? fullbox : 344;
        pc.diceWidth=Math.floor((box - 44) / 4);

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
        // TODO this needs to move into a function
        var playTimer;

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

            var checkinWords = { words: pc.wordList };
            $http.post('/champboggle2015/api/checkin/' + $scope.checkinpoint, checkinWords)
                .error(function() {
                    console.log('Error posting word list');
                })
                .success(function(data, status) {
                    console.log('Got success status: ' + status);
                    // TODO Try, try again
                });
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

        $scope.$watch('letters', function(newValue, oldValue) {
          if (!newValue) {
              return;
          }
          var newMatrix = [];
          for (var i = 0; i < 4; i++) {
            newMatrix[i] = [];
            for (var j = 0; j < 4; j++) {
              newMatrix[i][j] = new Die($scope.letters[i * 4 + j]);
            }
          }
          pc.matrix = newMatrix;
          playTimer = $interval(progressPlay, 1000);
        });

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