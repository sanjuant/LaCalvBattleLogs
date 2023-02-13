/**
 * @class The BattleLogsUpdate regroups the Update functionalities
 */
class BattleLogsLoad {
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
            return;
        }
        this.__internal__items = BattleLogs.Utils.pakoUncompress(data["items"]);
        this.__internal__armes = BattleLogs.Utils.pakoUncompress(data["armes"]);
        this.__internal__calvs = BattleLogs.Utils.pakoUncompress(data["calvs"]);

        BattleLogs.Message.updateMessages()
    }

    /**
     * @desc Get object item by short name
     *
     * @param {string} shortName: short name of object needed
     *
     * @return found object or null
     */
    static getObjectByShortName(shortName) {
        let internalArrays = [
            this.__internal__items,
            this.__internal__armes,
            this.__internal__calvs
        ];
        for (let internalArray of internalArrays) {
            let foundObject = internalArray.find(item => {
                return item.short === shortName
            });
            if (foundObject) {
                return foundObject;
            }
        }
        return shortName;
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__items = [];
    static __internal__armes = [];
    static __internal__calvs = [];
}