/**
 * @class The BattleLogsStatsRoues regroups functionality related to battle logs roues stats
 */
class BattleLogsStatsRoues {
    static Settings = {
        Type: "Roues"
    }

    static Messages = {
        oeuf: {
            name: "Stats des oeufs",
            title: "{0} <span class='item-name'>{1}</span>",
            cost: "{0} alopièce{1} dépensée{2}"
        },
        coquille: {
            name: "Stats des coquilles",
            title: "{0} <span class='item-name'>{1}</span>",
            cost: "{0} coquille{1} cassée{2}"
        },
        ticket: {
            name: "Stats des tickets",
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
            cost: "premium"
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
        this.__internal__updateStatPaneBlock(statsData, rouesType, short)
    }

    /**
     * @desc Reset stats
     *
     * @param {string} id: Id of wheel to reset
     */
    static resetStats(id) {
        const statPanes = document.querySelectorAll(`#Stats-${id}[data-key=${id}] .stats-block`);
        statPanes.forEach(pane => {
            pane.remove()
        })
        this.appendStatsToPane(this.Data[id])
    }

    /**
     * @desc Sets the default values for various settings related to the stats pane.
     *
     * @param {string} key: key to set in local storage
     */
    static setDefaultSettingsValues(key) {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(key, {
            "oeuf": this.__internal__defaultStats["oeuf"],
            "coquille": this.__internal__defaultStats["coquille"],
            "ticket": this.__internal__defaultStats["ticket"],
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
        Object.keys(statsData).forEach((key) => {
            if (!BattleLogs.Stats.NotUpdateAttributes.includes(key)) {
                this.__internal__createStatPaneBlock(statsData, key, container);
            }
        })
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
        let type = statsData[key];
        if (typeof type !== 'object') return;
        let object = BattleLogs.Utils.getObjectByShortName(key);

        let roueTypeDiv = document.createElement("div");
        roueTypeDiv.classList.add(`stats-block`)
        roueTypeDiv.dataset["key"] = key
        let roueTypeTitle = document.createElement("div");
        roueTypeTitle.classList.add(`stats-subtitle`);
        roueTypeTitle.classList.add(`rarity-${type.rarity}`);
        roueTypeTitle.dataset[statsData.id] = object.short;

        roueTypeTitle = this.__internal__createOrUpdateRouesTitle(statsData, statsData.id, roueTypeTitle, object);
        roueTypeDiv.appendChild(roueTypeTitle);

        // Create percentage bar for each rarity
        let roueTypeStatBar = document.createElement("div");
        roueTypeStatBar.classList.add("stats-bar");
        roueTypeStatBar.dataset[statsData.id] = object.short;

        roueTypeStatBar = this.__internal__createOrUpdatePercentageBar(statsData, roueTypeStatBar, object);
        roueTypeDiv.appendChild(roueTypeStatBar);

        container.appendChild(roueTypeDiv);
    }

    /**
     * @desc Updates a specific block within the stats pane, reflecting the statistical data for a particular wheel type.
     *       Handles the creation or update of different elements such as the title, percentage bar, and rarity details.
     *
     * @param {Object} statsData: Statistical data for the specific wheel type.
     * @param {string} rouesType: Type of wheel
     * @param {string} key: Key of wheel.
     */
    static __internal__updateStatPaneBlock(statsData, rouesType, key) {
        const statPaneBlock = document.querySelector(`[data-key=${rouesType}] .stats-block[data-key="${key}"]`)
        const roueTypeSubtitle = statPaneBlock.querySelector(".stats-subtitle");
        let short = roueTypeSubtitle.getAttribute(`data-${statsData.id}`);
        let object = BattleLogs.Utils.getObjectByShortName(short);
        this.__internal__createOrUpdateRouesTitle(statsData, statsData.id, roueTypeSubtitle, object);

        // Update or create percentage bar for each rarity
        const statsBar = statPaneBlock.querySelector(".stats-bar");
        this.__internal__createOrUpdatePercentageBar(statsData, statsBar, object);
    }

    /**
     * @desc Creates and updates the title of roue stats
     *
     * @param {Object} statsData: The data of stats to update
     * @param {string} statsType: Type of stat
     * @param {Element} roueTypeTitle: The title element to update or create
     * @param {Object} item: Item object
     * @return {Element} The updated or created title element
     */
    static __internal__createOrUpdateRouesTitle(statsData, statsType, roueTypeTitle, item) {
        let total = statsData[item.short]["total"];
        let name;
        if (total > 1) {
            name = item.name.split(" ");
            if (name.length > 1) {
                name = name[0] + "s " + name[1] + "s";
            } else {
                name = name[0] + "s"
            }
        } else {
            name = item.name;
        }
        let cost = Math.round(statsData[item.short].cost);
        let costFormatted = BattleLogs.Utils.formatNumber(cost);
        let roueCost = this.Messages[statsType].cost.format(costFormatted, cost > 1 ? 's' : '', cost > 1 ? 's' : '');

        if (roueTypeTitle.childElementCount !== 0) {
            roueTypeTitle.children[0].firstChild.textContent = `${total} `;
            roueTypeTitle.children[0].querySelector("span").textContent = name;
            const lastChild = roueTypeTitle.children[0].lastChild
            if (total > 1 && lastChild.textContent.startsWith(' ') && !lastChild.textContent.endsWith('s')) {
                lastChild.textContent = lastChild.textContent + 's';
            }
            roueTypeTitle.children[1].textContent = roueCost;
        } else {
            const subTitleSpan = document.createElement("span")
            subTitleSpan.innerHTML = this.Messages[statsType].title.format(total, name, total > 1 ? 's' : '')
            roueTypeTitle.appendChild(subTitleSpan)

            let costSpan = document.createElement("span");
            costSpan.classList.add("item-cost");
            costSpan.textContent = roueCost;
            roueTypeTitle.appendChild(costSpan);
        }

        return roueTypeTitle;
    }

    /**
     * @desc Creates and updates the percentage bar of roue stats
     *
     * @param {Object} statsData: The data of stats to update
     * @param {Element} statsBar: The stats bar element to update or create
     * @param {Object} item: Item object
     * @return {Element} The updated or created stats bar element
     */
    static __internal__createOrUpdatePercentageBar(statsData, statsBar, item) {
        for (let i = 0; i < statsData[item.short].itemsPerRarity.length; i++) {
            if (statsData[item.short].itemsPerRarity[i] !== null && statsData[item.short].itemsPerRarity[i] > 0) {
                let spanRarity = statsBar.querySelector(`span[data-rarity="${i.toString()}"]`);
                if (!spanRarity) {
                    spanRarity = document.createElement("span");
                    spanRarity.classList.add(`bar-rarity-${i}`);
                    spanRarity.dataset.rarity = i.toString();
                    statsBar.appendChild(spanRarity);
                }
                let itemsPercentage = BattleLogs.Stats.getItemPercentage(statsData, item.short, i, 2);
                let visibleItemsPercentage = itemsPercentage > 0 ? Math.round(BattleLogs.Utils.roundToAny(itemsPercentage, 1)) : 0;
                spanRarity.textContent = `${visibleItemsPercentage}%`;
                spanRarity.style.width = `${itemsPercentage}%`;
                let dropChance = item[`p${i}`] * 100
                spanRarity.title = `Chance d'obtention: ${dropChance}%, Obtenu: ${itemsPercentage}%, Items: ${statsData[item.short].itemsPerRarity[i]}`
            } else {
                let spanRarity = statsBar.querySelector(`span[data-rarity="${i.toString()}"]`);
                if (spanRarity) {
                    spanRarity.remove()
                }
            }
        }
        return statsBar;
    }

    /**
     * @desc Default statistical values for different types of wheels, such as "oeuf", "coquille", "ticket".
     *       Contains initial values for total, cost, itemsPerRarity, rarity, etc., for each wheel type.
     */
    static __internal__defaultStats = {
        "oeuf": {
            "id": "oeuf",
            "time": new Date().toISOString(),
            "c": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null], "rarity": 1},
            "d": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 2},
            "r": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 3},
            "re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0], "rarity": 4},
        },
        "coquille": {
            "id": "coquille",
            "time": new Date().toISOString(),
            "c": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null], "rarity": 1},
            "d": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 2},
            "r": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 3},
            "re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0], "rarity": 4},
        },
        "ticket": {
            "id": "ticket",
            "time": new Date().toISOString(),
            "ticket": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 0},
        },
    }
}