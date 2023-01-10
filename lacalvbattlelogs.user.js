// ==UserScript==
// @name        LaCalv Battle Logs
// @description Ce script intercepte les réponses et les affiches dans la console LaCalv Battle Log, parsée et formatée de manière à être facilement lisible.
// @include     https://lacalv.fr/
// @version     0.2
// ==/UserScript==

const MAX_CONSOLE_MESSAGES = 100

class Execution {
    static worldboss_reward = null;
    static worldboss_reward_printed = null;
    static admin_reward = null;
    static admin_reward_printed = null;
    static wbclassement = { top: [], user: { classement: 0, dommages: 0 } };
}

class Update {
    static notifs = [];
    static streaming = false;
    static wb = -1
}

realProcess = function (xhr) {
    if (xhr.responseURL === "https://lacalv.fr/play/battlewb") {
        parseBattleWbResponse(xhr.response)
    } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/battle?opponent")) {
        parseBattleOpponentResponse(xhr.response)
    } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/battlepve")) {
        parseBattlePveResponse(xhr.response)
    } else if (xhr.responseURL === "https://lacalv.fr/play/update") {
        parseUpdateResponse(xhr.response)
    } else if (xhr.responseURL === "https://lacalv.fr/play/wbclassement") {
        parseWbClassementResponse(xhr.response)
    }
}

function parseUpdateResponse(response) {
    const data = JSON.parse(response)
    if (Update.streaming !== data['streaming']) {
        Update.streaming = data['streaming'];
        // appendToConsole(`Stream: ${Update.streaming ? "En Ligne" : "Hors Ligne"}`);
    }
    Update.notifs = data['player']['notifs']
    Update.wb = data['wb']
}

function parseBattleWbResponse(response) {
    const data = JSON.parse(response)
    const {player, opponent} = getStatsFromBattle(data);
    appendToConsole(`Boss: Vous avez causé ${player.dmg} dommages.`);
}

function parseWbClassementResponse(response) {
    const data = JSON.parse(response)
    Execution.wbclassement['top'] = data['top']
}

function parseBattlePveResponse(response) {
    const data = JSON.parse(response)
    const {player, opponent} = getStatsFromBattle(data);
    let itemsWin = [];
    if ('item' in data.rewards) {
        for (const item of data.rewards) {
            const itemWin = `${item.value} (x${item.count})`;
            itemsWin.push(itemWin);
        }
    }

    const infosWin = [('alopieces' in data.rewards && data.rewards.alopieces > 0) ? `Alopièces: ${data.rewards.alopieces}` : '', ('event' in data.rewards && data.rewards.event > 0) ? `Event: ${data.rewards.event}` : '', ('expUser' in data && data.expUser > 0) ? `Expérience: ${data.expUser}` : '', (itemsWin.length > 0) ? `Items: ${itemsWin.join(', ')}` : ''];

    const infosLose = [(opponent.soinTotal > 0 || opponent.pvRecover !== -1) ? `Soins: ${opponent.soinTotal}` : '', (opponent._bouclier > 0) ? `Bouclier: ${opponent.bouclier}` : '', `Vie: ${opponent.pvFinal}`];

    if (player.result === 'winner') {
        appendToConsole(`ToB: Vous avez gagné. ${infosWin.filter(Boolean).join(' - ')}`);
    } else {
        appendToConsole(`ToB: Vous avez perdu. ${infosLose.filter(Boolean).join(' - ')}`);
    }
}

function parseBattleOpponentResponse(response) {
    const data = JSON.parse(response)
    const {player, opponent} = getStatsFromBattle(data);
    const infos = [(data.eloUser > 0) ? `Elo: ${(player.result === 'looser') ? '-' : ''}${data.eloUser}` : '', (data.aloUser > 0) ? `Alopièces: ${data.aloUser}` : '', (data.event > 0) ? `Event: ${data.event}` : '', (data.expUser > 0) ? `Expérience: ${data.expUser}` : '',];
    appendToConsole(`PvP: Vous avez ${player.result === 'winner' ? "gagné" : "perdu"}, contre ${opponent.name}. ${infos.filter(Boolean).join(' - ')}`);
}

function printNotifs() {
    const reward = getRewardsInNotifs(Update.notifs)
    Execution.worldboss_reward = reward.worldboss
    Execution.admin_reward = reward.admin

    if (null != Execution.worldboss_reward && (Execution.worldboss_reward_printed === null || Execution.worldboss_reward.date !== Execution.worldboss_reward_printed.date)) {
        appendToConsole(`Combat Boss: ${Execution.worldboss_reward.text}`)
        Execution.worldboss_reward_printed = Execution.worldboss_reward
    } else if (null != Execution.admin_reward && (Execution.admin_reward_printed === null || Execution.admin_reward.date !== Execution.admin_reward_printed.date)) {
        appendToConsole(`Admin: ${Execution.admin_reward.text}`)
        Execution.admin_reward_printed = Execution.admin_reward
    }
}

