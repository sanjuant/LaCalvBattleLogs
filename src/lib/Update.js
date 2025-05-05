/**
 * @class The BattleLogsUpdate regroups the Update functionalities
 */
class BattleLogsUpdate {
    static Settings = {
        DateSoundBossAvailable: "Update-DateSoundBossAvailable"
    }

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
    static BaseStats = undefined;
    static Level = 1;

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__playerNotifs = [];
            // Restore previous session state
            this.__internal__loadSettingValues();
        }
    }


    /**
     * @desc Return true if update has loaded
     *
     * @return true if load objects has loaded else false
     */
    static hasLoaded() {
        if (this.Armes.length === 0
            || this.Items.length === 0
            || this.Calvs.length === 0) {
            return false;
        }
        return true;
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
        if (!BattleLogs.Roues.hasLoaded() || !BattleLogs.Load.hasLoaded() || !BattleLogs.Shop.hasLoaded()) {
            BattleLogs.Update.queryUrl("load", "GET");
        }

        if ("wb" in data) {
            this.Wb = BattleLogs.Utils.tryParseInt(data["wb"], -1);
        }
        if (data["player"] && data["player"]["notifs"]) {
            this.__internal__playerNotifs = data["player"]["notifs"];
        }
        if (data["player"] && data["player"]["stats"]) {
            this.BaseStats = data["player"]["stats"];
        }
        if (data["player"] && data["player"]["level"]) {
            this.Level = data["player"]["level"];
        }
        if (data["nounce"]) {
            this.__internal__nounce = data["nounce"];
        }
        if (data["id"]) {
            this.__internal__id = data["id"];
        }
        if (data["pseudo"]) {
            this.__internal__pseudo = data["pseudo"];
        }
        if (data["player"]) {
            this.stuffs = data["player"]["stuffs"];
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
        if (data["player"] && data["player"]["stuffHistoire"] >= 0) {
            this.stuffHistoire = data["player"]["stuffHistoire"] + 1;
        }
        if (data["player"] && data["player"]["stuffPVE"] >= 0) {
            this.stuffPVE = data["player"]["stuffPVE"] + 1;
        }
        if (data["player"] && data["player"]["stuffWB"] >= 0) {
            this.stuffWB = data["player"]["stuffWB"] + 1;
        }

        this.__internal__addImportantNotifToLog(this.__internal__playerNotifs);

        // Run a query to Wbclassement to get the most accurate ranking
        if (BattleLogs.Wbclassement.Remaining < 100000) {
            this.queryUrl("wbclassement", "GET");
        }

        // Play sound when boss is available
        if (this.Wb >= 0 && !BattleLogs.Sound.SoundEmitted.bossAvailable && data["bossE"] > 0) {
            BattleLogs.Sound.notifWhenBossAvailable();
        } else if (this.Wb === -1 && BattleLogs.Sound.SoundEmitted.bossAvailable && data["bossE"] > 0) {
            if (this.__internal__dateForSoundBossAvailable === null) {
                this.__internal__dateForSoundBossAvailable = new Date();
            }
            if (BattleLogs.Utils.secElapsedBetweenDate(this.__internal__dateForSoundBossAvailable, new Date()) >= 50) {
                BattleLogs.Sound.notifWhenBossAvailable(); // Boss repop
                this.__internal__dateForSoundBossAvailable = null;
            }
        }

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
                    "name": this.__internal__pseudo,
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

        static gemQuality(gem) {
            let rarityName = ["common", "atypique", "rare", "epique", "legendaire"]
            let gemInfos = BattleLogs.Load.getGemByName(gem.name);
    
            const processProba = (base, upgrade, data) => {
                let stat = +(base[0]) + data[0][0] * (+(base[1]) - +(base[0])); // minBase + probaBase (maxBase - minBase)
                if(data.length > 1){
                    const leftProba = data.slice(1).reduce((sum, proba) => +(proba[0]) + +(sum));
                    stat += +(upgrade[0]) * (data.length - 1) + leftProba * (+(upgrade[1]) - +(upgrade[0])); // minUpgrade * (n-1) + sum(probaUpgrade) (maxUpgrade - minUpgrade)
                }
                const maxStat = +(base[1]) + (data.length - 1) * +(upgrade[1]);
                return stat/maxStat;
            }
    
            const mainProba = processProba(
                gemInfos.mainStat[rarityName[gem.rarity]].base,
                gemInfos.mainStat[rarityName[gem.rarity]].upgrade,
                gem.mg.data
            )
            let subProba = 0;
            gem.sg.forEach(statProba => {
                subProba += processProba(
                    gemInfos.infos.subStatRange[statProba.name][rarityName[gem.rarity]].base,
                    gemInfos.infos.subStatRange[statProba.name][rarityName[gem.rarity]].upgrade,
                    statProba.data
                )
            });
            subProba = gem.sg.length > 0 ? subProba / gem.sg.length : 1;
            return (mainProba+subProba)/2;
        }

        static getPlayerBaseStats(){
            return this.BaseStats;
        }
    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/
    static __internal__playerNotifs = null;
    static __internal__importantNotifs = ["Boss des Mondes", "Admin"];
    static __internal__nounce = null;
    static __internal__dateForSoundBossAvailable = null;
    static __internal__pseudo = null
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

}