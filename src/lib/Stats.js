/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

class BattleLogsStats {
    static Settings = {
        StatsEnable: "Stats-Enable",
        StatsRoues: "Stats-Roues",
        StatsStuffs: "Stats-Stuffs",
        Type: "Stats"
    }

    static StatsPanel;
    static StatsButton;

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
        stuffs: {
            name: "Stats des stuffs",
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
            cost: "premium"
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
            this.__internal__statsRouesData = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsRoues);
            this.__internal__statsStuffsData = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.StatsStuffs);
        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            while (true) {
                if (BattleLogs.Shop.hasLoaded() && BattleLogs.Roues.hasLoaded() && BattleLogs.Load.hasLoaded()) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1 seconde (ajustez selon vos besoins)
            }

            for (const key in this.__internal__statsRouesData) {
                this.__internal__updateStatsRouesOutput(this.__internal__statsRouesData[key])
            }
            this.__internal__updateStatsStuffsOutput(this.__internal__statsStuffsData)
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
     * @desc Update roues stats
     *
     * @param {Number} count: Count of roue
     * @param {string} short: Short name of roue
     * @param {Array} items: Array of items
     * @param {string} rouesType: Type of roue
     * @param {Number} cost: price of a roue
     *
     */
    static updateStats(count, short, items, rouesType, cost) {
        const statsData = this.__internal__statsRouesData[rouesType];
        statsData[short]["total"] += count;
        statsData[short]["cost"] += cost;
        items.forEach(item => {
            statsData[short].itemsPerRarity[item.rarity] += item.count;
        })
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsRoues, this.__internal__statsRouesData);
        BattleLogs.Stats.__internal__updateStatsRouesOutput(statsData);
    }

    static updateStatsStuffs(stuff, user, opponent=null) {
        const stuffHash = this.__internal__createStuffHash(stuff)
        let stuffData = this.__internal__statsStuffsData.stuffs[stuffHash]
        if (!stuffData) {
            stuffData = {
                "time": new Date().toISOString(),
                "update": new Date().toISOString(),
                "slot": stuff.slot,
                "name": stuff.name,
                "loadout": {
                    "arme": stuff.arme,
                    "calv": stuff.calv,
                    "items": stuff.items,
                    "famAtk": stuff.famAtk,
                    "famDef": stuff.famDef
                },
                "wb": {},
                "battle": {
                    "dmgMax": user.dmgTotal,
                    "dmgMin": user.dmgTotal,
                    "dmgTotal": 0,
                    "dmgAverage": 0,
                    "battleCount": 0
                },
            }
            this.__internal__statsStuffsData.stuffs[stuffHash] = stuffData;
        }
        if (opponent) {
            const wbHash = opponent.name.hashCode();
            let wbData = stuffData.wb[wbHash];
            if (!wbData) {
                wbData = {
                    "name": opponent.name,
                    "dmgMax": user.dmgTotal,
                    "dmgMin": user.dmgTotal,
                    "dmgTotal": 0,
                    "dmgAverage": 0,
                    "battleCount": 0
                }
                stuffData.wb[wbHash] = wbData;
            }
            wbData.dmgMax = wbData.dmgMax > user.dmgTotal ? wbData.dmgMax : user.dmgTotal;
            wbData.dmgMin = wbData.dmgMin < user.dmgTotal ? wbData.dmgMin : user.dmgTotal;
            wbData.battleCount += 1;
            wbData.dmgTotal += user.dmgTotal;
            wbData.dmgAverage += Math.round(wbData.dmgTotal / wbData.battleCount);
        }
        stuffData.updated_at = new Date().toISOString();
        stuffData.battle.dmgMax = stuffData.battle.dmgMax > user.dmgTotal ? stuffData.battle.dmgMax : user.dmgTotal;
        stuffData.battle.dmgMin = stuffData.battle.dmgMin < user.dmgTotal ? stuffData.battle.dmgMin : user.dmgTotal;
        stuffData.battle.battleCount += 1;
        stuffData.battle.dmgTotal += user.dmgTotal;
        stuffData.battle.dmgAverage = Math.round(stuffData.battle.dmgTotal / stuffData.battle.battleCount);
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, this.__internal__statsStuffsData);
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/
        // TODO: Supprimer les stuffs qui ont un total de combats inférieur à 10 depuis +24h
        // TODO: Afficher les 50 premiers stuffs
        // TODO: Limiter le nombre de stuffs à 100 (marge de 50 pour la période de 24h) en supprimant les stuffs qui ont le moins de combats et qui sont les plus vieux

    static __internal__statsRouesData = null;
    static __internal__statsStuffsData = null;

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
     * @desc Build the output of roue stats
     */
    static __internal__buildStatsRouesOutput(statsData) {
        console.log(statsData)
        let statsType = statsData.id;

        // Build Panel for roue stats
        const divPanel = document.createElement("div");
        divPanel.id = `${this.Settings.Type}-${statsType}`;

        const statsTitle = document.createElement("div");
        statsTitle.classList.add(`stats-title`)
        const formattedDate = this.__internal__formatStatsDate(statsData);
        let statsTitleNameSpan = document.createElement("span");
        statsTitleNameSpan.textContent = this.Messages[statsType].name;
        statsTitleNameSpan.classList.add("stats-title-name");
        let statsTitleDateSpan = document.createElement("span");
        statsTitleDateSpan.classList.add("stats-title-date");
        let sinceSpan = document.createElement("span");
        sinceSpan.textContent = this.Messages.since.format(formattedDate);
        statsTitleDateSpan.appendChild(sinceSpan)
        this.__internal__addClearButton(statsData.id, statsTitleDateSpan)
        statsTitle.appendChild(statsTitleNameSpan);
        statsTitle.appendChild(statsTitleDateSpan);
        divPanel.appendChild(statsTitle);

        // Build div for each type of roue
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

            roueTypeTitle = this.__internal__createOrUpdateRouesTitle(statsData, statsType, roueTypeTitle, object);
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
     * @desc Build the output of roue stats
     */
    static __internal__buildStatsStuffsOutput(stuffsData) {
        let statsType = stuffsData.id;

        // Build Panel for roue stats
        const divPanel = document.createElement("div");
        divPanel.id = `${this.Settings.Type}-${statsType}`;

        const statsTitle = document.createElement("div");
        statsTitle.classList.add(`stats-title`)
        const formattedDate = this.__internal__formatStatsDate(stuffsData);
        let statsTitleNameSpan = document.createElement("span");
        statsTitleNameSpan.textContent = this.Messages[statsType].name;
        statsTitleNameSpan.classList.add("stats-title-name");
        let statsTitleDateSpan = document.createElement("span");
        statsTitleDateSpan.classList.add("stats-title-date");
        let sinceSpan = document.createElement("span");
        sinceSpan.textContent = this.Messages.since.format(formattedDate);
        statsTitleDateSpan.appendChild(sinceSpan)
        this.__internal__addClearButton(stuffsData.id, statsTitleDateSpan)
        statsTitle.appendChild(statsTitleNameSpan);
        statsTitle.appendChild(statsTitleDateSpan);
        divPanel.appendChild(statsTitle);
        const statsStuffsContainer = document.createElement("div");
        statsStuffsContainer.classList.add("stats-stuffs-container")
        divPanel.appendChild(statsStuffsContainer);

        // Build div for each stuff
        Object.keys(stuffsData.stuffs).forEach((key) => {
            const stuffData = stuffsData.stuffs[key]
            this.__internal__createOrUpdateStuff(stuffData, statsStuffsContainer)
        })
        this.StatsPanel.appendChild(divPanel);
    }

    /**
     * @desc Creates and updates the stuff element
     *
     * @param {Object} stuffData: The data of stuff to update
     * @param {Element} stuffsElement: The title element to update or create
     * @return {Element} The updated or created title element
     */
    static __internal__createOrUpdateStuff(stuffData, stuffsElement) {
        // Create container
        const stuffContainerDiv = document.createElement("div");
        stuffContainerDiv.classList.add("stats-stuff");

        // Create header
        const stuffHeader = document.createElement("div");
        stuffHeader.classList.add("stats-stuff-header");

        // Create div for left elements
        const headerLeft = document.createElement("div");
        const headerTitleSpan = document.createElement("span");
        headerTitleSpan.textContent = stuffData.name;
        headerLeft.appendChild(headerTitleSpan);
        const headerTitleButton = document.createElement("button");
        headerTitleButton.textContent = "Éditer";
        headerLeft.appendChild(headerTitleButton);
        stuffHeader.appendChild(headerLeft);

        // Create div for right elements
        const headerRight = document.createElement("div");
        const headerDate = document.createElement("span");
        headerDate.textContent = this.__internal__formatStatsDate(stuffData);
        headerRight.appendChild(headerDate);
        const headerAction = document.createElement("button");
        headerAction.textContent = "Supprimer";
        headerRight.appendChild(headerAction);
        stuffHeader.appendChild(headerRight);

        // Append header to container
        stuffContainerDiv.appendChild(stuffHeader);

        // Create body
        const stuffBody = document.createElement("div");
        stuffBody.classList.add("stats-stuff-body");
        // Create loadout container
        const loadoutContainer = document.createElement("div");
        loadoutContainer.classList.add("stuff-body-loadout");
        this.__internal__appendStuffData(stuffData.loadout, loadoutContainer)
        stuffBody.appendChild(loadoutContainer)

        // Create battle stats container
        const battleContainer = document.createElement("div");
        battleContainer.classList.add("stuff-body-battle");
        this.__internal__appendStuffData(stuffData.battle, battleContainer)
        stuffBody.appendChild(battleContainer)

        // Append body to container
        stuffContainerDiv.appendChild(stuffBody);
        stuffsElement.appendChild(stuffContainerDiv);
    }

    static __internal__appendStuffData(data, container) {
        for (const key in data) {
            const object = data[key];
            this.__internal__appendAttributes(object, key, container);
        }
    }

    static __internal__appendAttributes(object, key, container) {
        const attrContainer = document.createElement("div")
        attrContainer.classList.add(`loadout-${key}`)
        attrContainer.dataset["key"] = key
        if (Array.isArray(object)) {
            for (let item of object) {
                this.__internal__appendAttributes(item, key, container)
            }
        } else {
            const label = document.createElement("span");
            label.classList.add("key")
            label.textContent = key.capitalize();
            const name = document.createElement("span");
            name.classList.add("value")
            if (typeof object === 'object') {
                name.textContent = object.name;
                name.classList.add(`rarity-${object.rarity}`);
            } else {
                name.textContent = object;
            }

            attrContainer.appendChild(label)
            attrContainer.appendChild(name)
            container.appendChild(attrContainer)
        }
    }

    /**
     * @desc Update the output of roue stats
     *
     * @param {Object} statsData: Data of stat
     */
    static __internal__updateStatsRouesOutput(statsData) {
        let statsType = statsData.id;
        let statsDiv = document.getElementById(`${this.Settings.Type}-${statsType}`);
        if (statsDiv !== null) {
            let roueTypeSubtitles = statsDiv.getElementsByClassName(`stats-subtitle`);
            // Update title for each type of roue
            for (let roueTypeSubtitle of roueTypeSubtitles) {
                let short = roueTypeSubtitle.getAttribute(`data-${statsType}`);
                let object = BattleLogs.Utils.getObjectByShortName(short);
                roueTypeSubtitle = this.__internal__createOrUpdateRouesTitle(statsData, statsType, roueTypeSubtitle, object);

                // Update or create percentage bar for each rarity
                const statsBar = document.querySelector(`.stats-bar[data-${statsType}="${short}"]`);
                this.__internal__createOrUpdatePercentageBar(statsData, statsBar, object);
            }
        } else {
            this.__internal__buildStatsRouesOutput(statsData);
        }
    }

    /**
     * @desc Update the output of roue stats
     *
     * @param {Object} statsData: Data of stat
     */
    static __internal__updateStatsStuffsOutput(statsData) {
        let statsType = statsData.id;
        let statsDiv = document.getElementById(`${this.Settings.Type}-${statsType}`);
        if (statsDiv !== null) {
            let roueTypeSubtitles = statsDiv.getElementsByClassName(`stats-subtitle`);
            // Update title for each type of roue
            for (let roueTypeSubtitle of roueTypeSubtitles) {
                let short = roueTypeSubtitle.getAttribute(`data-${statsType}`);
                let object = BattleLogs.Utils.getObjectByShortName(short);
                roueTypeSubtitle = this.__internal__createOrUpdateRouesTitle(statsData, statsType, roueTypeSubtitle, object);

                // Update or create percentage bar for each rarity
                const statsBar = document.querySelector(`.stats-bar[data-${statsType}="${short}"]`);
                this.__internal__createOrUpdatePercentageBar(statsData, statsBar, object);
            }
        } else {
            this.__internal__buildStatsStuffsOutput(statsData);
        }
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
                let itemsPercentage = this.__internal__getItemPercentage(statsData, item.short, i);
                spanRarity.textContent = `${itemsPercentage}%`;
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
     * @desc Add button to reset stats
     *
     * @param {string} id: The button id (that will be used for the corresponding local storage item id as well)
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addClearButton(id, containingDiv) {
        const resetButton = document.createElement("button");
        resetButton.id = id;
        resetButton.classList.add("svg_reset");
        resetButton.title = "Remettre à zéro les stats";

        resetButton.onclick = () => {
            const confirmed = window.confirm("Tu vas remettre à zéro les stats sélectionnées, es-tu sûr ?");
            if (confirmed) {
                this.__internal__statsRouesData[id] = this.__internal__defaultStatsRoues[id];
                this.__internal__statsRouesData[id].time = new Date().toISOString();
                this.__internal__updateStatsRouesOutput(this.__internal__statsRouesData[id]);
                const dateSpan = document.querySelector(`#${this.Settings.Type}-${id} .stats-title-date span`)
                dateSpan.textContent = this.Messages.since.format(this.__internal__formatStatsDate(this.__internal__statsRouesData[id]));
                BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StatsRoues, this.__internal__statsRouesData);
            }
        };

        containingDiv.appendChild(resetButton);
    }

    /**
     * @desc Calculate the percentage of items per rarity in relation to the total items
     *
     * @param {Object} stats: An object containing the roue stats
     * @param {string} short: The short type name of the roue, corresponding to a key in the `stats` object
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
     * @desc Return date in string format for stats
     *
     * @param {Object} statsData: Data of stat
     * @return {string} Date formatted in string
     */
    static __internal__formatStatsDate(statsData) {
        let created_since = BattleLogs.Utils.getDateObject(statsData["time"]);
        return `${created_since.getDate().toString().padZero()}/${(created_since.getMonth() + 1).toString().padZero()}/${created_since.getFullYear().toString().substring(-2)} - ${created_since.getHours().toString().padZero()}h${created_since.getMinutes().toString().padZero()}`;
    }

    static __internal__createStuffHash(stuff) {
        // sort the "items" array
        stuff.items.sort();
        // concatenate the elements of the "items" array with the other attributes
        let concatenatedItems = stuff.arme + stuff.calv + stuff.items.join('') + stuff.famAtk + stuff.famDef;
        return concatenatedItems.hashCode()
    }

    /**
     * @desc Sets the stats settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StatsRoues, {
            "oeuf": this.__internal__defaultStatsRoues["oeuf"],
            "coquille": this.__internal__defaultStatsRoues["coquille"],
            "ticket": this.__internal__defaultStatsRoues["ticket"],
        });
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StatsStuffs, this.__internal__defaultStatsStuffs);
    }

    static __internal__defaultStatsRoues = {
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
        }
    }

    static __internal__defaultStatsStuffs = {
        "id": "stuffs",
        "time": new Date().toISOString(),
        "stuffs": {}
    }
}