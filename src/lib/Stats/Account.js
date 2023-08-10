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
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
        },
    };

    static Data;

    /**
     * @desc Creates and appends statistical panes for each type of wheel within the stats panel.
     *       Iterates through the data of each wheel type and creates a corresponding pane using the `BattleLogs.Stats.createPane` method.
     */
    static createStatsPanes() {
        Object.keys(this.Data).forEach(key => {
            const pane = BattleLogs.Stats.createPane(this.Data[key], this.Settings.Type)
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
     * @desc Updates the wheel stats with the provided details, such as count, cost, items, etc.
     *       The method also updates the visual stats bar to reflect the new data.
     *
     * @param {Number} count: Number of wheels spin.
     * @param {string} short: Short name of the wheel (e.g., "c", "d", "r", "re", "ticket").
     * @param {Array} items: Array of items obtained from the wheel.
     * @param {string} rouesType: Type of wheel (e.g., "oeuf", "coquille", "ticket").
     * @param {Number} cost: Price of a wheel.
     */
    static updateStats(count, short, items, rouesType, cost) {
        const statsData = this.Data[rouesType];
        statsData[short]["total"] += count;
        statsData[short]["cost"] = BattleLogs.Utils.roundToAny(statsData[short]["cost"] + cost, 2);
        items.forEach(item => {
            statsData[short].itemsPerRarity[item.rarity] += item.count;
        })
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsRoues, this.Data);
        // this.__internal__updateStatPaneBlock(statsData, rouesType, short)
    }

    /**
     * @desc Reset stats
     *
     * @param {string} id: Id of wheel to reset
     */
    static resetStats(id) {
        this.Data[id] = JSON.parse(JSON.stringify(this.__internal__defaultStats[id]));
        const newStatsData = this.Data[id]
        newStatsData.time = new Date().toISOString();
        const statPanes = document.querySelectorAll(`#Stats-${id}[data-key=${id}] .stats-block`);
        statPanes.forEach(pane => {
            pane.remove()
        })
        this.appendStatsToPane(this.Data[id])
        const dateSpan = document.querySelector(`#${BattleLogs.Stats.Settings.Type}-${id} [data-key="time"]`)
        dateSpan.textContent = BattleLogs.Stats.Messages.since.format(BattleLogs.Stats.formatStatsDate(newStatsData));
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsRoues, this.Data);
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


    /**
     * @desc Builds the stats pane for a specific wheel type, utilizing the given data.
     *
     * @param {Object} statsData: Statistical data for the specific wheel type.
     * @param {Element} container: HTML element representing the container pane.
     */
    static __internal__buildStatPane(statsData, container) {
        // Build div for each type of roue
        Object.keys()
    }

    /**
     * @desc Creates a block within the stats pane for a specific wheel type.
     *       This block contains elements such as the title, percentage bar, and details related to different rarities.
     *
     * @param {Object} statsData: Statistical data for the specific wheel type.
     * @param {string} key: Key of wheel.
     * @param {Element} container: HTML element representing the block within the stats pane.
     */
    static __internal__createStatPaneBlock(statsData, key, container) {

    }

    /**
     * @desc Default statistical values for different types of wheels, such as "oeuf", "coquille", "ticket".
     *       Contains initial values for total, cost, itemsPerRarity, rarity, etc., for each wheel type.
     */
    static __internal__defaultStats = {
        "account": {
            "id": "account",
            "time": new Date().toISOString(),
            "ticket": 0,
            "alopiece": 0,
            "familiers": 0,
            "armes": {
                0: {
                    "totalObjects": 0,
                    "objects": [
                        {
                            // "name": "Ciseaux cisaillés",
                            // "short": "ciseauxcisaills",
                            "count": 2,
                            "level": 9,
                            // "rarity": 1
                        }
                    ]
                },
                1: {"totalObjects": 0, "objects": []},
                2: {"totalObjects": 0, "objects": []},
                3: {"totalObjects": 0, "objects": []},
                4: {"totalObjects": 0, "objects": []},
                5: {"totalObjects": 0, "objects": []},
                6: {"totalObjects": 0, "objects": []}
            },
            "calvs": {
                0: {"totalObjects": 0, "objects": []},
                1: {"totalObjects": 0, "objects": []},
                2: {"totalObjects": 0, "objects": []},
                3: {"totalObjects": 0, "objects": []},
                4: {"totalObjects": 0, "objects": []},
                5: {"totalObjects": 0, "objects": []},
                6: {"totalObjects": 0, "objects": []}
            },
            "items": {
                0: {"totalObjects": 0, "objects": []},
                1: {"totalObjects": 0, "objects": []},
                2: {"totalObjects": 0, "objects": []},
                3: {"totalObjects": 0, "objects": []},
                4: {"totalObjects": 0, "objects": []},
                5: {"totalObjects": 0, "objects": []},
                6: {"totalObjects": 0, "objects": []}
            },
            "objects": {
                0: {"totalObjects": 0, "objects": [
                        {
                            "count": 0,
                            "level": 1
                        }
                    ]},
                1: {"totalObjects": 0, "objects": []},
                2: {"totalObjects": 0, "objects": []},
                3: {"totalObjects": 0, "objects": []},
                4: {"totalObjects": 0, "objects": []},
                5: {"totalObjects": 0, "objects": []},
                6: {"totalObjects": 0, "objects": []}
            },
        },
    }
}