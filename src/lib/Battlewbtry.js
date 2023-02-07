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
        const data = xhr.response.toString();
        const value = BattleLogs.Utils.tryParseInt(data, -1);
        if (BattleLogs.Update.Wb < 0) {
            this.SecRemaining = Number.MAX_VALUE;
        } else  {
            this.SecRemaining = value;
        }
    }
}