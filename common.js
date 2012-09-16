window.htmlsafe = function (str) {
    return str.toString().replace(/&/g, "&amp;")
            .replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
};
