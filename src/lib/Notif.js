/**
 * @class The BattleLogsSummarize regroups the Notifs logs functionalities
 */
class BattleLogsNotif {
    static Settings = {
        Logs: "Notif-Logs",
        Type: "Notif",
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
            const logsArray = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.Logs);
            if (logsArray !== null) {
                this.LogsArray = logsArray;
            }
        }
    }

    /**
     * @desc Append message to battle logs menu
     *
     * @param {Object} log: log to convert in message
     */
    static appendMessage(log) {
        const time = BattleLogs.Utils.getDate(log.time).toLocaleTimeString();
        const message = log.message;
        const type = log.type;
        if (BattleLogs.Message.Filters[log.type].enable) {
            BattleLogs.Message.appendMessage(time, message, type);
        }
    }

    /**
     * @desc Create notif object
     *
     * @param {string} text: Text of notif
     * @param {Date} date: Date of notif
     * @returns player object
     */
    static createNotif(text, date) {
        if (this.__internal__minElapsedSinceExecution(date) < 2) {
            const notif = this.__internal__createNotif(text, date);
            const log = this.__internal__addLog(notif);
            this.appendMessage(log);
        }
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    /**
     * @desc Append log to local storage and logs array
     *
     * @param {Object} notif: Notif to append in log
     *
     * @return Log added
     */
    static __internal__addLog(notif) {
        this.LogsArray.push(notif);
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.Logs, notif);
        return notif;
    }

    /**
     * @desc Create notif object
     *
     * @param {string} text: Text of notif
     * @param {Date} date: Date of notif
     * @returns player object
     */
    static __internal__createNotif(text, date) {
        return new this.Log(
            this.Settings.Type,
            text,
            date
        );
    }

    /**
     *
     * @param dateString
     * @return {number}
     * @private
     */
    static __internal__minElapsedSinceExecution(dateString) {
        let [datePart, timePart] = dateString.split(" ");
        let [day, month, year] = datePart.split("/");
        let [hour, minute] = timePart.split(":");
        let date = new Date(year, month - 1, day, hour, minute);

        let diffInSeconds = (new Date().getTime() - date.getTime()) / 1000;
        return diffInSeconds / 60;
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.Logs, this.LogsArray);
    }

    static Log = class {
        constructor(type, message, date) {
            this.type = type;
            this.time = new Date();
            this.message = message;
            this.date = date;
        }
    };
}