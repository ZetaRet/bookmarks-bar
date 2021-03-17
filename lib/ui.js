/**
 * Author: Zeta Ret
 * Bookmarks Bar UI
 **/

function createTopEl() {
	var tel = document.createElement('div');
	tel.classList.add('bookmarks-bar-top-panel');
	tel.style.margin = '4px';
	return tel;
}

function createSpacer(space, styles) {
	var spacer = document.createElement('div');
	spacer.classList.add('bookmark-spacer');
	spacer.style.marginRight = space + 'px';
	if (styles)
		for (var k in styles) spacer.style[k] = styles[k];
	return spacer;
}

function createModalBtn(name) {
	var btn = document.createElement('div');
	btn.classList.add('bookmark-modal-btn');
	btn.innerText = name;
	return btn;
}

module.exports.createTopEl = createTopEl;
module.exports.createSpacer = createSpacer;
module.exports.createModalBtn = createModalBtn;