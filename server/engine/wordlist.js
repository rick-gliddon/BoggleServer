exports.createWordList = function(str) {
	var allWords = [];
	var strs = str.split('\n');
	for (var i = 0; i < strs.length; i++) {
		var words = strs[i].split(' ');
		for (var j = 0; j < words.length; j++) {
			if (words[j].trim() !== '') {
				allWords[allWords.length] = words[j].trim();
			}
		}
	}
	return allWords;
};
