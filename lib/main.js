/**
 * Author: Zeta Ret
 * Date: 2018 - Today
 * Bookmarks Bar package for Atom IDE
 **/

var path = require('path'),
	electron = require('electron');
var cfg = {
		packageid: 'bookmarks-bar'
	},
	nskey = cfg.packageid + '.',
	cfgkeys = ['bookmarks', 'textColor', 'textGamma', 'fontSize', 'priority', '__jsondata', '__jsonpath', 'reverseFolderPaths', 'showIcons', 'textHoverColor'],
	disposables = null,
	cfgobserve = {},
	fs = null,
	css = [
		'.bookmark-button { cursor: pointer; display: inline-block; padding-right: 3px; border-radius: 2px; font-weight: bold; }',
		'.bookmark-spacer { display: inline-block; width: 0px; height: 1px; }',
		'.bookmark-folder-btn { cursor: pointer; display: inline-block; padding: 0 2px; border-radius: 2px; }',
		'.bookmark-file-btn { cursor: pointer; display: inline-block; padding: 0 2px; border-radius: 2px; }',
		'.bookmark-modal-btn { background: #040404; color: #e4e4e4; cursor: pointer; padding: 7px; display: inline-block; border-radius: 6px; }',
		'.bookmark-modal-btn:hover { background: #1b1b1b; color: #fafafa; }',
		'.zetaretbookmarksbarselect { width: 100%; color: #000; background-color: #fff; border: none; padding: 2px; display: block; border-radius: 2px; }',
		'.zetaretbookmarksbarinput { width: 100%; color: #000; background-color: #fff; border: none; padding: 2px; display: block; border-radius: 2px; }',
		'.f-inp, .c-inp { color: #000; background: #fff; border: none; padding: 2px; margin: 2px; border-radius: 2px; }',
		'.f-lab { display: inline-block; min-width: 50px; }',
		'.f-save, .f-cancel { margin: 10px; }',
		'.folder-modal-select { width: 100%; color: #000; background-color: #fff; border: none; padding: 2px; margin-top: 10px; border-radius: 2px; }',
		'.folder-modal-name { display: inline-block; margin: 2px; font-weight: bold; }',
		'.bookmark-save-folder { margin-left: 4px; border: none; background-color: #040404; padding: 2px 13px; color: #e4e4e4; border-radius: 5px; cursor: pointer; }',
		'.bookmark-save-folder:hover { background-color: #1b1b1b; color: #fafafa; }'
	];
var jsondata, topEl, topPanel, items = {};

function cfgGet(name) {
	cfg[name] = atom.config.get(nskey + name);
}

function cfgSet(name, v) {
	cfg[name] = v;
	atom.config.set(nskey + name, v);
}

function getAllCfg() {
	cfgkeys.forEach(function(el) {
		cfgGet(el);
	});
}

function updateJsonData() {
	var jd = JSON.stringify(jsondata || {});
	if (cfg.__jsonpath) {
		if (!fs) {
			fs = require('fs');
		}
		if (fs) {
			try {
				fs.writeFile(cfg.__jsonpath, jd, function(err) {
					if (err) {
						cfgSet('__jsondata', jd);
						return;
					} else {
						cfgSet('__jsondata', '');
						cfgobserve.__jsonpath();
					}
				});
			} catch (err) {
				cfgSet('__jsondata', jd);
			}
		}
	} else {
		cfgSet('__jsondata', jd);
	}
}

function findFile(pathx) {
	var i, j, f, fd, loc = [];
	if (jsondata) {
		if (jsondata.files && jsondata.files.length > 0) {
			for (i = 0; i < jsondata.files.length; i++) {
				f = jsondata.files[i];
				if (f && f.p === pathx) loc.push({
					target: f,
					index: i,
					type: 'file'
				});
			}
		}
		if (jsondata.folders && jsondata.folders.length > 0) {
			for (i = 0; i < jsondata.folders.length; i++) {
				fd = jsondata.folders[i];
				if (fd && fd.f && fd.f.length > 0) {
					for (j = 0; j < fd.f.length; j++) {
						f = fd.f[j];
						if (f && f.p === pathx) loc.push({
							target: f,
							index: j,
							folderindex: i,
							folder: fd,
							type: 'folder'
						});
					}
				}
			}
		}
	}
	return loc;
}

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

