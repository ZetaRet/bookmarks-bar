/**
 * Author: Zeta Ret
 * Bookmarks Bar Utils
 **/

function computeColor(color, gamma) {
	var r = parseInt(color.substr(1, 2), 16),
		g = parseInt(color.substr(3, 2), 16),
		b = parseInt(color.substr(5, 2), 16);
	gamma = parseInt(gamma);
	r = Math.min(255, r + gamma).toString(16);
	g = Math.min(255, g + gamma).toString(16);
	b = Math.min(255, b + gamma).toString(16);
	if (r.length === 1) r = '0' + r;
	if (g.length === 1) g = '0' + g;
	if (b.length === 1) b = '0' + b;
	return '#' + r + g + b;
}

function getRGBA(color, alpha) {
	var r = parseInt(color.substr(1, 2), 16),
		g = parseInt(color.substr(3, 2), 16),
		b = parseInt(color.substr(5, 2), 16);
	return 'rgba(' + [r, g, b, alpha].join(',') + ')';
}

module.exports.computeColor = computeColor;
module.exports.getRGBA = getRGBA;