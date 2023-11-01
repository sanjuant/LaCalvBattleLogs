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
        let data;
        try {
            data = JSON.parse(xhr.response);
            if (typeof data !== "object") return;
        } catch (e) {
            return
        }

        // Check user, top is is lower and remaining upper previous value
        let firstUserDamageHasReduce;
        if ("top" in data && data["top"].length > 0) {
            if (this.__internal__top[0]) {
                firstUserDamageHasReduce = data["top"][0]["damage"] < this.__internal__top[0]["damage"];
            } else {
                firstUserDamageHasReduce = false;
            }
        } else {
            firstUserDamageHasReduce = true;
        }

        let playerDamageHasReduce = false;
        if (data["user"]) {
            playerDamageHasReduce = data["user"]["damages"] < this.__internal__user["damages"];
        }

        let bossHealthRemainingHasIncreased = false;
        if (data["remaining"]) {
            bossHealthRemainingHasIncreased = data["remaining"] > this.Remaining;
        }

        if (firstUserDamageHasReduce && playerDamageHasReduce && bossHealthRemainingHasIncreased && !this.__internal__WbclassementPrinted) {
            this.__internal__addWbClassementToLog();
            this.__internal__WbclassementPrinted = true;
        }

        // If wbclassement has printed, set lowers values
        if (data["top"] && !firstUserDamageHasReduce || this.__internal__WbclassementPrinted) {
            this.__internal__top = data["top"];
        }
        if (data["user"] && !playerDamageHasReduce || this.__internal__WbclassementPrinted) {
            this.__internal__user = data["user"];
        }
        if (data["remaining"] && (!bossHealthRemainingHasIncreased || BattleLogs.Update.Wb < 0) || this.__internal__WbclassementPrinted) {
            this.Remaining = data["remaining"];
        }

        if (this.__internal__WbclassementPrinted) {
            this.__internal__WbclassementPrinted = false;
        }

        if (!firstUserDamageHasReduce && !playerDamageHasReduce && (!bossHealthRemainingHasIncreased || BattleLogs.Update.Wb < 0)) {
            this.UpdateDate = new Date();
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/
    static __internal__top = null;
    static __internal__user = null;
    static __internal__WbclassementPrinted = false;

    /**
     * @desc Add worldboss classement to log
     */
    static __internal__addWbClassementToLog() {
        const dateString = BattleLogs.Utils.getDateObject(this.UpdateDate).toLocaleString("fr");
        const message = this.__internal__buildWbClassementMessage(dateString);
        BattleLogs.Notif.createNotif(message, dateString);
    }

    /**
     * @desc Build message for worldboss classement
     *
     * @param {string} dateString: time of classement
     *
     * @return string message
     */
    static __internal__buildWbClassementMessage(dateString) {
        const user = this.__internal__user
        let message = "Classement Worldboss {0}/{1} ({2})&nbsp;:".format(user.classement + 1, user.max, dateString);
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