function createStarModal() {
	var item = document.createElement('div'),
		desc = document.createElement('div'),
		otherlocitem = document.createElement('div'),
		editor = atom.workspace.getActiveTextEditor(),
		p, f = jsondata.folders,
		sel = '<select class="file-select zetaretbookmarksbarselect">';
	if (editor) {
		p = editor.getPath();
	}
	if (f) {
		sel += '<option value="none"></option>';
		f.forEach(function(el, index) {
			sel += '<option value="' + index + '">' + el.n.split(new RegExp('<|>')).join('') + '</option>';
		});
	}
	sel += '</select>';
	var newfolder = '<b>Create new folder:</b> ' +
		'<input class="folder-input zetaretbookmarksbarinput" type="text"/>';
	desc.innerHTML = p ? '<b>Bookmark editor:</b><br/>' + p + '<br/><br/><b>Select folder:</b> ' + sel + '<br/>' + newfolder :
		'<b>You can not bookmark this tab.</b>';
	desc.style.padding = '20px';
	desc.style.wordWrap = 'break-word';
	item.appendChild(desc);
	item.appendChild(otherlocitem);
	var input = desc.getElementsByClassName('zetaretbookmarksbarinput')[0];
	if (input) {
		input.maxLength = 100;
		input.addEventListener('keydown', function(e) {
			e.stopImmediatePropagation();
		});
	}
	var buttons = document.createElement('div');
	buttons.style.padding = '20px';
	item.appendChild(buttons);
	if (p) {
		var starbtn = createModalBtn('Star'),
			otherloc = findFile(p),
			olstr = [];

		otherloc.forEach(function(el) {
			if (el.type === 'file') {
				olstr.push('File array at index of <b>' + el.index + '</b>.');
			} else if (el.type === 'folder') {
				olstr.push('Folder <b>' + el.folder.n + '</b> with folder index <b>' + el.folderindex + '</b> at file index of <b>' + el.index + '</b>.');
			}
		});
		if (olstr.length > 0) {
			otherlocitem.style.padding = '20px';
			otherlocitem.innerHTML = '<b>File is already in</b>:<br/>' + olstr.join('<br/>');
		}

		if (cfg.showIcons === 'yes') {
			starbtn.classList.add('icon');
			starbtn.classList.add('icon-star');
		}
		starbtn.addEventListener('click', function(e) {
			var finp = item.getElementsByClassName('folder-input')[0],
				fsel = item.getElementsByClassName('file-select')[0],
				fval = finp.value,
				n = p.split(path.sep).pop();
			if (fval) {
				jsondata.folders.push({
					n: fval,
					f: [{
						n: n,
						p: p
					}]
				});
			} else {
				var fselv = fsel.value;
				if (fselv === 'none') {
					jsondata.files.push({
						n: n,
						p: p
					});
				} else {
					var index = parseInt(fselv);
					if (!jsondata.folders[index].f) jsondata.folders[index].f = [];
					jsondata.folders[index].f.push({
						n: n,
						p: p
					});
				}
			}
			updateJsonData();
			item._panel.destroy();
		});
		buttons.appendChild(starbtn);
		buttons.appendChild(createSpacer(20));
	}
	var closebtn = createModalBtn('Close');
	if (cfg.showIcons === 'yes') {
		closebtn.classList.add('icon');
		closebtn.classList.add('icon-circle-slash');
	}
	closebtn.addEventListener('click', function(e) {
		item._panel.destroy();
	});
	buttons.appendChild(closebtn);

	return item;
}

