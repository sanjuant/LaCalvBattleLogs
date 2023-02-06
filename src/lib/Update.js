/**
 * @class The BattleLogsUpdate regroups the Update functionalities
 */
class BattleLogsUpdate {
    static Settings = {
        Streaming: "Update-Streaming",
    }

    static Streaming = false;
    static Wb = -1;

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingValues();
            this.__internal__playerNotifs = [];
        }
    }

    /**
     * @desc Parse XMLHttpRequest response
     *
     * @param {XMLHttpRequest} xhr: The xhr request
     */
    static parseResponse(xhr) {
        const data = JSON.parse(xhr.response);
        if (typeof data !== "object") return;
        if (data["streaming"]) {
            this.Streaming = data["streaming"];
        }
        if (data["wb"]) {
            this.Wb = data["wb"];
        }
        if (data["player"] && data["player"]["notifs"]) {
            this.__internal__playerNotifs = data["player"]["notifs"];
        }
        if (data["nounce"]) {
            this.__internal__nounce = data["nounce"];
        }

        this.__internal__addImportantNotifToLog(this.__internal__playerNotifs);

        // Run a query to Wbclassement to get the most accurate ranking
        if (this.Streaming && (BattleLogs.Utils.minElapsedBetweenDate(BattleLogs.Wbclassement.UpdateDate, new Date()) > 3 || BattleLogs.Wbclassement.Remaining < 50000)) {
            this.__internal__queryUrl("wbclassement");
        }

        // Play sound when boss is available
        if (!BattleLogs.Utils.LocalStorage.getValue(this.Settings.Streaming) && this.Streaming && this.Wb > 0) {
            BattleLogs.Sound.notifWhenBossAvailable(); // Streaming starting
        } else if (this.Wb === 0 && !BattleLogs.Sound.SoundEmitted.bossAvailable) {
            BattleLogs.Sound.notifWhenBossAvailable(); // Boss repop
        } else if (this.Wb > 0 && BattleLogs.Sound.SoundEmitted.bossAvailable) {
            BattleLogs.Sound.SoundEmitted.bossAvailable = false; // Reset value
        }

        // Play sound when boss fight is available
        if (this.Streaming && !BattleLogs.Sound.SoundEmitted.bossAvailable
            && this.Wb > 0
            && (BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) > 285
                && BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) < 300
                || BattleLogs.Battlewbtry.Available)
        ) {
            BattleLogs.Sound.notifWhenBossFightAvailable()
        }

        // Set new value streaming to local storage
        BattleLogs.Utils.LocalStorage.setValue(this.Settings.Streaming, data["streaming"]);
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/
    static __internal__playerNotifs = null;
    static __internal__importantNotifs = ["Boss des Mondes", "Admin"];
    static __internal__nounce = null;

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
     * @desc Query url from LaCalv
     *
     * @param {string} url: Url to query
     */
    static __internal__queryUrl(url) {
        let request = new XMLHttpRequest();
        request.open(
            "GET",
            "https://lacalv.fr/play/" + url,
            true
        );
        request.setRequestHeader("nounce", this.__internal__nounce);
        request.send();
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
}