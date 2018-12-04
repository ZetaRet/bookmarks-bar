/**
 * Author: Zeta Ret
 * Date: 2018 - Today
 * Bookmarks Bar package for Atom IDE
 **/
var cfg = {},
	nskey = 'bookmarks-bar.',
	cfgkeys = ['bookmarks', 'textColor', 'fontSize', 'priority', '__jsondata'],
	cfgobserve = {};

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

getAllCfg();
cfgkeys.forEach(function(el) {
	atom.config.observe(nskey + el, function(v) {
		cfgGet(el);
		if (cfgobserve[el]) cfgobserve[el](v);
	});
});

var topEl, topPanel, items = {},
	jsondata;

function updateJsonData() {
	cfgSet('__jsondata', JSON.stringify(jsondata || {}));
}

function createTopEl() {
	var tel = document.createElement('div');
	tel.classList.add('bookmarks-bar-top-panel');
	tel.style.margin = '4px';
	return tel;
}

function createSpacer(space) {
	var spacer = document.createElement('div');
	spacer.style.display = 'inline-block';
	spacer.style.marginRight = space + 'px';
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
	var item = document.createElement('div');
	var desc = document.createElement('div');
	var editor = atom.workspace.getActiveTextEditor(),
		p;
	if (editor) {
		p = editor.getPath();
	}
	var f = jsondata.folders;
	var sel = '<select class="file-select">';
	if (f) {
		sel += '<option value="none"></option>';
		f.forEach(function(el, index) {
			sel += '<option value="' + index + '">' + el.n + '</option>';
		});
	}
	sel += '</select>';
	var newfolder = 'Create new folder: <input class="folder-input" type="text" style="width: 100px;"/>';
	desc.innerHTML = p ? '<b>You are about to bookmark this editor:</b><br/>' + p + '<br/><br/>Select folder: ' + sel + '<br/><br/>' + newfolder :
		'<b>You can not bookmark this tab.</b>';
	desc.style.padding = '20px';
	item.appendChild(desc);
	if (p) {
		var starbtn = createModalBtn('Star');
		starbtn.classList.add('icon');
		starbtn.classList.add('icon-star');
		starbtn.addEventListener('click', function(e) {
			var finp = item.getElementsByClassName('folder-input')[0];
			var fsel = item.getElementsByClassName('file-select')[0];
			var fval = finp.value;
			var n = p.split('\\').pop();
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
		item.appendChild(starbtn);
		item.appendChild(createSpacer(20));
	}
	var closebtn = createModalBtn('Close');
	closebtn.classList.add('icon');
	closebtn.classList.add('icon-circle-slash');
	closebtn.addEventListener('click', function(e) {
		item._panel.destroy();
	});
	item.appendChild(closebtn);

	return item;
}

function createFileModal(fbtn) {
	var item = document.createElement('div');
	var desc = document.createElement('div');
	var p = fbtn._path;
	desc.innerHTML = p ? '<b>You are about to view this editor:</b><br/>' + p : '<b>You can not open this editor. Path is broken or missing.</b>';
	desc.style.padding = '20px';
	item.appendChild(desc);
	if (p) {
		var viewbtn = createModalBtn('View');
		viewbtn.classList.add('icon');
		viewbtn.classList.add('icon-eye');
		viewbtn.addEventListener('click', function(e) {
			if (p) {
				atom.workspace.open(p);
				item._panel.destroy();
			}
		});
		item.appendChild(viewbtn);
		item.appendChild(createSpacer(20));
	}
	var closebtn = createModalBtn('Close');
	closebtn.classList.add('icon');
	closebtn.classList.add('icon-circle-slash');
	closebtn.addEventListener('click', function(e) {
		item._panel.destroy();
	});
	item.appendChild(closebtn);
	item.appendChild(createSpacer(80));
	var delbtn = createModalBtn('Delete');
	delbtn.classList.add('icon');
	delbtn.classList.add('icon-trashcan');
	delbtn.addEventListener('click', function(e) {
		jsondata.files.splice(fbtn._index, 1);
		updateJsonData();
		item._panel.destroy();
	});
	item.appendChild(delbtn);

	return item;
}

function createFolderModal(fbtn) {
	var item = document.createElement('div');
	var desc = document.createElement('div');
	var f = fbtn._files;
	var sel = '<select class="file-select">';
	if (f) {
		f.forEach(function(el, index) {
			sel += '<option value="' + index + '">' + el.p + '</option>';
		});
	}
	sel += '</select>';
	desc.innerHTML = 'Current folder: ' + fbtn._name + '<br/><br/>' + (f && f.length > 0 ? '<b>You are about to view this editor:</b><br/>' + sel : '<b>No files in this folder.</b>');
	desc.style.padding = '20px';
	item.appendChild(desc);
	if (f) {
		var viewbtn = createModalBtn('View');
		viewbtn.classList.add('icon');
		viewbtn.classList.add('icon-eye');
		viewbtn.addEventListener('click', function(e) {
			var fsel = item.getElementsByClassName('file-select')[0];
			var p;
			try {
				p = fbtn._files[parseInt(fsel.value)].p;
			} catch (e) {}
			atom.workspace.open(p);
			item._panel.destroy();
		});
		item.appendChild(viewbtn);
		item.appendChild(createSpacer(20));
	}
	var closebtn = createModalBtn('Close');
	closebtn.classList.add('icon');
	closebtn.classList.add('icon-circle-slash');
	closebtn.addEventListener('click', function(e) {
		item._panel.destroy();
	});
	item.appendChild(closebtn);
	item.appendChild(createSpacer(80));
	var delbtn = createModalBtn('Dispose folder');
	delbtn.classList.add('icon');
	delbtn.classList.add('icon-flame');
	delbtn.addEventListener('click', function(e) {
		jsondata.folders.splice(fbtn._index, 1);
		updateJsonData();
		item._panel.destroy();
	});
	item.appendChild(delbtn);
	item.appendChild(createSpacer(20));
	var deledbtn = createModalBtn('Delete selected editor');
	deledbtn.classList.add('icon');
	deledbtn.classList.add('icon-trashcan');
	deledbtn.addEventListener('click', function(e) {
		var fsel = item.getElementsByClassName('file-select')[0];
		fbtn._files.splice(parseInt(fsel.value), 1);
		updateJsonData();
		item._panel.destroy();
	});
	item.appendChild(deledbtn);

	return item;
}

function createStarBtn() {
	var starbtn = document.createElement('div');
	starbtn.style.cursor = 'pointer';
	starbtn.style.display = 'inline-block';
	starbtn.style.marginRight = '4px';
	starbtn.classList.add('icon');
	starbtn.classList.add('icon-star');
	starbtn.innerHTML = 'Bookmark';
	starbtn.addEventListener('click', function(e) {
		var mitem = createStarModal();
		var panel = atom.workspace.addModalPanel({
			item: mitem
		});
		mitem._panel = panel;
	});
	return starbtn;
}

function createFolderBtn(name, files, index) {
	var fbtn = document.createElement('div');
	fbtn.style.cursor = 'pointer';
	fbtn.style.display = 'inline-block';
	fbtn.style.marginRight = '4px';
	fbtn.classList.add('icon');
	fbtn.classList.add('icon-file-directory');
	fbtn.innerHTML = name;
	fbtn._index = index;
	fbtn._files = files;
	fbtn._name = name;
	fbtn.addEventListener('click', function(e) {
		var mitem = createFolderModal(fbtn);
		var panel = atom.workspace.addModalPanel({
			item: mitem
		});
		mitem._panel = panel;
	});
	return fbtn;
}

function createFileBtn(name, path, index) {
	var fbtn = document.createElement('div');
	fbtn.style.cursor = 'pointer';
	fbtn.style.display = 'inline-block';
	fbtn.style.marginRight = '4px';
	fbtn.classList.add('icon');
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
	fbtn.classList.add(icon);
	fbtn.innerHTML = name;
	fbtn._index = index;
	fbtn._name = name;
	fbtn._path = path;
	fbtn.addEventListener('click', function(e) {
		var mitem = createFileModal(fbtn);
		var panel = atom.workspace.addModalPanel({
			item: mitem
		});
		mitem._panel = panel;
	});
	return fbtn;
}

function decorateTopEl() {
	items = {
		folders: [],
		files: []
	};
	jsondata = null;
	try {
		jsondata = JSON.parse(cfg.__jsondata) || {};
	} catch (e) {
		jsondata = {};
	}
	if (!jsondata.folders || jsondata.folders.constructor !== Array) jsondata.folders = [];
	if (!jsondata.files || jsondata.files.constructor !== Array) jsondata.files = [];

	items.starbtn = createStarBtn();
	topEl.appendChild(items.starbtn);
	topEl.appendChild(createSpacer(15));

	jsondata.folders.forEach(function(el, index) {
		items.folders.push(createFolderBtn(el.n, el.f, index));
	});
	items.folders.forEach(function(el) {
		topEl.appendChild(el);
		topEl.appendChild(createSpacer(5));
	});
	jsondata.files.forEach(function(el, index) {
		items.files.push(createFileBtn(el.n, el.p, index));
	});
	items.files.forEach(function(el) {
		topEl.appendChild(el);
		topEl.appendChild(createSpacer(5));
	});
}

cfgobserve.priority = function(v) {
	if (topPanel) topPanel.destroy();
	topEl = createTopEl();
	topPanel = atom.workspace.addTopPanel({
		item: topEl,
		priority: cfg.priority === 'default' ? 100 : cfg.priority
	});
};
cfgobserve.priority();
cfgobserve.textColor = function(v) {
	topEl.style.color = cfg.textColor === 'default' ? 'inherit' : cfg.textColor;
};
cfgobserve.textColor();
cfgobserve.fontSize = function(v) {
	topEl.style.fontSize = cfg.fontSize === 'default' ? 'inherit' : cfg.fontSize;
};
cfgobserve.fontSize();
cfgobserve.bookmarks = function(v) {
	topEl.style.display = cfg.bookmarks === 'yes' ? 'block' : 'none';
};
cfgobserve.bookmarks();
cfgobserve.__jsondata = function(v) {
	topEl.innerHTML = '';
	decorateTopEl();
};
cfgobserve.__jsondata();
