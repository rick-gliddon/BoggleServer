var Node = require('./treenode');

function WordTree() {
	this.head = new Node();
}

WordTree.prototype = {

    constructor: WordTree,

    addWord: function(newWord, node) {
    	node = node || this.head;

		if (!newWord) {
			node.isWord = true;
			return;
		}
		var ch = newWord[0];
		if (!node.branches[ch]) {
			node.branches[ch] = new Node();
		}
		this.addWord(newWord.substring(1), 
			node.branches[ch]);
	},

	addWords: function(newWords) {
		for (var i = 0; i < newWords.length; i++) {
			this.addWord(newWords[i], this.head);
		}
	},

	getNode: function(withChar, fromNode) {
		fromNode = fromNode || this.head;
		return fromNode.branches[withChar];
	},

	toString: function(base, node) {
		base = base || '';
		node = node || this.head;

		var str = '';
		if (node.isWord) {
			str += base + ' ';
		}
		if (!node.branches) {
			return str;
		}
		for (var ch in node.branches) {
			str += this.toString(base + ch,
				node.branches[ch]);
		}
		return str;
	}
};

module.exports = WordTree;
