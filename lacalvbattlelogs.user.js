// ==UserScript==
// @name        LaCalv Battle Logs
// @author      Sorrow
// @description Ce script intercepte les réponses et les affiches dans la console LaCalv Battle Log, parsée et formatée de manière à être facilement lisible.
// @include     https://lacalv.fr/
// @version     1.5

// @homepageURL   https://github.com/sanjuant/LaCalvBattleLogs/
// @supportURL    https://github.com/sanjuant/LaCalvBattleLogs/issues
// @downloadURL   https://github.com/sanjuant/LaCalvBattleLogs/raw/master/lacalvbattlelogs.user.js
// @updateURL     https://github.com/sanjuant/LaCalvBattleLogs/raw/master/lacalvbattlelogs.user.js
// ==/UserScript==

const BL_VERSION = "bl_localstorage_version"
const BL_BOSS = "bl_boss"
const BL_PVP = "bl_pvp"
const BL_TOB = "bl_tob"
const BL_LOCALSTORAGE_VERSION = 0.4
const BL_FILTERS = "bl_filters"
const BL_X10 = "bl_x10"
const BL_X50 = "bl_x50"
const BL_X100 = "bl_x100"
const BL_NOTIF = "bl_notif"
const FILTERS = {'x10': true, 'x50': true, 'x100': true, 'boss': true, 'pvp': true, 'tob': true, 'notif': true}
const BL_SETTINGS = "bl_settings"
const SETTINGS = {'width':'500px', 'side':'right', 'expanded': false}

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
    bl_settings:SETTINGS
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
            <button id="btn_side">

            </button>
            <button id="btn_expand">
    
            </button>
        </div>
    </div>
    <div class="wrapper">
        <div class="settings">
            <div class="clear">
                <button id="btn_clear">
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
        <div id="el_messages" class="message">
<!--            <p><span class="time">21:07:05</span><span class="text">[Top 26%] Tu as obtenu 3660 alopièces, et x10 "Coquille dégarnie"</span><span class="type">Boss</span></p>-->
<!--            <p><span class="time">21:21:13</span><span class="text">NahusOmega: Perdu - Vie&nbsp;:&nbsp;590</span><span class="type">PvP</span></p>-->
        </div>
    </div>
