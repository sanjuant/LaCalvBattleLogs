/**
 * @class The BattleLogsUpdate regroups the Wbclassement functionalities
 */
class BattleLogsWbclassement {
    static Remaining;
    static UpdateDate;

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__top = [];
            this.__internal__user = {classement: -1, damages: 0, max: 0};
            this.UpdateDate = new Date();
            this.Remaining = Number.MAX_SAFE_INTEGER;
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
        if (this.__internal__top.length > 0 && data["top"]?.length === 0 && BattleLogs.Update.Wb < 0) {
            this.__internal__addWbClassementToLog();
        }
        if (data["top"]) {
            this.__internal__top = data["top"];
        }
        if (data["user"]) {
            this.__internal__user = data["user"];
        }
        if (data["remaining"]) {
            this.Remaining = data["remaining"];
        }
        this.UpdateDate = new Date();
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/
    static __internal__top = null;
    static __internal__user = null;

    /**
     * @desc Add worldboss classement to log
     */
    static __internal__addWbClassementToLog() {
        const message = this.__internal__buildWbClassementMessage()
        const notifLog = BattleLogs.Notif.createNotif(message, this.UpdateDate)
        BattleLogs.Notif.addLog(notifLog)
    }

    /**
     * @desc Build message for worldboss classement
     *
     * @return string message
     */
    static __internal__buildWbClassementMessage() {
        const user = this.__internal__user
        let message = "Classement Worldboss {0}/{1} ({2})&nbsp;:".format(user.classement + 1, user.max + 1, this.UpdateDate.toLocaleString("fr-FR"))
        for (let i = 0; i < this.__internal__top.length; i++) {
            let user = this.__internal__top[i];
            message += "\n";
            message += this.__internal__formatRankingLine(user, i + 1);
        }
        message += "\n";
        message += this.__internal__formatRankingLine(user, user.classement + 1, true);
        return message;
    }

    /**
     * @desc Format line for ranking in worldboss classement
     *
     * @param {object} user
     * @param {Number} rank
     * @param {boolean} isPlayer
     * @return string ranking line
     */
    static __internal__formatRankingLine(user, rank, isPlayer = false) {
        if (isPlayer) {
            user.pseudoTwitch = "Vous"
            user.damage = user.damages
        }
        const pad = (rank).toString().length > 2 ? (rank).toString().length : 2
        let spacing = 25 - user["pseudoTwitch"].length;
        return `${(rank).toString().padEnd(pad)} - ${user["pseudoTwitch"]} ${user["damage"].toString().padStart(spacing)} dommages`;
    }
}