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
            equipment: "Valeur de l'équipement"
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
        const { Update, Load } = BattleLogs;
        const statsData = this.Data["account"];

        statsData.alopiece = Update.Alopiece;
        statsData.ticket = Update.Tickets;

        this.__internal__updateStatsProperty('armes', Update.Armes, Load.Armes, 1);
        this.__internal__updateStatsProperty('calvs', Update.Calvs, Load.Calvs, 1);
        this.__internal__updateStatsProperty('items', Update.Items, Load.Items);
        this.__internal__updateStatsProperty('familiers', Update.Familiers, Load.Familiers, 6);
        const newWorth = this.__internal__calculateAccountValue();
        statsData.worth = newWorth > 0 ? newWorth : statsData.worth;
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

    static __internal__statsAllowedKey = ["worth", "equipment", "alopiece", "ticket", "armes", "calvs", "items", "familiers"];
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
        this.__internal__statsAllowedKey.forEach((key) => {
            this.__internal__appendAttributes(statsData, key, blockValues);
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
            if (object[key].total !== 0 && object[key].owned === object[key].total) name.classList.add("rarity-4")
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

    static __internal__updateStatsProperty(property, updateValue, loadValue, subtract = 0) {
        const statsData = this.Data["account"];
        const owned = statsData[property].owned;
        const total = statsData[property].total;

        statsData[property].owned = updateValue.length > owned ? updateValue.length : owned;
        statsData[property].total = loadValue.length - subtract > 0 ? loadValue.length - subtract : total;
    }

    static __internal__gemUpCostByRarity(rarity, level) {
        if (level < 2) return 0;
        const costByRarity= {
            0: [100, 150, 200, 250, 500, 750, 1000, 1250, 1500, 2500, 3500, 4500, 5500, 7500],
            1: [120, 180, 240, 300, 600, 900, 1200, 1500, 1800, 3000, 4200, 5400, 6600, 9000],
            2: [140, 210, 280, 350, 700, 1050, 1400, 1750, 2100, 3500, 4900, 6300, 7700, 10500],
            3: [160, 240, 320, 400, 800, 1200, 1600, 2000, 2400, 4000, 5600, 7200, 8800, 12000],
            4: [200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000, 5000, 7000, 9000, 11000, 15000] 
        }
        return costByRarity[rarity].slice(0, level-1).reduce((sum, e) => sum + e);
    }

    static __internal__calculateAccountValue() {
        if (BattleLogs.Update.Armes.length === 0
            || BattleLogs.Update.Items.length === 0
            || BattleLogs.Update.Calvs.length === 0
        ) return;
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
        let gemsCost = {
            "dureté" : 750000,
            "herculéenne" : 1500000,
            "gavage" : 500000,
            "dévouement" : 500000,
            "dressage" : 500000,
            "soutien" : 1000000,
            "vitalité" : 1000000,
            "guérison" : 1425000,
            "blockhaus" : 1250000,
            "hivernale" : 3125000,
        }
        let gemRateByRarity = {0: 0.01, 1: 0.02, 2: 0.1, 3: 0.5, 4: 1}
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
        this.Data["account"].equipment = countAlopiece;

        BattleLogs.Update.Objects.forEach(object => {
            let obj = BattleLogs.Utils.getObjectByName(object["name"]);
            let cost = 0;
            if ("cost" in obj && obj["cost"] === 0 && "oeuf" in obj) {
                cost = oeufsCost[obj["rarity"]] * (Math.floor(object["count"] / obj["needed"])); // coquilles
            } else if ("cost" in obj) {
                cost = obj["cost"] * object["count"];
            }

            countAlopiece += cost;
        });

        BattleLogs.Update.Familiers.forEach(fam => {
            let obj = BattleLogs.Utils.getObjectByName(fam["name"]);
            if (fam["sorts"].length === 4) {
                fam["sorts"].forEach(famSort => {
                    let sortShop = BattleLogs.Utils.getObjectByShortName(famSort["short"]);
                    if ("cost" in sortShop) countAlopiece += sortShop["cost"];
                })
            }
            if ("cost" in obj) countAlopiece += obj["cost"];
        });

        BattleLogs.Update.Costumes.forEach(costume => {
            let obj = BattleLogs.Utils.getObjectByShortName(costume);
            if ("cost" in obj) countAlopiece += obj["cost"];
        })


        BattleLogs.Update.Gems.forEach(gem => {
            countAlopiece += Math.round(gemsCost[gem.name] * gemRateByRarity[gem.rarity] * BattleLogs.Update.gemQuality(gem));
            countAlopiece += this.__internal__gemUpCostByRarity(gem.rarity, gem.level);
        });
        return countAlopiece;
    }

    /**
     * @desc Default statistical values for different types of wheels, such as "oeuf", "coquille", "ticket".
     *       Contains initial values for total, cost, itemsPerRarity, rarity, etc., for each wheel type.
     */
    static __internal__defaultStats = {
        "account": {
            "id": "account",
            "time": new Date().toISOString(),
            "worth": 0,
            "equipment": 0,
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
        },
    }
}