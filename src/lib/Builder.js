/**
 * @class The BattleLogsBuilder regroups the builder functionalities
 */

class BattleLogsBuilder {

    static Settings = {
        BuilderEnable: "Builder_Enable",
        BuilderPanes: "Builder-Panes",
        Type: "Builder"
    }

    static NotUpdateAttributes = ["id", "time"]

    static BuilderPanel;
    static BuilderPanes;

    static cachedLevel = 1;
    static STATS_TABLE = {
        force: null,
        esquive: null,
        'vitalité': null,
        vitesse: null,
        setMultiplier: 3,
        levelMultiplier: {
            1: 1,
            2: 1.05,
            3: 1.1,
            4: 1.15,
            5: 1.20,
            6: 1.25,
            7: 1.30,
            8: 1.35,
            9: 1.40,
            10: 1.45,
            11: 1.50,
            12: 1.55,
            13: 1.60,
            14: 1.65,
            15: 1.70,
        },
};

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
            this.__internal__addStatsButton(this.Settings.BuilderEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            this.__internal__computeAllStats();

        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            while (true) {
                if (BattleLogs.Load.hasLoaded()) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1 seconde (ajustez selon vos besoins)
            }
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
        if (this.__internal__builderButton) {
            BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
            BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
            this.BuilderPanel.classList.add("hidden");
            this.__internal__builderButton.classList.remove("selected");
            this.__internal__builderButton.title = "Afficher les stats";
            BattleLogs.Utils.LocalStorage.setValue(this.__internal__builderButton.id, "false");
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
            this.BuilderPanes[id] = true
            BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StatsPanes, this.BuilderPanes)
        } else {
            // If element is visible, hide it
            element.style.display = "none";
            button.classList.replace(showSvgClass, hideSvgClass);
            button.title = hideText;
            this.BuilderPanes[id] = false
            BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StatsPanes, this.BuilderPanes)
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__builderButton;

    static __internal__computeAllStats() {
        const MODES = [
            {
                name: 'force',
                min: -201,
                max: 201,
            },
            {
                name: 'esquive',
                min: -201,
                max: 201,
            },
            {
                name: 'vitesse',
                min: -201,
                max: 201,
            },
            {
                name: 'vitalité',
                min: -201,
                max: 201,
            },
        ];
    
    
        for (const entry in MODES) {
            STATS_TABLE[MODES[entry].name] = {};
    
            const min = MODES[entry].min;
            const max = MODES[entry].max;
    
            const extra = 20;
            const accA = 250, accB = 250;
    
            for (let seed = min; seed <= max; seed++) {
                const loc = [];
                for (let i = 0; i < 3000; i++) {
                    loc.push(Math.ceil(seed + ((seed * ((i - 1) ^ (0.9 + (accA / 250))) * i * (i + 1)) / (6 + (((i ^ 2) / 50) / accB) + ((i - 1) * extra))) / (seed + 1) + (i * seed / 4)));
                }
                STATS_TABLE[MODES[entry].name][seed] = loc;
            }
        }
    }

    /**
     * @desc Adds the BattleLogs panel
     */
    static __internal__addStatsPanel() {
        // Add settings container
        this.BuilderPanel = document.createElement("div");
        this.BuilderPanel.id = "battlelogs-builder_panel";
        this.BuilderPanel.classList.add("builder", "unlocked");
        if (!(BattleLogs.Utils.LocalStorage.getValue(this.Settings.BuilderEnable) === "true")) {
            this.BuilderPanel.classList.add("hidden")
        }
        // Add Stats panel to DOM
        BattleLogs.Menu.BattleLogsWrapper.appendChild(this.BuilderPanel);
    }

    /**
     * @desc Internal method to create and set up the stats button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addBuilderButton(id, containingDiv) {
        // Add messages container to battle logs menu
        this.__internal__builderButton = document.createElement("button");
        this.__internal__builderButton.id = id;
        this.__internal__builderButton.classList.add("svg_builder");

        let inBuilder = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (inBuilder) {
            BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
            BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
            this.__internal__builderButton.classList.add("selected");
            this.__internal__builderButton.title = "Masquer le builder";
        } else {
            this.__internal__builderButton.title = "Afficher le builder";
        }
        this.__internal__builderButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                BattleLogs.Message.resetSelectedSettings()
                BattleLogs.Glossary.resetSelected()
                BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
                this.BuilderPanel.classList.remove("hidden");
                this.__internal__builderButton.classList.add("selected");
                this.__internal__builderButton.title = "Masquer le builder";
            } else {
                BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
                this.BuilderPanel.classList.add("hidden")
                this.__internal__builderButton.classList.remove("selected");
                this.__internal__builderButton.title = "Afficher le builder";
                BattleLogs.Menu.BattleLogsWrapper.scrollTop = BattleLogs.Menu.BattleLogsWrapper.scrollHeight;
            }

            BattleLogs.Utils.LocalStorage.setValue(this.__internal__builderButton.id, newStatus);
        };

        containingDiv.appendChild(this.__internal__builderButton);
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.BuilderPanes, {});
    }
}