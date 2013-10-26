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
        var records = document.querySelectorAll(".comKill");
        for (var i = 0; i < records.length; i++) {
            records[i].className = records[i].className.replace(/ comKill( mute)?/, "");
        }
        var buttons = document.querySelectorAll(".mute-btn");
        for (i = 0; i < buttons.length; i++) {
            buttons[i].parentNode.removeChild(buttons[i]);
        }
    };

    document.body.addEventListener("click", function(e) {
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
         * @type {HTMLElement}
         */
        var photoLayer = document.querySelector("body > .pg.mab:not(.comKill)");
        if (photoLayer) {
            var tLink = photoLayer.querySelector(".tv.Ub");
            if (tLink) {
                photoLayer.className += " comKill";
                oid = tLink.getAttribute("oid");
                if (config.muteList.indexOf(oid) >= 0) {
                    photoLayer.className += " mute";
                }
            }
        }


        var records = document.querySelectorAll(".Yp.Xa:not(.comKill)");
        for (var i = 0, l = records.length; i < l; i++) {
            var titleLink = records[i].querySelector(".tv.Ub.Hf");
            if (!titleLink) continue; // могут быть не-записи, без авторов

            var uPicEl = records[i].querySelector(".Uk.wi.hE");
            if (!uPicEl) continue;

            var uPic = uPicEl.getAttribute("src");
            uPic = uPic.replace(/\/s\d+-/, "/s90-");

            oid = titleLink.getAttribute("oid");
            var title = titleLink.firstChild.nodeValue;

            records[i].className += " comKill";
            //noinspection JSValidateTypes
            var mute = (config.muteList.indexOf(oid) >= 0);
            if (mute) {
                records[i].className += " mute";
            }
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
                            ("Скрывать комментарии к записям '" + title + "'")
            );
        }
    };

    setInterval(update, 1000);

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
