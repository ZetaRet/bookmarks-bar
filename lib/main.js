/**
 * Author: Zeta Ret
 * Date: 2018 - Today
 * Bookmarks Bar package for Atom IDE
 **/
var cfg = {
		packageid: 'bookmarks-bar'
	},
	nskey = cfg.packageid + '.',
	cfgkeys = ['bookmarks', 'textColor', 'textGamma', 'fontSize', 'priority', '__jsondata', '__jsonpath', 'reverseFolderPaths', 'showIcons'],
	disposables = null,
	cfgobserve = {},
	fs = null;
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
			fs.writeFile(cfg.__jsonpath, jd, function(err) {
				if (err) {
					cfgSet('__jsondata', jd);
					return;
				} else {
					cfgSet('__jsondata', '');
					cfgobserve.__jsonpath();
				}
			});
		}
	} else {
		cfgSet('__jsondata', jd);
	}
}

function findFile(path) {
	var i, j, f, fd, loc = [];
	if (jsondata) {
		if (jsondata.files && jsondata.files.length > 0) {
			for (i = 0; i < jsondata.files.length; i++) {
				f = jsondata.files[i];
				if (f && f.p === path) loc.push({
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
						if (f && f.p === path) loc.push({
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
	spacer.style.display = 'inline-block';
	spacer.style.marginRight = space + 'px';
	spacer.style.width = '0px';
	spacer.style.height = '1px';
	if (styles)
		for (var k in styles) spacer.style[k] = styles[k];
	return spacer;
}

function createModalBtn(name) {
	var btn = document.createElement('div');
	btn.innerText = name;
	btn.style.background = '#040404';
	btn.style.color = '#e4e4e4';
	btn.style.cursor = 'pointer';
	btn.style.padding = '7px';
	btn.style.display = 'inline-block';
	btn.style.borderRadius = '6px';
	return btn;
}

function createStarModal() {
	var item = document.createElement('div'),
		desc = document.createElement('div'),
		otherlocitem = document.createElement('div'),
		editor = atom.workspace.getActiveTextEditor(),
		p, f = jsondata.folders,
		sel = '<select class="file-select" style="width:100%; color:#000; background-color:#fff; border:none; padding:2px; display:block;">';
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
	var newfolder = 'Create new folder: ' +
		'<input class="folder-input zetaretbookmarksbarinput" type="text" style="width:100%; color:#000; background-color:#fff; border:none; padding:2px; display:block;"/>';
	desc.innerHTML = p ? '<b>You are about to bookmark this editor:</b><br/>' + p + '<br/><br/>Select folder: ' + sel + '<br/>' + newfolder :
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
				n = p.split('\\').pop();
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
	desc.innerHTML = p ? '<b>You are about to view this editor:</b><br/>' + p.split(new RegExp('<|>')).join('') :
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
		sel = '<select class="file-select" style="width:100%; color:#000; background-color:#fff; border:none; padding:2px; margin-top:10px;">';
	if (f) {
		var rp = cfg.reverseFolderPaths || 'no';
		f.forEach(function(el, index) {
			var op = el.p.split(new RegExp('<|>')).join('');
			if (rp === 'yes') op = op.split('\\').reverse().join('\\');
			sel += '<option value="' + index + '">' + op + '</option>';
		});
	}
	sel += '</select>';
	desc.innerHTML = 'Current folder: <b><span class="folder-name" style="display:inline-block;margin:2px;">' +
		(fbtn._name.split(new RegExp('<|>')).join('') || '[Unnamed Folder]') +
		'</span></b><br/><br/>' +
		(f && f.length > 0 ? '<b>You are about to view this editor:</b><br/>' + sel : '<b>No files in this folder.</b>');
	desc.style.padding = '20px';
	desc.style.wordWrap = 'break-word';
	item.appendChild(desc);
	var fnel = item.getElementsByClassName('folder-name')[0];
	if (fnel) {
		fnel.style.cursor = 'pointer';
		fnel.setAttribute('title', 'Click to change folder name');
		fnel.addEventListener('click', function(e) {
			var p = fnel.parentNode;
			p.innerHTML = "<input class='f-inp' type='text'/><input class='f-save' type='button' value='Save'/>";
			var input = p.getElementsByClassName('f-inp')[0],
				btn = p.getElementsByClassName('f-save')[0];

			function savefinp() {
				jsondata.folders[fbtn._index].n = input.value;
				updateJsonData();
				item._panel.destroy();
			}
			input.style.border = 'none';
			input.style.padding = '2px';
			input.maxLength = 100;
			input.addEventListener('keydown', function(e) {
				if (e.keyCode === 13) {
					savefinp();
				}
				e.stopImmediatePropagation();
			});
			input.focus();
			input.value = fbtn._name;
			input.setAttribute('title', 'Press `Enter` to save new folder name');
			btn.style.marginLeft = '4px';
			btn.style.border = 'none';
			btn.style.backgroundColor = '#000';
			btn.style.padding = '2px 13px';
			btn.style.color = '#fff';
			btn.style.borderRadius = '5px';
			btn.style.cursor = 'pointer';
			btn.setAttribute('title', 'Click to save new folder name');
			btn.addEventListener('click', function(e) {
				savefinp();
			})
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
			} catch (e) {}
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
	starbtn.style.cursor = 'pointer';
	starbtn.style.display = 'inline-block';
	starbtn.style.paddingRight = '3px';
	starbtn.style.borderRadius = '2px';
	if (cfg.showIcons === 'yes') {
		starbtn.classList.add('icon');
		starbtn.classList.add('icon-star');
	}
	starbtn.innerHTML = 'Bookmark';
	starbtn.setAttribute('title', 'Bookmark this editor');
	starbtn.addEventListener('mouseover', function(e) {
		starbtn.style.background = 'rgba(255,255,255,0.11)';
	});
	starbtn.addEventListener('mouseout', function(e) {
		starbtn.style.background = null;
	});
	starbtn.addEventListener('click', function(e) {
		var mitem = createStarModal(),
			panel = atom.workspace.addModalPanel({
				item: mitem
			});
		panel.onDidChangeVisible(function(e) {
			if (!panel.isVisible()) {
				try {
					panel.destroy();
				} catch (e) {}
			}
		});
		mitem._panel = panel;
	});
	return starbtn;
}

function createFolderBtn(name, files, index) {
	var fbtn = document.createElement('div');
	fbtn.style.cursor = 'pointer';
	fbtn.style.display = 'inline-block';
	fbtn.style.padding = '0 2px';
	fbtn.style.borderRadius = '2px';
	if (cfg.showIcons === 'yes') {
		fbtn.classList.add('icon');
		fbtn.classList.add('icon-file-directory');
	}
	fbtn.innerHTML = name.split(new RegExp('<|>')).join('') || '[Unnamed Folder]';
	fbtn._index = index;
	fbtn._files = files;
	fbtn._name = name;
	fbtn.setAttribute('title', 'Click to access folder modal, CTRL+Click to open all files in ' + name);
	fbtn.addEventListener('mouseover', function(e) {
		fbtn.style.background = 'rgba(255,255,255,0.11)';
	});
	fbtn.addEventListener('mouseout', function(e) {
		fbtn.style.background = null;
	});
	fbtn.addEventListener('click', function(e) {
		if (e.ctrlKey) {
			if (files && files.length > 0) {
				files.forEach(function(el) {
					if (el.p) atom.workspace.open(el.p);
				});
			}
		} else {
			var mitem = createFolderModal(fbtn),
				panel = atom.workspace.addModalPanel({
					item: mitem
				});
			panel.onDidChangeVisible(function(e) {
				if (!panel.isVisible()) {
					try {
						panel.destroy();
					} catch (e) {}
				}
			});
			mitem._panel = panel;
		}
	});
	return fbtn;
}

function createFileBtn(name, path, index) {
	var fbtn = document.createElement('div');
	fbtn.style.cursor = 'pointer';
	fbtn.style.display = 'inline-block';
	fbtn.style.padding = '0 2px';
	fbtn.style.borderRadius = '2px';
	if (cfg.showIcons === 'yes') {
		fbtn.classList.add('icon');
	}
	fbtn.setAttribute('title', 'Click to view file modal of ' + path);
	var p = path,
		ext, n, icon;
	if (p) {
		p = p.split('\\');
		n = p.pop();
		ext = n.split('.').pop();
	}
	switch (ext) {
		case 'md':
			icon = 'icon-book';
			break;
		default:
			icon = 'icon-file-text';
	}
	if (cfg.showIcons === 'yes') {
		fbtn.classList.add(icon);
	}
	fbtn.innerHTML = name.split(new RegExp('<|>')).join('');
	fbtn._index = index;
	fbtn._name = name;
	fbtn._path = path;
	fbtn.addEventListener('mouseover', function(e) {
		fbtn.style.background = 'rgba(255,255,255,0.11)';
	});
	fbtn.addEventListener('mouseout', function(e) {
		fbtn.style.background = null;
	});
	fbtn.addEventListener('click', function(e) {
		var mitem = createFileModal(fbtn),
			panel = atom.workspace.addModalPanel({
				item: mitem
			});
		panel.onDidChangeVisible(function(e) {
			if (!panel.isVisible()) {
				try {
					panel.destroy();
				} catch (e) {}
			}
		});
		mitem._panel = panel;
	});
	return fbtn;
}

function readJSONDataFromCFG() {
	if (cfg.__jsonpath) {
		if (!fs) {
			fs = require("fs");
		}
		if (fs.existsSync(cfg.__jsonpath)) {
			var rjd = fs.readFileSync(cfg.__jsonpath);
			try {
				jsondata = JSON.parse(rjd) || {};
			} catch (e) {
				jsondata = {};
			}
		} else {
			jsondata = {};
		}
	} else {
		try {
			jsondata = JSON.parse(cfg.__jsondata) || {};
		} catch (e) {
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
		if (el && el.constructor === Object) items.folders.push(createFolderBtn(el.n, el.f, index));
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
	topPanel = atom.workspace.addTopPanel({
		item: topEl,
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
	};
	cfgobserve.__jsondata = function(v) {
		topEl.innerHTML = '';
		decorateTopEl();
	};
	cfgobserve.__jsonpath = function(v) {
		topEl.innerHTML = '';
		decorateTopEl();
	}
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
