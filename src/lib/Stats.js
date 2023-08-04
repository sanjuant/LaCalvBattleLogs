/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

class BattleLogsStats {
    // Aliases on the other classes
    static Roues = BattleLogsStatsRoues;
    static Stuffs = BattleLogsStatsStuffs;

    static Settings = {
        StatsEnable: "Stats-Enable",
        StatsRoues: "Stats-Roues",
        StatsStuffs: "Stats-Stuffs",
        Type: "Stats"
    }

    static Messages = {
        stuffs: {
            name: "Stats des stuffs",
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
            cost: "premium"
        },
        since: "(depuis le {0})",
    };

    static NotUpdateAttributes = ["id", "time"]

    static StatsPanel;

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static async initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Add separator
            BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            // Add panel
            this.__internal__addStatsPanel()
            // Add button
            this.__internal__addStatsButton(this.Settings.StatsEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);

            // Set default settings
            this.Roues.setDefaultSettingsValues(this.Settings.StatsRoues)
            this.Stuffs.setDefaultSettingsValues(this.Settings.StatsStuffs)

            // Restore previous session state
            this.Roues.Data = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsRoues);
            this.Stuffs.Data = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsStuffs);
        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            // while (true) {
            //     if (BattleLogs.Shop.hasLoaded() && BattleLogs.Roues.hasLoaded() && BattleLogs.Load.hasLoaded()) {
            //         break;
            //     }
            //     await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1 seconde (ajustez selon vos besoins)
            // }
            this.Roues.createStatsPanes()
            this.Stuffs.createStatsPanes()
        }
    }

    /**
     * @desc Creates a pane element to display object stats.
     *
     * @param {Object} objectData: Contains data for the object, must include an 'id' property.
     * @param {String} statsName: Name of the statistic.
     *
     * @returns {HTMLElement} The pane element containing the object's statistics.
     */
    static createPane(objectData, statsName) {
        let statsType = objectData.id;

        // Build pane for object stats
        const paneElement = document.createElement("div");
        paneElement.id = `${this.Settings.Type}-${statsType}`;
        paneElement.dataset["key"] = objectData.id

        // Build header
        const paneHeader = document.createElement("div");
        paneHeader.classList.add(`stats-title`)
        const formattedDate = this.__internal__formatStatsDate(objectData);

        // Create title left part of header
        let paneHeaderTitle = document.createElement("span");
        paneHeaderTitle.textContent = this[statsName].Messages[statsType].name;
        paneHeaderTitle.classList.add("stats-title-name");

        // Create date right part of header
        let paneHeaderDate = document.createElement("span");
        paneHeaderDate.classList.add("stats-title-date");
        let sinceSpan = document.createElement("span");
        sinceSpan.textContent = this.Messages.since.format(formattedDate);
        sinceSpan.dataset["key"] = "time"
        paneHeaderDate.appendChild(sinceSpan)

        // Add clear button
        this.__internal__addClearButton(
            objectData,
            paneHeaderDate,
            statsName,
            this[statsName].resetStats.bind(this[statsName])
        );

        paneHeader.appendChild(paneHeaderTitle);
        paneHeader.appendChild(paneHeaderDate);
        paneElement.appendChild(paneHeader);
        return paneElement;
    }


    /**
     * Reset selected status and update elements accordingly
     */
    static resetSelected() {
        if (this.__internal__statsButton) {
            BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
            BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
            this.StatsPanel.classList.add("hidden");
            this.__internal__statsButton.classList.remove("selected");
            this.__internal__statsButton.title = "Afficher les stats";
            BattleLogs.Utils.LocalStorage.setValue(this.__internal__statsButton.id, "false");
        }
    }

    /**
     * @desc Calculate the percentage of items per rarity in relation to the total items
     *
     * @param {Object} stats: An object containing the roue stats
     * @param {string} short: The short type name of the roue, corresponding to a key in the `stats` object
     * @param {Number} rarity: The rarity level, corresponding to a key in the `itemsPerRarity` sub-object in the `stats` object
     * @param {Number} fixation: Number of decimals expected (between 0-100)
     * @return {Number} The calculated percentage, a float with 2 decimals places
     */
    static getItemPercentage(stats, short, rarity, fixation = 2) {
        if (stats[short].itemsPerRarity[rarity] > 0) {
            return BattleLogs.Utils.roundToAny(stats[short].itemsPerRarity[rarity] / stats[short]["total"] * 100, fixation);
        }
        return 0;
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__statsButton;

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
     * @desc Internal method to create and set up the stats button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addStatsButton(id, containingDiv) {
        // Add messages container to battle logs menu
        this.__internal__statsButton = document.createElement("button");
        this.__internal__statsButton.id = id;
        this.__internal__statsButton.classList.add("svg_stats");

        let inStats = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (inStats) {
            BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
            BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
            this.__internal__statsButton.classList.add("selected");
            this.__internal__statsButton.title = "Masquer les stats";
        } else {
            this.__internal__statsButton.title = "Afficher les stats";
        }
        this.__internal__statsButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                BattleLogs.Message.resetSelectedSettings()
                BattleLogs.Glossary.resetSelected()
                BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
                this.StatsPanel.classList.remove("hidden");
                this.__internal__statsButton.classList.add("selected");
                this.__internal__statsButton.title = "Masquer les stats";
            } else {
                BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
                this.StatsPanel.classList.add("hidden")
                this.__internal__statsButton.classList.remove("selected");
                this.__internal__statsButton.title = "Afficher les stats";
                BattleLogs.Menu.BattleLogsWrapper.scrollTop = BattleLogs.Menu.BattleLogsWrapper.scrollHeight;
            }

            BattleLogs.Utils.LocalStorage.setValue(this.__internal__statsButton.id, newStatus);
        };

        containingDiv.appendChild(this.__internal__statsButton);
    }

    /**
     * @desc Add button to reset stats
     *
     * @param {Object} statsData: Data of stats
     * @param {Element} containingDiv: The div element to append the button to
     * @param {string} className: The class stats to clear
     * @param {Function} resetStats: internal method to call to update output
     */
    static __internal__addClearButton(statsData, containingDiv, className, resetStats) {
        const resetButton = document.createElement("button");
        resetButton.id = statsData.id;
        resetButton.classList.add("svg_reset");
        resetButton.title = "Remettre à zéro les stats";
        resetButton.dataset["class"] = className;
        resetButton.dataset["key"] = statsData.id;
        resetButton.onclick = () => {
            const confirmed = window.confirm("Tu vas remettre à zéro les stats sélectionnées, es-tu sûr ?");
            if (confirmed) {
                this[className].Data[statsData.id] = JSON.parse(JSON.stringify(this[className].__internal__defaultStats[statsData.id]));
                const newStatsData = this[className].Data[statsData.id]
                newStatsData.time = new Date().toISOString();
                resetStats(newStatsData.id)
                const dateSpan = document.querySelector(`#${this.Settings.Type}-${statsData.id} [data-key="time"]`)
                dateSpan.textContent = this.Messages.since.format(this.__internal__formatStatsDate(newStatsData));
                BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings[`Stats${className}`], this[className].Data);
            }
        };

        containingDiv.appendChild(resetButton);
    }


    /**
     * @desc Return date in string format for stats
     *
     * @param {Object} objectData: Data of stat
     * @return {string} Date formatted in string
     */
    static __internal__formatStatsDate(objectData) {
        let created_since = BattleLogs.Utils.getDateObject(objectData["time"]);
        return `${created_since.getDate().toString().padZero()}/${(created_since.getMonth() + 1).toString().padZero()}/${created_since.getFullYear().toString().substring(-2)} - ${created_since.getHours().toString().padZero()}h${created_since.getMinutes().toString().padZero()}`;
    }
}