/**
 * @class The BattleLogsStatsAccount regroups functionality related to account stats
 */
class BattleLogsStatsAccount {
    static Settings = {
        Type: "Account"
    }

    static Messages = {
        account: {
            name: "Stats du compte",
            alopiece: "Alopièces",
            ticket: "Tickets",
            armes: "Armes possédées",
            calvs: "Calvs possédées",
            items: "Items possédés",
            familiers: "Familiers possédés",
            worth: "Valeur du compte",
        },
    };

    static Data;

    /**
     * @desc Creates and appends statistical panes for each type of wheel within the stats panel.
     *       Iterates through the data of each wheel type and creates a corresponding pane using the `BattleLogs.Stats.createPane` method.
     */
    static createStatsPanes() {
        Object.keys(this.Data).forEach(key => {
            const pane = BattleLogs.Stats.createPane(this.Data[key], this.Settings.Type, false, false)
            BattleLogs.Stats.StatsPanel.appendChild(pane)
            this.appendStatsToPane(this.Data[key])
        })
    }

    /**
     * @desc Appends or updates the content of the stats pane for a specific wheel type.
     *
     * @param {Object} statsData: The statistical data for a specific wheel type, containing details such as ID, total, cost, etc.
     */
    static appendStatsToPane(statsData) {
        const statPaneBody = document.querySelector(`#Stats-${statsData.id}[data-key=${statsData.id}] .stats-body`);
        if (statPaneBody !== null) {
            this.__internal__buildStatPane(statsData, statPaneBody)
        }
    }

