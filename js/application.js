var app = new (Spine.Controller.sub({
	elements: {
		"#rendered": "$rendered",
		"#compiled_css": "$compiledCSS",
		"#css_editor": "$cssEditor"
	},
	events: {
		"click #css_editor": "click",
		"dblclick #css_editor": "dblclick"
	},
	init: function() {
		var self = this;

		self.lessParser = new less.Parser();

		var SCSS = ace.require("ace/mode/scss").Mode;
		var html = ace.require("ace/mode/html").Mode;
		self.cssEditor = ace.edit("css_editor");
		self.markupEditor = ace.edit("markup_editor");
		self.cssEditor.setTheme("ace/theme/twilight");
		self.markupEditor.setTheme("ace/theme/twilight");
		self.cssEditor.getSession().setMode(new SCSS());
		self.markupEditor.getSession().setMode(new html());

		var parseCommand = {
			name: "parseCSS",
			bindKey: { win: "Ctrl-P", mac: "Ctrl-P", sender: "editor" },
			exec: function() { self.parse(); }
		};
		self.el.bind("keydown", "ctrl+p", function(){ self.parse(); return false; });
		self.cssEditor.commands.addCommand(parseCommand);
		self.markupEditor.commands.addCommand(parseCommand);

		// Create iDropper
		self.$colorPicker = $("<div/>")
			.appendTo(this.el)
			.addClass("iDc disabled")
			.iDropper({ size: 120 });
		self.iDropper = self.$colorPicker.data("iDropper");
		self.iDropper.bind("drag", function(hex) { self.colorChange(hex); });
	},

	click: function(e) { this.$colorPicker.addClass("disabled"); },

	dblclick: function(e) {
		var self = this;
		var cursor = self.cssEditor.getCursorPosition();
		var $el = $(self.getElementAbovePosition(cursor));

		self.activeInfo = cursor;
		if($el.hasClass("ace_color")) self.showColorPicker($el);
	},

	showColorPicker: function($over) {
		var self = this;
		if(!$over.jquery) $over= $($over);
		self.$colorPicker.removeClass("disabled").css($over.offset());
		self.iDropper.set($over.html());
		self.activeInfo.$el = $over;
	},

	colorChange: function(hex) {
		var self = this, value, _text, _line = "";
		if(!self.activeInfo.$el) return false;

		self.activeInfo.$el.html(hex);

		// sets new value by replacing line
		_text = self.activeInfo.$el.parents(".ace_line").text();
		for(var i=0; i<_text.length; i++) { _line += _text.charCodeAt(i) === 160 ? " " : _text[i]; }
		value = self.cssEditor.getSession().getValue().split("\n");
		value[self.activeInfo.row] = _line;
		value = value.join("\n");
		self.cssEditor.getSession().setValue(value);

		self.parse(value);
	},

	getElementAbovePosition: function(pos) {
		var $line = this.$cssEditor.find(".ace_text-layer").children().eq(pos.row);
		var el = this._getElement($line[0], 0, pos.column);
		return el;
	},

	_getElement: function(startEl, count, colStop, el) {
		var nodes = startEl.childNodes;
		var len = nodes.length;

		for(var i=0; i<len; i++) {
			if(nodes[i].nodeType === 3) {
				count += nodes[i].length; // If text node
				el = nodes[i].parentNode;
			} else {
				el = nodes[i];
				var _n = this._getElement(el, count, colStop, el);
				if(_n) return _n;
			}
			if(count > colStop) return el;
		}
		return el;
	},


	parse: function(css) {
		var self = this;

		self.$rendered.html(self.markupEditor.getSession().getValue());
		var lessCode = css || self.cssEditor.getSession().getValue();

		self.lessParser.parse(lessCode, function(err, tree) {
			if (err) { return console && console.error(err); }
			self.$compiledCSS.html("<style>" + tree.toCSS() + "</style>");
		});
	}
}))({ el: "body" });

