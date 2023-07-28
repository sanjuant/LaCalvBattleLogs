/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

class BattleLogsStats {
    static Settings = {
        StatsEnable: "Stats-Enable",
        EggStats: "Egg-Stats",
    }

    static StatsPanel;
    static StatsButton;
    static EggStatsPanel;

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
            this.__internal__eggStats = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.EggStats);
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
    static updateEggStats(count, short, items, rouesType, cost) {
        if (rouesType === "oeuf") {
            this.__internal__eggStats[short]["total"] += count;
            this.__internal__eggStats[short]["cost"] += count * BattleLogsRoues.Multiplier * cost;
            items.forEach(item => {
                this.__internal__eggStats[short]["itemsPerRarity"][item["rarity"]] += item["count"];
            })
            BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.EggStats, this.__internal__eggStats);
            this.__internal__updateEggStatsOutput();
        }

    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__eggStats = null;
    static __internal__eggTypes = [
        {"short": "c", "name": "oeufs chevelus"},
        {"short": "d", "name": "oeufs dégarnis"},
        {"short": "r", "name": "oeufs rasés"},
        {"short": "re", "name": "oeufs reluisants"}
    ];

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
                this.__internal__updateEggStatsOutput();
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
     * @desc Sets the stats settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.EggStats, {
            "time" : new Date().toISOString(),
            "c" : {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, null]},
            "d" : {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0]},
            "r" : {"total": 0, "cost": 0, "itemsPerRarity": [0, 0, 0, 0, 0]},
            "re": {"total": 0, "cost": 0, "itemsPerRarity": [null, null, 0, 0, 0]},
        });
    }

    /**
     * @desc Build the output of egg stats
     */
    static __internal__BuildEggStatsOutput() {
        if (this.StatsButton.classList.contains("selected")) {

            // Build Panel for egg stats
            this.EggStatsPanel = document.createElement("div");
            this.EggStatsPanel.id = "Stats-1";

            const title_div = document.createElement("div");
            const title_span = document.createElement("span");
            let created_since = BattleLogs.Utils.getDateString(this.__internal__eggStats["time"]);
            title_span.textContent = "Stats des oeufs (depuis le {0})".format(created_since);
            title_div.appendChild(title_span);
            this.EggStatsPanel.appendChild(title_div);

            // Update title for each type of egg
            let eggStats_subdiv = document.createElement("div");
            this.__internal__eggTypes.forEach( type => {
                let eggStats_subdiv_title = document.createElement("div");
                eggStats_subdiv_title.classList.add("eggStats-title");
                eggStats_subdiv_title.dataset.egg = type.short;
                let subdiv_title_span = document.createElement("span");

                let name;
                if (this.__internal__eggStats[type.short]["total"] !== 0) {
                    name = type.name;
                }else{
                    name = type.name.split(" ");
                    name = name[0].substring(0, name[0].length - 1) + " " + name[1].substring(0, name[1].length - 1)
                }
                subdiv_title_span.innerHTML = "{0} <em>{1}</em> - {2} alopièces dépensées".format(
                    this.__internal__eggStats[type.short]["total"],
                    name,
                    this.__internal__eggStats[type.short]["cost"]
                );
                eggStats_subdiv_title.appendChild(subdiv_title_span);
                eggStats_subdiv.appendChild(eggStats_subdiv_title);
                
                // Update percentage bar for each rarity
                if (this.__internal__eggStats[type.short]["total"] !== 0) {
                    let eggStats_subdiv_content = document.createElement("div");
                    eggStats_subdiv_content.classList.add("eggStats-bar");
                    eggStats_subdiv_content.dataset.egg = type.short;
                    for (let i = 0; i < this.__internal__eggStats[type.short]["itemsPerRarity"].length; i++) {
                        if (this.__internal__eggStats[type.short]["itemsPerRarity"][i] !== null) {
                            let raritySpan = document.createElement("span");
                            let itemsPercentage = (this.__internal__eggStats[type.short]["itemsPerRarity"][i] / this.__internal__eggStats[type.short]["total"] * 100).toFixed(2);
                            itemsPercentage = itemsPercentage+"%";
                            raritySpan.textContent = itemsPercentage;
                            raritySpan.style.width = itemsPercentage;
                            raritySpan.classList.add("span-rarity-{0}".format(i));
                            raritySpan.dataset.rarity = i;
                            eggStats_subdiv_content.appendChild(raritySpan);
                        }
                    }
                    eggStats_subdiv.appendChild(eggStats_subdiv_content);
                }
            })
            this.EggStatsPanel.appendChild(eggStats_subdiv);
            this.StatsPanel.appendChild(this.EggStatsPanel);
        }
    }

    /**
     * @desc Update the output of egg stats
     */
    static __internal__updateEggStatsOutput() {
        if ( document.getElementById("Stats-1") !== null) {
            let statsTitle_divs = document.getElementsByClassName("eggStats-title");

            // Update title for each type of egg
            for ( let title_div of statsTitle_divs) {
                let short = title_div.getAttribute("data-egg");

                let name;
                if (this.__internal__eggStats[short]["total"] !== 0) {
                    name = this.__internal__eggTypes[short];
                }else{
                    name = this.__internal__eggTypes[short].split(" ");
                    name = name[0].substring(0, name[0].length - 1) + " " + name[1].substring(0, name[1].length - 1)
                }
                let title_span = title_div.getElementsByTagName("span");
                title_span[0].innerHTML = "{0} <em>{1}</em> - {2} alopièces dépensées".format(
                    this.__internal__eggStats[short]["total"],
                    name,
                    this.__internal__eggStats[short]["cost"]
                );
                
                // Update percentage bar for each rarity
                let statsBar_divs = document.getElementsByClassName("eggStats-bar");
                let statsBar_spans = statsBar_divs.getElementsByTagName("span");
                for (bar_span of statsBar_spans) {
                    let rarity = bar_span.getAttribute("data-rarity");
                    bar_span.textContent = this.__internal__eggStats[short].itemsPerRarity[rarity];
                    bar_span.style.width = this.__internal__eggStats[short].itemsPerRarity[rarity];
                };
            };
        } else {
            this.__internal__BuildEggStatsOutput();
        }
    }
}