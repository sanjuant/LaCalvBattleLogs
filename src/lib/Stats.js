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
    static __internal__eggTypes = [
        {"short": "c", "name": "oeufs chevelus", "rarity": 1},
        {"short": "d", "name": "oeufs dégarnis", "rarity": 2},
        {"short": "r", "name": "oeufs rasés", "rarity": 3},
        {"short": "re", "name": "oeufs reluisants", "rarity": 4}
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

    /**
     * @desc Build the output of egg stats
     */
    static __internal__BuildStatsEggOutput() {
        if (this.StatsButton.classList.contains("selected")) {

            // Build Panel for egg stats
            this.StatsEggPanel = document.createElement("div");
            this.StatsEggPanel.id = `${this.Settings.Type}-${this.__internal__statsEgg.id}`;

            const title_div = document.createElement("div");
            const title_span = document.createElement("span");
            let created_since = BattleLogs.Utils.getDateString(this.__internal__statsEgg["time"]);
            title_span.textContent = "Stats des oeufs (depuis le {0})".format(created_since);
            title_div.appendChild(title_span);
            this.StatsEggPanel.appendChild(title_div);

            // Update title for each type of egg
            let statsEgg_subdiv = document.createElement("div");
            this.__internal__eggTypes.forEach(type => {
                let statsEgg_subdiv_title = document.createElement("div");
                statsEgg_subdiv_title.classList.add("stats-egg-title");
                statsEgg_subdiv_title.classList.add(`rarity-${type.rarity}`);
                statsEgg_subdiv_title.dataset.egg = type.short;
                let subdiv_title_span = document.createElement("span");

                let name;
                if (this.__internal__statsEgg[type.short]["total"] !== 0) {
                    name = type.name;
                } else {
                    name = type.name.split(" ");
                    name = name[0].substring(0, name[0].length - 1) + " " + name[1].substring(0, name[1].length - 1)
                }
                subdiv_title_span.innerHTML = `${this.__internal__statsEgg[type.short]["total"]} <em>${name}</em> - ${this.__internal__statsEgg[type.short]["cost"]} alopièces dépensées`
                statsEgg_subdiv_title.appendChild(subdiv_title_span);
                statsEgg_subdiv.appendChild(statsEgg_subdiv_title);

                // Update percentage bar for each rarity
                if (this.__internal__statsEgg[type.short]["total"] !== 0) {
                    let statsEgg_subdiv_content = document.createElement("div");
                    statsEgg_subdiv_content.classList.add("stats-bar");
                    statsEgg_subdiv_content.dataset.egg = type.short;
                    for (let i = 0; i < this.__internal__statsEgg[type.short]["itemsPerRarity"].length; i++) {
                        if (this.__internal__statsEgg[type.short]["itemsPerRarity"][i] !== null) {
                            let raritySpan = document.createElement("span");
                            let itemsPercentage = (this.__internal__statsEgg[type.short]["itemsPerRarity"][i] / this.__internal__statsEgg[type.short]["total"] * 100).toFixed(2);
                            itemsPercentage = itemsPercentage + "%";
                            raritySpan.textContent = itemsPercentage;
                            raritySpan.style.width = itemsPercentage;
                            raritySpan.classList.add(`bar-rarity-${i}`);
                            raritySpan.dataset.rarity = i.toString();
                            statsEgg_subdiv_content.appendChild(raritySpan);
                        }
                    }
                    statsEgg_subdiv.appendChild(statsEgg_subdiv_content);
                }
            })
            this.StatsEggPanel.appendChild(statsEgg_subdiv);
            this.StatsPanel.appendChild(this.StatsEggPanel);
        }
    }

    /**
     * @desc Update the output of egg stats
     */
    static __internal__updateStatsEggOutput() {
        if (document.getElementById(`${this.Settings.Type}-${this.__internal__statsEgg.id}`) !== null) {
            let statsTitle_divs = document.getElementsByClassName("stats-egg-title");

            // Update title for each type of egg
            for (let title_div of statsTitle_divs) {
                let short = title_div.getAttribute("data-egg");

                let name;
                if (this.__internal__statsEgg[short]["total"] !== 0) {
                    name = this.__internal__eggTypes[short];
                } else {
                    name = this.__internal__eggTypes[short].split(" ");
                    name = name[0].substring(0, name[0].length - 1) + " " + name[1].substring(0, name[1].length - 1)
                }
                let title_span = title_div.getElementsByTagName("span");
                title_span[0].innerHTML = `${this.__internal__statsEgg[short]["total"]} <em>${name}</em> - ${this.__internal__statsEgg[short]["cost"]} alopièces dépensées`

                // Update percentage bar for each rarity
                let statsBar_divs = document.getElementsByClassName("stats-bar");
                let statsBar_spans = statsBar_divs.getElementsByTagName("span");
                for (bar_span of statsBar_spans) {
                    let rarity = bar_span.getAttribute("data-rarity");
                    bar_span.textContent = this.__internal__statsEgg[short].itemsPerRarity[rarity];
                    bar_span.style.width = this.__internal__statsEgg[short].itemsPerRarity[rarity];
                }
            }
        } else {
            this.__internal__BuildStatsEggOutput();
        }
    }
}