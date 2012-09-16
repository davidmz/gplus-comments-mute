window.addEventListener("load", function() {
    var config;
    var oidInfoCache = {};
    var port = chrome.extension.connect();
    port.onMessage.addListener(function(msg) {
        config = msg;
        updateControls();
    });

    var mlCont = document.getElementById("mute-list");
    var tpl = new Jst(document.getElementById("item_tmpl").querySelector(".mute-item"));

    var updateControls = function() {
        document.getElementById("comments-on-post").checked = !config.mutePostPage;
        mlCont.innerHTML = "";
        document.getElementById("mute-block").style.display = (config.muteList.length > 0) ? "block" : "none";
        config.muteList.forEach(function(oid) {
            var d = mlCont.appendChild(document.createElement("div"));
            if (!(oid in oidInfoCache)) {
                d.innerHTML = "Загрузка...";

                var profUrl = "https://plus.google.com/u/0/_/socialgraph/lookup/hovercards/?m=" +
                        encodeURIComponent("[[[null,null,\"" + oid + "\"]]]");
                var xhr = new XMLHttpRequest();
                xhr.open("GET", profUrl);
                xhr.onload = function() {
                    var res = xhr.responseText
                            .replace(/^\S+\s+/, "")
                            .replace(/"([^"\\]|\\"|\\\\)*"/g, function(m) { return m.replace(",", "\\u002C"); })
                            .replace(/\[,/g, "[null,").replace(/,,/g, ",null,").replace(/,,/g, ",null,");
                    try {
                        var data = JSON.parse(res);
                        var info = {
                            oid:    data[0][1][0][1][0][2],
                            url:    "https:" + data[0][1][0][1][0][4],
                            name:   data[0][1][0][1][2][0],
                            photo:  "https:" + data[0][1][0][1][2][8],
                            desc:   data[0][1][0][1][2][21],
                            site:   data[0][1][0][1][2][18][1]
                        };
                        oidInfoCache[oid] = info;

                        d.innerHTML = tpl.render(info);
                        // этого JST пока не умеет
                        d.querySelector(".photo").style.backgroundImage = "url(" + info.photo + ")";
                    } catch (e) {
                        d.innerHTML = "Data error";
                    }
                };
                xhr.send();
            } else {
                var info = oidInfoCache[oid];
                d.innerHTML = tpl.render(info);
                // этого JST пока не умеет
                d.querySelector(".photo").style.backgroundImage = "url(" + info.photo + ")";
            }
        });
    };

    document.getElementById("remove-oids").addEventListener("click", function() {
        var inputs = document.getElementById("mute-list").querySelectorAll("input:checked");
        var oids = [];
        for (var i = 0; i < inputs.length; i++) oids.push(inputs[i].value);
        oids.forEach(function(oid) {
            port.postMessage({
                "action":"set",
                "oid":oid,
                "muted":false
            });
        });
    });

    document.getElementById("comments-on-post").addEventListener("change", function() {
        port.postMessage({
            "action":   "setPageMute",
            "muted":    !this.checked
        });
    });

});
