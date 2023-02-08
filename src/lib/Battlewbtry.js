/**
 * @class The BattleLogsUpdate regroups the Battlewbtry functionalities
 */
class BattleLogsBattlewbtry {
    static SecRemaining = Number.MAX_VALUE;

    /**
     * @desc Parse XMLHttpRequest response
     *
     * @param {XMLHttpRequest} xhr: The xhr request
     */
    static parseResponse(xhr) {
        let data;
        try {
            data = xhr.response.toString();
            if (typeof data !== "string") return;
        } catch (e) {
            return
        }

        const value = BattleLogs.Utils.tryParseInt(data, -1);
        if (BattleLogs.Update.Wb < 0) {
            this.SecRemaining = Number.MAX_VALUE;
        } else  {
            this.SecRemaining = value;
        }
    }
}