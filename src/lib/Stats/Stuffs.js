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
        const statPaneBody = document.querySelector(`#Stats-${statsData.id}[data-key=${statsData.id}] .stats-body`);
        if (statPaneBody !== null) {
            this.__internal__buildStatPane(statsData, statPaneBody)
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
     * @desc Sets the stats stuffs settings default values in the local storage
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
        filterInput.placeholder = 'Recherchez un stuff...';
        filterInput.addEventListener('input', (event) => {
            this.__internal__filterStuffs(event, container);
        });
        stuffsActionsLeft.appendChild(filterInput)

        const sortAscButton = document.createElement("button");
        sortAscButton.classList.add("svg_sort-asc");
        sortAscButton.title = "Trier en ordre croissant";
        stuffsActionsRight.appendChild(sortAscButton)
        sortAscButton.addEventListener('click', () => this.__internal__sortStuffs('asc', stuffsContainer));

        const sortDescButton = document.createElement("button");
        sortDescButton.classList.add("svg_sort-desc");
        sortDescButton.title = "Trier en ordre décroissant";
        stuffsActionsRight.appendChild(sortDescButton)
        sortDescButton.addEventListener('click', () => this.__internal__sortStuffs('desc', stuffsContainer));

        const sortAbButton = document.createElement("button");
        sortAbButton.classList.add("svg_sort-ab");
        sortAbButton.title = "Trier par ordre alphabétique";
        stuffsActionsRight.appendChild(sortAbButton)
        sortAbButton.addEventListener('click', () => this.__internal__sortStuffs('ab', stuffsContainer));

        const sortBaButton = document.createElement("button");
        sortBaButton.classList.add("svg_sort-ba");
        sortBaButton.title = "Trier par ordre alphabétique inversé";
        stuffsActionsRight.appendChild(sortBaButton)
        sortBaButton.addEventListener('click', () => this.__internal__sortStuffs('ba', stuffsContainer));

        container.appendChild(stuffsActions)

        // Build div for each type of stuff
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
        const headerTitleSpan = document.createElement("span");
        headerTitleSpan.dataset["key"] = "name"
        headerTitleSpan.textContent = statsData.customName ? statsData.customName : statsData.name;
        headerTitleSpan.title = `#${statsData.slot} - ${statsData.name}`;
        headerLeft.appendChild(headerTitleSpan);
        const headerTitleButton = document.createElement("button");
        headerTitleButton.title = "Éditer";
        headerTitleButton.classList.add("svg_edit-dark");
        headerTitleButton.dataset["key"] = key
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
                delete BattleLogs.Stats.Stuffs.Data.stuffs.stuffs[key];
                stuffContainerDiv.remove();
                BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs.Stats.Settings.StatsStuffs, this.Data);
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
        stuffCollapseButton.classList.add("svg_chevron-down-dark");
        stuffCollapseButton.title = "Déplier le stuff";
        // Initially hide the stuff body
        stuffBody.style.display = "none";
        stuffCollapseButton.addEventListener('click', () => {
            BattleLogs.Stats.toggleElementDisplay(
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
     * @desc Filters the stuffs in the container based on the given word.
     *
     * @param {Event} event: Event object containing the value to filter by.
     * @param {Element} container: HTML element representing the container to filter.
     */
    static __internal__filterStuffs(event, container) {
        const word = event.target.value; // Récupérer le mot saisi
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
     * @desc Sorts the stuffs in the container alphabetically based on the stuff's name.
     *
     * @param {string} order: The order to sort by. Can be either 'ab' for A to Z or 'ba' for Z to A.
     * @param {Element} container: HTML element representing the container to sort.
     */
    static __internal__sortStuffs(order, container) {
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

        Object.keys(stuffs).forEach((key) => {
            if (!BattleLogs.Stats.NotUpdateAttributes.includes(key)) {
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
            BattleLogs.Stats.Stuffs.Data.stuffs.stuffs[key].customName = input.value;
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
            if (!promptContainer.contains(event.target) && document.querySelector(".prompt") && !document.querySelector(`button[data-key="${key}"]`).contains(event.target)) {
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