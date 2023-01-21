// ==UserScript==
// @name        LaCalv Battle Logs
// @author      Sorrow
// @description Ce script intercepte les réponses et les affiches dans la console LaCalv Battle Log, parsée et formatée de manière à être facilement lisible.
// @include     https://lacalv.fr/*
// @version     1.4.1

// @homepageURL   https://github.com/sanjuant/LaCalvBattleLogs/
// @supportURL    https://github.com/sanjuant/LaCalvBattleLogs/issues
// @downloadURL   https://github.com/sanjuant/LaCalvBattleLogs/raw/master/lacalvbattlelogs.user.js
// @updateURL     https://github.com/sanjuant/LaCalvBattleLogs/raw/master/lacalvbattlelogs.user.js
// ==/UserScript==

const MESSAGES = {
    "boss": {
        "normal": "Vous avez attaqué {0} tour{1}.",
        "short": "Atq:{0}",
        "list": "Vous avez attaqué {0} tour{1}.",
    },
    "pvp": {
        "normal": "Vous avez {0}, contre {1}.",
        "short": "{0} contre {1}.",
        "list": "Vous avez {0}, contre {1}.",
    },
    "tob": {
        "normal": "Vous avez {0} à l'étage {1}.",
        "short": "Étage {1} {0}.",
        "list": "Vous avez {0} à l'étage {1}.",
    },
    "rewards": {
        "label": {
            "normal": "[Récompenses]",
            "short": "[Récomp.]",
            "list": "Récompenses :",
        },
        "elo": {
            "normal": "Elo&nbsp;:&nbsp;{0}",
            "short": "Elo:{0}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Elo&nbsp;:&nbsp;{0}",
        },
        "alo": {
            "normal": "Alopièce{0}&nbsp;:&nbsp;{1}",
            "short": "Alo:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Alopièce{0}&nbsp;:&nbsp;{1}",
        },
        "event": {
            "normal": "Event{0}&nbsp;:&nbsp;{1}",
            "short": "Event:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Event{0}&nbsp;:&nbsp;{1}",
        },
        "exp": {
            "normal": "Expérience{0}&nbsp;:&nbsp;{1}",
            "short": "Exp:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Expérience{0}&nbsp;:&nbsp;{1}",
        },
        "items": {
            "normal": "Item{0}&nbsp;:&nbsp;{1}",
            "short": "Item:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Item{0}&nbsp;:&nbsp;{1}",
        }
    },
    "infos": {
        "label": {
            "normal": "[{0}]",
            "short": "[{0}]",
            "list": "{0} :",
        },
        "label_user": {
            "normal": "Vous",
            "short": "Vous",
            "list": "Joueur",
        },
        "label_opponent": {
            "normal": "Adversaire",
            "short": "Lui",
            "list": "Adversaire",
        },
        "bouclier": {
            "normal": "Bouclier&nbsp;:&nbsp;{0}",
            "short": "Bouc:{0}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Bouclier&nbsp;:&nbsp;{0}",
        },
        "vie": {
            "normal": "Vie&nbsp;:&nbsp;{0}",
            "short": "Vie:{0}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Vie&nbsp;:&nbsp;{0}",
        },
        "soin": {
            "normal": "Soin{0}&nbsp;:&nbsp;{1}",
            "short": "Soin:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Soin{0}&nbsp;:&nbsp;{1}",
        },
        "esquive": {
            "normal": "Esquive{0}&nbsp;:&nbsp;{1}",
            "short": "Esq:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Esquive{0}&nbsp;:&nbsp;{1}",
        },
        "stun": {
            "normal": "Stun{0}&nbsp;:&nbsp;{1}",
            "short": "Stun:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Stun{0}&nbsp;:&nbsp;{1}",
        },
        "dc": {
            "normal": "Double Coup{0}&nbsp;:&nbsp;{1}",
            "short": "Dc:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Double Coup{0}&nbsp;:&nbsp;{1}",
        },
        "dmg": {
            "normal": "Dommage{0}&nbsp;:&nbsp;{1}",
            "short": "Dmg:{1}",
            "list": "&nbsp;&nbsp;&nbsp;&nbsp;- Dommage{0}&nbsp;:&nbsp;{1}",
        }
    },
    "summary": {
        "boss": {
            "normal": "Vous avez attaqué {0} fois le Boss en moyennes lors des {1} derniers combats.",
            "short": "Boss - Atq:{0}",
            "list": "Moyennes des {1} derniers combats Boss :\n&nbsp;&nbsp;&nbsp;&nbsp;- Attaques&nbsp;:&nbsp;{0} ",
        },
        "pvp": {
            "normal": "Résultat des {0} derniers combats PvP : Victoire {1}% - Défaite {2}%",
            "short": "PvP - Vic:{1}% Déf:{2}%",
            "list": "Moyennes des {0} derniers combats PvP :\n&nbsp;&nbsp;&nbsp;&nbsp;- Victoire&nbsp;:&nbsp;{1}%\n&nbsp;&nbsp;&nbsp;&nbsp;- Défaite&nbsp;:&nbsp;{2}%",
        },
        "tob": {
            "normal": "Résultat des {0} derniers combats ToB : Victoire {1}% - Défaite {2}%",
            "short": "ToB - Vic:{1}% Déf:{2}%",
            "list": "Moyennes des {0} derniers combats ToB :\n&nbsp;&nbsp;&nbsp;&nbsp;- Victoire&nbsp;:&nbsp;{1}%\n&nbsp;&nbsp;&nbsp;&nbsp;- Défaite&nbsp;:&nbsp;{2}%",
        },
        "rewards": {
            "normal": "\n",
            "short": " ",
            "list": "\n",
        },
        "infos": {
            "normal": "\n",
            "short": " ",
            "list": "\n",
        },
    },
    "join": {
        "normal": ", ",
        "short": " ",
        "list": "\n",
    }
}

const BL_VERSION = "bl_localstorage_version"
const BL_BOSS = "bl_boss"
const BL_PVP = "bl_pvp"
const BL_TOB = "bl_tob"
const BL_LOCALSTORAGE_VERSION = 0.9
const BL_FILTERS = "bl_filters"
const BL_X10 = "bl_x10"
const BL_X50 = "bl_x50"
const BL_X100 = "bl_x100"
const BL_NOTIF = "bl_notif"
const FILTERS = {'x10': true, 'x50': true, 'x100': true, 'boss': true, 'pvp': true, 'tob': true, 'notif': true}
const BL_SETTINGS = "bl_settings"
const SETTINGS = {'width':'500px', 'side':'right', 'expanded': false, 'format': 'normal'}

