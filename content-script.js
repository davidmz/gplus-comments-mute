(function() {
    var config;

    // Общаемся с бэкграундом
    var port = chrome.extension.connect();
    port.onMessage.addListener(function(msg) {
        config = msg;
        clearAll();
        update();
    });

    /**
     * Всё с чистого листа
     */
    var clearAll = function() {
        var records = document.querySelectorAll(".Tg.Sb.comKill");
        for (var i = 0; i < records.length; i++) {
            records[i].className = records[i].className.replace(/ comKill( mute)?/, "");
        }
        var buttons = document.querySelectorAll(".mute-btn");
        for (i = 0; i < buttons.length; i++) {
            buttons[i].parentNode.removeChild(buttons[i]);
        }
        var photoLayer = document.querySelector("body > .gQ  .aT.c-B.comKill");
        if (photoLayer) photoLayer.className.replace(/ comKill/, "");
    };

    document.body.addEventListener("click", function(e) {
        console.log(e);
        if (e.target.className == "mute-btn") {
            openDialog.apply(e.target.muteData);
        }
    });

    /**
     * Периодическая проверка новых записей
     */
    var update = function() {
        // console.log(config);
        if (!config) return; // ещё не загрузился
        if (!config.mutePostPage && /\/posts\//.test(location.pathname)) return;

        var oid;

        /**
         * Комментарии к фото скрываем всегда (потому что их можно развернуть)
         * @type {Node}
         */
        var photoLayer = document.querySelector("body > .gQ .aT.c-B:not(.comKill)");
        if (photoLayer) {
            photoLayer.className += " comKill";
            oid = photoLayer.querySelector(".Sg.Ob").getAttribute("oid");
            if (config.muteList.indexOf(oid) >= 0) {
                var commentsLink = photoLayer.querySelector(".tJ.a-n.tca");
                commentsLink.className = commentsLink.className.replace("tca", "bka");
                var els = photoLayer.querySelectorAll(".CO");
                for (var j = 0; j < els.length; j++) els[j].style.display = "none"
            }
        }


        var records = document.querySelectorAll(".Tg.Sb:not(.comKill)");
        for (var i = 0; i < records.length; i++) {
            var titleLink = records[i].querySelector(".Sg.Ob.Tc");
            if (!titleLink) continue; // могут быть не-записи, без авторов

            var uPic = records[i].querySelector(".Ol.Rf.Ep").getAttribute("src");
            uPic = uPic.replace("/s48-", "/s90-");

            oid = titleLink.getAttribute("oid");
            var title = titleLink.firstChild.nodeValue;

            records[i].className += " comKill";
            //noinspection JSValidateTypes
            var mute = (config.muteList.indexOf(oid) >= 0);
            if (mute) records[i].className += " mute";
            var btn = document.createElement("div");
            btn.className = "mute-btn";
            btn.muteData = {
                oid:    oid,
                name:   title,
                uPic:   uPic,
                muted:  mute
            };
            records[i].appendChild(btn);
            btn.setAttribute(
                    "title",
                    mute ?
                            ("Показывать комментарии к записям '" + title + "'") :
                            ("Скрывать комментарии к записям'" + title + "'")
            );
        }
    };
    (function() {
        update();
        setTimeout(arguments.callee, 1000);
    })();

    var openDialog = function() {
        var html = '<div class="comKill-dialogShadow"><div class="comKill-dialogWin">' +
                '<img src="' + htmlsafe(this.uPic) + '" class="upic">' +
                '<p><b>' +
                (this.muted ? "Включить" : "Отключить") +
                '</b> показ комментариев к записям ' + htmlsafe(this.name) + '?</p>' +
                '<a href="' +
                    htmlsafe(chrome.extension.getURL("settings.html")) +
                    '" target="_blank" class="settings">настройки</a>' +
                '<div class="footer">' +
                '<button type="submit">' + (this.muted ? "Включить" : "Отключить") + '</button>' +
                '<button type="reset">Отмена</button>' +
                '</div>' +
                '</div></div>';
        var dlg = document.body.appendChild(document.createElement("div"));
        dlg.innerHTML = html;
        var self = this;
        dlg.addEventListener("click", function(e) {
            if (e.target.nodeName == "BUTTON") {
                if (e.target.type == "submit") {
                    setMuteState(self.oid, !self.muted);
                }
                dlg.parentNode.removeChild(dlg);
            }
        });
    };

    var setMuteState = function(oid, muted) {
        port.postMessage({
            "action":"set",
            "oid":oid,
            "muted":muted
        });
    };

})();
