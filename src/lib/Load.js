/**
 * @class The BattleLogsUpdate regroups the Update functionalities
 */
class BattleLogsLoad {
    static Armes = [];
    static Calvs = [];
    static Items = [];
    static Familiers = [];
    static Histoire = [];
    static Effects = [];
    static EffectsData = [];
    static Expeditions = [];
    static Sorts = [];
    static Panos = [];
    static Event = [];
    static Gems = [];

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

        const discardInvalidFormatObjects = (data) => data.filter(e => e.name !== "Non implémenté");

        this.Items = discardInvalidFormatObjects(BattleLogs.Utils.pakoUncompress(data["items"]));
        this.Armes = discardInvalidFormatObjects(BattleLogs.Utils.pakoUncompress(data["armes"]));
        this.Calvs = discardInvalidFormatObjects(BattleLogs.Utils.pakoUncompress(data["calvs"]));
        this.Familiers = BattleLogs.Utils.pakoUncompress(data["familiers"]);
        this.Histoire = BattleLogs.Utils.pakoUncompress(data["histoire"]);
        this.Effects = BattleLogs.Utils.pakoUncompress(data["effectsv2"]);
        this.EffectsData = BattleLogs.Utils.pakoUncompress(data["effectsData"]);
        this.Expeditions = BattleLogs.Utils.pakoUncompress(data["expeditions"]);
        this.Sorts = BattleLogs.Utils.pakoUncompress(data["sorts"]);
        this.Panos = BattleLogs.Utils.pakoUncompress(data["panos"]);
        this.Event = BattleLogs.Utils.pakoUncompress(data["event"]);
        this.Gems = BattleLogs.Utils.pakoUncompress(data["gemmes"]);

        BattleLogs.Message.updateMessages()
    }

    /**
     * @desc Return true if load has loaded
     *
     * @return true if load objects has loaded else false
     */
    static hasLoaded() {
        if (this.Items.length === 0) {
            return false;
        }
        if (this.Armes.length === 0) {
            return false;
        }
        if (this.Calvs.length === 0) {
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
            this.Items,
            this.Armes,
            this.Calvs,
            this.Familiers
        ];
        return [].concat(...internalArrays)
    }

    static getExpedition(id) {
        let foundObject = this.Expeditions.find(item => {
            return item.id === id
        });
        if (foundObject) {
            return foundObject;
        }
        return id;
    }

    static getFamilier(shortName) {
        let foundObject = this.Familiers.find(item => {
            return item.short === shortName
        });
        if (foundObject) {
            return foundObject;
        }
        return shortName;
    }

    static getEventLoot() {
        return this.Event["loot"];
    }

    static getGemByName(name) {
        return this.Gems[name];
    }
    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

}