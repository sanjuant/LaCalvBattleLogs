/**
 * @class The BattleLogsSurvie regroups the Survie logs functionalities
 */
class BattleLogsHistoire extends BattleLogsSurvie {
    static Settings = {
        Logs: "Histoire-Logs",
        Type: "Histoire",
        Limit: 500
    };

    static LogsArray = [];

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
        const choice = new URLSearchParams(url.search)
                        .get('id')
                        .split("_")[0];
        const uid = crypto.randomUUID()
        for (const stat of stats) {
            const log = this.__internal__addLog(uid, choice, stat.user, stat.opponent, stat.rewards, stat.stuff);
            this.appendMessage(log);
            BattleLogs.Stats.Stuffs.updateStats(this.Settings.Type, stat.stuff, stat.user);
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
            fragments.push(
                this.Messages[BattleLogs.Message.Settings.Format]
                    .format(log.user.result === "winner" ? "gagné" : "perdu", log.opponent.name, this.__internal__getDifficultyByChoice(log.choice))
            );
        }
        fragments.push(BattleLogs.Battle.buildBattleMessage(log));

        return fragments.join(
            BattleLogs.Message.Joiner.fragments[BattleLogs.Message.Settings.Format]
        );
    }

    static __internal__getDifficultyByChoice(choice) {
        if (choice === "normal") {
            return "Normal"
        } else if (choice === "easy") {
            return "Facile"
        } else {
            return "Difficile"
        }
    }
}