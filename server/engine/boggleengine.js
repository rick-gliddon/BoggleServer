module.exports = function() {
	
	this.newDice = function() {
		return ['aaeegn', 
	            'elrtty', 
	            'aoottw', 
	            'abbjoo',
	            'ehrtvw',
	            'cimotu',
	            'distty',
	            'eiosst',
	            'delrvy',
	            'achops',
	            'himnqu',
	            'eeinsu',
	            'eeghnw',
	            'affkps',
	            'hlnnrz',
	            'deilrx'];
	};

	this.rollDice = function() {
		var diceList = this.newDice();
		var roll = '';
		while (diceList.length) {
			var index = Math.floor(Math.random() * diceList.length);
			var die = diceList[index];
			roll += die[Math.floor(Math.random() * 6)]; // six sides on a die
			diceList.splice(index, 1);
		}
		return roll;
	};

	this.duplicateMatrix = function(source) {
		var dest = [];
		for (var i = 0; i < source.length; i++) {
			dest[i] = source[i].slice();
		}
		return dest;
	};

	this.solveFor = function(matrix, startPos, baseWord, visited, treeNode) {
		var solutionList = [];
		var directions = [[-1, -1], [-1, 0], [-1, 1],
		                  [ 0, -1],          [ 0, 1],
		                  [ 1, -1], [ 1, 0], [ 1, 1]];
		var formingWord = baseWord + matrix[startPos[0]][startPos[1]];
		if (treeNode.isWord) {
			solutionList.push(formingWord);
		}
		visited[startPos[0]][startPos[1]] = true;

		while (directions.length) {
			var direction = directions[0];
			var x = startPos[0] + direction[0];
			var y = startPos[1] + direction[1];
			
			if (x >= 0 && y >= 0 && x < visited.length && y < visited[0].length
				       && !visited[x][y]) {

				var nextNode = treeNode.branches[matrix[x][y]];
				if (nextNode) {
					solutionList = solutionList.concat(this.solveFor(matrix, [x, y], formingWord, this.duplicateMatrix(visited), nextNode));
				}
			}
			directions.shift();
		}
		return solutionList;
	};

	this.solveMatrix = function(matrix, wordTree) {
		var solutionList = [];
		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				var visited = [[false, false, false, false],
				               [false, false, false, false],
				               [false, false, false, false],
				               [false, false, false, false]];
				var startWord = '';
				var treeNode = wordTree.getNode(matrix[i][j]);
				solutionList = solutionList.concat(this.solveFor(matrix, [i, j], startWord, this.duplicateMatrix(visited), treeNode));
			}
		}
		return solutionList;
	};

	this.solve = function(roll, wordTree) {
		var matrix = [];
		for (var i = 0; i < 4; i++) {
			matrix[i] = [];
			for (var j = 0; j < 4; j++) {
				matrix[i][j] = roll[i * 4 + j];
			}
		}

		solutionList = this.solveMatrix(matrix, wordTree);
		
		return solutionList.sort().filter(function(item, pos) {
			return !pos || item !== solutionList[pos - 1];
		});
	};

	this.toString = function(roll) {
		var str = '';
		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				str += roll[i * 4 + j] + ' ';
			}
			str += '\n';
		}
		return str;
	};
        
        this.calculateScore = function(word) {
            var score;
            if (word.length < 3) {
                score = 0;
            } else if (word.length === 3 || word.length === 4) {
                score = 1;
            } else {
                score = word.length - 3;
            }
            return score;
        };
};