`

const battleLogsCss = `
    .console {
        position: absolute;
        top: 0;
        width: 500px;
        height: 100%;
        background: #232327;
        opacity: 1;
        color: #fff;
        overflow: hidden;
        z-index: 9999
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

    .vl {
        border-left: 1px solid #919191;
        height: 16px;
    }

    .header {
        background: #0c0c0d;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.3rem 0.6rem;
    }
    
    .wrapper {
        height: calc(100% - 36px);
    }

    .settings {
        background: #232327;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.3rem 0.6rem;
        gap: 4px;
        cursor: default;
        border-bottom: 1px solid #919191;
        font-size: 13px;
    }

    .settings-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    button {
        border: none;
        background-color: transparent;
        cursor: pointer;
        color: #ccc;
    }

    .settings-right button {
        padding: 0 0.5rem;
    }

    button:hover {
        background-color: #434346;
    }

    button.selected {
        background-color: #58585c;
        color: #fff;
    }


    .title {
        font-weight: 700;
        font-family: 'Roboto Condensed', sans-serif;
    }

    .message {
        height: calc(98% - 36px);
        overflow: auto;
        background-color: #0c0c0d;
    }

    .message > p {
        margin: 0;
        font-family: monospace;
        font-size: 13px;
        line-height: 18px;
        padding: 0.2rem 0.5rem;
        white-space: pre-wrap;
        word-break: break-word;
        border-bottom: 1px solid #919191;
        background-color: #232327;
        display: flex;
        align-items: center;
        gap: 1rem;
        color: #F6F6F6;
    }
    
    .message > p:nth-last-child(1) {
        border-bottom: 0;
        padding-bottom:0.25rem;
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
`

const gameOut = document.querySelector(".game-out")
const game = gameOut.querySelector(".game")

const elConsole = document.createElement("div")
elConsole.style.width = _bl.bl_settings.width
elConsole.classList.add("console")
elConsole.classList.add("side-" + _bl.bl_settings.side)
elConsole.style.height = _bl.bl_settings.expanded ? "100%" : "36px"
elConsole.innerHTML = battleLogsHtml

gameOut.appendChild(elConsole)

addGlobalStyle(battleLogsCss);

String.prototype.format = function () {
    let i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

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
    console.log("resizeLeft")
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
const right = "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.2 4C20.8 4 22 5.2 22 6.8v10.5c0 1.5-1.2 2.8-2.8 2.8H4.8C3.2 20 2 18.8 2 17.2V6.8C2 5.2 3.2 4 4.8 4h14.4zM16 18.5h3.3c.7 0 1.2-.6 1.2-1.2V6.8c0-.7-.6-1.2-1.2-1.2H16v12.9zM3.5 6.8v10.5c0 .7.6 1.2 1.2 1.2h9.7v-13H4.8c-.7 0-1.3.6-1.3 1.3z\" fill=\"#fff\"></path></svg>";
const left = "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.25 4A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75A2.75 2.75 0 0 1 4.75 4ZM8.004 5.5H4.75c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h3.254v-13Zm11.246 0H9.504v13h9.746c.69 0 1.25-.56 1.25-1.25V6.75c0-.69-.56-1.25-1.25-1.25Z\" fill=\"#fff\"/></svg>";
if (_bl.bl_settings.side === "right") {
    btnSide.innerHTML = left;
    btnSide.classList.add("side-right")
    btnSide.title = "Ancrer à gauche"
} else {
    btnSide.innerHTML = right;
    btnSide.classList.add("side-left")
    btnSide.title = "Ancrer à droite"
    game.style.margin = null
    game.style.marginLeft = "auto"
    game.style.marginRight = "50px"
}
btnSide.addEventListener("click", () => {
    if (elConsole.classList.contains("side-right")) {
        btnSide.innerHTML = "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.2 4C20.8 4 22 5.2 22 6.8v10.5c0 1.5-1.2 2.8-2.8 2.8H4.8C3.2 20 2 18.8 2 17.2V6.8C2 5.2 3.2 4 4.8 4h14.4zM16 18.5h3.3c.7 0 1.2-.6 1.2-1.2V6.8c0-.7-.6-1.2-1.2-1.2H16v12.9zM3.5 6.8v10.5c0 .7.6 1.2 1.2 1.2h9.7v-13H4.8c-.7 0-1.3.6-1.3 1.3z\" fill=\"#fff\"></path></svg>"
        elConsole.classList.remove("side-right")
        elConsole.classList.add("side-left")
        elResize.classList.remove("side-right")
        elResize.classList.add("side-left")
        btnSide.title = "Ancrer à droite"
        game.style.margin = null
        game.style.marginLeft = "auto"
        game.style.marginRight = "50px"
        setSettingsStorage("side", "left");
    } else {
        btnSide.innerHTML = "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.25 4A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75A2.75 2.75 0 0 1 4.75 4ZM8.004 5.5H4.75c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h3.254v-13Zm11.246 0H9.504v13h9.746c.69 0 1.25-.56 1.25-1.25V6.75c0-.69-.56-1.25-1.25-1.25Z\" fill=\"#fff\"/></svg>"
        elConsole.classList.remove("side-left")
        elConsole.classList.add("side-right")
        elResize.classList.remove("side-left")
        elResize.classList.add("side-right")
        btnSide.title = "Ancrer à gauche"
        game.style.margin = null
        game.style.marginLeft = "auto"
        game.style.marginRight = "auto"
        setSettingsStorage("side", "right");
    }
});

const btnExpand = document.getElementById("btn_expand")
const down = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" color="#000"><path d="M0 0h24v24H0z" fill="none"></path><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg>';
const up = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" color="#000"><path d="M0 0h24v24H0z" fill="none"></path><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path></svg>';
if (_bl.bl_settings.expanded) {
    btnExpand.innerHTML = up;
} else {
    btnExpand.innerHTML = down;
}
btnExpand.addEventListener('click', () => {
    if (elConsole.style.height === '100%') {
        elConsole.style.height = '36px';
        btnExpand.innerHTML = down;
        setSettingsStorage("expanded", false);
    } else {
        elConsole.style.height = '100%';
        btnExpand.innerHTML = up;
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

const elMessages = document.getElementById("el_messages")


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

function appendBossBattle(damages, infos) {
    let battle = {
        "type": "Boss",
        "time": new Date(),
        "damages": damages,
        "infos": infos,
    }
    setItemStorage(BL_BOSS, battle)
    appendBossBattleLogs(battle)
    if (_bl.bl_boss.length % 100 === 0) appendSummaryBossLogs(100)
    if (_bl.bl_boss.length % 50 === 0) appendSummaryBossLogs(50)
    if (_bl.bl_boss.length % 10 === 0) appendSummaryBossLogs(10)
}

function appendPvpBattle(result, opponent, reward, infos) {
    let battle = {
        "type": "PvP",
        "time": new Date(),
        "result": result,
        "opponent": opponent,
        "rewards": reward,
        "infos": infos,
    }
    setItemStorage(BL_PVP, battle)
    appendPvpBattleLogs(battle)
    if (_bl.bl_pvp.length % 100 === 0) appendSummaryPvpLogs(100)
    if (_bl.bl_pvp.length % 50 === 0) appendSummaryPvpLogs(50)
    if (_bl.bl_pvp.length % 10 === 0) appendSummaryPvpLogs(10)
}

function appendTobBattle(result, opponent, reward, infos, stage) {
    let battle = {
        "type": "ToB",
        "time": new Date(),
        "stage": stage,
        "result": result,
        "opponent": opponent,
        "rewards": reward,
        "infos": infos,
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
        "message": message
    }
    setItemStorage(BL_NOTIF, notif)
    appendNotifBattleLogs(notif)
}

function appendBossBattleLogs(log) {
    const msg = "Vous avez causé {} dommage{}."
    let message = msg.format(log.damages, log.damages > 1 ? 's' : '');
    message = message.concat(' ', formatInfosLogs(log.infos))
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendSummaryBossLogs(count, log = null) {
    if (null === log) {
        const averageDamages = Math.floor(_bl.bl_boss.slice(-count).reduce((acc, log) => acc + log.damages, 0) / count);
        log = {
            "type": "x" + count,
            "bl_type": "boss",
            "time": new Date(),
            "averageDamages": averageDamages,
            "infos": {
                "esquive": _bl.bl_boss.slice(-count).reduce((acc, log) => acc + log.infos.esquive, 0) / count,
            },
        }
        setItemStorage("bl_" + log.type, log)
    }
    const msg = "Le Boss a subi en moyenne {} points de dommages lors des {} derniers combats."
    let message = msg.format(log.averageDamages, count);
    if (log.infos.esquive > 0) {
        message = message.concat("\nStatistiques moyennes - ", formatInfosLogs(log.infos))
    }
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendPvpBattleLogs(log) {
    const msg = "Vous avez {}, contre {}."
    let message = msg.format(log.result === "winner" ? "gagné" : "perdu", log.opponent);
    message = concatRewardsAndInfos(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendSummaryPvpLogs(count, log = null) {
    if (null === log) {
        log = {
            "type": "x" + count,
            "bl_type": "pvp",
            "time": new Date(),
            "win": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + (log.result === "winner" ? 1 : 0), 0) / count * 100,
            "loose": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + (log.result === "looser" ? 1 : 0), 0) / count * 100,
            "rewards": {
                "elo": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.rewards.elo, 0) / count,
                "alo": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.rewards.alo, 0) / count,
                "event": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.rewards.event, 0) / count,
                "exp": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.rewards.exp, 0) / count,
            },
            "infos": {
                "vie": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.infos.vie, 0) / count,
                "bouclier": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.infos.bouclier, 0) / count,
                "soin": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.infos.soin, 0) / count,
                "esquive": _bl.bl_pvp.slice(-count).reduce((acc, log) => acc + log.infos.esquive, 0) / count,
            },
        }
        setItemStorage("bl_" + log.type, log)
    }
    const msg = "Résultat des {} derniers combats PvP : Victoire {}% - Défaite {}%"
    let message = msg.format(count, log.win, log.loose);
    message = concatRewardsAndInfosSummaries(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendTobBattleLogs(log) {
    const msg = "Vous avez {} à l'étage {}."
    let message = msg.format(log.result === "winner" ? "vaincu" : "échoué", log.stage);
    message = concatRewardsAndInfos(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendSummaryTobLogs(count, log = null) {
    if (null === log) {
        log = {
            "type": "x" + count,
            "bl_type": "tob",
            "time": new Date(),
            "win": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + (log.result === "winner" ? 1 : 0), 0) / count * 100,
            "loose": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + (log.result === "looser" ? 1 : 0), 0) / count * 100,
            "rewards": {
                "alo": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + log.rewards.alo, 0) / count,
                "event": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + log.rewards.event, 0) / count,
                "exp": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + log.rewards.exp, 0) / count,
            },
            "infos": {
                "vie": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + log.infos.vie, 0) / count,
                "bouclier": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + log.infos.bouclier, 0) / count,
                "soin": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + log.infos.soin, 0) / count,
                "esquive": _bl.bl_tob.slice(-count).reduce((acc, log) => acc + log.infos.esquive, 0) / count,
            },
        }
        setItemStorage("bl_" + log.type, log)
    }
    const msg = "Résultat des {} derniers combats ToB : Victoire {}% - Défaite {}%"
    let message = msg.format(count, log.win, log.loose);
    message = concatRewardsAndInfosSummaries(message, log)
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), message, log.type)
}

function appendNotifBattleLogs(log) {
    appendMessageToBattleLogs(new Date(log.time).toLocaleTimeString(), log.message, log.type)
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
    elMessages.scrollTop = elMessages.scrollHeight;
}

function concatRewardsAndInfos(message, log) {
    if (log.result === "winner" && formatRewardsLogs(log.rewards) !== '') {
        message = message.concat(' ', formatRewardsLogs(log.rewards))
    }
    message = message.concat(' ', formatInfosLogs(log.infos))
    return message
}

function concatRewardsAndInfosSummaries(message, log) {
    if (log.rewards.elo > 0 || log.rewards.alo > 0 || log.rewards.event > 0 || log.rewards.exp > 0) {
        message = message.concat("\nRécompenses moyennes - ", formatRewardsLogs(log.rewards))
    }
    if (log.infos.vie > 0 || log.infos.bouclier > 0 || log.infos.soin > 0 || log.infos.esquive > 0) {
        message = message.concat("\nStatistiques moyennes - ", formatInfosLogs(log.infos))
    }
    return message
}

function formatRewardsLogs(rewards) {
    let messages = []
    if (rewards.elo > 0) {
        messages.push("Elo&nbsp;:&nbsp;{}".format(rewards.elo))
    }
    if (rewards.alo > 0) {
        messages.push("Alopièce{}&nbsp;:&nbsp;{}".format(rewards.alo > 1 ? 's' : '', rewards.alo))
    }
    if (rewards.event > 0) {
        messages.push("Event{}&nbsp;:&nbsp;{}".format(rewards.event > 1 ? 's' : '', rewards.event))
    }
    if (rewards.exp > 0) {
        messages.push("Expérience{}&nbsp;:&nbsp;{}".format(rewards.exp > 1 ? 's' : '', rewards.exp))
    }
    return messages.join(', ')
}

function formatInfosLogs(infos) {
    let messages = []
    if (infos.bouclier > 0 || infos._bouclier > 0) {
        messages.push("Bouclier&nbsp;:&nbsp;{}".format(infos.bouclier))
    }
    if (infos.vie > 0) {
        messages.push("Vie&nbsp;:&nbsp;{}".format(infos.vie))
    }
    if (infos.soin > 0) {
        messages.push("Soin{}&nbsp;:&nbsp;{}".format(infos.soin > 1 ? 's' : '', infos.soin))
    }
    if (infos.esquive > 0) {
        messages.push("Esquive{}&nbsp;:&nbsp;{}".format(infos.esquive > 1 ? 's' : '', infos.esquive))
    }
    return messages.join(', ')
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
    static wbclassement = {top: [], user: {classement: 0, dommages: 0}};
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
    Update.notifs = data['player']['notifs']
    Update.wb = data['wb']
}

function parseBattleWbResponse(xhr) {
    const data = JSON.parse(xhr.response)
    const {player, opponent} = getStatsFromBattle(data);
    const infos_wb = {'esquive': player.oblocked}

    appendBossBattle(player.dmg, infos_wb)
}

function parseWbClassementResponse(xhr) {
    const data = JSON.parse(xhr.response)
    Execution.wbclassement['top'] = data['top']
}

function parseBattleOpponentResponse(xhr) {
    const data = JSON.parse(xhr.response)
    const {player, opponent} = getStatsFromBattle(data);
    const rewards = {'elo': data.eloUser, 'alo': data.aloUser, 'exp': data.expUser, 'event': data.event}
    const infos_opponent = {
        'vie': opponent.pvFinal,
        'bouclier': opponent.bouclier,
        'soin': opponent.soinTotal,
        'esquive': player.oblocked,
        '_bouclier': opponent._bouclier
    }
    appendPvpBattle(player.result, opponent.name, rewards, infos_opponent)
}

function parseBattleTobResponse(xhr) {
    const data = JSON.parse(xhr.response)
    const url = new URL(xhr.responseURL)
    const stage = new URLSearchParams(url.search).get('step')
    const {player, opponent} = getStatsFromBattle(data);
    let itemsWin = [];
    if ('item' in data.rewards) {
        for (const item of data.rewards) {
            const itemWin = `${item.value} (x${item.count})`;
            itemsWin.push(itemWin);
        }
    }
    const rewards = {'alo': data.rewards.alopieces, 'exp': data.expUser, 'event': data.rewards.event, 'items': itemsWin}
    const infos_opponent = {
        'vie': opponent.pvFinal,
        'bouclier': opponent.bouclier,
        'soin': opponent.soinTotal,
        'esquive': player.oblocked,
        '_bouclier': opponent._bouclier
    }

    appendTobBattle(player.result, opponent.name, rewards, infos_opponent, stage)
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
        let msg = "Classement Worldboss&nbsp;:"
        for (let i = 0; i < Execution.wbclassement['top'].length; i++) {
            let user = Execution.wbclassement['top'][i];
            msg += "\n";
            let spacing = 25 - user['pseudoTwitch'].length;
            msg += `${i + 1} ${i < 9 ? " " : ""} - ${user['pseudoTwitch']} ${user['damage'].toString().padStart(spacing)} dommages`;
        }

        appendNotifBattle(msg)
        Execution.wbclassement['top'] = [];
    }
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
        pvFinal: 0,
        bouclier: 0,
        dmgTotal: 0,
        dmg: 0,
        dmgRenvoi: 0,
        dmgPoison: 0,
        soinTotal: 0,
        pvRecover: -1,
        vdv: 0,
        ublocked: 0,
        oblocked: 0,
        _force: 0,
        _esquive: 0,
        _pv: 0,
        _speed: 0,
        _defaultDamage: 0,
        _speedCalculated: 0,
        _bouclier: 0
    };
    let player = Object.assign({}, statsObject);
    let opponent = Object.assign({}, statsObject);
    let u = data.user;
    let o = data.opponent;
    let battle = data.battle;
    let actions = battle[0];
    player.name = u.pseudoTwitch;
    opponent.name = "pseudoTwitch" in o ? o.pseudoTwitch : o.name;

    let result = actions[actions.length - 1];
    if ('winner' in result && 'looser' in result && player.name === result.winner) {
        player.result = 'winner';
        opponent.result = 'looser';
    } else if ('winner' in result && 'looser' in result) {
        player.result = 'looser';
        opponent.result = 'winner';
    }
    if ('armeEffect' in o && (o.armeEffect.id === 'chance' || o.armeEffect.id === 'soin')) {
        opponent.pvRecover = 0;
    }
    for (let [i, action] of actions.entries()) {
        if (action.u1 && action.u2 && action.m1 && action.m2) {
            if (i === 0) {
                player._force = action.u1.force;
                opponent._force = action.u2.force;
                player._esquive = action.u1.esquive;
                opponent._esquive = action.u2.esquive;
                player._pv = action.u1.pv;
                opponent._pv = action.u2.pv;
                player._speed = action.u1.speed;
                opponent._speed = action.u2.speed;
                player._defaultDamage = action.u1.defaultDamage;
                opponent._defaultDamage = action.u2.defaultDamage;
                player._speedCalculated = action.u1.speedCalculated;
                opponent._speedCalculated = action.u2.speedCalculated;
                player._bouclier = action.m1[24];
                opponent._bouclier = action.m2[24];
            }
        }
        if (action.u1 && action.u2) {
            if (action.u1.modifiers) {
                player.bouclier = action.u1.modifiers[24];
            }
            if (action.u2.modifiers) {
                opponent.bouclier = action.u2.modifiers[24];
            }
            player.pvFinal = action.u1.pv;
            opponent.pvFinal = action.u2.pv;
            player.pvFinal = action.u1.pv;
            opponent.pvFinal = action.u2.pv;
        }
        let playerOrOpponent;
        if (action.from === player.name) {
            playerOrOpponent = player;
        } else if (action.from === opponent.name) {
            playerOrOpponent = opponent;
        }
        if (action.data && action.action === 'atk') {
            if (action.data.ublocked) {
                playerOrOpponent.ublocked += 1;
            }
            if (action.data.oblocked) {
                playerOrOpponent.oblocked += 1;
            }
            playerOrOpponent.vdv += action.data.vdv;
            playerOrOpponent.dmg += action.data.dmg;
            if (playerOrOpponent === player) {
                opponent.dmgRenvoi += action.data.renvoi;
            } else {
                player.dmgRenvoi += action.data.renvoi;
            }
        } else if (action.data && action.action === 'poison') {
            if ('pv' in action.data) {
                playerOrOpponent.dmgPoison += action.data.pv;
            }
        } else if (action.data && action.action === 'chance') {
            if ('pv' in action.data) {
                playerOrOpponent.pvRecover += action.data.pv;
            }
        }
    }

    player.dmgTotal = player.dmg + player.dmgRenvoi + player.dmgPoison;
    player.soinTotal = player.pvRecover + player.vdv;
    opponent.dmgTotal = opponent.dmg + opponent.dmgRenvoi + opponent.dmgPoison;
    opponent.soinTotal = opponent.pvRecover + opponent.vdv;

    return {player: player, opponent: opponent};
}