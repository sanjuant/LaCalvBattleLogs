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
        this.__internal__expeditions = BattleLogs.Utils.pakoUncompress(data["expeditions"]);
        this.__internal__familiers = BattleLogs.Utils.pakoUncompress(data["familiers"]);

        BattleLogs.Message.updateMessages()
    }

    /**
     * @desc Return true if load has loaded
     *
     * @return true if load objects has loaded else false
     */
    static hasLoaded() {
        if (this.__internal__items.length === 0) {
            return false;
        }
        if (this.__internal__armes.length === 0) {
            return false;
        }
        if (this.__internal__calvs.length === 0) {
            return false;
        }
        return true;
    }

    /**
     * @desc Return all objects of Load
     *
     * @return array of objects
     */
    static getObjects() {
        const internalArrays = [
            this.__internal__items,
            this.__internal__armes,
            this.__internal__calvs
        ];
        return [].concat(...internalArrays)
    }

    static getExpedition(id) {
        let foundObject = this.__internal__expeditions.find(item => {
            return item.id === id
        });
        if (foundObject) {
            return foundObject;
        }
        return id;
    }

    static getFamilier(shortName) {
        let foundObject = this.__internal__familiers.find(item => {
            return item.short === shortName
        });
        if (foundObject) {
            return foundObject;
        }
        return shortName;
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__items = [];
    static __internal__armes = [];
    static __internal__calvs = [];
    static __internal__expeditions = [];
    static __internal__familiers = [];
}