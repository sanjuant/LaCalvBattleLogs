/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

class BattleLogsStats {
    // Aliases on the other classes
    static Roues = BattleLogsStatsRoues;
    static Stuffs = BattleLogsStatsStuffs;
    static Account = BattleLogsStatsAccount;

    static Settings = {
        StatsEnable: "Stats-Enable",
        StatsRoues: "Stats-Roues",
        StatsStuffs: "Stats-Stuffs",
        StatsAccount: "Stats-Account",
        StatsPanes: "Stats-Panes",
        Type: "Stats"
    }

    static Messages = {
        since: "(depuis le {0})",
    };

    static NotUpdateAttributes = ["id", "time"]

    static StatsPanel;
    static StatsPanes;

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
            this.__internal__statsButton = BattleLogs.Menu.createMenuButton(
                this.Settings.Type,
                this.Settings.StatsEnable,
                "svg_stats",
                this.StatsPanel,
                "Afficher les Stats",
                "Masquer les Stats"
            )
            // Set default settings
            this.__internal__setDefaultSettingsValues(this.Settings.StatsPanes)
            this.Roues.setDefaultSettingsValues(this.Settings.StatsRoues)
            this.Stuffs.setDefaultSettingsValues(this.Settings.StatsStuffs)
            this.Account.setDefaultSettingsValues(this.Settings.StatsAccount)

