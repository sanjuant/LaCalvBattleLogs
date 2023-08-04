/**
 * @class The BattleLogsStatsRoues regroups functionality related to battle logs stuffs stats
 */
class BattleLogsStatsStuffs {
    static Settings = {
        Type: "Stuffs"
    }

    static Messages = {
        stuffs: {
            name: "Stats des stuffs",
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
            cost: "premium"
        },
    };

    static Data;

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
        const statPane = document.querySelector(`#Stats-${statsData.id}[data-key=${statsData.id}]`);
        if (statPane !== null) {
            this.__internal__buildStatPane(statsData, statPane)
        }
    }

    /**
     * @desc Update stats of stuff
     *
     * @param {Object} stuff: stuff to update.
     * @param {Object} user: user object for battle stats
     * @param {Object} opponent: opponent object for battle stats
     */
    static updateStats(stuff, user, opponent) {
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
        stuffData.updated_at = new Date().toISOString();
        stuffData.battle.dmgMax = stuffData.battle.dmgMax > user.dmgTotal ? stuffData.battle.dmgMax : user.dmgTotal;
        stuffData.battle.dmgMin = stuffData.battle.dmgMin < user.dmgTotal ? stuffData.battle.dmgMin : user.dmgTotal;
        stuffData.battle.battleCount += 1;
        stuffData.battle.dmgTotal += user.dmgTotal;
        stuffData.battle.dmgAverage = Math.round(stuffData.battle.dmgTotal / stuffData.battle.battleCount);
        BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, this.Data);
        this.__internal__createOrUpdateStuff(stuffData, stuffHash)
    }

    /**
     * @desc Reset stats
     *
     * @param {string} id: Id of object to reset
     */
    static resetStats(id) {
        const statPanes = document.querySelector(`#Stats-${id}[data-key=${id}] .stats-stuffs-container`);
        statPanes.remove()
        this.appendStatsToPane(this.Data[id])
    }

    /**
     * @desc Sets the stats roues settings default values in the local storage
     */
    static setDefaultSettingsValues(key) {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(key, {
            "stuffs": this.__internal__defaultStats["stuffs"]
        });
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__stuffPaneAllowedKey = ["loadout", "battle", "wb"]

    /**
     * @desc Update stuff values
     *
     * @param {Object} stuffData: stuff data to update
     * @param {Element} container: HTML element representing the stuffs container.
     */
    static __internal__updateStuffValues(stuffData, stuffContainerDiv) {
        Object.keys(stuffData).forEach((key) => {
            if (this.__internal__stuffPaneAllowedKey.includes(key)) {
                if (key === "wb") {
                    Object.keys(stuffData.wb).forEach((wbKey) => {
                        const keyContainer = stuffContainerDiv.querySelector(`[data-key=${wbKey}]`)
                        if (keyContainer) {
                            Object.keys(stuffData.wb[wbKey]).forEach((subkey) => {
                                this.__internal__updateAttributes(stuffData.wb, wbKey, subkey, keyContainer)
                            })
                        }
                    })
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
    static __internal__updateAttributes(stuffData, key, subkey, container,  id= null) {
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
                value.textContent = object;
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
        // Build div for each type of roue
        Object.keys(statsData).forEach((key) => {
            if (!BattleLogs.Stats.NotUpdateAttributes.includes(key)) {
                this.__internal__createStatPaneBlock(statsData, key, stuffsContainer);
            }
        })
        container.appendChild(stuffsContainer);
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
                this.__internal__createStuffPane(statsData[key], stuffKey, container);
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
    static __internal__createOrUpdateStuff(stuffData, key, stuffsElement=null) {
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
     * @desc Creates a block within the stats pane for a specific wheel type.
     *       This block contains elements such as the title, percentage bar, and details related to different rarities.
     *
     * @param {Object} statsData: Statistical data for the specific wheel type.
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
        stuffHeader.classList.add(statsData[key].element.toLocaleLowerCase());

        // Create div for left elements
        const headerLeft = document.createElement("div");
        const headerTitleSpan = document.createElement("span");
        headerTitleSpan.textContent = statsData[key].name;
        headerLeft.appendChild(headerTitleSpan);
        const headerTitleButton = document.createElement("button");
        headerTitleButton.textContent = "Éditer";
        headerLeft.appendChild(headerTitleButton);
        stuffHeader.appendChild(headerLeft);

        // Create div for right elements
        const headerRight = document.createElement("div");
        const headerDate = document.createElement("span");
        headerDate.textContent = BattleLogs.Stats.formatStatsDate(statsData[key]);
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
        Object.keys(statsData[key]).forEach((stuffKey) => {
            if (this.__internal__stuffPaneAllowedKey.includes(stuffKey)) {
                if (stuffKey !== "wb") {
                    this.__internal__appendStuffStats(statsData[key], stuffKey, stuffBody);
                } else {
                    Object.keys(statsData[key][stuffKey]).forEach((wbKey) => {
                        this.__internal__appendStuffStatsWb(statsData[key][stuffKey], wbKey, stuffBody);
                    })
                }
            }
        })

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
        }
        else {
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
    static __internal__appendAttributes(object, key, subkey, container,id=null) {
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
            console.log(object)
            console.log(key)
            console.log(subkey)
            label.textContent = subkey.capitalize();
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
        console.log(concatenatedItems)
        console.log(concatenatedItems.hashCode())
        return concatenatedItems.hashCode()
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
            "element": stuff.element,
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