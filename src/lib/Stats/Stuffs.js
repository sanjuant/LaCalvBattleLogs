/**
 * @class The BattleLogsStatsRoues regroups functionality related to battle logs stuffs stats
 */
class BattleLogsStatsStuffs {
    static Settings = {
        StuffsFilters: "Stats-Stuffs-Filters",
        Type: "Stuffs",
    }

    static Messages = {
        stuffs: {
            name: "Stats des stuffs",
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
            cost: "premium"
        },
    };

    static Data;
    static Filters;

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
        } else {
            // Build div for each type of stuff
            Object.keys(statsData).forEach((key) => {
                if (!BattleLogs.Stats.NotUpdateAttributes.includes(key)) {
                    this.__internal__createStatPaneBlock(statsData, key, statPaneBody);
                }
            })
        }
    }

    /**
     * @desc Update stats of stuff
     *
     * @param {Object} stuff: stuff to update.
     * @param {Object} user: user object for battle stats
     * @param {Object} opponent: opponent object for battle wb stats
     */
    static updateStats(stuff, user, opponent = null) {
        const stuffHash = this.__internal__createStuffHash(stuff)
        let stuffData = this.Data["stuffs"].stuffs[stuffHash]
        if (!stuffData) {
            stuffData = this.__internal__createDefaultStuffDataObject(stuff, user)
            this.Data["stuffs"].stuffs[stuffHash] = stuffData;
        }
        if (opponent) {
            const wbHash = opponent.name.hashCode();
            let wbData = stuffData.wb[wbHash];
            if (!wbData) {
                wbData = this.__internal__createDefaultStuffWbDataObject(user, opponent)
                stuffData.wb[wbHash] = wbData;
            }
            wbData.dmgMax = wbData.dmgMax > user.dmgTotal ? wbData.dmgMax : user.dmgTotal;
            wbData.dmgMin = wbData.dmgMin < user.dmgTotal ? wbData.dmgMin : user.dmgTotal;
            wbData.battleCount += 1;
            wbData.dmgTotal += user.dmgTotal;
            wbData.dmgAverage = Math.round(wbData.dmgTotal / wbData.battleCount);
        }
        stuffData.name = stuff.name
        stuffData.update = new Date().toISOString();
        stuffData.battle.dmgMax = stuffData.battle.dmgMax > user.dmgTotal ? stuffData.battle.dmgMax : user.dmgTotal;
        stuffData.battle.dmgMin = stuffData.battle.dmgMin < user.dmgTotal ? stuffData.battle.dmgMin : user.dmgTotal;
        stuffData.battle.battleCount += 1;
        stuffData.battle.dmgTotal += user.dmgTotal;
        stuffData.battle.dmgAverage = Math.round(stuffData.battle.dmgTotal / stuffData.battle.battleCount);
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, this.Data);

        // Delete stuff if limit is reached
        const stuffsLength = Object.keys(this.Data.stuffs.stuffs).length;
        if (stuffsLength > this.__internal_stuffDisplayLimit) {
            let stuffsKeysSortedByWeight = this.getStuffsKeysSortedByWeight()
            const lowestWeightKey = stuffsKeysSortedByWeight[stuffsKeysSortedByWeight.length - 1]
            if (stuffsKeysSortedByWeight.slice(0, this.__internal_stuffDisplayLimit).includes(stuffHash)) {
                if (stuffsLength >= this.__internal_stuffStorageLimit) {
                    delete this.Data.stuffs.stuffs[lowestWeightKey];
                }
                document.querySelector(`[data-key="${lowestWeightKey}"]`).remove()
                this.__internal__createOrUpdateStuff(stuffData, stuffHash)
            }
        } else {
            this.__internal__createOrUpdateStuff(stuffData, stuffHash)
        }
    }

    /**
     * @desc Reset stats
     *
     * @param {string} id: Id of object to reset
     */
    static resetStats(id) {
        // Remove all "stuffs" that are not locked
        for (let stuffKey in this.Data[id].stuffs) {
            if (!this.Data[id].stuffs[stuffKey].locked) {
                delete this.Data[id].stuffs[stuffKey];
                delete BattleLogs.Stats.StatsPanes[stuffKey];
            }
        }
        this.Data[id].time = new Date().toISOString();

        const statBody = document.querySelector('#Stats-stuffs[data-key="stuffs"] .stats-body');
        statBody.querySelector(".stats-stuffs-container").remove()
        statBody.querySelector(".stuffs-actions").remove()

        this.appendStatsToPane(this.Data[id])

        const dateSpan = document.querySelector(`#${BattleLogs.Stats.Settings.Type}-stuffs [data-key="time"]`)
        dateSpan.textContent = BattleLogs.Stats.Messages.since.format(BattleLogs.Stats.formatStatsDate(this.Data[id]));
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, this.Data);
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsPanes, BattleLogs.Stats.StatsPanes);
    }

    /**
     * @desc Sets the stats stuffs settings default values in the local storage
     */
    static setDefaultSettingsValues(key) {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(key, {
            "stuffs": this.__internal__defaultStats["stuffs"]
        });
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.StuffsFilters, {"order":"asc", "input":""});
    }

    /**
     * @desc Returns the keys of the "stuffs" objects sorted by a weighted score.
     * The weight is calculated based on the "updateTimestamp", "battleCount" and "timeTimestamp" properties of each "stuff" object.
     * The weights assigned to these properties are defined by the "__internal_updateTimestampWeight", "__internal_battleCountWeight"
     * and "__internal_timeTimestampWeight" properties, respectively.
     *
     * The weighting and normalization process is as follows:
     * - The "updateTimestamp", "battleCount" and "timeTimestamp" of each "stuff" object are normalized by subtracting the minimum value and dividing by the range (max - min).
     * - Each of these normalized values is then multiplied by its respective weight.
     * - The final weighted score of each "stuff" is calculated by adding up all the weighted values.
     *
     * The list of stuff keys is then sorted in descending order based on these weighted scores.
     *
     * @returns {Array} An array of stuff keys sorted in descending order based on the weighted scores.
     */
    static getStuffsKeysSortedByWeight() {
        // Create a list of all "stuffs"
        let stuffsList = [];
        for (let stuffKey in this.Data.stuffs.stuffs) {
            let stuff = this.Data.stuffs.stuffs[stuffKey];
            let updateTimestamp = new Date(stuff.update).getTime() / 1000;
            let battleCount = stuff.battle.battleCount;
            let timeTimestamp = new Date(stuff.time).getTime() / 1000;
            let locked = stuff.locked;
            stuffsList.push({"stuffKey": stuffKey, "updateTimestamp": updateTimestamp, "battleCount": battleCount, "timeTimestamp":timeTimestamp, "locked": locked});
        }

        // Normalize and weight
        let maxUpdateTimestamp = Math.max(...stuffsList.map(s => s.updateTimestamp));
        let minUpdateTimestamp = Math.min(...stuffsList.map(s => s.updateTimestamp));
        let maxBattleCount = Math.max(...stuffsList.map(s => s.battleCount));
        let minBattleCount = Math.min(...stuffsList.map(s => s.battleCount));
        let maxTimeTimestamp = Math.max(...stuffsList.map(s => s.timeTimestamp));
        let minTimeTimestamp = Math.min(...stuffsList.map(s => s.timeTimestamp));

        for (let stuff of stuffsList) {
            stuff.updateTimestamp = this.__internal_updateTimestampWeight * ((stuff.updateTimestamp - minUpdateTimestamp) / (maxUpdateTimestamp - minUpdateTimestamp));
            stuff.battleCount = this.__internal_battleCountWeight * ((stuff.battleCount - minBattleCount) / (maxBattleCount - minBattleCount));
            stuff.timeTimestamp = this.__internal_timeTimestampWeight * ((stuff.timeTimestamp - minTimeTimestamp) / (maxTimeTimestamp - minTimeTimestamp));

            stuff.weightedScore = stuff.updateTimestamp + stuff.battleCount + stuff.timeTimestamp;
            // Increase the score by 100 if the stuff is locked
            if (stuff.locked) {
                stuff.weightedScore += 100;
            }
        }

        // Sort by weighted score
        stuffsList.sort((a, b) => b.weightedScore - a.weightedScore);

        return stuffsList.map(stuff => stuff.stuffKey);
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__stuffPaneAllowedKey = ["loadout", "battle", "wb"]
    static __internal_stuffDisplayLimit = 50
    static __internal_stuffStorageLimit = 70
    static __internal_battleCountWeight = 0.50;
    static __internal_timeTimestampWeight = 0.15;
    static __internal_updateTimestampWeight = 0.35;

    /**
     * @desc Update stuff values
     *
     * @param {Object} stuffData: stuff data to update
     * @param {Element} stuffContainerDiv: HTML element representing the stuffs container.
     */
    static __internal__updateStuffValues(stuffData, stuffContainerDiv) {
        Object.keys(stuffData).forEach((key) => {
            if (this.__internal__stuffPaneAllowedKey.includes(key) || ["name", "update"].includes(key)) {
                if (key === "wb") {
                    Object.keys(stuffData.wb).forEach((wbKey) => {
                        const keyContainer = stuffContainerDiv.querySelector(`[data-key=${wbKey}]`)
                        if (keyContainer) {
                            Object.keys(stuffData.wb[wbKey]).forEach((subkey) => {
                                this.__internal__updateAttributes(stuffData.wb, wbKey, subkey, keyContainer)
                            })
                        } else {
                            const container = stuffContainerDiv.querySelector(".stats-stuff-body")
                            this.__internal__appendStuffStatsWb(stuffData.wb, wbKey, container);
                        }
                    })
                } else if (key === "name") {
                    const spanName = stuffContainerDiv.querySelector(`[data-key=${key}]`)
                    spanName.textContent = stuffData.customName ? stuffData.customName : stuffData[key];
                    spanName.title = `#${stuffData.slot} - ${stuffData.name}`;
                } else if (key === "update") {
                    const spanDate = stuffContainerDiv.querySelector(`[data-key=${key}]`)
                    spanDate.title = `Crée le: ${BattleLogs.Stats.formatStatsDate(stuffData)}, Mis à jour le: ${BattleLogs.Stats.formatStatsDate(stuffData, true, true)}`
                } else {
                    const keyContainer = stuffContainerDiv.querySelector(`[data-key=${key}]`)
                    if (keyContainer) {
                        Object.keys(stuffData[key]).forEach((subkey) => {
                            this.__internal__updateAttributes(stuffData, key, subkey, keyContainer)
                        })
                    }
                }
            }
        })
    }

    /**
     * @desc Update attributes of stuff in container
     *
     * @param {Object} stuffData: stuff data to update
     * @param {string} key: Key of data.
     * @param {string} subkey: Subkey of data.
     * @param {Element} container: HTML element representing the stuff block.
     * @param {Number} id: Represent number of iteration for array
     */
    static __internal__updateAttributes(stuffData, key, subkey, container, id = null) {
        const object = stuffData[key][subkey];
        const subkeyContainer = container.querySelector(`[data-key=${id !== null ? subkey + id : subkey}]`)
        if (subkeyContainer === null) return;
        if (Array.isArray(object)) {
            object.forEach((item, i) => {
                this.__internal__updateAttributes(item, key, subkey, subkeyContainer, i)
            })
        } else {
            const value = subkeyContainer.querySelector(".value");
            if (typeof object === 'object') {
                value.textContent = object.name;
                value.classList.add(`rarity-${object.rarity}`);
            } else {
                value.textContent = BattleLogs.Utils.formatNumber(object);
            }
        }
    }

    /**
     * @desc Builds the stats pane for a specific wheel type, utilizing the given data.
     *
     * @param {Object} statsData: Statistical data for the specific wheel type.
     * @param {Element} container: HTML element representing the container pane.
     */
    static __internal__buildStatPane(statsData, container) {
        const stuffsContainer = document.createElement("div")
        stuffsContainer.classList.add("stats-stuffs-container")

        const stuffsActions = document.createElement("div");
        stuffsActions.classList.add("stuffs-actions");
        const stuffsActionsLeft = document.createElement("div");
        stuffsActionsLeft.classList.add("stuffs-actions-left");
        const stuffsActionsRight = document.createElement("div");
        stuffsActionsRight.classList.add("stuffs-actions-right");
        stuffsActions.appendChild(stuffsActionsLeft);
        stuffsActions.appendChild(stuffsActionsRight);

        // Create filter button
        const filterInput = document.createElement('input');
        filterInput.classList.add("stuffs-filter");
        filterInput.type = 'text';
        filterInput.id = 'filterInput';
        filterInput.value = this.Filters.input;
        filterInput.placeholder = 'Recherchez un stuff...';
        let timer = null; // Store the timer outside the event handler
        filterInput.addEventListener('input', (event) => {
            // Clear the previous timer if it exists
            if (timer) {
                clearTimeout(timer);
            }

            // Create a new timer that calls the update function after 500ms
            timer = setTimeout(() => {
                this.__internal__filterStuffs(event, container);
            }, 500);
        });
        stuffsActionsLeft.appendChild(filterInput)

        let sortButtons = []

        const sortAscButton = document.createElement("button");
        sortAscButton.classList.add("svg_sort-asc");
        sortAscButton.title = "Trier en ordre croissant";
        sortButtons['asc'] = sortAscButton;
        stuffsActionsRight.appendChild(sortAscButton)
        sortAscButton.addEventListener('click', () => {
            this.__internal__sortStuffs('asc', stuffsContainer, sortAscButton, stuffsActionsRight);
        });

        const sortDescButton = document.createElement("button");
        sortDescButton.classList.add("svg_sort-desc");
        sortDescButton.title = "Trier en ordre décroissant";
        sortButtons['desc'] = sortDescButton;
        stuffsActionsRight.appendChild(sortDescButton)
        sortDescButton.addEventListener('click', () => {
            this.__internal__sortStuffs('desc', stuffsContainer, sortDescButton, stuffsActionsRight);
        });

        const sortAbButton = document.createElement("button");
        sortAbButton.classList.add("svg_sort-ab");
        sortAbButton.title = "Trier par ordre alphabétique";
        sortButtons['ab'] = sortAbButton;
        stuffsActionsRight.appendChild(sortAbButton)
        sortAbButton.addEventListener('click', () => {
            this.__internal__sortStuffs('ab', stuffsContainer, sortAbButton, stuffsActionsRight);
        });

        const sortBaButton = document.createElement("button");
        sortBaButton.classList.add("svg_sort-ba");
        sortBaButton.title = "Trier par ordre alphabétique inversé";
        sortButtons['ba'] = sortBaButton;
        stuffsActionsRight.appendChild(sortBaButton)
        sortBaButton.addEventListener('click', () => {
            this.__internal__sortStuffs('ba', stuffsContainer, sortBaButton, stuffsActionsRight);
        });

        container.appendChild(stuffsActions)

        // Build div for each type of stuff
        Object.keys(statsData).forEach((key) => {
            if (!BattleLogs.Stats.NotUpdateAttributes.includes(key)) {
                this.__internal__createStatPaneBlock(statsData, key, stuffsContainer);
            }
        })
        container.appendChild(stuffsContainer);

        this.__internal__sortStuffs(this.Filters.order, stuffsContainer, sortButtons[this.Filters.order], stuffsActionsRight);
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
        Object.keys(statsData[key]).forEach((stuffKey) => {
            if (!BattleLogs.Stats.NotUpdateAttributes.includes(key)) {
                this.__internal__createStuffPane(statsData[key][stuffKey], stuffKey, container);
            }
        })
    }

    /**
     * @desc Creates and updates the stuff element
     *
     * @param {Object} stuffData: The data of stuff to update
     * @param {string} key: Key of data
     * @param {Element} stuffsElement: The title element to update or create
     * @return {Element} The updated or created title element
     */
    static __internal__createOrUpdateStuff(stuffData, key, stuffsElement = null) {
        if (stuffsElement === null) {
            stuffsElement = document.querySelector(".stats-stuffs-container");
        }
        let stuffContainerDiv = document.querySelector(`.stats-stuff[data-key='${key}']`)
        if (stuffContainerDiv !== null) {
            this.__internal__updateStuffValues(stuffData, stuffContainerDiv)
        } else {
            this.__internal__createStuffPane(stuffData, key, stuffsElement)
        }

    }

    /**
     * @desc Creates a block within the stats pane for a specific stuff.
     *
     * @param {Object} statsData: Statistical data for the specific stuff.
     * @param {string} key: Key of wheel.
     * @param {Element} container: HTML element representing the block within the stats pane.
     */
    static __internal__createStuffPane(statsData, key, container) {
        // Create container
        const stuffContainerDiv = document.createElement("div");
        stuffContainerDiv.classList.add("stats-stuff");
        stuffContainerDiv.dataset["key"] = key;

        // Create header
        const stuffHeader = document.createElement("div");
        stuffHeader.classList.add("stats-stuff-header");
        stuffHeader.classList.add(statsData.element.toLocaleLowerCase());

        // Create div for left elements
        const headerLeft = document.createElement("div");
        headerLeft.classList.add("stuff-title")
        const headerLockButton = document.createElement("button");
        if (statsData.locked) {
            headerLockButton.title = "Déverrouiller";
            headerLockButton.classList.add("selected");
        } else {
            headerLockButton.title = "Verrouiller";
        }
        headerLockButton.classList.add("svg_lock");
        headerLockButton.dataset["key"] = key
        headerLockButton.onclick = () => {
            this.__internal__lockStuff(statsData, headerLockButton)
            return false;
        };
        headerLeft.appendChild(headerLockButton);
        const headerTitleSpan = document.createElement("span");
        headerTitleSpan.dataset["key"] = "name"
        headerTitleSpan.textContent = statsData.customName ? statsData.customName : statsData.name;
        headerTitleSpan.title = `#${statsData.slot} - ${statsData.name}`;
        headerLeft.appendChild(headerTitleSpan);
        const headerTitleButton = document.createElement("button");
        headerTitleButton.title = "Éditer";
        headerTitleButton.classList.add("svg_edit");
        headerTitleButton.dataset["key"] = key
        headerTitleButton.oncontextmenu = () => {
            this.__internal__showPrompt(statsData, key)
            return false;
        };
        headerTitleButton.onclick = () => {
            this.__internal__showPrompt(statsData, key)
            return false;
        };
        headerLeft.appendChild(headerTitleButton);
        stuffHeader.appendChild(headerLeft);

        // Create div for right elements
        const headerRight = document.createElement("div");
        headerRight.classList.add("stuff-date")
        const headerDate = document.createElement("span");
        headerDate.textContent = BattleLogs.Stats.formatStatsDate(statsData, false);
        headerDate.dataset["key"] = "update"
        headerDate.title = `Crée le: ${BattleLogs.Stats.formatStatsDate(statsData)}, Mis à jour le: ${BattleLogs.Stats.formatStatsDate(statsData, true, true)}`
        headerRight.appendChild(headerDate);
        const headerAction = document.createElement("button");
        headerAction.title = "Supprimer";
        headerAction.classList.add("svg_trash-dark");
        headerAction.onclick = () => {
            const confirmed = window.confirm("Tu vas supprimer le stuff, es-tu sûr ?");
            if (confirmed) {
                stuffContainerDiv.remove();
                delete BattleLogs.Stats.Stuffs.Data.stuffs.stuffs[key];
                delete BattleLogs.Stats.StatsPanes[key];
                BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, this.Data);
                BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsPanes, BattleLogs.Stats.StatsPanes);
            }
        };
        headerRight.appendChild(headerAction);
        stuffHeader.appendChild(headerRight);

        // Append header to container
        stuffContainerDiv.appendChild(stuffHeader);

        // Create body
        const stuffBody = document.createElement("div");
        stuffBody.classList.add("stats-stuff-body");
        Object.keys(statsData).forEach((stuffKey) => {
            if (this.__internal__stuffPaneAllowedKey.includes(stuffKey)) {
                if (stuffKey !== "wb") {
                    this.__internal__appendStuffStats(statsData, stuffKey, stuffBody);
                } else {
                    Object.keys(statsData[stuffKey]).forEach((wbKey) => {
                        this.__internal__appendStuffStatsWb(statsData[stuffKey], wbKey, stuffBody);
                    })
                }
            }
        })

        // Create Collapse/Expand button for the stuff body
        const stuffCollapseButton = document.createElement("button");
        // Initially hide the stuff body
        if (BattleLogs.Stats.StatsPanes.hasOwnProperty(key)) {
            stuffCollapseButton.classList.add("svg_chevron-down-dark");
            stuffCollapseButton.title = "Déplier le stuff";
            stuffBody.style.display = "none";
        } else {
            stuffCollapseButton.classList.add("svg_chevron-up-dark");
            stuffCollapseButton.title = "Réduire le stuff";
            BattleLogs.Stats.StatsPanes[key] = false;
        }
        stuffCollapseButton.addEventListener('click', () => {
            BattleLogs.Stats.toggleElementDisplay(
                key,
                stuffBody,
                stuffCollapseButton,
                "svg_chevron-up-dark",
                "svg_chevron-down-dark",
                "Réduire le stuff",
                "Déplier le stuf"
            );
        });
        headerRight.appendChild(stuffCollapseButton);

        // Append body to container
        stuffContainerDiv.appendChild(stuffBody);
        container.appendChild(stuffContainerDiv);
    }


    /**
     * @desc Append stats and loadout of stuff in stuff body block
     *
     * @param {Object} stuffData: Statistical data for the specific stuff.
     * @param {string} key: Key of stuff.
     * @param {Element} container: HTML element representing the block within the stats pane.
     */
    static __internal__appendStuffStats(stuffData, key, container) {
        // Create loadout container
        const blockContainer = document.createElement("div");
        blockContainer.classList.add("stuff-body-block");
        blockContainer.dataset["key"] = key;
        if (key === "loadout") {
            const blockValues = document.createElement("div");
            blockValues.classList.add("stuff-body-block-values")
            blockValues.classList.add(`values-${key}`)
            const objectToGroup = {"arme_calv": ["arme", "calv"], "items": ["items"], "fams": ["famAtk", "famDef"]}
            Object.keys(objectToGroup).forEach((objectGroupKey) => {
                let group = objectToGroup[objectGroupKey];
                const stuffBodyGroup = document.createElement("div");
                for (const subKey of group) {
                    this.__internal__appendAttributes(stuffData[key][subKey], key, subKey, stuffBodyGroup);
                }
                blockValues.appendChild(stuffBodyGroup);
            })
            blockContainer.appendChild(blockValues);
        } else {
            const blockLabel = document.createElement("div");
            blockLabel.classList.add("stuff-body-block-title");
            blockLabel.textContent = key.capitalize()
            const blockValues = document.createElement("div");
            blockValues.classList.add("stuff-body-block-values")
            blockValues.classList.add(`values-${key}`)
            this.__internal__appendStuffData(stuffData, key, blockValues)
            blockContainer.appendChild(blockLabel);
            blockContainer.appendChild(blockValues);
        }

        container.appendChild(blockContainer)
    }


    /**
     * @desc Append wb stats of stuff in stuff body block
     *
     * @param {Object} stuffData: Statistical data for the specific stuff.
     * @param {string} key: Key of stuff.
     * @param {Element} container: HTML element representing the block within the stats pane.
     */
    static __internal__appendStuffStatsWb(stuffData, key, container) {
        // Create loadout container
        const blockContainer = document.createElement("div");
        blockContainer.classList.add("stuff-body-block");
        blockContainer.dataset["key"] = key;
        const blockLabel = document.createElement("div");
        blockLabel.classList.add("stuff-body-block-title");
        blockLabel.textContent = stuffData[key].name.capitalize()
        const blockValues = document.createElement("div");
        blockValues.classList.add("stuff-body-block-values")
        blockValues.classList.add("values-wb")
        this.__internal__appendStuffData(stuffData, key, blockValues)
        blockContainer.appendChild(blockLabel);
        blockContainer.appendChild(blockValues);
        container.appendChild(blockContainer)
    }


    /**
     * @desc Append data of stuff in container
     *
     * @param {Object} data: Statistical data for the specific stuff.
     * @param {string} key: Key of wheel.
     * @param {Element} container: HTML element representing the stuff block.
     */
    static __internal__appendStuffData(data, key, container) {
        for (const subkey in data[key]) {
            if (subkey === "name") continue
            const object = data[key][subkey];
            this.__internal__appendAttributes(object, key, subkey, container);
        }
    }

    /**
     * @desc Append attributes of stuff in container
     *
     * @param {Object} object: object data to append
     * @param {string} key: Key of data.
     * @param {string} subkey: Subkey of data.
     * @param {Element} container: HTML element representing the stuff block.
     * @param {Number} id: Represent number of iteration for array
     */
    static __internal__appendAttributes(object, key, subkey, container, id = null) {
        const attrContainer = document.createElement("div")
        attrContainer.classList.add(key)
        attrContainer.dataset["key"] = id !== null ? subkey + id : subkey
        if (Array.isArray(object)) {
            object.forEach((item, i) => {
                this.__internal__appendAttributes(item, key, subkey, container, i)
            })
        } else {
            const label = document.createElement("span");
            label.classList.add("key")
            label.textContent = subkey.capitalize();
            const name = document.createElement("span");
            name.classList.add("value")
            if (typeof object === 'object') {
                name.textContent = object.name;
                name.classList.add(`rarity-${object.rarity}`);
            } else if (!isNaN(object)) {  // check if object can be converted to a number
                name.textContent = BattleLogs.Utils.formatNumber(object);
            } else {
                name.textContent = object;
            }

            attrContainer.appendChild(label)
            attrContainer.appendChild(name)
            container.appendChild(attrContainer)
        }
    }

    /**
     * @desc Creates a unique hash based on equipment data.
     *
     * @param {Object} stuff: Equipment data object.
     * @return {string} Unique hash based on the equipment data.
     */
    static __internal__createStuffHash(stuff) {
        // sort the "items" array
        const itemsArray = stuff.items.map(item => item.name).sort();
        // concatenate the elements of the "items" array with the other attributes
        let concatenatedItems = stuff.arme.name + stuff.calv.name + itemsArray.join('') + stuff.famAtk.name + stuff.famDef.name;
        return concatenatedItems.hashCode()
    }

    /**
     * @desc This method is used to assigns an "onclick" event to the lock button to lock or unlock the stuff.
     * @param {Object} stuff: The stuff object that should be locked or unlocked.
     * @param {Element} buttonContainer: The HTML element representing the button that should be used to lock or unlock the stuff.
     */
    static __internal__lockStuff(stuff, buttonContainer) {
        // Check if the button is selected
        if (buttonContainer.classList.contains("selected")) {
            // If the button is selected, remove the 'selected' class from the button and unlock the stuff
            buttonContainer.classList.remove('selected');
            buttonContainer.title = "Verrouiller";
            stuff.locked = false;
        } else {
            // If the button is not selected, add the 'selected' class to the button and lock the stuff
            buttonContainer.classList.add('selected');
            buttonContainer.title = "Déverrouiller";
            stuff.locked = true;
        }
        // Update the stored data to reflect the changes
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, this.Data);
    }

    /**
     * @desc Filters the stuffs in the container based on the given word.
     *
     * @param {Event} event: Event object containing the value to filter by.
     * @param {Element} container: HTML element representing the container to filter.
     */
    static __internal__filterStuffs(event, container) {
        let word;
        if (typeof event === 'string') {
            word = event;
        } else {
            word = event.target.value; // Récupérer le mot saisi
        }

        // Obtenir tous les éléments "stuff" dans le conteneur
        const stuffs = container.querySelectorAll('.stats-stuff');

        // Parcourir tous les "stuffs" et appliquer la logique de filtrage
        stuffs.forEach(stuff => {
            // Récupérer la clé ou d'autres données à partir de l'élément "stuff"
            const stuffKey = stuff.dataset["key"];
            const stuffData = this.Data.stuffs.stuffs[stuffKey];
            // Appliquer une logique de filtrage en fonction de la clé ou d'autres critères
            // Par exemple, si vous avez un critère de filtrage en fonction de la clé, vous pouvez faire quelque chose comme ceci:
            if (this.__internal__findWordInObject(word, stuffData)) { // ou utilisez une autre condition de comparaison
                stuff.style.removeProperty('display'); // afficher l'élément qui correspond au filtre
            } else {
                stuff.style.display = 'none'; // masquer les autres éléments
            }
        });
        this.Filters.input = word;
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StuffsFilters, this.Filters)
    }

    /**
     * @desc Finds a word within an object, performing the search case-insensitively and accent-insensitively.
     *
     * @param {string} word: The word to search for.
     * @param {Object} obj: The object to search within.
     * @return {boolean} Returns true if the word is found, otherwise false.
     */
    static __internal__findWordInObject(word, obj) {
        const normalizedWord = word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                const normalizedString = obj[key].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (normalizedString.includes(normalizedWord)) {
                    return true;
                }
            }
            if (typeof obj[key] === 'object') {
                if (this.__internal__findWordInObject(normalizedWord, obj[key])) {
                    return true;
                }
            }
            if (Array.isArray(obj[key])) {
                for (const item of obj[key]) {
                    if (this.__internal__findWordInObject(normalizedWord, item)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * @desc Sorts the stuffs in the container based on the order and handles button selection.
     *
     * @param {string} order: The order to sort by. Can be either 'asc', 'desc', 'ab', or 'ba'.
     * @param {Element} container: HTML element representing the container to sort.
     * @param {Element} button: The button that was clicked.
     * @param {Element} buttonContainer: The container of all the buttons.
     */
    static __internal__sortStuffs(order, container, button, buttonContainer) {
        const stuffsData = this.Data.stuffs.stuffs
        this.__internal__renderStuffs(stuffsData, container);
        // Get all the "stuff" elements in the container
        const stuffs = Array.from(container.querySelectorAll('.stats-stuff'));

        // Sort the stuffs alphabetically based on the stuff's name
        if (["ab", "ba"].includes(order)) {
            stuffs.sort((a, b) => {
                const stuffKeyA = a.dataset["key"];
                const stuffKeyB = b.dataset["key"];
                const stuffNameA = stuffsData[stuffKeyA].customName ? stuffsData[stuffKeyA].customName.toLowerCase() : stuffsData[stuffKeyA].name.toLowerCase();
                const stuffNameB = stuffsData[stuffKeyB].customName ? stuffsData[stuffKeyB].customName.toLowerCase() : stuffsData[stuffKeyB].name.toLowerCase();

                if (order === 'ab') {
                    if (stuffNameA < stuffNameB) return -1;
                    if (stuffNameA > stuffNameB) return 1;
                    return 0;
                } else if (order === 'ba') {
                    if (stuffNameA < stuffNameB) return 1;
                    if (stuffNameA > stuffNameB) return -1;
                    return 0;
                }
            });
        } else if (["asc", "desc"].includes(order)) {
            if (order === 'desc') {
                stuffs.reverse();
            }
        }

        // Clear the container and append the sorted stuffs
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        stuffs.forEach(stuff => container.appendChild(stuff));

        // Handle button selection
        this.__internal__handleButtonSelection(button, buttonContainer);
        this.__internal__filterStuffs(this.Filters.input, container);

        this.Filters.order = order;
        BattleLogs.Utils.LocalStorage.setComplexValue(this.Settings.StuffsFilters, this.Filters)
    }

    /**
     * @desc Handles the selection and deselection of buttons.
     *
     * @param {Element} button: The button to select.
     * @param {Element} buttonContainer: The container of all the buttons.
     */
    static __internal__handleButtonSelection(button, buttonContainer) {
        // Find the currently selected button and deselect it
        const selectedButton = buttonContainer.querySelector('.selected');
        if (selectedButton) {
            selectedButton.classList.remove('selected');
        }

        // Select the clicked button
        button.classList.add('selected');
    }

    /**
     * @desc Renders stuffs in the given container.
     *
     * @param {Object} stuffs: The stuffs to render.
     * @param {Element} container: The container in which to render the stuffs.
     */
    static __internal__renderStuffs(stuffs, container) {
        // Clear the container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const stuffsKeysSortedByWeight = this.getStuffsKeysSortedByWeight().slice(0, this.__internal_stuffDisplayLimit)
        Object.keys(stuffs).forEach((key) => {
            if (stuffsKeysSortedByWeight.includes(key)) {
                this.__internal__createStuffPane(stuffs[key], key, container);
            }
        })
    }

    /**
     * @desc Shows a prompt for renaming a given stuff. The prompt includes an input field
     * pre-filled with the stuff's current name, and buttons for submitting the change
     * or closing the prompt. The function handles all interactions with the prompt,
     * including updating the stuff's name in the relevant places in the DOM and
     * the application's data structures.
     *
     * @param {Object} stuff: The stuff object containing the current name and other details.
     * @param {string} key: The key used to identify the specific stuff in the application's data structures.
     */
    static __internal__showPrompt(stuff, key) {
        console.log(key)
        let defaultValue = stuff.name;

        let promptContainer = document.createElement("div");
        promptContainer.classList.add("prompt");

        let label = document.createElement("label");
        label.textContent = "Veuillez saisir le nom du stuff :";
        promptContainer.appendChild(label);

        let input = document.createElement("input");
        input.type = "text";
        input.value = defaultValue;
        input.placeholder = defaultValue;

        input.addEventListener("focus", function () {
            if (input.value === defaultValue) {
                input.value = "";
            }
        });

        input.addEventListener("blur", function () {
            if (input.value === "") {
                input.value = defaultValue;
            }
        });

        promptContainer.appendChild(input);

        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        let button = document.createElement("button");
        button.textContent = "Valider";
        button.classList.add("primary")
        button.style.marginRight = "10px"

        function updateStuffName(e) {
            e.preventDefault()
            document.querySelector(`.stats-stuff[data-key="${key}"] .stuff-title > span`).textContent = input.value;
            if (input.value === defaultValue) {
                BattleLogs.Stats.Stuffs.Data.stuffs.stuffs[key].customName = null;
            } else {
                BattleLogs.Stats.Stuffs.Data.stuffs.stuffs[key].customName = input.value;
            }
            BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, BattleLogs.Stats.Stuffs.Data);
            promptContainer.remove();
            removeEventListeners();
        }

        button.addEventListener("click", function (e) {
            updateStuffName(e);
        });

        buttonContainer.appendChild(button);

        let closeButton = document.createElement("button");
        closeButton.textContent = "Fermer";
        closeButton.classList.add("danger")
        closeButton.addEventListener("click", function () {
            promptContainer.remove();
            removeEventListeners();
        });

        buttonContainer.appendChild(closeButton);

        promptContainer.appendChild(buttonContainer);
        document.addEventListener("click", function (event) {
            if (!promptContainer.contains(event.target) && document.querySelector(".prompt") && !document.querySelector(`button.svg_edit[data-key="${key}"]`).contains(event.target)) {
                promptContainer.remove();
                removeEventListeners();
            }
        });

        let removeEventListeners = function () {
            document.removeEventListener("keydown", keydownListener);
            document.removeEventListener("keyup", keyupListener);
        };

        let keydownListener = function (event) {
            if (event.key === "Enter") {
                updateStuffName(event);
            } else if (event.key === "Escape") {
                promptContainer.remove();
                removeEventListeners();
            }
        };

        let keyupListener = function (event) {
            // Gérer l'événement keyup si nécessaire
        };

        document.addEventListener("keydown", keydownListener);
        document.addEventListener("keyup", keyupListener);

        document.body.appendChild(promptContainer);
    }

    /**
     * @desc Creates a default object for each new stuff
     *
     * @param {Object} stuff: Equipment data object.
     * @param {Object} user: User data object.
     * @return {Object} return a stuff data object with default values
     */
    static __internal__createDefaultStuffDataObject(stuff, user) {
        return {
            "time": new Date().toISOString(),
            "update": new Date().toISOString(),
            "slot": stuff.slot,
            "name": stuff.name,
            "customName": null,
            "element": stuff.element,
            "loadout": {
                "arme": stuff.arme,
                "calv": stuff.calv,
                "items": stuff.items,
                "famAtk": stuff.famAtk,
                "famDef": stuff.famDef
            },
            "battle": {
                "dmgMax": user.dmgTotal,
                "dmgMin": user.dmgTotal,
                "dmgTotal": 0,
                "dmgAverage": 0,
                "battleCount": 0
            },
            "wb": {},
        }
    }

    /**
     * @desc Creates a default object for each new stuff
     *
     * @param {Object} user: User data object.
     * @param {Object} opponent: Opponent data object.
     * @return {Object} return a stuff wb data object with default values
     */
    static __internal__createDefaultStuffWbDataObject(user, opponent) {
        return {
            "name": opponent.name,
            "dmgMax": user.dmgTotal,
            "dmgMin": user.dmgTotal,
            "dmgTotal": 0,
            "dmgAverage": 0,
            "battleCount": 0
        }
    }

    /**
     * @desc Default statistical values for stuffs
     */
    static __internal__defaultStats = {
        "stuffs": {
            "id": "stuffs",
            "time": new Date().toISOString(),
            "stuffs": {}
        }
    }
}