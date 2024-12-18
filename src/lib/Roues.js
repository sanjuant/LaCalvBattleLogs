/**
 * @class The BattleLogsUpdate regroups the Roues functionalities
 */
class BattleLogsRoues {

    static Settings = {
        MenuSettings: "Roues-Settings",
        Type: "Roues",
    };

    static Messages = {
        normal: "Tu as {2} {0} {1}.",
        short: "{1}:{0}",
        list: "Tu as {2} {0} {1}.",
        item: {
            normal: "{0}",
            short: "{0}",
            list: "&nbsp;&nbsp;&nbsp;&nbsp;{0}",
        }
    };

    static Multiplier = 1;


    /**
     * @desc Initialize Class
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingsValues()
            this.__internal__rouesSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
            BattleLogs.Menu.addSettings(this.__internal__menuSettings, this.__internal__rouesSettings, "Roues");
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

        const gameUrl = BattleLogsComponentLoader.gameUrl;
        const baseUrl = gameUrl.endsWith("/") ? gameUrl : gameUrl + "/";
        if (xhr.responseURL === baseUrl + "play/load") {
            this.__internal__roues = BattleLogs.Utils.pakoUncompress(data["shopv2"])["gachapon"];
            this.Multiplier = data["multiplierShop"];
        } else {
            const url = new URL(xhr.responseURL);
            const segments = url.pathname.split('/');
            const short = segments.pop() || segments.pop(); // Handle potential trailing slash
            let shortStats = short;
            let count = new URLSearchParams(url.search).get('count') || 1;
            let rouesType;
            let multiplier = 1;
            if (short.match(/^(c|d|r|re|beta)$/)) {
                rouesType = "coquille";
            } else if (short.match(/^exclusive*/)) {
                rouesType = "ticket";
                shortStats = rouesType;
            } else {
                return;
            }
            let rewards = this.__internal__addRouesToLog(count, short, data["new"], rouesType);
            BattleLogs.Stats.Roues.updateStats(Number(count), shortStats, rewards["items"], rouesType, rewards["cost"] * multiplier);
        }
    }

    /**
     * @desc Update settings of class
     */
    static updateSettings() {
        this.__internal__rouesSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
    }

    /**
     * @desc Append message to battle logs menu
     *
     * @param {Object} log: log to convert in message
     */
    static appendMessage(log) {
        if (this.__internal__rouesSettings["display-" + log.rouesType]) {
            const message = this.__internal__buildRouesMessage(log);
            BattleLogs.Message.appendMessage(message, log.type, log);
        }
    }

    /**
     * @desc Return true if roues has loaded
     *
     * @return true if roues objects has loaded else false
     */
    static hasLoaded() {
        if (this.__internal__roues.length === 0) {
            return false;
        }
        return true;
    }

    /**
     * @desc Return all objects of Roues
     *
     * @return array of objects
     */
    static getObjects() {
        const internalArrays = [
            this.__internal__roues,
        ];
        return [].concat(...internalArrays)
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__roues = [];
    static __internal__rouesSettings = null;
    static __internal__menuSettings = {
        display: {
            title: "Affichages des ouvertures",
            stats: {
                oeuf: {
                    name: "Oeufs",
                    display: true,
                    setting: true,
                    text: "Afficher les ouvertures d'oeufs",
                    type: "checkbox"
                },
                coquille: {
                    name: "Coeuffres",
                    display: true,
                    setting: true,
                    text: "Afficher les ouvertures de coeuffres",
                    type: "checkbox"
                },
                ticket: {
                    name: "Tickets",
                    display: true,
                    setting: true,
                    text: "Afficher les ouvertures de tickets",
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
            short: ":",
            list: " : \n"
        },
        normal: " ",
        short: " ",
        list: "\n"
    }

    /**
     * @desc Add roues to log
     *
     * @param {Number} count: Count of roue
     * @param {string} short: Short name of roue
     * @param {Array} dataItems: Array of items
     * @param {string} rouesType: Type of roue
     *
     */
    static __internal__addRouesToLog(count, short, dataItems, rouesType) {
        const itemsArray = this.__internal__createRewardItemsArray(dataItems);
        const isCoquille = rouesType === "coquille";
        const verb = isCoquille ? "assemblé" : "ouvert";
        count = isCoquille ? count * 100 : count;
        let cost = 0;

        let name;
        if (rouesType === "ticket") {
            name = rouesType
            if (count > 1) {
                name = name + "s";
            }
        } else {
            let object = BattleLogs.Utils.getObjectByShortName(short);
            if (rouesType === "oeuf") {
                cost = object["cost"];
            } else if (rouesType === "coquille") {
                cost = count;
            }
            if (object["name"]) {
                name = object["name"];
            }
            if (count > 1) {
                name = name.split(" ")[0] + "s " + name.split(" ").slice(1).join(" ");
            }
        }

        const message = "{0}|{1}|{2}".format(count, name, verb);

        const log = new this.Log(BattleLogs.Notif.Settings.Type, this.Settings.Type, message, itemsArray, rouesType, cost);
        BattleLogs.Notif.appendNotif(log);
        return {"items": itemsArray, "cost": cost};
    }

    /**
     * @desc Build message for roues opening
     *
     * @param {Object} log: Log of roues
     *
     * @return string message
     */
    static __internal__buildRouesMessage(log) {
        const groups = this.__internal__groupItemsByType(log.rewards.items);
        const fragments = [];

        if (log.message.includes("|")) {
            fragments.push(this.Messages[BattleLogs.Message.Settings.Format].format(
                log.message.split("|")[0].trim(),
                log.message.split("|")[1].trim(),
                log.message.split("|")[2].trim())
            );
        } else {
            fragments.push(log.message);
        }

        const rouesSpan = document.createElement("span");
        for (const group in groups) {
            const rouesSpanFragments = [];
            // Add label for item type
            const rLabelSpan = document.createElement("span");
            rLabelSpan.classList.add(`${BattleLogs.Message.Settings.Format}-label`);
            rLabelSpan.textContent = group.capitalize();
            rouesSpanFragments.push(rLabelSpan.outerHTML)

            let items = []
            // Format item to html
            const valueSpan = document.createElement("span");
            groups[group].forEach(item => {
                const objectSpan = document.createElement("span");
                objectSpan.classList.add("rarity-" + item.rarity);
                objectSpan.innerHTML = this.Messages.item[BattleLogs.Message.Settings.Format].format(item.count > 1 ? `${item.name} (x${item.count})` : item.name);
                items.push(objectSpan.outerHTML)
            })
            valueSpan.innerHTML = items.join(this.__internal__joiner.items[BattleLogs.Message.Settings.Format]);
            rouesSpanFragments.push(valueSpan.outerHTML);
            fragments.push(rouesSpanFragments.join(this.__internal__joiner.labelWithItems[BattleLogs.Message.Settings.Format]));
        }

        rouesSpan.innerHTML = fragments.join(this.__internal__joiner[BattleLogs.Message.Settings.Format]);

        return rouesSpan.outerHTML;
    }

    /**
     * @desc Group item object by type value
     *
     * @return object with nested objects by type
     */
    static __internal__groupItemsByType(items) {
        return items.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {});
    }

    /**
     * @desc Create rewards array with items
     *
     * @param {Object} dataRewards: Rewards of battle
     *
     * @return array with all items
     */
    static __internal__createRewardItemsArray(dataRewards) {
        let items = [];
        if (dataRewards) {
            dataRewards.forEach(reward => {
                const type = reward[0];
                const object = reward[1];
                let existingItem = items.find(i => i.name === object["name"]);
                if (existingItem === undefined) {
                    items.push({name: object["name"], count: 1, rarity: object["rarity"], type: type});
                } else {
                    existingItem.count += 1
                }
            })
        }

        return items;
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.MenuSettings, {});
    }

    static Log = class {
        constructor(type, logType, message, items, roueType, cost) {
            this.type = type;
            this.time = new Date().toISOString();
            this.message = message;
            this.rewards = {items: items};
            this.logType = logType;
            this.rouesType = roueType;
            this.cost = cost
        }
    };
}
