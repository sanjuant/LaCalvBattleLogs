/**
 * @class The BattleLogsUpdate regroups the Battlewbtry functionalities
 */
class BattleLogsBattlewbtry {
    static Available;

    /**
     * @desc Parse XMLHttpRequest response
     *
     * @param {XMLHttpRequest} xhr: The xhr request
     */
    static parseResponse(xhr) {
        const data = xhr.response.text();
        if (!isNaN(parseInt(data))) {
            this.Available = false;
        } else if (data === "OK") {
            this.Available = true;
        }
    }
}