    /**
     * @desc Updates the account stats
     */
    static updateStats() {
        const statsData = this.Data["account"];
        statsData.alopiece = BattleLogs.Update.Alopiece;
        statsData.ticket = BattleLogs.Update.Tickets;
        statsData.armes.owned = BattleLogs.Update.Armes.length > statsData.armes.owned ? BattleLogs.Update.Armes.length : statsData.armes.owned;
        statsData.armes.total = BattleLogs.Load.Armes.length - 1 > statsData.armes.total ? BattleLogs.Load.Armes.length - 1 : statsData.armes.total;
        statsData.calvs.owned = BattleLogs.Update.Calvs.length > statsData.calvs.owned ? BattleLogs.Update.Calvs.length : statsData.calvs.owned;
        statsData.calvs.total = BattleLogs.Load.Calvs.length - 1 > statsData.calvs.total ? BattleLogs.Load.Calvs.length - 1 : statsData.calvs.total;
        statsData.items.owned = BattleLogs.Update.Items.length > statsData.items.owned ? BattleLogs.Update.Items.length : statsData.items.owned;
        statsData.items.total = BattleLogs.Load.Items.length > statsData.items.total ? BattleLogs.Load.Items.length : statsData.items.total;
        statsData.familiers.owned = BattleLogs.Update.Familiers.length > statsData.familiers.owned ? BattleLogs.Update.Familiers.length : statsData.familiers.owned;
        statsData.familiers.total = BattleLogs.Load.Familiers.length - 1 > statsData.familiers.total ? BattleLogs.Load.Familiers.length - 1 : statsData.familiers.total;
        statsData.worth = this.__internal__calculateAccountValue() > 0 ? this.__internal__calculateAccountValue() : statsData.worth;
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsAccount, this.Data);
        this.__internal__updateAttributes(statsData);
    }

    /**
     * @desc Sets the default values for various settings related to the stats pane.
     *
     * @param {string} key: key to set in local storage
     */
    static setDefaultSettingsValues(key) {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(key, {
            "account": this.__internal__defaultStats["account"],
        });
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__statsAllowedKey = ["ticket", "alopiece", "familiers", "armes", "calvs", "items", "worth"];
    static __internal__statsBlockValue = null;

    /**
     * @desc Builds the stats pane for account stats, utilizing the given data.
     *
     * @param {Object} statsData: Statistical data for account.
     * @param {Element} container: HTML element representing the container pane.
     */
    static __internal__buildStatPane(statsData, container) {
        const blockContainer = document.createElement("div");
        blockContainer.classList.add("stats-account");
        const blockValues = document.createElement("div");
        blockValues.classList.add("stats-account-body");
        Object.keys(statsData).forEach((key) => {
            if (this.__internal__statsAllowedKey.includes(key)) {
                this.__internal__appendAttributes(statsData, key, blockValues);
            }
        })
        blockContainer.appendChild(blockValues);
        container.appendChild(blockContainer);
        this.__internal__statsBlockValue = blockValues;
    }

    /**
     * @desc Append attributes of stuff in container
     *
     * @param {Object} object: object data to append
     * @param {string} key: Key of data.
     * @param {Element} container: HTML element representing the stuff block.
     */
    static __internal__appendAttributes(object, key, container) {
        const attrContainer = document.createElement("div");
        attrContainer.classList.add(key);
        attrContainer.dataset["key"] = key;

        const label = document.createElement("span");
        label.classList.add("key");
        label.textContent = this.Messages[object.id][key].capitalize();
        const name = document.createElement("span");
        name.classList.add("value")
        if (typeof object[key] === 'object') {
            name.textContent = `${object[key].owned}/${object[key].total}`;
        } else if (!isNaN(object[key])) {  // check if object can be converted to a number
            name.textContent = BattleLogs.Utils.formatNumber(object[key]);
        } else {
            name.textContent = object[key];
        }

        attrContainer.appendChild(label)
        attrContainer.appendChild(name)
        container.appendChild(attrContainer)
    }

    /**
     * @desc Update attributes of stuff in container
     *
     * @param {Object} stuffData: stuff data to update
     */
    static __internal__updateAttributes(stuffData) {
        if (this.__internal__statsBlockValue === null) return // skip if not initialized

        Object.keys(stuffData).forEach((key) => {
            if (this.__internal__statsAllowedKey.includes(key)) {
                const container = this.__internal__statsBlockValue.querySelector(`[data-key=${key}]`)
                if (container === null) return;
                const value = container.querySelector(".value");
                if (typeof stuffData[key] === 'object') {
                    value.textContent = `${stuffData[key].owned}/${stuffData[key].total}`;
                } else {
                    value.textContent = BattleLogs.Utils.formatNumber(stuffData[key]);
                }
            }
        })
    }


    static __internal__calculateAccountValue() {
        let cheveuxCost = {0: 2000, 1: 5000, 2: 10000, 3: 30000, 4: 100000, 5: 300000, 6: 300000}
        let oeufsCost = {1: 2000, 2: 10000, 3: 20000, 4: 40000}
        let upgradeProbabilities = {
            1: 1,
            2: 0.85,
            3: 0.8,
            4: 0.7,
            5: 0.6,
            6: 0.5,
            7: 0.4,
            8: 0.3,
            9: 0.2,
            10: 0.1,
            11: 0.05,
            12: 0.025,
            13: 0.01,
            14: 0.003
        }
        let countAlopiece = 0
        const processItems = (items) => {
            items.forEach(item => {
                const obj = BattleLogs.Utils.getObjectByName(item.name);
                const {level, count} = item;

                let accumulatedCost = cheveuxCost[obj["rarity"]] * count;

                if (level > 1) {
                    for (let i = 1; i < level; i++) {
                        accumulatedCost += cheveuxCost[obj["rarity"]] / upgradeProbabilities[i];
                    }
                }

                countAlopiece += accumulatedCost;
            });
        };

        processItems(BattleLogs.Update.Armes);
        processItems(BattleLogs.Update.Items);
        processItems(BattleLogs.Update.Calvs);

        BattleLogs.Update.Objects.forEach(object => {
            let obj = BattleLogs.Utils.getObjectByName(object["name"]);
            let cost;
            if ("cost" in obj && obj["cost"] === 0 && obj["oeuf"]) {
                cost = oeufsCost[obj["rarity"]] * (Math.floor(object["count"] / obj["needed"])); // coquilles
            } else if ("cost" in obj) {
                cost = obj["cost"] * object["count"];
            } else {
                cost = cheveuxCost[obj["rarity"]] * object["count"];
            }

            countAlopiece += cost;
        });

        BattleLogs.Update.Familiers.forEach(fam => {
            let obj = BattleLogs.Utils.getObjectByName(fam["name"]);
            if (fam["sorts"].length === 4) {
                fam["sorts"].forEach(famSort => {
                    let sortShop = BattleLogs.Utils.getObjectByShortName(famSort["short"]);
                    if (sortShop["cost"]) countAlopiece += sortShop["cost"];
                })
            }
            if (obj["cost"]) countAlopiece += obj["cost"];
        });

        return countAlopiece
    }

    /**
     * @desc Default statistical values for different types of wheels, such as "oeuf", "coquille", "ticket".
     *       Contains initial values for total, cost, itemsPerRarity, rarity, etc., for each wheel type.
     */
    static __internal__defaultStats = {
        "account": {
            "id": "account",
            "time": new Date().toISOString(),
            "alopiece": 0,
            "ticket": 0,
            "armes": {
                "total": 0,
                "owned": 0
            },
            "calvs": {
                "total": 0,
                "owned": 0
            },
            "items": {
                "total": 0,
                "owned": 0
            },
            "familiers": {
                "total": 0,
                "owned": 0
            },
            "worth": 0,
        },
    }
}