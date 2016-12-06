let level1 = require('./src/level1');
let level2 = require('./src/level2');
let cheerio = require('cheerio');

module.exports = html => {
	let $ = cheerio.load(result.html, {
		decodeEntities: false,
		normalizeWhitespace: true
	});

	let level1Result = level1($);
	let titleSelector = level1Result.title;
	let dateString = level1Result.date;
	let contentSelector = level2($);

	return {
		title: titleSelector,
		date: dateString,
		content: contentSelector
	}
};