function createFileModal(fbtn) {
	var item = document.createElement('div'),
		desc = document.createElement('div'),
		p = fbtn._path;
	desc.innerHTML = p ? '<b>Selected editor:</b><br/>' + p.split(new RegExp('<|>')).join('') :
		'<b>You can not open this editor. Path is broken or missing.</b>';
	desc.style.padding = '20px';
	desc.style.wordWrap = 'break-word';
	item.appendChild(desc);
	var buttons = document.createElement('div');
	buttons.style.padding = '20px';
	item.appendChild(buttons);
	if (p) {
		var viewbtn = createModalBtn('View');
		if (cfg.showIcons === 'yes') {
			viewbtn.classList.add('icon');
			viewbtn.classList.add('icon-eye');
		}
		viewbtn.addEventListener('click', function(e) {
			if (p) {
				atom.workspace.open(p);
				item._panel.destroy();
			}
		});
		buttons.appendChild(viewbtn);
		buttons.appendChild(createSpacer(20));
	}
	var closebtn = createModalBtn('Close');
	if (cfg.showIcons === 'yes') {
		closebtn.classList.add('icon');
		closebtn.classList.add('icon-circle-slash');
	}
	closebtn.addEventListener('click', function(e) {
		item._panel.destroy();
	});
	buttons.appendChild(closebtn);
	var delbtn = createModalBtn('Delete');
	delbtn.style.cssFloat = 'right';
	if (cfg.showIcons === 'yes') {
		delbtn.classList.add('icon');
		delbtn.classList.add('icon-trashcan');
	}
	delbtn.addEventListener('click', function(e) {
		jsondata.files.splice(fbtn._index, 1);
		updateJsonData();
		item._panel.destroy();
	});
	buttons.appendChild(delbtn);

	return item;
}

function createFolderModal(fbtn) {
	var item = document.createElement('div'),
		desc = document.createElement('div'),
		f = fbtn._files,
		sel = '<select class="file-select folder-modal-select">';
	if (f) {
		var rp = cfg.reverseFolderPaths || 'no';
		f.forEach(function(el, index) {
			var op = el.p.split(new RegExp('<|>')).join('');
			if (rp === 'yes') op = op.split(path.sep).reverse().join(path.sep);
			sel += '<option value="' + index + '">' + op + '</option>';
		});
	}
	sel += '</select>';
	desc.innerHTML = '<b>Current folder:</b>' +
		'<div><span class="folder-name folder-modal-name">' +
		(fbtn._name.split(new RegExp('<|>')).join('') || '[Unnamed Folder]') +
		'</span></div><br/>' +
		(f && f.length > 0 ? '<b>Select editor:</b><br/>' + sel : '<b>No files in this folder.</b>');
	desc.style.padding = '20px';
	desc.style.wordWrap = 'break-word';
	item.appendChild(desc);
	var fnel = item.getElementsByClassName('folder-name')[0];
	if (fnel) {
		fnel.style.cursor = 'pointer';
		fnel.setAttribute('title', 'Click to change folder name');
		fnel.addEventListener('click', function(e) {
			var iv, cv, p = fnel.parentNode,
				pc = [].slice.call(p.children);
			p.innerHTML = "<span class='f-lab'>Name: </span><input class='f-inp' type='text'/><br/>" +
				"<span class='f-lab'>Color: </span><input class='c-inp' placeholder='#FFFFFF' type='text'/><br/>" +
				"<input class='f-save' type='button' value='Save'/>" +
				"<input class='f-cancel' type='button' value='Cancel'/>";
			var input = p.getElementsByClassName('f-inp')[0],
				cinput = p.getElementsByClassName('c-inp')[0],
				btn = p.getElementsByClassName('f-save')[0],
				cbtn = p.getElementsByClassName('f-cancel')[0];

			function getfdata() {
				if (!iv) iv = input.value;
				if (!cv) cv = cinput.value;
				var hx = '[0-9A-Fa-f]';
				if (!cv.match(new RegExp('^[#]' + hx.repeat(6) + '$'))) cv = null;
				savefinp();
			}

			function savefinp() {
				var ff = jsondata.folders[fbtn._index];
				ff.n = iv;
				if (cv) ff.c = cv;
				else delete ff.c;
				updateJsonData();
				item._panel.destroy();
			}

			function revert() {
				p.innerHTML = '';
				pc.forEach(el => p.appendChild(el));
			}

			input.maxLength = 100;
			cinput.maxLength = 100;
			input.addEventListener('keydown', function(e) {
				if (e.keyCode === 13) getfdata();
				e.stopImmediatePropagation();
			});
			cinput.addEventListener('keydown', function(e) {
				if (e.keyCode === 13) getfdata();
				e.stopImmediatePropagation();
			});
			input.focus();
			input.value = fbtn._name;
			cinput.value = fbtn._color || '';
			input.setAttribute('title', 'Change name. Press `Enter` to save folder');
			cinput.setAttribute('title', 'Change color. Press `Enter` to save folder');
			btn.classList.add('bookmark-save-folder');
			btn.setAttribute('title', 'Click to save new folder name');
			btn.addEventListener('mousedown', function(e) {
				getfdata();
			});
			cbtn.classList.add('bookmark-save-folder');
			cbtn.setAttribute('title', 'Click to cancel edit folder');
			cbtn.addEventListener('mousedown', function(e) {
				revert();
			});
		});
	}
	var buttons = document.createElement('div');
	buttons.style.padding = '20px';
	item.appendChild(buttons);
	if (f && f.length > 0) {
		var viewbtn = createModalBtn('View');
		if (cfg.showIcons === 'yes') {
			viewbtn.classList.add('icon');
			viewbtn.classList.add('icon-eye');
		}
		viewbtn.addEventListener('click', function(e) {
			var p, fsel = item.getElementsByClassName('file-select')[0];
			try {
				p = fbtn._files[parseInt(fsel.value)].p;
			} catch (err) {}
			if (p) atom.workspace.open(p);
			item._panel.destroy();
		});
		buttons.appendChild(viewbtn);
		buttons.appendChild(createSpacer(20));
	}
	var closebtn = createModalBtn('Close');
	if (cfg.showIcons === 'yes') {
		closebtn.classList.add('icon');
		closebtn.classList.add('icon-circle-slash');
	}
	closebtn.addEventListener('click', function(e) {
		item._panel.destroy();
	});
	buttons.appendChild(closebtn);
	if (f && f.length > 0) {
		var deledbtn = createModalBtn('Delete selected editor');
		deledbtn.style.cssFloat = 'right';
		if (cfg.showIcons === 'yes') {
			deledbtn.classList.add('icon');
			deledbtn.classList.add('icon-trashcan');
		}
		deledbtn.addEventListener('click', function(e) {
			var fsel = item.getElementsByClassName('file-select')[0];
			fbtn._files.splice(parseInt(fsel.value), 1);
			updateJsonData();
			item._panel.destroy();
		});
		buttons.appendChild(deledbtn);
		buttons.appendChild(createSpacer(20, {
			cssFloat: 'right'
		}));
	}
	var delbtn = createModalBtn('Dispose folder');
	delbtn.style.cssFloat = 'right';
	if (cfg.showIcons === 'yes') {
		delbtn.classList.add('icon');
		delbtn.classList.add('icon-flame');
	}
	delbtn.addEventListener('click', function(e) {
		jsondata.folders.splice(fbtn._index, 1);
		updateJsonData();
		item._panel.destroy();
	});
	buttons.appendChild(delbtn);
	return item;
}

