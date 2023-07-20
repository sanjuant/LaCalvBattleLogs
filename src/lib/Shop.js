/**
 * @class The BattleLogsShop regroups the shop functionalities
 */
class BattleLogsShop {
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
        this.__internal__shop = BattleLogs.Utils.pakoUncompress(data["shop"]);

        BattleLogs.Message.updateMessages()
    }

    /**
     * @desc Return true if load has loaded
     *
     * @return true if load objects has loaded else false
     */
    static hasLoaded() {
        return this.__internal__shop.length !== 0;

    }

    /**
     * @desc Return all objects of Shop
     *
     * @return array of objects
     */
    static getObjects() {
        const internalArrays = [
            this.__internal__shop,
        ];
        return [].concat(...internalArrays)
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__shop = [];
}