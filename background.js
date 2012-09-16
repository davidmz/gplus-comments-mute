(function() {
    var config, ports = [];

    try { config = JSON.parse(localStorage["config"]); } catch (e) {}
    if (!config) {
        config = {
            muteList: [],
            mutePostPage: false
        };
        localStorage["config"] = JSON.stringify(config);
    }

    chrome.extension.onConnect.addListener(function(port) {
        ports.push(port);
        port.postMessage(config);
        port.onMessage.addListener(function(msg) {
            if (msg.action == "set") {
                var oid = msg.oid, p = config.muteList.indexOf(oid);
                if (msg.muted && p < 0) {
                    config.muteList.unshift(oid);
                } else if (!msg.muted && p >= 0) {
                    config.muteList.splice(p, 1);
                }
            } else if (msg.action = "setPageMute") {
                config.mutePostPage = msg.muted;
            }
            localStorage["config"] = JSON.stringify(config);
            ports.forEach(function(port1) {
                try { port1.postMessage(config); } catch (e) {}
            });
        });
        port.onDisconnect.addListener(function() {
            var p = ports.indexOf(port);
            ports.splice(p, 1);
        });
    });
})();