function createStarBtn() {
	var starbtn = document.createElement('div');
	starbtn.classList.add('bookmark-button');
	if (cfg.showIcons === 'yes') {
		starbtn.classList.add('icon');
		starbtn.classList.add('icon-star');
	}
	starbtn.innerText = 'Bookmark';
	starbtn.setAttribute('title', 'Bookmark this editor');
	starbtn.addEventListener('mouseover', function(e) {
		starbtn.style.background = getRGBA(cfg.textHoverColor, 0.11);
	});
	starbtn.addEventListener('mouseout', function(e) {
		starbtn.style.background = null;
	});
	starbtn.addEventListener('click', function(e) {
		var mitem = createStarModal(),
			panel = atom.workspace.addModalPanel({
				item: mitem
			});
		var input = mitem.getElementsByClassName('zetaretbookmarksbarinput')[0];
		if (input) input.focus();
		panel.onDidChangeVisible(function(e) {
			if (!panel.isVisible()) {
				try {
					panel.destroy();
				} catch (err) {}
			}
		});
		mitem._panel = panel;
	});
	return starbtn;
}

function createFolderBtn(name, files, index, fd) {
	var fbtntitle, fbtn = document.createElement('div');
	fbtn.classList.add('bookmark-folder-btn');
	if (cfg.showIcons === 'yes') {
		fbtn.classList.add('icon');
		fbtn.classList.add('icon-file-directory');
	}
	fbtn.innerText = name.split(new RegExp('<|>')).join('') || '[Unnamed Folder]';
	fbtn._index = index;
	fbtn._files = files;
	fbtn._name = name;
	fbtn._color = fd.c;
	if (fd.c) {
		fbtn.style.color = fd.c;
		fbtn.style.fontWeight = 'bold';
	}
	fbtntitle = [
		'Click to access folder modal of ' + name,
		'[CTRL + Click] to open all files in editor',
		'[ALT|SHIFT + Click] to open all files in explorer'
	];
	fbtn.setAttribute('title', fbtntitle.join('\n'));
	fbtn.addEventListener('mouseover', function(e) {
		fbtn.style.background = getRGBA(cfg.textHoverColor, 0.11);
	});
	fbtn.addEventListener('mouseout', function(e) {
		fbtn.style.background = null;
	});
	fbtn.addEventListener('click', function(e) {
		if (e.ctrlKey || e.metaKey) {
			if (files && files.length > 0) {
				files.forEach(function(el) {
					if (el.p) atom.workspace.open(el.p);
				});
			}
		} else if (e.altKey || e.shiftKey) {
			if (files && files.length > 0) {
				files.forEach(function(el) {
					if (el.p) electron.shell.showItemInFolder(el.p);
				});
			}
		} else {
			var mitem = createFolderModal(fbtn),
				panel = atom.workspace.addModalPanel({
					item: mitem
				});
			panel.element.style.minWidth = '580px';
			panel.onDidChangeVisible(function(e) {
				if (!panel.isVisible()) {
					try {
						panel.destroy();
					} catch (err) {}
				}
			});
			mitem._panel = panel;
		}
	});
	return fbtn;
}

