/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

class BattleLogsStats {
    static Settings = {
        StatsEnable: "Stats-Enable",
        StatsEgg: "Stats-Egg",
        StatsShell: "Stats-Shell",
        StatsRoues: "Stats-Roues",
        Type: "Stats"
    }

    static StatsPanel;
    static StatsButton;

    static Messages = {
        egg: {
            name: "Stats des oeufs",
            title: "{0} <span class='item-name'>{1}</span>",
            cost: "{0} alopièce{1} dépensée{2}"
        },
        shell: {
            name: "Stats des coquilles",
            title: "{0} <span class='item-name'>{1}</span>",
            cost: "{0} coquille{1} utilisée{2}"
        },
        ticket: {
            name: "Stats des tickets",
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
            cost: "gratuit"
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
            this.__internal__statsData = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsRoues);
        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            while (true) {
                if (BattleLogs.Shop.hasLoaded() && BattleLogs.Roues.hasLoaded() && BattleLogs.Load.hasLoaded()) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1 seconde (ajustez selon vos besoins)
            }

            for (const key in this.__internal__statsData) {
                this.__internal__updateStatsEggOutput(this.__internal__statsData[key])
            }
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
    static updateStats(count, short, items, rouesType, cost) {
        const statsData = this.__internal__statsData[rouesType];
        statsData[short]["total"] += count;
        statsData[short]["cost"] += cost;
        items.forEach(item => {
            statsData[short].itemsPerRarity[item.rarity] += item.count;
        })
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsRoues, this.__internal__statsData);
        BattleLogs.Stats.__internal__updateStatsEggOutput(statsData);
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__statsData = null;

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
                // for (const key in this.__internal__statsData) {
                //     this.__internal__updateStatsEggOutput(this.__internal__statsData[key])
                // }
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
    static __internal__buildStatsEggOutput(statsData) {
        let statsType = statsData.id;

        // Build Panel for egg stats
        const divPanel = document.createElement("div");
        divPanel.id = `${this.Settings.Type}-${statsType}`;

        const statsTitle = document.createElement("div");
        statsTitle.classList.add(`stats-title`)
        let created_since = BattleLogs.Utils.getDateObject(statsData["time"]);
        const formattedDate = `${created_since.getDate().toString().padZero()}/${(created_since.getMonth() + 1).toString().padZero()}/${created_since.getFullYear().toString().substring(-2)} - ${created_since.getHours().toString().padZero()}h${created_since.getMinutes().toString().padZero()}`;
        let statsTitleNameSpan = document.createElement("span");
        statsTitleNameSpan.textContent = this.Messages[statsType].name;
        statsTitleNameSpan.classList.add("stats-title-name");
        let statsTitleDateSpan = document.createElement("span");
        statsTitleDateSpan.textContent = this.Messages.since.format(formattedDate);
        statsTitleDateSpan.classList.add("stats-title-date");
        statsTitle.appendChild(statsTitleNameSpan);
        statsTitle.appendChild(statsTitleDateSpan);
        divPanel.appendChild(statsTitle);

        // Build div for each type of egg
        Object.keys(statsData).forEach((key) => {
            let type = statsData[key];
            if (typeof type !== 'object') return;
            let object = BattleLogs.Utils.getObjectByShortName(key);
            let roueTypeDiv = document.createElement("div");
            roueTypeDiv.classList.add(`stats-block`)
            let roueTypeTitle = document.createElement("div");
            roueTypeTitle.classList.add(`stats-subtitle`);
            roueTypeTitle.classList.add(`rarity-${type.rarity}`);
            roueTypeTitle.dataset[statsType] = object.short;

            roueTypeTitle = this.__internal__createOrUpdateEggTitle(statsData, statsType, roueTypeTitle, object);
            roueTypeDiv.appendChild(roueTypeTitle);

            // Create percentage bar for each rarity
            let roueTypeStatBar = document.createElement("div");
            roueTypeStatBar.classList.add("stats-bar");
            roueTypeStatBar.dataset[statsType] = object.short;

            roueTypeStatBar = this.__internal__createOrUpdatePercentageBar(statsData, roueTypeStatBar, object);
            roueTypeDiv.appendChild(roueTypeStatBar);

            divPanel.appendChild(roueTypeDiv);
        })
        this.StatsPanel.appendChild(divPanel);
    }

    /**
     * @desc Update the output of egg stats
     *
     * @param {Object} statsData: Data of stat
     */
    static __internal__updateStatsEggOutput(statsData) {
        let statsType = statsData.id;
        let statsDiv = document.getElementById(`${this.Settings.Type}-${statsType}`);
        if (statsDiv !== null) {
            let roueTypeSubtitles = statsDiv.getElementsByClassName(`stats-subtitle`);
            // Update title for each type of egg
            for (let roueTypeSubtitle of roueTypeSubtitles) {
                let short = roueTypeSubtitle.getAttribute(`data-${statsType}`);
                let object = BattleLogs.Utils.getObjectByShortName(short);
                roueTypeSubtitle = this.__internal__createOrUpdateEggTitle(statsData, statsType, roueTypeSubtitle, object);

                // Update or create percentage bar for each rarity
                const statsBar = document.querySelector(`.stats-bar[data-${statsType}="${short}"]`);
                this.__internal__createOrUpdatePercentageBar(statsData, statsBar, object);
            }
        } else {
            this.__internal__buildStatsEggOutput(statsData);
        }
    }

    /**
     * @desc Creates and updates the title of egg stats
     *
     * @param {Object} statsData: The data of stats to update
     * @param {string} statsType: Type of stat
     * @param {Element} roueTypeTitle: The title element to update or create
     * @param {Object} item: Item object
     * @return {Element} The updated or created title element
     */
    static __internal__createOrUpdateEggTitle(statsData, statsType, roueTypeTitle, item) {
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
        let cost = statsData[item.short].cost;
        let costFormatted = BattleLogs.Utils.formatNumber(cost);
        let roueCost = this.Messages[statsType].cost.format(costFormatted, cost > 1 ? 's' : '', cost > 1 ? 's' : '');

        if (roueTypeTitle.childElementCount !== 0) {
            roueTypeTitle.children[0].firstChild.textContent = `${total} `;
            roueTypeTitle.children[0].querySelector("span").textContent = name;
            const lastChild = roueTypeTitle.children[0].lastChild
            if (lastChild.textContent.startsWith(' ') && total > 1) {
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
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StatsRoues, {
            "oeuf": {
                "id": "egg",
                "time": created_since,
                "c": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null], "rarity": 1},
                "d": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 2},
                "r": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 3},
                "re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0], "rarity": 4},
            },
            "coquille": {
                "id": "shell",
                "time": created_since,
                "c": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null], "rarity": 1},
                "d": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 2},
                "r": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 3},
                "re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0], "rarity": 4},
            },
            "ticket": {
                "id": "ticket",
                "time": created_since,
                "ticket": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0], "rarity": 0},
            },
        });
    }
}