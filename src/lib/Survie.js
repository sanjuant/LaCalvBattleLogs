/**
 * @class The BattleLogsSurvie regroups the Survie logs functionalities
 */
class BattleLogsSurvie {
    static Settings = {
        Logs: "Survie-Logs",
        Type: "Survie"
    };

    static Messages = {
        normal: "Tu as {0} contre {1} ({2}).",
        short: "{0} contre {1}({2})",
        list: "Tu as {0} contre {1} ({2}).",
    };

    static BannedStats = {
        normal: {
            user: ["result"],
            opponent: ["result"]
        },
        short: {
            user: ["result"],
            opponent: ["result"]
        },
        list: {
            user: ["result"],
            opponent: ["result"]
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

        let stats = []
        if (data["results"]) {
            for (const subdata of data["results"]) {
                // subdata["rewards"] = data["rewards"]
                const {
                    user,
                    opponent,
                    rewards,
                    stuff
                } = BattleLogs.Battle.getStatsFromData(subdata);
                stats.push({user, opponent, rewards, stuff})
            }
        }

        const url = new URL(xhr.responseURL);
        const choice = new URLSearchParams(url.search).get('choice');
        const uid = crypto.randomUUID()
        for (const stat of stats) {
            const log = this.__internal__addLog(uid, choice, stat.user, stat.opponent, stat.rewards, stat.stuff);
            this.appendMessage(log);
            BattleLogs.Stats.Stuffs.updateStats(stat.stuff, stat.user);
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
     *
     * @returns message for battle logs
     */
    static buildMessage(log) {
        let fragments = [];
        if (BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs.Battle.Settings.MenuSettings)["misc-summary"]) {
            if (log.rewards.elo > 0 || log.rewards.alo > 0 || log.rewards.exp > 0 || log.rewards.items.length > 0) {
                fragments.push(
                    this.Messages[BattleLogs.Message.Settings.Format]
                        .format(log.user.result === "winner" ? "gagné" : "perdu", log.opponent.name, this.__internal__getDifficultyByChoice(log.choice))
                    + " Score +" + this.__internal__getScoreByChoice(log.choice)
                );
            } else {
                fragments.push(
                    this.Messages[BattleLogs.Message.Settings.Format]
                        .format(log.user.result === "winner" ? "gagné" : "perdu", log.opponent.name, this.__internal__getDifficultyByChoice(log.choice))
                );
            }
        }
        fragments.push(BattleLogs.Battle.buildBattleMessage(log));

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
     * @param {string} uid: Uid of survie battle
     * @param {string} choice: Choice of survie battle
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {Object} rewards: Rewards of battle
     * @param {string} stuff: Stuff of battle
     *
     * @return Log added
     */
    static __internal__addLog(uid, choice, user, opponent, rewards, stuff) {
        const log = new this.Log(this.Settings.Type, uid, choice, user, opponent, rewards, stuff);
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

    static Log = class {
        constructor(type, uid, choice, user, opponent, rewards, stuff) {
            this.type = type;
            this.uid = uid;
            this.choice = choice;
            this.time = new Date().toISOString();
            this.user = user;
            this.opponent = opponent;
            this.rewards = rewards;
            this.stuff = stuff;
        }
    };

    static __internal__getDifficultyByChoice(choice) {
        if (choice === "2") {
            return "Normal"
        } else if (choice === "3") {
            return "Difficile"
        } else {
            return "Facile"
        }
    }

    static __internal__getScoreByChoice(choice) {
        if (choice === "2") {
            return "3"
        } else if (choice === "3") {
            return "5"
        } else {
            return "1"
        }
    }
}