            // Restore previous session state
            this.StatsPanes = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsPanes);
            this.Stuffs.Filters = BattleLogs.Utils.LocalStorage.getComplexValue(this.Stuffs.Settings.StuffsFilters);
            this.Roues.Data = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsRoues);
            // this.Stuffs.Data = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsStuffs);
            this.Stuffs.Data = this.Stuffs.loadAndCompareStuffsWithModel();
            this.Account.Data = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsAccount);
        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            while (true) {
                if (BattleLogs.Shop.hasLoaded() && BattleLogs.Roues.hasLoaded() && BattleLogs.Load.hasLoaded()) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1 seconde (ajustez selon vos besoins)
            }
            this.Account.createStatsPanes()
            this.Roues.createStatsPanes()
            this.Stuffs.createStatsPanes()
        }
    }

    /**
     * @desc Creates a pane element to display object stats.
     *
     * @param {Object} objectData: Contains data for the object, must include an 'id' property.
     * @param {String} statsName: Name of the statistic.
     * @param {boolean} since: Display date for stats.
     * @param {boolean} reset: Display reset button.
     *
     * @returns {HTMLElement} The pane element containing the object's statistics.
     */
    static createPane(objectData, statsName, since=true, reset=true) {
        let statsType = objectData.id;

        // Build pane for object stats
        const paneElement = document.createElement("div");
        paneElement.id = `${this.Settings.Type}-${statsType}`;
        paneElement.dataset["key"] = objectData.id

        // Build header
        const paneHeader = document.createElement("div");
        paneHeader.classList.add(`stats-title`)
        const formattedDate = this.formatStatsDate(objectData);

        // Create title left part of header
        let paneHeaderTitle = document.createElement("span");
        paneHeaderTitle.textContent = this[statsName].Messages[statsType].name;
        paneHeaderTitle.classList.add("stats-title-name");

        // Create right part of header
        let paneHeaderRight = document.createElement("div");
        paneHeaderRight.classList.add("stats-title-right");

        // Create date right part of header
        let paneHeaderDate = document.createElement("span");
        paneHeaderDate.classList.add("stats-title-date");
        if (since) {
            let sinceSpan = document.createElement("span");
            sinceSpan.textContent = this.Messages.since.format(formattedDate);
            sinceSpan.dataset["key"] = "time"
            paneHeaderDate.appendChild(sinceSpan)
        }

        if (reset) {
            // Add clear button
            this.__internal__addClearButton(
                objectData,
                paneHeaderDate,
                statsName,
                this[statsName].resetStats.bind(this[statsName])
            );
        }

        // Create Collapse/Expand button for the pane
        const paneCollapseButton = document.createElement("button");
        paneCollapseButton.classList.add("svg_chevron-down");
        paneCollapseButton.title = "Déplier les stats";

        paneHeader.appendChild(paneHeaderTitle);
        paneHeaderRight.appendChild(paneHeaderDate);
        paneHeaderRight.appendChild(paneCollapseButton);
        paneHeader.appendChild(paneHeaderRight);
        paneElement.appendChild(paneHeader);

        // Create body
        const paneBody = document.createElement("div");
        paneBody.classList.add("stats-body");

        // Initially hide the pane body
        if (!BattleLogs.Stats.StatsPanes[objectData.id]) {
            paneBody.style.display = "none";
        }
        paneCollapseButton.addEventListener('click', () => {
            this.toggleElementDisplay(
                objectData.id,
                paneBody,
                paneCollapseButton,
                "svg_chevron-up",
                "svg_chevron-down",
                "Réduire les stats",
                "Déplier les stats"
            );
        });


        paneElement.appendChild(paneBody);

        return paneElement;
    }

    /**
     * Reset selected status and update elements accordingly
     */
    static resetSelected() {
        BattleLogs.Menu.resetSelected(this.__internal__statsButton, this.StatsPanel, "Afficher les Stats");
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

    /**
     * @desc Return date in string format for stats
     *
     * @param {Object} objectData: Data of stat
     * @param {boolean} includeTime: Whether to include the time in the returned string
     * @param {boolean} useUpdateTime: Use update time instead create
     * @return {string} Date formatted in string
     */
    static formatStatsDate(objectData, includeTime = true, useUpdateTime= false) {
        let created_since;
        if (useUpdateTime) {
            created_since = BattleLogs.Utils.getDateObject(objectData["update"]);
        } else {
            created_since = BattleLogs.Utils.getDateObject(objectData["time"]);
        }
        let dateString = `${created_since.getDate().toString().padZero()}/${(created_since.getMonth() + 1).toString().padZero()}/${created_since.getFullYear().toString().substring(-2)}`;

        if (includeTime) {
            dateString += ` - ${created_since.getHours().toString().padZero()}h${created_since.getMinutes().toString().padZero()}`;
        }

        return dateString;
    }

    /**
     * @desc Toggles the display of a given HTML element and updates the SVG and title of the button.
     *
     * @param {string} id: Id of stats to toggle.
     * @param {Element} element: The HTML element to toggle.
     * @param {Element} button: The button that triggers the toggle and gets its SVG and title updated.
     * @param {String} showSvgClass: The SVG class to apply when the element is shown.
     * @param {String} hideSvgClass: The SVG class to apply when the element is hidden.
     * @param {String} showText: The text to display when the element is shown.
     * @param {String} hideText: The text to display when the element is hidden.
     */
    static toggleElementDisplay(id, element, button, showSvgClass, hideSvgClass, showText, hideText) {
        if (element.style.display === "none") {
            // If element is hidden, show it
            element.style.removeProperty("display");
            button.classList.replace(hideSvgClass, showSvgClass);
            button.title = showText;
            this.StatsPanes[id] = true
            BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StatsPanes, this.StatsPanes)
        } else {
            // If element is visible, hide it
            element.style.display = "none";
            button.classList.replace(showSvgClass, hideSvgClass);
            button.title = hideText;
            this.StatsPanes[id] = false
            BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StatsPanes, this.StatsPanes)
        }
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
        this.StatsPanel.classList.add("stats", "unlocked");
        if (!(BattleLogs.Utils.LocalStorage.getValue(this.Settings.StatsEnable) === "true")) {
            this.StatsPanel.classList.add("hidden")
        }
        // Add Stats panel to DOM
        BattleLogs.Menu.BattleLogsWrapper.appendChild(this.StatsPanel);
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
                resetStats(statsData.id)
            }
        };

        containingDiv.appendChild(resetButton);
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StatsPanes, {});
    }
}