function printWbclassement() {
    if (Update.wb < -1 && Execution.wbclassement.top.length > 0) {
        let msg = "Classement Worldboss:"
        for (let i = 0; i < Execution.wbclassement['top'].length; i++) {
            let user = Execution.wbclassement['top'][i];
            msg += "\n";
            let spacing = 25 - user['pseudoTwitch'].length;
            msg += `${i + 1} ${i < 9 ? " " : ""} - ${user['pseudoTwitch']} ${user['damage'].toString().padStart(spacing)} dommages`;
        }

        appendToConsole(msg)

        Execution.wbclassement['top'] = [];
    }
}


setInterval(function() {
    printNotifs()
    printWbclassement()
}, 15000);

function getRewardsInNotifs(notifs) {
    let rewards = { admin: null, worldboss: null };
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
        var open = XMLHttpRequest.prototype.open;
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

function appendToConsole(text, save = true) {
    const time = new Date().toLocaleTimeString();
    let message = {'time': time, 'text': text}
    let consoleMessages = JSON.parse(localStorage.getItem('consoleMessages'))
    consoleMessages.push(message);

    const preEl = document.createElement('pre');
    preEl.textContent = `[${message.time}] ${message.text}`;
    msgEl.appendChild(preEl);
    msgEl.scrollTop = msgEl.scrollHeight;

    if (consoleMessages.length > MAX_CONSOLE_MESSAGES) {
        consoleMessages = consoleMessages.slice(-MAX_CONSOLE_MESSAGES);
        msgEl.removeChild(msgEl.firstElementChild);
    }
    localStorage.setItem('consoleMessages', JSON.stringify(consoleMessages));
}

const consoleEl = document.createElement('div');
consoleEl.classList.add("console-element")

// Create the chat header
const headerEl = document.createElement('div');
headerEl.classList.add("header-element")

// Create the chat title
const titleEl = document.createElement('div');
titleEl.classList.add("title-element")
titleEl.textContent = 'LaCalv Battle Logs';

// Create the expand/collapse button
const expandButtonEl = document.createElement('button');
expandButtonEl.classList.add("expand-button-element")
console.log(localStorage.getItem('expanded'))
if (JSON.parse(localStorage.getItem('expanded')) === true) {
    expandButtonEl.textContent = '-';
} else {
    expandButtonEl.textContent = '+';
    consoleEl.style.height = '36px';
}

const msgEl = document.createElement('div');
msgEl.classList.add("message-element")

// Add an event listener to toggle the height of the console
expandButtonEl.addEventListener('click', () => {
    if (consoleEl.style.height === '100%') {
        consoleEl.style.height = '36px';
        expandButtonEl.textContent = '+';
        localStorage.setItem('expanded', "false");
    } else {
        consoleEl.style.height = '100%';
        expandButtonEl.textContent = '-';
        localStorage.setItem('expanded', "true");
    }
});

// Append the title and expand/collapse button to the header
headerEl.appendChild(titleEl);
headerEl.appendChild(expandButtonEl);

// Append the header to the console
consoleEl.appendChild(headerEl);
consoleEl.appendChild(msgEl)

if (null === localStorage.getItem('consoleMessages')) {
    localStorage.setItem('consoleMessages', JSON.stringify([]));
}

const messages = JSON.parse(localStorage.getItem('consoleMessages'));
messages.forEach(message => {
    const preEl = document.createElement('pre');
    preEl.textContent = `[${message.time}] ${message.text}`;
    msgEl.appendChild(preEl);
    msgEl.scrollTop = msgEl.scrollHeight;
})

document.querySelector(".game-out").appendChild(consoleEl)


addGlobalStyle('.console-element{position:absolute;top:0;right:0;width:500px;height:100%;background:#36393f;opacity:1;color:#fff;overflow:auto;z-index:9999}');
addGlobalStyle('.header-element{background:#2e3136;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-radius:5px 5px 0 0}');
addGlobalStyle('.title-element{font-weight:700}');
addGlobalStyle('.expand-button-element{background:0 0;color:#fff;border:none;cursor:pointer}');
addGlobalStyle('.message-element {height:calc(98% - 36px);overflow:auto}');
addGlobalStyle('.message-element > pre {margin:0;font-family:monospace;font-size:13px;line-height:18px;padding:0.2rem 0.5rem;white-space:pre-wrap;word-break:break-word;border-bottom:1px solid #ccc;--darkreader-inline-border-bottom:#3e4446}');

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}