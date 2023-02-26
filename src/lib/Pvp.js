/**
 * @class The BattleLogsPvp regroups the Pvp logs functionalities
 */
class BattleLogsPvp {
    static Settings = {
        Logs: "Pvp-Logs",
        Type: "Pvp"
    };

    static Messages = {
        normal: "Tu as {0} contre {1}.",
        short: "{0} contre {1}",
        list: "Tu as {0} contre {1}.",
        summarize: {
            normal: "Victoire {0}%, Défaite {1}%",
            short: "Vic:{0}% Déf:{1}%",
            list: "Victoire : {0}% - Défaite : {1}%"
        }
    };

    static BannedStats = {
        normal: {
            user: ["result"],
            opponent: ["result", "name"]
        },
        short: {
            user: ["result"],
            opponent: ["result", "name"]
        },
        list: {
            user: ["result"],
            opponent: ["result", "name"]
        }
    };

    static LogsArray = [];

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingValues();
            // Restore previous session state
            const logsArray = BattleLogs.Utils.LocalStorage.getComplexValue(
                this.Settings.Logs
            );
            if (logsArray !== null) {
                this.LogsArray = logsArray;
            }
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
            return
        }

        const {
            user,
            opponent,
            rewards
        } = BattleLogs.Battle.getStatsFromData(data);
        const url = new URL(xhr.responseURL);
        const stage = new URLSearchParams(url.search).get('step');
        const log = this.__internal__addLog(user, opponent, rewards, stage);
        this.appendMessage(log);
        if (this.LogsArray.length % BattleLogs.Summarize.Settings.x10.Count === 0) {
            BattleLogs.Summarize.addLog(
                this.Settings.Type,
                BattleLogs.Summarize.Settings.x10.Type
            );
        }
        if (this.LogsArray.length % BattleLogs.Summarize.Settings.x50.Count === 0) {
            BattleLogs.Summarize.addLog(
                this.Settings.Type,
                BattleLogs.Summarize.Settings.x50.Type
            );
        }
        if (this.LogsArray.length % BattleLogs.Summarize.Settings.x100.Count === 0) {
            BattleLogs.Summarize.addLog(
                this.Settings.Type,
                BattleLogs.Summarize.Settings.x100.Type
            );
        }
    }

    /**
     * @desc Append message to battle logs menu
     *
     * @param {Object} log: log to convert in message
     */
    static appendMessage(log) {
        const message = this.buildMessage(log);
        const type = log.type;
        if (BattleLogs.Message.Filters[log.type].enable) {
            BattleLogs.Message.appendMessage(message, type, log);
        }
    }

    /**
     * @desc Build message from log
     *
     * @param {Object} log: Log to display in message
     * @param {Boolean} summarize: Set to true if it's summarize log
     *
     * @returns message for battle logs
     */
    static buildMessage(log, summarize = false) {
        let fragments = [];
        if (BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs.Battle.Settings.MenuSettings)["misc-summary"]) {
            if (summarize) {
                fragments.push(BattleLogs.Summarize.formatResult(this.Messages.summarize[BattleLogs.Message.Settings.Format], log.user.result))
            } else {
                fragments.push(
                    this.Messages[BattleLogs.Message.Settings.Format]
                        .format(log.user.result === "winner" ? "gagné" : "perdu", log.opponent.name)
                );
            }
        }
        fragments.push(BattleLogs.Battle.buildBattleMessage(log, summarize));

        return fragments.join(
            BattleLogs.Message.Joiner.fragments[BattleLogs.Message.Settings.Format]
        );
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    /**
     * @desc Append log to local storage and logs array
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {Object} rewards: Rewards of battle
     * @param {string} stage: Stage of battle
     *
     * @return Log added
     */
    static __internal__addLog(user, opponent, rewards, stage) {
        const log = new this.Logs(this.Settings.Type, user, opponent, rewards, stage);
        this.LogsArray.push(log);
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.Logs, log);

        return log;
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(
            this.Settings.Logs,
            this.LogsArray
        );
    }

    static Logs = class {
        constructor(type, user, opponent, rewards, stage) {
            this.type = type;
            this.time = new Date().toISOString();
            this.user = user;
            this.opponent = opponent;
            this.rewards = rewards;
            this.stage = stage;
        }
    };
}