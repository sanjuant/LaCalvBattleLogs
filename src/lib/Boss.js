/**
 * @class The BattleLogsBoss regroups the Boss logs functionalities
 */
class BattleLogsBoss {
    static Settings = {
        Logs: "Boss-Logs",
        Type: "Boss",
        LastBattle: "Boss-LastBattle"
    };

    static Messages = {
        normal: "Tu as attaqué {0} tour{2} et infligé {1} dommage{3} totaux.",
        short: "Tour:{0} DmgTot:{1}",
        list: "Tu as attaqué {0} tour{2} et infligé {1} dommage{3} totaux.",
        summarize: {
            normal: "Tu as attaqué {0} tour{2} et infligé {1} dommage{3} totaux en moyenne.",
            short: "Tour:{0} DmgTot:{1}",
            list: "Tu as attaqué {0} tour{2} et infligé {1} dommage{3} totaux en moyenne."
        }
    };

    static BannedStats = {
        normal: {
            user: [
                "tour", "dmgTotal", "result"
            ],
            opponent: ["vie", "result"]
        },
        short: {
            user: ["tour", "dmgTotal", "result"],
            opponent: ["vie", "result"]
        },
        list: {
            user: [
                "tour", "dmgTotal", "result"
            ],
            opponent: ["vie", "result"]
        }
    };

    static LogsArray = [];

    static LastBattle = new Date();

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingValues();
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
            return
        }

        this.LastBattle = new Date();
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.LastBattle, this.LastBattle)
        BattleLogs.Sound.SoundEmitted.bossFightAvailable = false;
        const {
            user,
            opponent,
            rewards,
            stuff
        } = BattleLogs.Battle.getStatsFromData(data);
        const log = this.__internal__addLog(user, opponent, rewards, stuff);
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
        BattleLogs.Stats.updateStatsStuffs(stuff, user, opponent);
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
                fragments.push(this.Messages.summarize[BattleLogs.Message.Settings.Format].format(log.user.tour, log.user.dmgTotal, log.user.tour > 1 ? "s" : "", log.user.dmgTotal > 1 ? "s" : ""))
            } else {
                fragments.push(
                    this.Messages[BattleLogs.Message.Settings.Format]
                        .format(log.user.tour, log.user.dmgTotal, log.user.tour > 1 ? "s" : "", log.user.dmgTotal > 1 ? "s" : "")
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
     * @param {Object} stuff: Stuff of battle
     *
     * @return Log added
     */
    static __internal__addLog(user, opponent, rewards, stuff) {
        const log = new this.Logs(this.Settings.Type, user, opponent, rewards, stuff);
        this.LogsArray.push(log);
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.Logs, log);

        return log;
    }

    /**
     * @desc Load the Message settings values stored in the local storage
     */
    static __internal__loadSettingValues() {
        const logsArray = BattleLogs.Utils.LocalStorage.getComplexValue(
            this.Settings.Logs
        );
        if (logsArray !== null) {
            this.LogsArray = logsArray;
        }
        const lastBattle = BattleLogs.Utils.LocalStorage.getComplexValue(
            this.Settings.LastBattle
        );
        if (lastBattle !== null) {
            this.LastBattle = new Date(lastBattle);
        }
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(
            this.Settings.Logs,
            this.LogsArray
        );
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(
            this.Settings.LastBattle,
            this.LastBattle
        );
    }

    static Logs = class {
        constructor(type, user, opponent, rewards, stuff) {
            this.type = type;
            this.time = new Date().toISOString();
            this.user = user;
            this.opponent = opponent;
            this.rewards = rewards;
            this.stuff = stuff;
        }
    };
}