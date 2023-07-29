/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

class BattleLogsStats {
    static Settings = {
        StatsEnable: "Stats-Enable",
        StatsEgg: "Stats-Egg",
        Type: "Stats"
    }

    static StatsPanel;
    static StatsButton;
    static StatsEggPanel;

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            // Add CSV button
            this.__internal__addStatsPanel()
            this.__internal__addStatsButton(this.Settings.StatsEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);

            // Set default settings
            this.__internal__setDefaultSettingsValues()
            // Restore previous session state
            this.__internal__statsEgg = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsEgg);
            this.__internal__buildStatsEggOutput()
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
            this.__internal__updateStatsEggOutput();
        }

    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__statsEgg = null;
    static __internal__eggTypes = {
        "c": {"short": "c", "name": "oeufs chevelus", "rarity": 1},
        "d": {"short": "d", "name": "oeufs dégarnis", "rarity": 2},
        "r": {"short": "r", "name": "oeufs rasés", "rarity": 3},
        "re": {"short": "re", "name": "oeufs reluisants", "rarity": 4}
    };

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
                this.__internal__updateStatsEggOutput();
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
    static __internal__buildStatsEggOutput() {
        if (this.StatsButton.classList.contains("selected")) {
            // Build Panel for egg stats
            this.StatsEggPanel = document.createElement("div");
            this.StatsEggPanel.id = `${this.Settings.Type}-${this.__internal__statsEgg.id}`;

            const statsTitle = document.createElement("div");
            statsTitle.classList.add("stats-title")
            let created_since = BattleLogs.Utils.getDateObject(this.__internal__statsEgg["time"]);

            const formattedDate = `${created_since.getDate().toString().padZero()}/${(created_since.getMonth() + 1).toString().padZero()}/${created_since.getFullYear().toString().substring(-2)} - ${created_since.getHours().toString().padZero()}h${created_since.getMinutes().toString().padZero()}`;
            // statsTitle.textContent = ` (depuis le ${formattedDate})`;
            let statsTitleNameSpan = document.createElement("span");
            statsTitleNameSpan.textContent = "Stats des oeufs";
            statsTitleNameSpan.classList.add("stats-title-name");
            let statsTitleDateSpan = document.createElement("span");
            statsTitleDateSpan.textContent = ` (depuis le ${formattedDate})`;
            statsTitleDateSpan.classList.add("stats-title-date");
            statsTitle.appendChild(statsTitleNameSpan);
            statsTitle.appendChild(statsTitleDateSpan);
            this.StatsEggPanel.appendChild(statsTitle);

            // Build div for each type of egg
            Object.keys(this.__internal__eggTypes).forEach((key) => {
                let type = this.__internal__eggTypes[key];
                let eggTypeDiv = document.createElement("div");
                eggTypeDiv.classList.add("stats-egg-block")
                let eggTypeTitle = document.createElement("div");
                eggTypeTitle.classList.add("stats-egg-title");
                eggTypeTitle.classList.add(`rarity-${type.rarity}`);
                eggTypeTitle.dataset.egg = type.short;

                eggTypeTitle = this.__internal__createOrUpdateEggTitle(eggTypeTitle, type.short);
                eggTypeDiv.appendChild(eggTypeTitle);

                // Create percentage bar for each rarity
                let eggTypeStatBar = document.createElement("div");
                eggTypeStatBar.classList.add("stats-bar");
                eggTypeStatBar.dataset.egg = type.short;

                eggTypeStatBar = this.__internal__createOrUpdateEggPercentageBar(eggTypeStatBar, type.short);
                eggTypeDiv.appendChild(eggTypeStatBar);

                this.StatsEggPanel.appendChild(eggTypeDiv);
            })
            this.StatsPanel.appendChild(this.StatsEggPanel);
        }
    }

    /**
     * @desc Update the output of egg stats
     */
    static __internal__updateStatsEggOutput() {
        if (document.getElementById(`${this.Settings.Type}-${this.__internal__statsEgg.id}`) !== null) {
            let eggTypesTitles = document.getElementsByClassName("stats-egg-title");

            // Update title for each type of egg
            for (let eggTypeTitle of eggTypesTitles) {
                let short = eggTypeTitle.getAttribute("data-egg");
                eggTypeTitle = this.__internal__createOrUpdateEggTitle(eggTypeTitle, short);

                // Update or create percentage bar for each rarity
                const statsBar = document.querySelector(`.stats-bar[data-egg="${short}"]`);
                if (statsBar) {
                    this.__internal__createOrUpdateEggPercentageBar(statsBar, short);
                }
            }
        } else {
            this.__internal__buildStatsEggOutput();
        }
    }

    /**
     * @desc Creates and updates the title of egg stats
     *
     * @param {Element} eggTypeTitle: The title element to update or create
     * @param {string} short: The abbreviation of egg type
     * @return {Element} The updated or created title element
     */
    static __internal__createOrUpdateEggTitle(eggTypeTitle, short) {
        let name;
        if (this.__internal__statsEgg[short]["total"] !== 0) {
            name = this.__internal__eggTypes[short].name;
        } else {
            name = this.__internal__eggTypes[short].name.split(" ");
            name = name[0].substring(0, name[0].length - 1) + " " + name[1].substring(0, name[1].length - 1)
        }
        eggTypeTitle.innerHTML = `${this.__internal__statsEgg[short]["total"]} <span class="item-name">${name}</span> - ${this.__internal__statsEgg[short]["cost"]} alopièces dépensées`;
        return eggTypeTitle;
    }

    /**
     * @desc Creates and updates the percentage bar of egg stats
     *
     * @param {Element} statsBar: The stats bar element to update or create
     * @param {string} short: The abbreviation of egg type
     * @return {Element} The updated or created stats bar element
     */
    static __internal__createOrUpdateEggPercentageBar(statsBar, short) {
        for (let i = 0; i < this.__internal__statsEgg[short].itemsPerRarity.length; i++) {
            if (this.__internal__statsEgg[short].itemsPerRarity[i] !== null && this.__internal__statsEgg[short].itemsPerRarity[i] > 0) {
                let spanRarity = statsBar.querySelector(`span[data-rarity="${i.toString()}"]`);
                if (!spanRarity) {
                    spanRarity = document.createElement("span");
                    spanRarity.classList.add(`bar-rarity-${i}`);
                    spanRarity.dataset.rarity = i.toString();
                    statsBar.appendChild(spanRarity);
                }
                let itemsPercentage = this.__internal__getItemPercentage(this.__internal__statsEgg, short, i.toString());
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
     * @param {string} rarity: The rarity level, corresponding to a key in the `itemsPerRarity` sub-object in the `stats` object
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
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StatsEgg, {
            "id": "Eggs",
            "time": new Date().toISOString(),
            "c": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null]},
            "d": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0]},
            "r": {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0]},
            "re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0]},
        });
    }
}