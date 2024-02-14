/**
 * @class The BattleLogsUpdate regroups the Update functionalities
 */
class BattleLogsUpdate {
    static Settings = {
        Streaming: "Update-Streaming",
        DateSoundBossAvailable: "Update-DateSoundBossAvailable"
    }

    static Streaming = false;
    static Wb = Number.MIN_VALUE;
    static stuffAtk = 0;
    static stuffs = {};
    static Alopiece = 0;
    static Tickets = 0;
    static Calvs = [];
    static Items = [];
    static Armes = [];
    static Objects = [];
    static Familiers = [];
    static Gems = [];
    static Costumes = [];

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingValues();
            this.__internal__playerNotifs = [];
            // Restore previous session state
            this.__internal__loadSettingValues();
        }
    }

    /**
     * @desc Parse XMLHttpRequest response
     *
     * @param {XMLHttpRequest} xhr: The xhr request
     */
    static parseResponse(xhr) {
        let data;
        try {
            data = JSON.parse(xhr.response);
            if (typeof data !== "object") return;
        } catch (e) {
            return;
        }

        // Set roues and load if not loaded
        if (!BattleLogs.Roues.hasLoaded()) {
            BattleLogs.Update.queryUrl("roues", "GET")
        }
        if (!BattleLogs.Load.hasLoaded()) {
            BattleLogs.Update.queryUrl("load", "GET")
        }
        if (!BattleLogs.Shop.hasLoaded()) {
            BattleLogs.Update.queryUrl("shop", "GET")
        }

        if ("streaming" in data) {
            this.Streaming = data["streaming"];
        }
        if ("wb" in data) {
            this.Wb = BattleLogs.Utils.tryParseInt(data["wb"], -1);
        }
        if (data["player"] && data["player"]["notifs"]) {
            this.__internal__playerNotifs = data["player"]["notifs"];
        }
        if (data["nounce"]) {
            this.__internal__nounce = data["nounce"];
        }
        if (data["id"]) {
            this.__internal__id = data["id"];
        }
        if (data["pseudoTwitch"]) {
            this.__internal__pseudoTwitch = data["pseudoTwitch"];
        }
        if (data["player"]) {
            this.__internal__parse_player_stuffs(data["player"]);
        }
        if (data["tickets"]) {
            this.Tickets = data["tickets"]
        }
        if (data["alopiece"]) {
            this.Alopiece = data["alopiece"]
        }
        if (data["calvs"]) {
            this.Calvs = data["calvs"]
        }
        if (data["items"]) {
            this.Items = data["items"]
        }
        if (data["armes"]) {
            this.Armes = data["armes"]
        }
        if (data["familiers"]) {
            this.Familiers = data["familiers"]
        }
        if (data["gems"]) {
            this.Gems = data["gems"]
        }
        if (data["event_costumes"]) {
            this.Costumes = data["event_costumes"]
        }
        if (data["objects"]) {
            this.Objects = data["objects"]
        }
        if (data["player"] && data["player"]["stuffAtk"] >= 0) {
            this.stuffAtk = data["player"]["stuffAtk"] + 1;
        }
        if (data["player"] && data["player"]["stuffPVE"] >= 0) {
            this.stuffPVE = data["player"]["stuffPVE"] + 1;
        }
        if (data["player"] && data["player"]["stuffWB"] >= 0) {
            this.stuffWB = data["player"]["stuffWB"] + 1;
        }

        this.__internal__addImportantNotifToLog(this.__internal__playerNotifs);

        // Run a query to Wbclassement to get the most accurate ranking
        if (this.Streaming && (BattleLogs.Utils.minElapsedBetweenDate(BattleLogs.Wbclassement.UpdateDate, new Date()) > 3 || BattleLogs.Wbclassement.Remaining < 100000)) {
            this.queryUrl("wbclassement", "GET");
        }

        // Play sound when boss is available
        if (BattleLogs.Utils.LocalStorage.getValue(this.Settings.Streaming) === "false" && this.Streaming && this.Wb >= 0) {
            BattleLogs.Sound.notifWhenBossAvailable(); // Streaming starting
        } else if (this.Streaming && this.Wb === -1 && !BattleLogs.Sound.SoundEmitted.bossAvailable) {
            if (this.__internal__dateForSoundBossAvailable === null) {
                this.__internal__dateForSoundBossAvailable = new Date();
            }
            if (BattleLogs.Utils.secElapsedBetweenDate(this.__internal__dateForSoundBossAvailable, new Date()) >= 50) {
                BattleLogs.Sound.notifWhenBossAvailable(); // Boss repop
            }
        } else if (this.Wb > 0 && BattleLogs.Sound.SoundEmitted.bossAvailable) {
            this.__internal__dateForSoundBossAvailable = null;
            BattleLogs.Sound.SoundEmitted.bossAvailable = false; // Reset value
        }

        // Play sound when boss fight is available
        if (this.Streaming && !BattleLogs.Sound.SoundEmitted.bossAvailable && !BattleLogs.Sound.SoundEmitted.bossFightAvailable
            && this.Wb > 0
            && ((BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) > 890 && BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) < 900)
                || BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) > 900 && BattleLogs.Battlewbtry.SecRemaining <= 10)
        ) {
            BattleLogs.Sound.notifWhenBossFightAvailable();
        }

        // Set new value streaming to local storage
        BattleLogs.Utils.LocalStorage.setValue(this.Settings.Streaming, this.Streaming);
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.DateSoundBossAvailable, this.__internal__dateForSoundBossAvailable);

        BattleLogs.Stats.Account.updateStats()
    }

        /**
         * @desc Query url from LaCalv
         *
         * @param {string} url: Url to query
         * @param {string} method: Http method
         */
        static queryUrl(url, method = "GET") {
            const gameUrl = BattleLogsComponentLoader.gameUrl;
            const baseUrl = gameUrl.endsWith("/") ? gameUrl : gameUrl + "/";
            let request = new XMLHttpRequest();
            request.open(
                method,
                baseUrl + "play/" + url,
                true
            );
            let nounce = this.__internal__nounce
            if (nounce !== null) {
                let c = window.btoa(JSON.stringify({
                    "name": this.__internal__pseudoTwitch,
                    "time": new Date().getTime().toString()
                }))
                nounce.c = window.btoa(c + this.__internal__id)
                request.setRequestHeader("nounce", JSON.stringify(nounce));
                request.setRequestHeader("Authorization", "Bearer COOKIE");

                request.send();
            }
        }

        static getGemById(id) {
            return this.Gems.find(item => item.id === id);
        }


    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/
    static __internal__playerNotifs = null;
    static __internal__importantNotifs = ["Boss des Mondes", "Admin"];
    static __internal__nounce = null;
    static __internal__dateForSoundBossAvailable = null;
    static __internal__pseudoTwitch = null
    static __internal__id = null

    /**
     * @desc Check notif to find important notif to append to log
     *
     * @param {Array} notifs: Array of notifs
     */
    static __internal__addImportantNotifToLog(notifs) {
        notifs.forEach(notif => {
            if (this.__internal__importantNotifs.includes(notif["type"]) && !BattleLogs.Notif.LogsArray.some(log => log.date === notif["date"])) {
                BattleLogs.Notif.createNotif(notif["text"], notif["date"])
            }
        })
    }

    /**
     * @desc Load the Message settings values stored in the local storage
     */
    static __internal__loadSettingValues() {
        const dateSoundBossAvailable = BattleLogs.Utils.LocalStorage.getComplexValue(
            this.Settings.DateSoundBossAvailable
        );
        if (dateSoundBossAvailable !== null) {
            this.__internal__dateForSoundBossAvailable = new Date(dateSoundBossAvailable);
        }
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultValue(
            this.Settings.Streaming,
            false
        );
    }

    /**
     * @desc Sets the stuffs of player
     *
     * @param {Object} player: Player object
     */
    static __internal__parse_player_stuffs(player) {
        let setStuffs = (player, stuffs, calvs, armes, items, familiers) => {
            if (calvs in player && items in player && armes in player && stuffs in player) {
                for (let i = 0; i < player[calvs].length; i++) {
                    let name = "Slot #"+ (i + 1).toString()
                    if (i in player[stuffs]) {
                        name = player[stuffs][i] ? player[stuffs][i] : "Slot #"+ (i + 1).toString()
                    }
                    this[stuffs][i] = {"name": name, "calv": player[calvs][i], "arme": player[armes][i], "items": player[items][i]}
                    if (familiers in player) {
                        if (player[familiers][i] === null || player[familiers][i] === undefined) {
                            continue
                        }
                        if ("attack" in player[familiers][i]) {
                            this[stuffs][i].famAtk = player[familiers][i]["attack"].capitalize()
                        }
                        if ("defense" in player[familiers][i]) {
                            this[stuffs][i].famDef = player[familiers][i]["defense"].capitalize()
                        }
                    }
                }
            }
        }
        
        this.stuffs = {};
        this.stuffsPVE = {};
        this.stuffsWB = {};

        setStuffs(player, "stuffs", "calvs", "armes", "items", "familiers");
        setStuffs(player, "stuffsPVE", "calvsPVE", "armesPVE", "itemsPVE", "familiersPVE");
        setStuffs(player, "stuffsWB", "calvsWB", "armesWB", "itemsWB", "familiersWB");
    }
}