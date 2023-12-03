/**
 * @class The BattleLogsHistoire regroups the Histoire logs functionalities
 */
class BattleLogsHistoire extends BattleLogsSurvie {
    static Settings = {
        Logs: "Histoire-Logs",
        Type: "Histoire",
        Limit: 500
    };

    static Messages = {
        normal: "Tu as {0} contre {1} ({2}/Zone&nbsp;{3}.{4}/{5})(x{6}).",
        short: "{0} contre {1}({2}/{3}.{4}/{5})(x{6})",
        list: "Tu as {0} contre {1} ({2}&nbsp;|&nbsp;Zone&nbsp;{3}.{4}&nbsp;|&nbsp;{5})(x{6}).",
    };

    static LogsArray = [];
    //static nbBattle = 0;

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
            let nbBattle = Math.floor(data["results"].length / 3);
            if (data["lost"] && data["results"].length % 3) nbBattle += 1;

            for (const subdata of data["results"]) {
                const {
                    user,
                    opponent,
                    rewards,
                    stuff
                } = BattleLogs.Battle.getStatsFromData(subdata);
                stats.push({user, opponent, rewards, stuff, nbBattle})
            }
        }
        console.log(stats);
        const url = new URL(xhr.responseURL);
        const choice = new URLSearchParams(url.search).get('id');
                        
        let uid = crypto.randomUUID();
        for (const stat of stats) {
            BattleLogs.Stats.Stuffs.updateStats(this.Settings.Type, stat.stuff, stat.user);
        }

        const lastBattle = stats[stats.length - 1];
        if (data["results"].length > 1) {
            const {
                user,
                opponent
            } = BattleLogs.Summarize.customSummarize(stats.slice(0,-1));
            user.result = data["lost"] ? "looser" : "winner";
            const sublog = this.__internal__addLog(uid, choice, user, opponent, BattleLogs.Battle.createRewards(), lastBattle.stuff, lastBattle.nbBattle);
            //this.appendMessage(sublog);
        }
        
        const log = this.__internal__addLog(uid, choice, lastBattle.user, lastBattle.opponent, lastBattle.rewards, lastBattle.stuff, lastBattle.nbBattle);
        this.appendMessage(log);
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
            let choice, monde, zone, etape;
            [choice, monde, zone, etape] = log.choice.split("_");
            fragments.push(
                this.Messages[BattleLogs.Message.Settings.Format]
                    .format(log.user.result === "winner" ? "gagné" : "perdu", log.opponent.name, BattleLogs.Load.Histoire[monde]?.name, +zone+1, +etape+1, this.__internal__getDifficultyByChoice(choice), log['nbBattle'] ? log.nbBattle : 1)
            );
        }
        fragments.push(BattleLogs.Battle.buildBattleMessage(log));

        return fragments.join(
            BattleLogs.Message.Joiner.fragments[BattleLogs.Message.Settings.Format]
        );
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
    static __internal__addLog(uid, choice, user, opponent, rewards, stuff, nbBattle) {
        const log = new this.Log(this.Settings.Type, uid, choice, user, opponent, rewards, stuff, nbBattle);
        this.LogsArray.push(log);
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.Logs, log, this.Settings.Limit);

        return log;
    }

    static Log = class {
        constructor(type, uid, choice, user, opponent, rewards, stuff, nbBattle) {
            this.type = type;
            this.uid = uid;
            this.choice = choice;
            this.time = new Date().toISOString();
            this.user = user;
            this.opponent = opponent;
            this.rewards = rewards;
            this.stuff = stuff;
            this.nbBattle = nbBattle;
        }
    };

    static __internal__getDifficultyByChoice(choice) {
        if (choice === "normal") return "Normal";
        if (choice === "hard") return "Difficile";
        return "Facile";
    }
}