function createFileBtn(name, pathx, index) {
	var fbtntitle, fbtn = document.createElement('div');
	fbtn.classList.add('bookmark-file-btn');
	if (cfg.showIcons === 'yes') {
		fbtn.classList.add('icon');
	}
	fbtntitle = [
		'Click to view file modal of ' + pathx,
		'[CTRL + Click] to open in editor',
		'[ALT|SHIFT + Click] to open in explorer'
	];
	fbtn.setAttribute('title', fbtntitle.join('\n'));
	var p = pathx,
		ext, n, icon;
	if (p) {
		p = p.split(path.sep);
		n = p.pop();
		ext = n.split('.').pop();
	}
	if (ext === 'md') icon = 'icon-book';
	else icon = 'icon-file-text';
	if (cfg.showIcons === 'yes') {
		fbtn.classList.add(icon);
	}
	fbtn.innerText = name.split(new RegExp('<|>')).join('');
	fbtn._index = index;
	fbtn._name = name;
	fbtn._path = pathx;
	fbtn.addEventListener('mouseover', function(e) {
		fbtn.style.background = getRGBA(cfg.textHoverColor, 0.11);
	});
	fbtn.addEventListener('mouseout', function(e) {
		fbtn.style.background = null;
	});
	fbtn.addEventListener('click', function(e) {
		if (e.ctrlKey || e.metaKey) {
			if (pathx) atom.workspace.open(pathx);
		} else if (e.altKey || e.shiftKey) {
			if (pathx) electron.shell.showItemInFolder(pathx);
		} else {
			var mitem = createFileModal(fbtn),
				panel = atom.workspace.addModalPanel({
					item: mitem
				});
			panel.onDidChangeVisible(function(e) {
				if (!panel.isVisible()) {
					try {
						panel.destroy();
					} catch (err) {}
				}
			});
			mitem._panel = panel;
		}
	});
	return fbtn;
}

function readJSONDataFromCFG() {
	if (cfg.__jsonpath) {
		if (!fs) {
			fs = require("fs");
		}
		try {
			if (fs.existsSync(cfg.__jsonpath)) {
				var rjd = fs.readFileSync(cfg.__jsonpath);
				try {
					jsondata = JSON.parse(rjd) || {};
				} catch (err) {
					jsondata = {};
				}
			} else {
				jsondata = {};
			}
		} catch (err) {
			jsondata = {};
		}
	} else {
		try {
			jsondata = JSON.parse(cfg.__jsondata) || {};
		} catch (err) {
			jsondata = {};
		}
	}
	if (!jsondata.folders || jsondata.folders.constructor !== Array) jsondata.folders = [];
	if (!jsondata.files || jsondata.files.constructor !== Array) jsondata.files = [];
}

