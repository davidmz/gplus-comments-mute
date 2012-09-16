(function() {
    var ATTR_PREFIX = "data-jst-";
    var CLEAN_TAG = "SPAN".toLowerCase();

    function Jst(node) {
        this.nodeName = CLEAN_TAG;
        this.attributes = {};
        this.rules = {};
        this.children = [];

        if (node) {
            this.nodeName = node.nodeName;
            for (var i = 0; i < node.attributes.length; i++) {
                var a = node.attributes[i];
                if (a.name.indexOf(ATTR_PREFIX) == 0) {
                    this.rules[a.name.substr(ATTR_PREFIX.length)] = a.value;
                } else {
                    this.attributes[a.name] = a.value;
                }
            }
            var c = node.firstChild;
            while (c) {
                if (c.nodeType == 1) { // Element
                    this.children.push(new Jst(c));
                } else if (c.nodeType == 3) { // Text
                    this.children.push(c.nodeValue);
                }
                c = c.nextSibling;
            }
        }
    }

    Jst.prototype.render = function(data, ctx) {
        // применить rules
        for (var r in this.rules) {
            if (this.rules.hasOwnProperty(r)) {
                var method = "rule" + dashToCamel(r);
                if (method in this) {
                    this[method].call(this, select(this.rules[r], data, ctx));
                }
            }
        }

        return this.makeHtml(data, ctx);
    };

    Jst.prototype.makeHtml = function(data, ctx) {
        var html = new StringBuilder();
        var isClean = (isEmptyObject(this.attributes) && this.nodeName.toLowerCase() == CLEAN_TAG);

        if (!isClean) {
            html.add("<" + htmlSafe(this.nodeName));
            for (var k in this.attributes) {
                if (this.attributes.hasOwnProperty(k)) {
                    html.add(" " + htmlSafe(k) + "=\"" + htmlSafe(this.attributes[k])+"\"");
                }
            }
            html.add(">");
        }
        for (var i = 0; i < this.children.length; i++) {
            var c = this.children[i];
            html.add((typeof c == "string") ? c : c.render(data, ctx));
        }
        if (!isClean) html.add("</" + htmlSafe(this.nodeName)+">");
        return html.join();
    };

    Jst.prototype.clone = function() {
        var clone = new Jst();
        clone.nodeName = this.nodeName;
        clone.attributes = this.attributes;
        clone.children = this.children;
        clone.rules = this.rules;
        return clone;
    };

    Jst.prototype.ruleText = function(value) {
        this.children = "" + value;
    };
    Jst.prototype.ruleAttr = function(value) {
        if (isArray(value) && value.length == 2) {
            this.attributes[value[0]] = value[1];
        }
    };
    Jst.prototype.ruleForeach = function(value) {
        var itemTpl = this.clone();
        delete itemTpl.rules["foreach"];

        this.makeHtml = function() {
            var html = new StringBuilder();
            if (isArray(value)) {
                var ctx = { "counter": 1, "count": value.length };
                for (var i = 0; i < value.length; i++) {
                    ctx.counter = i + 1;
                    html.add(itemTpl.clone().render(value[i], ctx));
                }
            }
            return html.join();
        };
    };


    /**
     * selector:
     * a.b.c.d
     * ''           // self
     * href:a.b.c   // атрибут, возаращает ['href', val]
     * #loop.counter     // выборка не из data, а из контекста
     * href:#loop.counter - тоже можно
     */

    function select(selector, value, ctx) {
        var attr = null;
        var m = selector.match(/^([a-z0-9_-]+)\s*:\s*/);
        if (m) { attr = m[1]; selector = selector.substr(m[0].length); }
        var val = resolvePath(selector, value, ctx);
        return attr ? [attr, val] : val;
    }

    function resolvePath(path, value, ctx) {
        if (path.charAt(0) == "#") {
            path = path.substr(1);
            value = ctx;
        }
        if (path == "") return value;
        var parts = path.split(".");
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (value && value[p]) value = value[p]; else value = null;
        }
        return value;
    }

    function dashToCamel(s) {
        var parts = s.split("-"), camel = "", i;
        for (i = 0; i < parts.length; i++) {
            camel += parts[i].charAt(0).toUpperCase() + parts[i].substr(1);
        }
        return camel;
    }

    function htmlSafe(s) {
        if (s === null) return "";
        return s.toString().replace(/&/g, "&amp;")
            .replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    }

    function isEmptyObject(obj) {
		for (var name in obj) if (obj.hasOwnProperty(name)) return false;
		return true;
	}

    function isArray(a) {
        if (Array.isArray) return Array.isArray(a);
        return (Object.prototype.toString.call(a) == '[object Array]');
    }

    function StringBuilder() { this._buf = ""; }
    StringBuilder.prototype.add = function(chunk) { this._buf += chunk; };
    StringBuilder.prototype.join = function() { return this._buf; };

    // Globalization
    var global = (function() { return this; })();
    var oldJst = global.Jst;
    global.Jst = Jst;
    Jst.noConflict = function() {
        if (oldJst !== undefined) global.Jst = oldJst; else delete(global.Jst);
        return Jst;
    };
})();