/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

class BattleLogsStats {
    static Settings = {
        StatsEnable: "Stats-Enable",
        StatsEgg: "Stats-Egg",
        StatsShell: "Stats-Shell",
        Type: "Stats"
    }

    static StatsPanel;
    static StatsButton;

    static Messages = {
        egg: {
            name: "Stats des oeufs",
            title: "{0} {1}",
            cost: "{0} alopièce{1} dépensée{2}"
        },
        shell: {
            name: "Stats des coquilles",
            title: "{0} {1}",
            cost: "{0} coquille{1} utilisée{2}"
        },
        since: "(depuis le {0})",
    };

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static async initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            // Add CSV button
            this.__internal__addStatsPanel()
            this.__internal__addStatsButton(this.Settings.StatsEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);

            // Set default settings
            this.__internal__setDefaultSettingsValues()
            // Restore previous session state
            this.__internal__statsEgg = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsEgg);
            this.__internal__statsShell = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsShell);
        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            while (true) {
                if (BattleLogs.Shop.hasLoaded() && BattleLogs.Roues.hasLoaded() && BattleLogs.Load.hasLoaded()) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1 seconde (ajustez selon vos besoins)
            }
            this.__internal__updateStatsEggOutput(this.__internal__statsEgg)
            this.__internal__updateStatsEggOutput(this.__internal__statsShell)
        }
    }

    /**
     * Reset selected status and update elements accordingly
     */
    static resetSelected() {
        if (this.StatsButton) {
            BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
            BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
            this.StatsPanel.classList.add("hidden");
            this.StatsButton.classList.remove("selected");
            this.StatsButton.title = "Afficher les stats";
            BattleLogs.Utils.LocalStorage.setValue(this.StatsButton.id, "false");
        }
    }

    /**
     * @desc Update eggs stats
     *
     * @param {Number} count: Count of roue
     * @param {string} short: Short name of roue
     * @param {Array} items: Array of items
     * @param {string} rouesType: Type of roue
     * @param {Number} cost: price of a roue
     *
     */
    static updateStatsEgg(count, short, items, rouesType, cost) {
        if (rouesType === "oeuf") {
            this.__internal__statsEgg[short]["total"] += count;
            this.__internal__statsEgg[short]["cost"] += count * BattleLogsRoues.Multiplier * cost;
            items.forEach(item => {
                this.__internal__statsEgg[short]["itemsPerRarity"][item["rarity"]] += item["count"];
            })
            BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StatsEgg, this.__internal__statsEgg);
            this.__internal__updateStatsEggOutput(this.__internal__statsEgg);
        }

    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__statsEgg = null;
    static __internal__statsShell = null

    /**
     * @desc Adds the BattleLogs panel
     */
    static __internal__addStatsPanel() {
        // Add settings container
        this.StatsPanel = document.createElement("div");
        this.StatsPanel.id = "battlelogs-stats_panel";
        this.StatsPanel.classList.add("stats")
        if (!(BattleLogs.Utils.LocalStorage.getValue(this.Settings.StatsEnable) === "true")) {
            this.StatsPanel.classList.add("hidden")
        }

        // Add Stats panel to DOM
        BattleLogs.Menu.BattleLogsWrapper.appendChild(this.StatsPanel);
    }

    /**
     * @desc Add Stats button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addStatsButton(id, containingDiv) {
        // Add messages container to battle logs menu
        this.StatsButton = document.createElement("button");
        this.StatsButton.id = id;
        this.StatsButton.classList.add("svg_stats");

        let inStats = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (inStats) {
            BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
            BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
            this.StatsButton.classList.add("selected");
            this.StatsButton.title = "Masquer les stats";
        } else {
            this.StatsButton.title = "Afficher les stats";
        }
        this.StatsButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                BattleLogs.Message.resetSelectedSettings()
                BattleLogs.Glossary.resetSelected()
                BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
                this.StatsPanel.classList.remove("hidden");
                this.StatsButton.classList.add("selected");
                this.StatsButton.title = "Masquer les stats";
            } else {
                BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
                this.StatsPanel.classList.add("hidden")
                this.StatsButton.classList.remove("selected");
                this.StatsButton.title = "Afficher les stats";
                BattleLogs.Menu.BattleLogsWrapper.scrollTop = BattleLogs.Menu.BattleLogsWrapper.scrollHeight;
            }

            BattleLogs.Utils.LocalStorage.setValue(this.StatsButton.id, newStatus);
        };

        containingDiv.appendChild(this.StatsButton);
    }

    /**
     * @desc Build the output of egg stats
     */
    static __internal__buildStatsEggOutput(statData) {
        let statType = statData.id;

        // Build Panel for egg stats
        const divPanel = document.createElement("div");
        divPanel.id = `${this.Settings.Type}-${statData.id}`;

        const statsTitle = document.createElement("div");
        statsTitle.classList.add("stats-title")
        let created_since = BattleLogs.Utils.getDateObject(statData["time"]);
        const formattedDate = `${created_since.getDate().toString().padZero()}/${(created_since.getMonth() + 1).toString().padZero()}/${created_since.getFullYear().toString().substring(-2)} - ${created_since.getHours().toString().padZero()}h${created_since.getMinutes().toString().padZero()}`;
        let statsTitleNameSpan = document.createElement("span");
        statsTitleNameSpan.textContent = this.Messages[statType].name;
        statsTitleNameSpan.classList.add("stats-title-name");
        let statsTitleDateSpan = document.createElement("span");
        statsTitleDateSpan.textContent = this.Messages.since.format(formattedDate);
        statsTitleDateSpan.classList.add("stats-title-date");
        statsTitle.appendChild(statsTitleNameSpan);
        statsTitle.appendChild(statsTitleDateSpan);
        divPanel.appendChild(statsTitle);

        // Build div for each type of egg
        Object.keys(statData).forEach((key) => {
            let type = statData[key];
            if (typeof type !== 'object') return;
            let object = BattleLogs.Utils.getObjectByShortName(key);
            let eggTypeDiv = document.createElement("div");
            eggTypeDiv.classList.add(`stats-block`)
            let eggTypeTitle = document.createElement("div");
            eggTypeTitle.classList.add(`stats-subtitle`);
            eggTypeTitle.classList.add(`rarity-${type.rarity}`);
            eggTypeTitle.dataset.egg = object.short;

            eggTypeTitle = this.__internal__createOrUpdateEggTitle(statData, statType, eggTypeTitle, object);
            eggTypeDiv.appendChild(eggTypeTitle);

            // Create percentage bar for each rarity
            let eggTypeStatBar = document.createElement("div");
            eggTypeStatBar.classList.add("stats-bar");
            eggTypeStatBar.dataset.egg = type.short;

            eggTypeStatBar = this.__internal__createOrUpdatePercentageBar(statData, eggTypeStatBar, object);
            eggTypeDiv.appendChild(eggTypeStatBar);

            divPanel.appendChild(eggTypeDiv);
        })
        this.StatsPanel.appendChild(divPanel);
    }

    /**
     * @desc Update the output of egg stats
     *
     * @param {Object} statData: Type of stat
     */
    static __internal__updateStatsEggOutput(statData) {
        let statType = statData.id;
        if (document.getElementById(`${this.Settings.Type}-${statType}`) !== null) {
            let eggTypesTitles = document.getElementsByClassName(`stats-${statType}-title`);

            // Update title for each type of egg
            for (let eggTypeTitle of eggTypesTitles) {
                let short = eggTypeTitle.getAttribute(`data-${statType}`);
                let object = BattleLogs.Utils.getObjectByShortName(short);
                eggTypeTitle = this.__internal__createOrUpdateEggTitle(statData, statType, eggTypeTitle, object);

                // Update or create percentage bar for each rarity
                const statsBar = document.querySelector(`.stats-bar[data-${statType}="${short}"]`);
                if (statsBar) {
                    this.__internal__createOrUpdatePercentageBar(statData, statsBar, object);
                }
            }
        } else {
            this.__internal__buildStatsEggOutput(statData);
        }
    }

    /**
     * @desc Creates and updates the title of egg stats
     *
     * @param {Object} statsData: The data of stats to update
     * @param {string} statType: Type of stat
     * @param {Element} eggTypeTitle: The title element to update or create
     * @param {Object} item: Item object
     * @return {Element} The updated or created title element
     */
    static __internal__createOrUpdateEggTitle(statsData, statType, eggTypeTitle, item) {
        let total = statsData[item.short]["total"];
        let name;
        if (total !== 0) {
            name = item.name;
        } else {
            name = item.name.split(" ");
            name = name[0].slice(0, -1) + " " + name[1].slice(0, -1);
        }
        let cost = statsData[item.short]["cost"];
        let eggCost = this.Messages[statType].cost.format(cost, cost > 0 ? 's' : '', cost > 0 ? 's' : '');

        if (eggTypeTitle.childElementCount !== 0) {
            eggTypeTitle.children[0].firstChild.textContent = `${total} `;
            eggTypeTitle.children[0].lastChild.textContent = name;
            eggTypeTitle.children[1].textContent = eggCost;
        }else{
            let nameContainerSpan = document.createElement("span")
            nameContainerSpan.textContent = `${total} `
            let nameSpan = document.createElement("span");
            nameSpan.classList.add("item-name");
            nameSpan.textContent = name;
            nameContainerSpan.appendChild(nameSpan)
            eggTypeTitle.appendChild(nameContainerSpan)

            let costSpan = document.createElement("span");
            costSpan.classList.add("item-cost");
            costSpan.textContent = eggCost;
            eggTypeTitle.appendChild(costSpan);
        }

        return eggTypeTitle;
    }

    /**
     * @desc Creates and updates the percentage bar of egg stats
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
                let itemsPercentage = this.__internal__getItemPercentage(statsData, item.short, i);
                spanRarity.textContent = `${itemsPercentage}%`;
                spanRarity.style.width = `${itemsPercentage}%`;
            }
        }
        return statsBar;
    }

    /**
     * @desc Calculate the percentage of items per rarity in relation to the total items
     *
     * @param {Object} stats: An object containing the egg stats
     * @param {string} short: The short type name of the egg, corresponding to a key in the `stats` object
     * @param {Number} rarity: The rarity level, corresponding to a key in the `itemsPerRarity` sub-object in the `stats` object
     * @return {string} The calculated percentage, a float with two decimal places
     */
    static __internal__getItemPercentage(stats, short, rarity) {
        if (stats[short].itemsPerRarity[rarity] > 0) {
            return (stats[short].itemsPerRarity[rarity] / stats[short]["total"] * 100).toFixed();
        }
        return "0";
    }

    /**
     * @desc Sets the stats settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        let created_since = new Date().toISOString();
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StatsEgg, {
            "id": "egg",
            "time": created_since,
            "c": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null], "rarity": 1},
            "d": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 2},
            "r": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 3},
            "re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0], "rarity": 4},
        });
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StatsShell, {
            "id": "shell",
            "time": created_since,
            "coquille_c": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null], "rarity": 1},
            "coquille_d": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 2},
            "coquille_r": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 3},
            "coquille_re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0], "rarity": 4},
        });
    }
}