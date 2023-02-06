/**
 * @class The BattleLogsUpdate regroups the Battlewbtry functionalities
 */
class BattleLogsBattlewbtry {
    static Available = false;
    static SecRemaining = 999;

    /**
     * @desc Parse XMLHttpRequest response
     *
     * @param {XMLHttpRequest} xhr: The xhr request
     */
    static parseResponse(xhr) {
        const data = xhr.response.toString();
        this.SecRemaining = BattleLogs.Utils.tryParseInt(data, 999);
        if (this.SecRemaining === 999 || BattleLogs.Update.Wb < 0) {
            this.Available = false;
        } else if (data === "OK") {
            this.Available = true;
        }
    }
}