function decorateTopEl() {
	items = {
		folders: [],
		files: []
	};
	jsondata = null;
	readJSONDataFromCFG();

	items.starbtn = createStarBtn();
	topEl.appendChild(items.starbtn);
	topEl.appendChild(createSpacer(15));

	jsondata.folders.forEach(function(el, index) {
		if (el && el.constructor === Object) items.folders.push(createFolderBtn(el.n, el.f, index, el));
	});
	items.folders.forEach(function(el) {
		topEl.appendChild(el);
		topEl.appendChild(createSpacer(5));
	});
	jsondata.files.forEach(function(el, index) {
		if (el && el.constructor === Object) items.files.push(createFileBtn(el.n, el.p, index));
	});
	items.files.forEach(function(el) {
		topEl.appendChild(el);
		topEl.appendChild(createSpacer(5));
	});
}

function createTopPanel() {
	if (topPanel) topPanel.destroy();
	topEl = createTopEl();
	var paneEl = document.createElement('div');
	paneEl.classList.add('bookmarks-bar-panel-item');
	var cssEl = document.createElement('style');
	cssEl.innerText = css.join('');
	paneEl.appendChild(cssEl);
	paneEl.appendChild(topEl);
	topPanel = atom.workspace.addTopPanel({
		item: paneEl,
		priority: cfg.priority === 'default' ? 100 : cfg.priority
	});
}

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

function initPackage() {
	recreateBookmarksBar();
}

function destroyPackage() {
	if (topPanel) {
		topPanel.destroy();
		topPanel = null;
	}
}

function unloadPackage() {
	destroyPackage();
	for (var k in disposables) disposables[k].dispose();
	disposables = null;
}

function initDisposables() {
	if (disposables) return;
	disposables = {};
	cfgkeys.forEach(function(el) {
		disposables['cfg_' + el] = atom.config.observe(nskey + el, function(v) {
			cfgGet(el);
			if (cfgobserve[el]) cfgobserve[el](v);
		});
	});
	disposables.activate = atom.packages.onDidActivatePackage(function(pack) {
		if (pack.name === cfg.packageid) {
			initPackage();
			initDisposables();
		}
	});
	disposables.deactivate = atom.packages.onDidDeactivatePackage(function(pack) {
		if (pack.name === cfg.packageid) {
			destroyPackage();
		}
	});
	disposables.unload = atom.packages.onDidUnloadPackage(function(pack) {
		if (pack.name === cfg.packageid) {
			unloadPackage();
		}
	});
}

function initObserve() {
	cfgobserve.priority = function(v) {
		recreateBookmarksBar();
	};
	cfgobserve.showIcons = function(v) {
		recreateBookmarksBar();
	};
	cfgobserve.textColor = function(v) {
		topEl.style.color = cfg.textColor === 'default' ? 'inherit' : computeColor(cfg.textColor, cfg.textGamma);
	};
	cfgobserve.textGamma = cfgobserve.textColor;
	cfgobserve.fontSize = function(v) {
		topEl.style.fontSize = cfg.fontSize === 'default' ? 'inherit' : cfg.fontSize;
	};
	cfgobserve.bookmarks = function(v) {
		topEl.style.display = cfg.bookmarks === 'yes' ? 'block' : 'none';
		topPanel[cfg.bookmarks === 'yes' ? 'show' : 'hide']();
	};
	cfgobserve.__jsondata = function(v) {
		topEl.innerHTML = '';
		decorateTopEl();
	};
	cfgobserve.__jsonpath = function(v) {
		topEl.innerHTML = '';
		decorateTopEl();
	};
}

function recreateBookmarksBar() {
	createTopPanel();
	cfgobserve.textColor();
	cfgobserve.fontSize();
	cfgobserve.bookmarks();
	cfgobserve.__jsondata();
}

getAllCfg();
initDisposables();
initObserve();
recreateBookmarksBar();