// ==UserScript==
// @name        LaCalv Battle Logs
// @author      Sorrow
// @description Ce script améliore l'expérience du jeu LaCalv pour les try harder.
// @include     https://lacalv.fr/*
// @version     2.0.0

// @homepageURL   https://github.com/sanjuant/LaCalvBattleLogs/
// @supportURL    https://github.com/sanjuant/LaCalvBattleLogs/issues
// @downloadURL   https://github.com/sanjuant/LaCalvBattleLogs/raw/master/lacalvbattlelogs.user.js
// @updateURL     https://github.com/sanjuant/LaCalvBattleLogs/raw/master/lacalvbattlelogs.user.js
// ==/UserScript==

// By default, the script is set to take the latest version available
// It could be preferable to set this to a label or a commit instead,
// if you want to fix a set version of the script
const releaseLabel = "master";

const battleLogsReleaseUrl = "https://raw.githubusercontent.com/sanjuant/LaCalvBattleLogs/" + releaseLabel + "/";

// Github only serves plain-text so we can't load it as a script object directly
const xmlHttp = new XMLHttpRequest();
xmlHttp.onreadystatechange = function()
{
    if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200))
    {
        // Store the content into a script div
        const script = document.createElement('script');
        script.innerHTML = xmlHttp.responseText;
        script.id = "battlelogs-component-loader";
        document.head.appendChild(script);
        BattleLogsComponentLoader.loadFromUrl(battleLogsReleaseUrl);
    }
}

// Download the content
xmlHttp.open("GET", battleLogsReleaseUrl + "src/ComponentLoader.js", true);
xmlHttp.send();