const _bl = {
    bl_localstorage_version: -1,
    bl_boss: [],
    bl_pvp: [],
    bl_tob: [],
    bl_x10: [],
    bl_x50: [],
    bl_x100: [],
    bl_filters: FILTERS,
    bl_notif: [],
    bl_settings:SETTINGS,
    is_phone: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

if (getItemStorage(BL_VERSION) == null) {
    setItemStorage(BL_VERSION, BL_LOCALSTORAGE_VERSION);
}
setDefaultItemStorage(BL_BOSS, []);
setDefaultItemStorage(BL_PVP, []);
setDefaultItemStorage(BL_TOB, []);
setDefaultItemStorage(BL_FILTERS, FILTERS);
setDefaultItemStorage(BL_X10, []);
setDefaultItemStorage(BL_X50, []);
setDefaultItemStorage(BL_X100, []);
setDefaultItemStorage(BL_NOTIF, []);
setDefaultItemStorage(BL_SETTINGS, SETTINGS);
if (_bl.bl_localstorage_version !== BL_LOCALSTORAGE_VERSION) {
    setItemStorage(BL_VERSION, BL_LOCALSTORAGE_VERSION)
}

function setDefaultItemStorage(key, defaultValue) {
    if (getItemStorage(key) == null || _bl.bl_localstorage_version !== BL_LOCALSTORAGE_VERSION) {
        setItemStorage(key, defaultValue, true);
    }
}

function getItemStorage(key) {
    const value = JSON.parse(localStorage.getItem(key))
    _bl[key] = value
    return value
}

function setItemStorage(key, value, overwrite = false) {
    const itemStorage = getItemStorage(key)
    if (!overwrite && Array.isArray(itemStorage)) {
        itemStorage.push(value);
        value = itemStorage
    }
    localStorage.setItem(key, JSON.stringify(value));
    _bl[key] = value
}

function setSettingsStorage(key, value) {
    const settings = getItemStorage(BL_SETTINGS)
    settings[key] = value
    setItemStorage(BL_SETTINGS, settings)
}

const battleLogsHtml = `
    <div id="el_resize"></div>
    <div class="header">
        <div class="title">LaCalv Battle Logs</div>
        <div class="btn_headers">
            <button id="btn_side"></button>
            <button id="btn_expand"></button>
        </div>
    </div>
    <div class="settings">
        <div class="clear">
            <button id="btn_clear" title="Supprimer les messages">
                <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" color="#fff">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>

        <div class="settings-right">
            <div class="averages">
                <button id="btn_average_x10">x10</button>
                <button id="btn_average_x50">x50</button>
                <button id="btn_average_x100">x100</button>
            </div>
            <div class="vl"></div>
            <div class="filters">
                <button id="btn_filter_boss">Boss</button>
                <button id="btn_filter_pvp">PvP</button>
                <button id="btn_filter_tob">ToB</button>
                <button id="btn_filter_notif">Notif</button>
            </div>
        </div>
    </div>
    <div id="el_wrapper" class="wrapper">
        <div id="el_messages" class="message"></div>
    </div>
    <div class="footer">
        <div class="settings-left">
            <button id="btn_format_normal" title="Affichage normal" value="normal">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" stroke="#fff"><path d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"/></svg>
            </button>
            <button id="btn_format_short" title="Affichage court" value="short">
                <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" width="18" height="18" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5"/></svg>
            </button>
            <button id="btn_format_list" title="Affichage en liste" value="list">
                <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" width="18" height="18" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z"/></svg>
            </button>
        </div>
        <div class="settings-right">
            <button id="btn_dl_csv" title="Exporter les messages au format CSV">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#fff" stroke-width="2" d="M4.998 9V1H19.5L23 4.5V23H4M18 1v5h5M7 13H5c-1 0-2 .5-2 1.5v3c0 1 1 1.5 2 1.5h2m6.25-6h-2.5c-1.5 0-2 .5-2 1.5s.5 1.5 2 1.5 2 .5 2 1.5-.5 1.5-2 1.5h-2.5m12.25-7v.5C20.5 13 18 19 18 19h-.5S15 13 15 12.5V12"/></svg>
            </button>
        </div>
    </div>
`

const battleLogsCss = `
    .console {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 500px;
        height: 100vh;
        background: #232327;
        opacity: 1;
        color: #fff;
        overflow: hidden;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        text-align: left;
        font: initial;
        font-size: 16px;
    }
    .console.side-right {
        right: 0;
        left: auto;
    }
    .console.side-left {
        right: auto;
        left: 0;
    }

    #el_resize {
        background-color: #35393b;
        position: absolute;
        width: 4px;
        height: 100%;
        cursor: w-resize;
    }
    #el_resize.side-right {
        left: 0;
        right: auto;
    }
    #el_resize.side-left {
        left: auto;
        right: 0;
    }

    .header {
        background: #0c0c0d;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.3em 0.6em;
    }

    .title {
        font-weight: 700;
        font-family: 'Roboto Condensed', sans-serif;
    }

    .wrapper {
        align-self: flex-start;
        overflow-x: auto;
        width: 100%;
    }

    .settings {
        background: #232327;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.3em 0.6em;
        gap: 4px;
        cursor: default;
        border-bottom: 1px solid #919191;
        font-size: 13px;
    }
    .settings-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .settings-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .settings-right button {
        padding: 0 0.5em;
    }
    .filters, .averages {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 2px;
    }

    button {
        border: none;
        background-color: transparent;
        cursor: pointer;
        color: #ccc;
        font-family: 'Roboto Condensed',sans-serif;
    }
    button:hover {
        background-color: #434346;
    }
    button.selected {
        background-color: #58585c;
        color: #fff;
    }

    .message {
        height: 100%;
        background-color: #0c0c0d;
    }
    .message > p {
        margin: 0;
        font-family: monospace;
        font-size: 13px;
        line-height: 18px;
        padding: 0.2em 0.5em;
        white-space: pre-wrap;
        word-break: break-word;
        border-bottom: 1px solid #919191;
        background-color: #232327;
        display: flex;
        align-items: center;
        gap: 1em;
        color: #F6F6F6;
    }
    .message > p:nth-last-child(1) {
        border-bottom: 0;
        padding-bottom:0.25em;
    }
    .time {
        flex: none;
        color: #9d9d9f;
        font-family: Calibri,sans-serif;
    }
    .type {
        flex: none;
        margin-left: auto;
        color: #00A7FF;
        font-family: Calibri,sans-serif;
    }

    .footer {
        background-color: #0c0c0d;
        margin-top: auto;
        padding: 0.3em 0.6em;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .footer .settings-left {
        gap: 2px;
    }

    .vl {
        border-left: 1px solid #919191;
        height: 16px;
    }
    
    #phone_expand {
        position: absolute;
        top:0;
        bottom: 0;
        left: 0;
        writing-mode: vertical-rl;
        transform:rotate(180deg);
        text-orientation: sideways;
        cursor: pointer;
        background-color: #232327;
        font-size: 16px;
    }
    #phone_expand .title {
        margin-top: auto;
        text-align: left;
        padding-bottom: 1em;
    }
    
    @media only screen and (orientation: landscape) and (max-device-width: 854px) {
        #el_resize {
            display: none;
        }
        .console {
            width: 100%;
            height: 100%;
            display: none;
        }
        #btn_side {
            display: none;
        }

        .title {
            /* gauche */
            /*margin-top: auto;*/
            /* droite */
        }
    }
`

const phoneHtml = `
    <div class="title">LaCalv Battle Logs</div>
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#fff" ><path fill="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02z" clip-rule="evenodd"/></svg>
`

const elConsole = document.createElement("div")
elConsole.classList.add("console")
elConsole.classList.add("side-" + _bl.bl_settings.side)
elConsole.innerHTML = battleLogsHtml

const elPhoneExpand = document.createElement("div")
elPhoneExpand.id = "phone_expand"
elPhoneExpand.classList.add("header")
elPhoneExpand.innerHTML = phoneHtml
elPhoneExpand.addEventListener("click", () => {
    elConsole.style.display = "flex"
    elWrapper.scrollTop = elWrapper.scrollHeight;
})

let gameOut;

const locationHref = (window.location.href.substr(-1) === '/') ? window.location.href.slice(0, -1) : window.location.href;
if (!_bl.is_phone && (locationHref === "https://lacalv.fr" || locationHref === "https://lacalv.fr/soon")) {
    elConsole.style.width = _bl.bl_settings.width
    elConsole.style.height = _bl.bl_settings.expanded ? "100vh" : "36px"
    gameOut = document.querySelector("body")
} else if (_bl.is_phone && (locationHref === "https://lacalv.fr/m" || locationHref === "https://lacalv.fr/soon")) {
    gameOut = document.querySelector("body")
    gameOut.appendChild(elPhoneExpand)
}

gameOut.appendChild(elConsole)
addGlobalStyle(battleLogsCss);

String.prototype.format = function() {
    var num = arguments.length;
    var oStr = this;
    for (var i = 0; i < num; i++) {
        var pattern = "\\{" + (i) + "\\}";
        var re = new RegExp(pattern, "g");
        oStr = oStr.replace(re, arguments[i]);
    }
    return oStr.capitalize();
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

let m_pos;

function resizeRight(e) {
    let parent = elResize.parentNode;
    let dx = m_pos - e.x;
    m_pos = e.x;
    parent.style.width = (parseInt(getComputedStyle(parent, '').width) + dx) + "px";
    elResize.addEventListener("mouseup", function () {
        document.removeEventListener("mousemove", resizeRight);
        setSettingsStorage("width", parent.style.width);
    });
}

function resizeLeft(e) {
    let parent = elResize.parentNode;
    let dx = m_pos - e.x;
    m_pos = e.x;
    parent.style.width = (parseInt(getComputedStyle(parent, '').width) - dx) + "px";
    elResize.addEventListener("mouseup", function () {
        document.removeEventListener("mousemove", resizeLeft);
        setSettingsStorage("width", parent.style.width);
    });
}

const elResize = document.getElementById("el_resize");
elResize.classList.add("side-" + _bl.bl_settings.side)
elResize.addEventListener("mousedown", function (e) {
    m_pos = e.x;
    if (elResize.classList.contains("side-right")) {
        document.addEventListener("mousemove", resizeRight, false);
    } else {
        document.addEventListener("mousemove", resizeLeft, false);
    }
}, false);


const btnSide = document.getElementById("btn_side")
const dockRight = '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.2 4C20.8 4 22 5.2 22 6.8v10.5c0 1.5-1.2 2.8-2.8 2.8H4.8C3.2 20 2 18.8 2 17.2V6.8C2 5.2 3.2 4 4.8 4h14.4zM16 18.5h3.3c.7 0 1.2-.6 1.2-1.2V6.8c0-.7-.6-1.2-1.2-1.2H16v12.9zM3.5 6.8v10.5c0 .7.6 1.2 1.2 1.2h9.7v-13H4.8c-.7 0-1.3.6-1.3 1.3z" fill="#fff"></path></svg>';
const dockLeft = '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.25 4A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75A2.75 2.75 0 0 1 4.75 4ZM8.004 5.5H4.75c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h3.254v-13Zm11.246 0H9.504v13h9.746c.69 0 1.25-.56 1.25-1.25V6.75c0-.69-.56-1.25-1.25-1.25Z" fill="#fff"/></svg>';
const game = gameOut.querySelector(".game")
if (_bl.bl_settings.side === "right") {
    btnSide.innerHTML = dockLeft;
    btnSide.classList.add("side-right")
    btnSide.title = "Ancrer à gauche"
} else {
    btnSide.innerHTML = dockRight;
    btnSide.classList.add("side-left")
    btnSide.title = "Ancrer à droite"
    changeGameSide(game, "right")
}
btnSide.addEventListener("click", () => {
    if (elConsole.classList.contains("side-right")) {
        btnSide.innerHTML = dockRight;
        elConsole.classList.remove("side-right")
        elConsole.classList.add("side-left")
        elResize.classList.remove("side-right")
        elResize.classList.add("side-left")
        btnSide.title = "Ancrer à droite"
        changeGameSide(game, "right")
        setSettingsStorage("side", "left");
    } else {
        btnSide.innerHTML = dockLeft;
        elConsole.classList.remove("side-left")
        elConsole.classList.add("side-right")
        elResize.classList.remove("side-left")
        elResize.classList.add("side-right")
        btnSide.title = "Ancrer à gauche"
        changeGameSide(game, "left")
        setSettingsStorage("side", "right");
    }
});

function changeGameSide(game, side)  {
    if (!game) return
    if (side === "right") {
        game.style.margin = null
        game.style.marginLeft = "auto"
        game.style.marginRight = "50px"
    } else {
        game.style.margin = null
        game.style.marginLeft = "auto"
        game.style.marginRight = "auto"
    }
}

const btnExpand = document.getElementById("btn_expand")
const chevronDown = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" color="#000"><path d="M0 0h24v24H0z" fill="none"></path><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg>';
const chevronUp = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" color="#000"><path d="M0 0h24v24H0z" fill="none"></path><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path></svg>';
const chevronLeft = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#fff" ><path fill="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02z" clip-rule="evenodd"/></svg>';
if (_bl.is_phone){
    btnExpand.innerHTML = chevronLeft;
} else if (_bl.bl_settings.expanded) {
    btnExpand.innerHTML = chevronUp;
} else {
    btnExpand.innerHTML = chevronDown;
}
btnExpand.addEventListener('click', () => {
    if (_bl.is_phone) {
        elConsole.style.display = "none"
    } else if (elConsole.style.height === '100vh') {
        elConsole.style.height = '36px';
        btnExpand.innerHTML = chevronDown;
        setSettingsStorage("expanded", false);
    } else {
        elConsole.style.height = '100vh';
        btnExpand.innerHTML = chevronUp;
        setSettingsStorage("expanded", true);
    }
});

const btnClear = document.getElementById("btn_clear")
btnClear.addEventListener("click", () => {
    for (const [key, value] of Object.entries(_bl.bl_filters)) {
        if (value === true) {
            setItemStorage("bl_" + key, [], true);
        }
    }
    updateMessages()
});

const btnAverage10 = document.getElementById("btn_average_x10")
if (_bl.bl_filters["x10"] !== false) btnAverage10.classList.add("selected")
btnAverage10.addEventListener("click", () => toggleSelectedClass(btnAverage10));

const btnAverage50 = document.getElementById("btn_average_x50")
if (_bl.bl_filters["x50"] !== false) btnAverage50.classList.add("selected")
btnAverage50.addEventListener("click", () => toggleSelectedClass(btnAverage50));

const btnAverage100 = document.getElementById("btn_average_x100")
if (_bl.bl_filters["x100"] !== false) btnAverage100.classList.add("selected")
btnAverage100.addEventListener("click", () => toggleSelectedClass(btnAverage100));

const btnFilterBoss = document.getElementById("btn_filter_boss")
if (_bl.bl_filters["boss"] !== false) btnFilterBoss.classList.add("selected")
btnFilterBoss.addEventListener("click", () => toggleSelectedClass(btnFilterBoss));

const btnFilterPvp = document.getElementById("btn_filter_pvp")
if (_bl.bl_filters["pvp"] !== false) btnFilterPvp.classList.add("selected")
btnFilterPvp.addEventListener("click", () => toggleSelectedClass(btnFilterPvp));

const btnFilterTob = document.getElementById("btn_filter_tob")
if (_bl.bl_filters["tob"] !== false) btnFilterTob.classList.add("selected")
btnFilterTob.addEventListener("click", () => toggleSelectedClass(btnFilterTob));

const btnFilterNotif = document.getElementById("btn_filter_notif")
if (_bl.bl_filters["notif"] !== false) btnFilterNotif.classList.add("selected")
btnFilterNotif.addEventListener("click", () => toggleSelectedClass(btnFilterNotif));

const btnFormatNormal = document.getElementById("btn_format_normal")
if (_bl.bl_settings.format === "normal") btnFormatNormal.classList.add("selected")
btnFormatNormal.addEventListener("click", () => changeFormatDisplay(btnFormatNormal))

const btnFormatShort = document.getElementById("btn_format_short")
if (_bl.bl_settings.format === "short") btnFormatShort.classList.add("selected")
btnFormatShort.addEventListener("click", () => changeFormatDisplay(btnFormatShort))

const btnFormatList = document.getElementById("btn_format_list")
if (_bl.bl_settings.format === "list") btnFormatList.classList.add("selected")
btnFormatList.addEventListener("click", () => changeFormatDisplay(btnFormatList))

const btnSaveToCsv = document.getElementById("btn_dl_csv")
btnSaveToCsv.addEventListener("click", () => {
    // Build the CSV string
    jsonToCsv(JSON.stringify(getBattleLogsInOrderAsc()))
});

const elMessages = document.getElementById("el_messages")
const elWrapper = document.getElementById("el_wrapper")

function jsonToCsv(data) {
    data = JSON.parse(data)
    const rows = [];

    let headers = new Set();
    data.forEach(log => {
        // use a recursive function to get all keys
        getKeys(log, headers)
    });
    headers = [...headers];

    data.forEach(log => {
        // Create an empty array to store the data for this event
        let row = [];
        // Iterate through all headers
        headers.forEach(header => {
            // use a recursive function to get all values
            let value = getValue(header, log);
            if (value >= 0 || value) {
                row.push(value);
            }
            else {
                row.push(null);
            }
        });
        // Add the row of data to the rows array
        rows.push(row);
    });
    // Create a string with the CSV data
    let csvContent = headers.join(';') + '\n' + rows.map(row => row.join(';')).join('\n');
    let link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(csvContent));
    let date = new Date()
    date = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0') + '-' + date.getHours().toString().padStart(2, '0') + '-' + date.getMinutes().toString().padStart(2, '0')
    link.setAttribute("download", "lacalvbattlelogs-" + date + ".csv");
    link.click();
}

function getKeys(log, headers, parentKey = '') {
    const unwantedKey = ["u.name", "u.result", "o.result"]
    for (let key in log) {
        const newKey = parentKey ? `${parentKey.charAt(0)}.${key}` : key;
        if (unwantedKey.includes(newKey)) continue
        if (Array.isArray(log[key])) {
            getKeys(log[key], headers, key);
        } else if (typeof log[key] === 'object') {
            getKeys(log[key], headers, key);
        }  else {
            headers.add(newKey);
        }
    }
}

function getValue(key, log, parentKey = '') {
    for (let objKey in log) {
        const newKey = parentKey ? `${parentKey.charAt(0)}.${objKey}` : objKey;
        if (newKey === key && parentKey === '') {
            return log[key].toString();
        } else if (newKey === key && parentKey !== '') {
            return log[objKey].toString();
        }

        if (typeof log[objKey] === 'object') {
            let value = getValue(key, log[objKey], objKey);
            if (null !== value && !Array.isArray(value)) { value = value.toString() }
            if (Array.isArray(value) && value.length > 0) {
                return value;
            }else if (value && value.length > 0 && !Array.isArray(value) ) {
                return value;
            }
        }
    }
    return null;
}

function toggleSelectedClass(element) {
    if (element.classList.contains("selected")) {
        element.classList.remove("selected")
        element.id.split(/_/).pop();
        const filters = getItemStorage(BL_FILTERS)
        filters[element.id.split(/_/).pop()] = false
        setItemStorage(BL_FILTERS, filters)
    } else {
        element.classList.add("selected")
        const filters = getItemStorage(BL_FILTERS)
        filters[element.id.split(/_/).pop()] = true
        setItemStorage(BL_FILTERS, filters)
    }
    updateMessages()
}

function changeFormatDisplay(element) {
    const buttons = element.parentNode.querySelectorAll("button")
    buttons.forEach(button => {
        button.classList.remove("selected")
    })
    element.classList.add("selected")
    const settings = getItemStorage(BL_SETTINGS)
    settings["format"] = element.value
    setItemStorage(BL_SETTINGS, settings)
    updateMessages()
}

function addGlobalStyle(css) {
    let head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    style = document.createElement('style');
    style.innerHTML = css;
    head.appendChild(style);
}

function updateMessages() {
    elMessages.innerHTML = ""
    const battleLogs = getBattleLogsInOrderAsc()
    appendBattleLogs(battleLogs)
}

function appendBattleLogs(battleLogs) {
    const logFunctions = {
        Boss: appendBossBattleLogs,
        PvP: appendPvpBattleLogs,
        ToB: appendTobBattleLogs,
        Notif: appendNotifBattleLogs,
    }

    battleLogs.forEach((log) => {
        switch (log.type) {
            case "x10":
            case "x50":
            case "x100":
                appendSummaryLogs(log);
                break;
            default:
                if (logFunctions[log.type]) {
                    logFunctions[log.type](log);
                }
                break;
        }
    });
}

function appendSummaryLogs(log) {
    let count = parseInt(log.type.slice(1));
    let appendSummaryFunc = {
        boss: appendSummaryBossLogs,
        pvp: appendSummaryPvpLogs,
        tob: appendSummaryTobLogs,
    }[log.bl_type];

    if (appendSummaryFunc) {
        appendSummaryFunc(count, log);
    }
}

function appendBossBattle(turn, user, opponent) {
    let battle = {
        "type": "Boss",
        "time": new Date(),
        "turn": turn,
        "opponent": opponent,
        "user": user,
    }
    setItemStorage(BL_BOSS, battle)
    appendBossBattleLogs(battle)
    if (_bl.bl_boss.length % 100 === 0) appendSummaryBossLogs(100)
    if (_bl.bl_boss.length % 50 === 0) appendSummaryBossLogs(50)
    if (_bl.bl_boss.length % 10 === 0) appendSummaryBossLogs(10)
}

function appendPvpBattle(result, user, opponent, reward) {
    let battle = {
        "type": "PvP",
        "time": new Date(),
        "result": result,
        "opponent": opponent,
        "user": user,
        "rewards": reward
    }
    setItemStorage(BL_PVP, battle)
    appendPvpBattleLogs(battle)
    if (_bl.bl_pvp.length % 100 === 0) appendSummaryPvpLogs(100)
    if (_bl.bl_pvp.length % 50 === 0) appendSummaryPvpLogs(50)
    if (_bl.bl_pvp.length % 10 === 0) appendSummaryPvpLogs(10)
}

function appendTobBattle(result, user, opponent, reward, stage) {
    let battle = {
        "type": "ToB",
        "time": new Date(),
        "stage": stage,
        "result": result,
        "opponent": opponent,
        "user": user,
        "rewards": reward,
    }
    setItemStorage(BL_TOB, battle)
    appendTobBattleLogs(battle)
    if (_bl.bl_tob.length % 100 === 0) appendSummaryTobLogs(100)
    if (_bl.bl_tob.length % 50 === 0) appendSummaryTobLogs(50)
    if (_bl.bl_tob.length % 10 === 0) appendSummaryTobLogs(10)
}

function appendNotifBattle(message) {
    let notif = {
        "type": "Notif",
        "time": new Date(),
        "message": JSON.stringify(message)
    }
    setItemStorage(BL_NOTIF, notif)
    appendNotifBattleLogs(notif)
}

function appendBossBattleLogs(log) {
    let message = MESSAGES.boss[_bl.bl_settings.format].format(log.turn, log.turn > 1 ? 's' : '');
    message = concatRewardsAndInfos(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendSummaryBossLogs(count, log = null) {
    if (null === log) {
        const turns = Math.floor(_bl.bl_boss.slice(-count).reduce((acc, log) => acc + log.turn, 0) / count);
        log = {
            "type": "x" + count,
            "bl_type": "boss",
            "time": new Date(),
            "turn": turns,
            "user": calculateStatistics(_bl.bl_boss, count, "user"),
            "opponent": calculateStatistics(_bl.bl_boss, count, "opponent")
        }
        setItemStorage("bl_" + log.type, log)
    }
    let message = MESSAGES.summary.boss[_bl.bl_settings.format].format(log.turn, count);
    message = concatRewardsAndInfosSummaries(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendPvpBattleLogs(log) {
    let message = MESSAGES.pvp[_bl.bl_settings.format].format(log.result === "winner" ? "gagné" : "perdu", log.opponent.name);
    message = concatRewardsAndInfos(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendSummaryPvpLogs(count, log = null) {
    if (null === log) {
        log = {
            "type": "x" + count,
            "bl_type": "pvp",
            "time": new Date(),
            "win": truncateNumber(_bl.bl_pvp.slice(-count).reduce((acc, log) => acc + (log.result === "winner" ? 1 : 0), 0) / count * 100),
            "loose": truncateNumber(_bl.bl_pvp.slice(-count).reduce((acc, log) => acc + (log.result === "looser" ? 1 : 0), 0) / count * 100),
            "rewards": calculateStatistics(_bl.bl_pvp, count, "rewards"),
            "user": calculateStatistics(_bl.bl_pvp, count, "user"),
            "opponent": calculateStatistics(_bl.bl_pvp, count, "opponent")
        }
        setItemStorage("bl_" + log.type, log)
    }
    let message = MESSAGES.summary.pvp[_bl.bl_settings.format].format(count, log.win, log.loose);
    message = concatRewardsAndInfosSummaries(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendTobBattleLogs(log) {
    let message = MESSAGES.tob[_bl.bl_settings.format].format(log.result === "winner" ? "vaincu" : "échoué", log.stage);
    message = concatRewardsAndInfos(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendSummaryTobLogs(count, log = null) {
    if (null === log) {
        log = {
            "type": "x" + count,
            "bl_type": "tob",
            "time": new Date(),
            "win": truncateNumber(_bl.bl_tob.slice(-count).reduce((acc, log) => acc + (log.result === "winner" ? 1 : 0), 0) / count * 100),
            "loose": truncateNumber(_bl.bl_tob.slice(-count).reduce((acc, log) => acc + (log.result === "looser" ? 1 : 0), 0) / count * 100),
            "rewards": calculateStatistics(_bl.bl_tob, count, "rewards"),
            "user": calculateStatistics(_bl.bl_tob, count, "user"),
            "opponent": calculateStatistics(_bl.bl_tob, count, "opponent")
        }
        setItemStorage("bl_" + log.type, log)
    }
    let message = MESSAGES.summary.tob[_bl.bl_settings.format].format(count, log.win, log.loose);
    message = concatRewardsAndInfosSummaries(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendNotifBattleLogs(log) {
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), JSON.parse(log.message), log.type)
}

function appendMessageToBattleLogs(time, message, type) {
    if (_bl.bl_filters[type.toLowerCase()] === false) return
    const pEl = document.createElement('p');
    const spanTimeEl = document.createElement('span')
    spanTimeEl.classList.add("time")
    spanTimeEl.innerHTML = time
    const spanMsdEl = document.createElement('span')
    spanMsdEl.innerHTML = message
    const spanTypeEl = document.createElement('span')
    spanTypeEl.classList.add("type")
    spanTypeEl.innerHTML = type
    pEl.appendChild(spanTimeEl);
    pEl.appendChild(spanMsdEl);
    pEl.appendChild(spanTypeEl);
    elMessages.appendChild(pEl);
    elWrapper.scrollTop = elWrapper.scrollHeight;
}

function concatRewardsAndInfos(message, log) {
    let rewardAndInfos = []
    if (log.rewards) rewardAndInfos.push(formatRewardsLogs(log.rewards))
    if (log.user) rewardAndInfos.push(formatInfosLogs(log.user, "user"))
    if (log.opponent) rewardAndInfos.push(formatInfosLogs(log.opponent, "opponent"))
    if (rewardAndInfos.length > 0) {
        const join = _bl.bl_settings.format === "normal" ? ' ' : MESSAGES.join[_bl.bl_settings.format]
        message = message.concat(join, rewardAndInfos.filter(Boolean).join(join))
    }
    return message
}

function concatRewardsAndInfosSummaries(message, log) {
    if (log.rewards && (log.rewards.elo > 0 || log.rewards.alo > 0 || log.rewards.event > 0 || log.rewards.exp > 0)) {
        message = message.concat(MESSAGES.summary.rewards[_bl.bl_settings.format], formatRewardsLogs(log.rewards))
    }
    const join = _bl.bl_settings.format === "normal" ? ' ' : MESSAGES.join[_bl.bl_settings.format]
    message = message.concat(MESSAGES.summary.infos[_bl.bl_settings.format], [formatInfosLogs(log.user, "user"), formatInfosLogs(log.opponent, "opponent")].filter(Boolean).join(join))
    return message
}

function formatRewardsLogs(rewards) {
    let messages = []
    let msg =''
    if (rewards.elo > 0 || rewards.elo < 0) {
        const msgElo = MESSAGES.rewards.elo[_bl.bl_settings.format].format(rewards.elo)
        messages.push(msgElo)
    }
    if (rewards.alo > 0) {
        const msgAlo = MESSAGES.rewards.alo[_bl.bl_settings.format].format(rewards.alo > 1 ? 's' : '', rewards.alo)
        messages.push(msgAlo)
    }
    if (rewards.event > 0) {
        const msgEvent = MESSAGES.rewards.event[_bl.bl_settings.format].format(rewards.event > 1 ? 's' : '', rewards.event)
        messages.push(msgEvent)
    }
    if (rewards.exp > 0) {
        const msgExp = MESSAGES.rewards.exp[_bl.bl_settings.format].format(rewards.exp > 1 ? 's' : '', rewards.exp)
        messages.push(msgExp)
    }
    if (rewards.items && rewards.items.length > 0) {
        const msgItems = MESSAGES.rewards.items[_bl.bl_settings.format].format(rewards.items.length > 1 ? 's' : '', rewards.items.length > 1 ? '[' + rewards.items.join(', ') + ']' : rewards.items.join(', '))
        messages.push(msgItems)
    }
    if (messages.length > 0) {
        messages = messages.filter(Boolean).join(MESSAGES.join[_bl.bl_settings.format])
        const join = _bl.bl_settings.format === "normal" ? '&nbsp;' : MESSAGES.join[_bl.bl_settings.format]
        msg = MESSAGES.rewards.label[_bl.bl_settings.format]
        msg = msg.concat(join, messages)
    }
    return msg
}

function formatInfosLogs(infos, key = '') {
    let messages = []
    let msg = ''
    if (infos.dmgTotal > 0) {
        const msgDamage = MESSAGES.infos.dmg[_bl.bl_settings.format].format(infos.dmgTotal > 1 ? 's' : '', infos.dmgTotal)
        messages.push(msgDamage)
    }
    if (infos.bouclier > 0 || infos._bouclier > 0) {
        const msgBouclier = MESSAGES.infos.bouclier[_bl.bl_settings.format].format(infos.bouclier)
        messages.push(msgBouclier)
    }
    if (infos.vie > 0) {
        const msgVie = MESSAGES.infos.vie[_bl.bl_settings.format].format(infos.vie)
        messages.push(msgVie)
    }
    if (infos.soinTotal > 0) {
        const msgSoin = MESSAGES.infos.soin[_bl.bl_settings.format].format(infos.soinTotal > 1 ? 's' : '', infos.soinTotal)
        messages.push(msgSoin)
    }
    if (infos.esquive > 0) {
        const msgEsquive = MESSAGES.infos.esquive[_bl.bl_settings.format].format(infos.esquive > 1 ? 's' : '', infos.esquive)
        messages.push(msgEsquive)
    }
    if (infos.stun > 0) {
        const msgStun = MESSAGES.infos.stun[_bl.bl_settings.format].format(infos.stun > 1 ? 's' : '', infos.stun)
        messages.push(msgStun)
    }
    if (infos.dc > 0) {
        const msgStun = MESSAGES.infos.dc[_bl.bl_settings.format].format(infos.dc > 1 ? 's' : '', infos.dc)
        messages.push(msgStun)
    }
    if (messages.length > 0) {
        messages = messages.filter(Boolean).join(MESSAGES.join[_bl.bl_settings.format])
        const join = _bl.bl_settings.format === "normal" ? '&nbsp;' : MESSAGES.join[_bl.bl_settings.format]
        const user = key === "user" ? MESSAGES.infos.label_user[_bl.bl_settings.format] : MESSAGES.infos.label_opponent[_bl.bl_settings.format]
        msg = MESSAGES.infos.label[_bl.bl_settings.format].format(user)
        msg = msg.concat(join, messages)
    }
    return msg
}

function calculateStatistics(logs, count, player) {
    const calculatedStatistics = {};
    Object.keys(logs[0][player]).forEach(statistic => {
        if(typeof logs[0][player][statistic] === "number"){
            calculatedStatistics[statistic] = truncateNumber(logs.slice(-count).reduce((acc, log) => acc + log[player][statistic], 0) / count);
        }
    });
    return calculatedStatistics;
}

function truncateNumber(number) {
    let trunc = number.toFixed(2);
    if (trunc.endsWith('.00')) {
        return parseInt(trunc);
    }
    return parseFloat(trunc);
}

function getBattleLogsInOrderAsc() {
    let logs = [].concat(
        _bl.bl_filters["boss"] !== false ? _bl.bl_boss : [],
        _bl.bl_filters["pvp"] !== false ? _bl.bl_pvp : [],
        _bl.bl_filters["tob"] !== false ? _bl.bl_tob : [],
        _bl.bl_filters["x10"] !== false ? _bl.bl_x10 : [],
        _bl.bl_filters["x50"] !== false ? _bl.bl_x50 : [],
        _bl.bl_filters["x100"] !== false ? _bl.bl_x100 : [],
        _bl.bl_filters["notif"] !== false ? _bl.bl_notif : [],
    )
    return logs.sort((a, b) => new Date(a.time) - new Date(b.time));
}

let battleLogs = getBattleLogsInOrderAsc()
appendBattleLogs(battleLogs)


realProcess = function (xhr) {
    if (xhr.responseURL.startsWith("https://lacalv.fr/play/battle?opponent")) {
        parseBattleOpponentResponse(xhr)
    } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/battlepve")) {
        parseBattleTobResponse(xhr)
    } else if (xhr.responseURL === "https://lacalv.fr/play/battlewb") {
        parseBattleWbResponse(xhr)
    } else if (xhr.responseURL === "https://lacalv.fr/play/update") {
        parseUpdateResponse(xhr)
    } else if (xhr.responseURL === "https://lacalv.fr/play/wbclassement") {
        parseWbClassementResponse(xhr)
    }
}

function hijackAjax(process) {
    if (typeof process != "function") {
        process = function (e) {
            console.log(e);
        };
    }
    window.addEventListener("hijack_ajax", function (event) {
        process(event.detail);
    }, false);

    function injection() {
        let open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
            this.addEventListener("load", function () {
                window.dispatchEvent(new CustomEvent("hijack_ajax", {detail: this}));
            }, false);
            open.apply(this, arguments);
        };
    }

    window.setTimeout("(" + injection.toString() + ")()", 0);
}

hijackAjax(realProcess);


class Execution {
    static worldboss_reward = null;
    static worldboss_reward_printed = null;
    static admin_reward = null;
    static admin_reward_printed = null;
    static wbclassement = {top: [], user: {classement: 0, damages: 0, max: 0}, date:null};
}

class Update {
    static notifs = [];
    static streaming = false;
    static wb = -1
}


function parseUpdateResponse(xhr) {
    const data = JSON.parse(xhr.response)
    if (Update.streaming !== data['streaming']) {
        Update.streaming = data['streaming'];
        // appendToConsole(`Stream: ${Update.streaming ? "En Ligne" : "Hors Ligne"}`);
    }
    if ('player' in data) Update.notifs = data['player']['notifs']
    if ('wb' in data) Update.wb = data['wb']
}

function parseBattleWbResponse(xhr) {
    const data = JSON.parse(xhr.response)
    const {user, opponent} = getStatsFromBattle(data);
    if (delete opponent.soinTotal < 0) delete opponent.soinTotal
    if (delete opponent.pvRecover < 0) delete opponent.pvRecover
    const userTurn = user.turn
    delete opponent.vie
    delete opponent._pv
    delete user.turn
    appendBossBattle(userTurn, user, opponent)
}

function parseWbClassementResponse(xhr) {
    const data = JSON.parse(xhr.response)
    if ('top' in data && data['top'].length > 0) Execution.wbclassement['top'] = data['top']
    if ('user' in data && data['user']['classement'] !== -1) Execution.wbclassement['user'] = data['user']
    Execution.wbclassement['date'] = new Date()
}

function parseBattleOpponentResponse(xhr) {
    const data = JSON.parse(xhr.response)
    const {user, opponent} = getStatsFromBattle(data);
    delete user.turn
    const rewards = {'elo': user.result === "winner" ? data.eloUser : -Math.abs(data.eloUser), 'alo': data.aloUser, 'exp': data.expUser, 'event': data.event}
    appendPvpBattle(user.result, user, opponent, rewards)
}

function parseBattleTobResponse(xhr) {
    const data = JSON.parse(xhr.response)
    const url = new URL(xhr.responseURL)
    const stage = new URLSearchParams(url.search).get('step')
    const {user, opponent} = getStatsFromBattle(data);
    delete user.turn
    let itemsWin = [];
    if ('item' in data.rewards) {
        for (const item of data.rewards.item) {
            if (item.count > 1) {
                itemsWin.push(`${item.value} (x${item.count})`);
            } else {
                itemsWin.push(`${item.value}`);
            }
        }
    }
    const rewards = {'alo': data.rewards.alopieces, 'exp': data.expUser, 'event': data.rewards.event, 'items': itemsWin}
    appendTobBattle(user.result, user, opponent, rewards, stage)
}

function printNotifs() {
    const reward = getRewardsInNotifs(Update.notifs)
    Execution.worldboss_reward = reward.worldboss
    Execution.admin_reward = reward.admin

    if (null != Execution.worldboss_reward && (Execution.worldboss_reward_printed === null || Execution.worldboss_reward.date !== Execution.worldboss_reward_printed.date)) {
        appendNotifBattle(Execution.worldboss_reward.text)
        Execution.worldboss_reward_printed = Execution.worldboss_reward
    } else if (null != Execution.admin_reward && (Execution.admin_reward_printed === null || Execution.admin_reward.date !== Execution.admin_reward_printed.date)) {
        appendNotifBattle(Execution.admin_reward.text)
        Execution.admin_reward_printed = Execution.admin_reward
    }
}

function printWbclassement() {
    if (Update.wb < 0 && Execution.wbclassement.top.length > 0) {
        const user = Execution.wbclassement['user']
        let msg = "Classement Worldboss {0}/{1} ({2})&nbsp;:".format(user.classement + 1, user.max + 1, Execution.wbclassement.date.toLocaleString("fr-FR"))
        for (let i = 0; i < Execution.wbclassement['top'].length; i++) {
            let user = Execution.wbclassement['top'][i];
            msg += "\n";
            msg += formatRankingLine(user, i+1);
        }
        msg += "\n";
        msg += formatRankingLine(user, user.classement + 1);
        appendNotifBattle(msg)
        Execution.wbclassement['top'] = [];
        Execution.wbclassement['user'] = {classement: 0, damages: 0, max: 0};
    }
}

function formatRankingLine(user, rank) {
    const pad = (rank).toString().length > 2 ? (rank).toString().length : 2
    let spacing = 25 - user['pseudoTwitch'].length;
    return `${(rank).toString().padEnd(pad)} - ${user['pseudoTwitch']} ${user['damage'].toString().padStart(spacing)} dommages`;
}

setInterval(function () {
    printNotifs()
    printWbclassement()
}, 15000);

function getRewardsInNotifs(notifs) {
    let rewards = {admin: null, worldboss: null};
    for (let i = 0; i < notifs.length; i++) {
        let notif = notifs[i];
        if (notif.type === 'Boss des Mondes') {
            if (minElapsedSinceExecution(notif.date) < 5) {
                rewards.worldboss = notif;
            }
        } else if (notif.type === 'Admin') {
            if (minElapsedSinceExecution(notif.date) < 5) {
                rewards.admin = notif;
            }
        }
    }
    return rewards;
}

function minElapsedSinceExecution(dateString) {
    let [datePart, timePart] = dateString.split(" ");
    let [day, month, year] = datePart.split("/");
    let [hour, minute] = timePart.split(":");
    let date = new Date(year, month - 1, day, hour, minute);

    let diffInSeconds = (new Date().getTime() - date.getTime()) / 1000;
    return diffInSeconds / 60;
}

function getStatsFromBattle(data) {
    let statsObject = {
        name: 'Name',
        result: 'null',
        vie: 0,
        bouclier: 0,
        dmgTotal: 0,
        dmg: 0,
        dmgRenvoi: 0,
        dmgPoison: 0,
        soinTotal: 0,
        pvRecover: 0,
        vdv: 0,
        dc: 0,
        erosion: 0,
        stun: 0,
        esquive: 0,
        _pv: 0,
        _bouclier: 0
    };
    let user = Object.assign({}, statsObject);
    user.turn = 0
    let opponent = Object.assign({}, statsObject);
    let u = data.user;
    let o = data.opponent;
    let battle = data.battle;
    let actions = battle[0];
    user.name = u.pseudoTwitch;
    opponent.name = "pseudoTwitch" in o ? o.pseudoTwitch : o.name;

    let result = actions[actions.length - 1];
    if ('winner' in result && 'looser' in result && user.name === result.winner) {
        user.result = 'winner';
        opponent.result = 'looser';
    } else if ('winner' in result && 'looser' in result) {
        user.result = 'looser';
        opponent.result = 'winner';
    }
    if ('armeEffect' in o && !(o.armeEffect.id === 'chance' || o.armeEffect.id === 'soin')) {
        opponent.pvRecover = -1;
    }
    for (let [i, action] of actions.entries()) {
        if (action.u1 && action.u2 && action.m1 && action.m2) {
            if (i === 0) {
                user._pv = action.u1.pv;
                opponent._pv = action.u2.pv;
                user._bouclier = action.m1[24];
                opponent._bouclier = action.m2[24];
            }
        }
        if (action.u1 && action.u2) {
            if (action.u1.modifiers) {
                user.bouclier = action.u1.modifiers[24];
            }
            if (action.u2.modifiers) {
                opponent.bouclier = action.u2.modifiers[24];
            }
            user.vie = action.u1.pv;
            opponent.vie = action.u2.pv;
            user.vie = action.u1.pv;
            opponent.vie = action.u2.pv;
        }
        let currentUser;
        if (action.from === user.name) {
            currentUser = user;
        } else if (action.from === opponent.name) {
            currentUser = opponent;
        }
        if (action.data && action.action === 'atk') {
            if (action.from === user.name) user.turn += 1;

            if (action.data.dc) {
                currentUser.dc += 1;
            }
            currentUser.vdv += action.data.vdv > 0 ? action.data.vdv : 0;
            currentUser.dmg += action.data.dmg > 0 ? action.data.dmg : 0;
            currentUser.erosion += action.data.erosion > 0 ? action.data.erosion : 0;
            if (currentUser === user) {
                opponent.dmgRenvoi += action.data.renvoi > 0 ? action.data.renvoi : 0;
                if (action.data.ublocked) {
                    opponent.stun += 1;
                }
                if (action.data.oblocked) {
                    opponent.esquive += 1;
                }
            } else {
                user.dmgRenvoi += action.data.renvoi > 0 ? action.data.renvoi : 0;
                if (action.data.ublocked) {
                    user.stun += 1;
                }
                if (action.data.oblocked) {
                    user.esquive += 1;
                }
            }
        } else if (action.data && action.action === 'poison') {
            if ('pv' in action.data) {
                currentUser.dmgPoison += action.data.pv;
            }
        } else if (action.data && action.action === 'chance') {
            if ('pv' in action.data) {
                currentUser.pvRecover += action.data.pv;
            }
        }
    }

    user.dmgTotal = user.dmg + user.dmgRenvoi + user.dmgPoison;
    user.soinTotal = user.pvRecover + user.vdv
    opponent.dmgTotal = opponent.dmg + opponent.dmgRenvoi + opponent.dmgPoison;
    opponent.soinTotal = opponent.pvRecover + opponent.vdv;
    return {user, opponent};
}