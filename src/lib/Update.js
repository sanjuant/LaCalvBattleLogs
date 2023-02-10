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

        if (data["streaming"]) {
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

        this.__internal__addImportantNotifToLog(this.__internal__playerNotifs);

        // Run a query to Wbclassement to get the most accurate ranking
        if (this.Streaming && (BattleLogs.Utils.minElapsedBetweenDate(BattleLogs.Wbclassement.UpdateDate, new Date()) > 3 || BattleLogs.Wbclassement.Remaining < 100000)) {
            this.__internal__queryUrl("wbclassement", "GET");
        }

        // Play sound when boss is available
        if (BattleLogs.Utils.LocalStorage.getValue(this.Settings.Streaming) === "false" && this.Streaming && this.Wb > 0) {
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
            && ((BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) > 290 && BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) < 300)
                || BattleLogs.Utils.secElapsedBetweenDate(BattleLogs.Boss.LastBattle, new Date()) > 300 && BattleLogs.Battlewbtry.SecRemaining <= 10)
        ) {
            BattleLogs.Sound.notifWhenBossFightAvailable();
        }

        // Set new value streaming to local storage
        BattleLogs.Utils.LocalStorage.setValue(this.Settings.Streaming, this.Streaming);
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.DateSoundBossAvailable, this.__internal__dateForSoundBossAvailable);
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/
    static __internal__playerNotifs = null;
    static __internal__importantNotifs = ["Boss des Mondes", "Admin"];
    static __internal__nounce = null;
    static __internal__dateForSoundBossAvailable = null;

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
     * @param {string} method: Http method
     */
    static __internal__queryUrl(url, method = "GET") {
        let request = new XMLHttpRequest();
        request.open(
            method,
            "https://lacalv.fr/play/" + url,
            true
        );
        request.setRequestHeader("nounce", this.__internal__nounce);
        request.send();
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
}