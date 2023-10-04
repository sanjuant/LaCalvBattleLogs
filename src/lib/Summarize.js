/**
 * @class The BattleLogsSummarize regroups the 'x10, x50, x100' logs
 */
class BattleLogsSummarize {
    static Settings = {
        x10: {
            Logs: "x10-Logs",
            Type: "x10",
            Count: 10
        },
        x50: {
            Logs: "x50-Logs",
            Type: "x50",
            Count: 50
        },
        x100: {
            Logs: "x100-Logs",
            Type: "x100",
            Count: 100
        },
        Limit: 100
    };

    static LogsArray = {
        x10: [],
        x50: [],
        x100: []
    };

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingValues();
            // Restore previous session state
            const logsArrayX10 = BattleLogs.Utils.LocalStorage.getComplexValue(
                this.Settings.x10.Logs
            );
            if (logsArrayX10 !== null) {
                this.LogsArray.x10 = logsArrayX10;
            }

            const logsArrayX50 = BattleLogs.Utils.LocalStorage.getComplexValue(
                this.Settings.x50.Logs
            );
            if (logsArrayX50 !== null) {
                this.LogsArray.x50 = logsArrayX50;
            }

            const logsArrayX100 = BattleLogs.Utils.LocalStorage.getComplexValue(
                this.Settings.x100.Logs
            );
            if (logsArrayX100 !== null) {
                this.LogsArray.x100 = logsArrayX100;
            }
        }
    }

    /**
     * @desc Add summarize log to battle logs
     *
     * @param {string} type: Type of log
     * @param {string} summarizeType: Base type of log
     */
    static addLog(type, summarizeType) {
        const log = this.__internal__addLog(type, summarizeType);
        this.appendMessage(log);
    }

    /**
     * @desc Append message to battle logs menu
     *
     * @param {Object} log: log to convert in message
     */
    static appendMessage(log) {
        const message = BattleLogs[log.logType].buildMessage(log, true);
        const type = log.logType + " " + log.type;
        if (BattleLogs.Message.Filters[log.type].enable) {
            BattleLogs.Message.appendMessage( message, type, log);
        }
    }

    /**
     * @desc Split result and format message
     * @param {string} message: message used to summarize log
     * @param {string }result: result of summarized log
     * @return Message formatted with result
     */
    static formatResult(message, result) {
        const win = result.toString().split("|")[0];
        const loose = result.toString().split("|")[1];
        const total = BattleLogs.Utils.tryParseInt(win) + BattleLogs.Utils.tryParseInt(loose);
        return message.format(win * 100 / total, loose * 100 / total)
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    /**
     * @desc Append log to local storage and logs array
     *
     * @param {string} type: Type of log
     * @param {string} summarizeType: Base type of log
     *
     * @return Log added
     */
    static __internal__addLog(type, summarizeType) {
        const {
            user,
            opponent,
            rewards
        } = this.__internal__summarizeLogs(
            BattleLogs[type].LogsArray.slice(-this.Settings[summarizeType].Count)
        );
        const log = new this.Log(
            this.Settings[summarizeType].Type,
            type,
            user,
            opponent,
            rewards
        );
        this.LogsArray[summarizeType].push(log);
        BattleLogs.Utils.LocalStorage.setComplexValue(
            this.Settings[summarizeType].Logs,
            log,
            this.Settings.Limit
        );
        return log;
    }

    /**
     * @desc Summarize logs
     *
     * @param {Array} logs: Array of logs
     *
     * @return Object used for message
     */
    static __internal__summarizeLogs(logs) {
        const user = this.__internal__summarizeAttributes("user", logs);
        const opponent = this.__internal__summarizeAttributes("opponent", logs);
        const rewards = this.__internal__summarizeAttributes("rewards", logs);
        return {
            user,
            opponent,
            rewards
        };
    }

    /**
     * @desc Summarize log attributes
     *
     * @param {string} type: Type of object summarized
     * @param {Array} logs: Array of logs
     *
     * @return Object of attributes summarized
     */
    static __internal__summarizeAttributes(type, logs) {
        const logRef = logs[0];
        let win = 0;
        let loose = 0;
        let summarizedAttributes;
        if (type === "rewards") {
            summarizedAttributes = BattleLogs.Battle.createRewards(logRef[type]
                .type);
        } else {
            summarizedAttributes = BattleLogs.Battle.createPlayer(logRef[type]
                .type);
        }
        for (const [key, value] of Object.entries(logRef[type])) {
            if (Number.isInteger(value)) {
                summarizedAttributes[key] = BattleLogs.Utils.truncateNumber(
                    logs.reduce((acc, log) => acc + log[type][key], 0) / logs.length
                );
            } else if (key === "result") {
                win = logs.filter((log) => log[type][key] === "winner").length;
                loose = logs.filter((log) => log[type][key] === "looser").length;
                summarizedAttributes[key] = win + '|' + loose;
            }
        }
        return summarizedAttributes;
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(
            this.Settings.x10.Logs,
            this.LogsArray.x10
        );
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(
            this.Settings.x50.Logs,
            this.LogsArray.x50
        );
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(
            this.Settings.x100.Logs,
            this.LogsArray.x100
        );
    }

    static Log = class {
        constructor(type, logType, user, opponent, rewards) {
            this.type = type;
            this.time = new Date().toISOString();
            this.user = user;
            this.opponent = opponent;
            this.rewards = rewards;
            this.logType = logType;
        }
    };
}