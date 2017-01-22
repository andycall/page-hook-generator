let level1 = require('./src/level1');
let level2 = require('./src/level2');
let cheerio = require('cheerio');
let debug = require('debug')('dev');

module.exports = html => {
	let $ = cheerio.load(html, {
		decodeEntities: false,
		normalizeWhitespace: true
	});

	let level1Result = level1($);
	let titleSelector = level1Result.title;
	let dateString = level1Result.date;
	let contentSelector = level2($);

	if (process.env.DEBUG == 'dev') {
		let format = require('json-format');

		debug('generated params %s', format({
			title: titleSelector,
			date: dateString,
			content: contentSelector
		}))
	}

	return {
		title: titleSelector,
		date: dateString,
		content: contentSelector
	}
};