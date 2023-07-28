/**
 * @class The BattleLogsExpeditions regroups the Expedtions functionalities
 */
class BattleLogsExpedition {

    static Settings = {
        MenuSettings: "Expeditions-Settings",
        Type: "Expedition",
    };

    static Messages = {
        normal: "{0} a terminé {1}.",
        short: "{0} a terminé {1}",
        list: "{0} a terminé {1}.",
        item: {
            normal: "{0}",
            short: "{0}",
            list: "&nbsp;&nbsp;&nbsp;&nbsp;{0}",
        }
    };

    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingsValues()
            this.__internal__expeditionsSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
            BattleLogs.Menu.addSettings(this.__internal__menuSettings, this.__internal__expeditionsSettings, "Expedition");
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
            return;
        }
        const url = new URL(xhr.responseURL);
        const fam = new URLSearchParams(url.search).get('fam');
        const expedition = +(new URLSearchParams(url.search).get('expedition')); // Using the unary plus operator to convert to an integer
        this.__internal__addExpeditionToLog(fam, expedition, data["rewards"]);
    }

    /**
     * @desc Update settings of class
     */
    static updateSettings() {
        this.__internal__expeditionsSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
    }

    /**
     * @desc Append message to battle logs menu
     *
     * @param {Object} log: log to convert in message
     */
    static appendMessage(log) {
        if (this.__internal__expeditionsSettings["display-" + log.logType.toLowerCase()]) {
            const message = this.__internal__buildExpeditionMessage(log);
            BattleLogs.Message.appendMessage(message, log.type, log);
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__roues = [];
    static __internal__expeditionsSettings = null;
    static __internal__menuSettings = {
        display: {
            title: "Affichages des expéditions",
            stats: {
                expedition: {
                    name: "Expédition",
                    display: true,
                    setting: true,
                    text: "Afficher les récompenses d'expéditions",
                    type: "checkbox"
                },
            }
        }
    }
    static __internal__joiner = {
        items: {
            normal: ", ",
            short: ", ",
            list: "\n"
        },
        labelWithItems: {
            normal: " ",
            short: "",
            list: " : \n"
        },
        normal: " ",
        short: " ",
        list: "\n"
    }

    /**
     * @desc Add expeditions to log
     *
     * @param {string} fam: Fam of expedition
     * @param {Number} expedition: Number of expedition
     * @param {Array} dataItems: Array of items
     *
     */
    static __internal__addExpeditionToLog(fam, expedition, dataItems) {
        let expeditionObject = BattleLogs.Load.getExpedition(expedition);
        let familierObject = BattleLogs.Load.getFamilier(fam);
        const itemsArray = this.__internal__createRewardItemsArray(dataItems, familierObject["rarity"] - 1);

        const message = "{0}|{1}".format(familierObject["name"], expeditionObject["name"]);

        const log = new this.Log(BattleLogs.Notif.Settings.Type, this.Settings.Type, message, itemsArray);
        BattleLogs.Notif.appendNotif(log);
    }

    /**
     * @desc Build message for expedition claim
     *
     * @param {Object} log: Log of expedition
     *
     * @return string message
     */
    static __internal__buildExpeditionMessage(log) {
        const fragments = [];

        if (log.message.includes("|")) {
            fragments.push(this.Messages[BattleLogs.Message.Settings.Format].format(
                log.message.split("|")[0].trim(),
                log.message.split("|")[1].trim())
            );
        } else {
            fragments.push(log.message);
        }

        const expeditionSpan = document.createElement("span");

        const expdedtionSpanFragments = [];
        // Add label for item type
        const rLabelSpan = document.createElement("span");
        rLabelSpan.classList.add(`${BattleLogs.Message.Settings.Format}-label`);
        rLabelSpan.textContent = BattleLogs.Battle.Messages[BattleLogs.Message.Settings.Format].rewards
        expdedtionSpanFragments.push(rLabelSpan.outerHTML)

        let items = []
        // Format item to html
        const valueSpan = document.createElement("span");
        log.rewards.items.forEach(item => {
            const objectSpan = document.createElement("span");
            objectSpan.classList.add("rarity-" + item.rarity);
            let proba = Math.round(item.proba * 100 * 1000) / 1000
            objectSpan.innerHTML = this.Messages.item[BattleLogs.Message.Settings.Format].format(`${item.name} (x${item.count}) [${proba}%]`);
            items.push(objectSpan.outerHTML)
        })
        valueSpan.innerHTML = items.join(this.__internal__joiner.items[BattleLogs.Message.Settings.Format]);
        expdedtionSpanFragments.push(valueSpan.outerHTML);
        fragments.push(expdedtionSpanFragments.join(this.__internal__joiner.labelWithItems[BattleLogs.Message.Settings.Format]));

        expeditionSpan.innerHTML = fragments.join(this.__internal__joiner[BattleLogs.Message.Settings.Format]);

        return expeditionSpan.outerHTML;
    }

    /**
     * @desc Create rewards array with items
     *
     * @param {Object} dataRewards: Rewards of battle
     * @param {Number} famRarity: Rarity of familier
     *
     * @return array with all items
     */
    static __internal__createRewardItemsArray(dataRewards, famRarity) {
        let items = [];
        dataRewards.forEach(reward => {
            const type = reward[0];
            const object = reward[1];
            let proba = object["multiplier"] ? object["proba"] * (1 + famRarity * 0.05) : object["proba"];
            let name;
            let count;
            let rarity;
            if (!isNaN(parseInt(object["value"], 10))) {
                name = type === "alopiece" ? "Alopièce" : object["value"]
                count = object["value"]
                rarity = object["rarity"] ? object["rarity"] : 0
            } else {
                const objectRef = BattleLogs.Utils.getObjectByShortName(object["value"])
                name = objectRef["name"] ? objectRef["name"] : object["value"];
                count = object["count"] ? object["count"] : 1
                rarity = objectRef["rarity"] ? objectRef["rarity"] : 0
            }
            items.push({name: name, count: count, rarity: rarity, proba: proba, type: type})
        })

        return items;
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.MenuSettings, {});
    }

    static Log = class {
        constructor(type, logType, message, items) {
            this.type = type;
            this.time = new Date().toISOString();
            this.message = message;
            this.rewards = {items: items};
            this.logType = logType;
        }
    };
}
