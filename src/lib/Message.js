/**
 * @class BattleLogsMessage provides functionality to add messages in battle logs
 */
class BattleLogsMessage {
    static Settings = {
        MessageFilters: "Message-Filters",
        MessageSettingsOpen: "Message-Settings-Open",
        MessageFormat: "Message-Format",
        Format: "normal"
    };

    static Filters = {
        x10: {
            title: "x10",
            enable: true,
            group: 0
        },
        x50: {
            title: "x50",
            enable: true,
            group: 0
        },
        x100: {
            title: "x100",
            enable: true,
            group: 0
        },
        Boss: {
            title: "Boss",
            enable: true,
            group: 1
        },
        Pvp: {
            title: "PvP",
            enable: true,
            group: 1
        },
        Tob: {
            title: "ToB",
            enable: true,
            group: 1
        },
        Survie: {
            title: "Survie",
            enable: true,
            group: 1
        },
        Notif: {
            title: "Notif",
            enable: true,
            group: 1
        }
    };

    static Joiner = {
        fragments: {
            normal: " ",
            short: " ",
            list: "\n"
        }
    };

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Set default settings to localstorage
            this.__internal__setDefaultSettingValues();
            // Restore previous session state
            this.__internal__loadSettingValues();
            // Build menu
            this.__internal__buildMenu();
        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            this.updateMessages();
        }
    }

    /**
     * @desc Append message to battle logs wrapper
     *
     * @param {string} message: Message to append
     * @param {string} type: Type of message displayed
     * @param {Object} log: Object of log to get information
     */
    static appendMessage(message, type, log) {
        // Create p element to group spans
        const pElem = document.createElement("p");
        pElem.dataset.time = BattleLogs.Utils.getDateString(log.time);
        pElem.dataset.type = log.type;

        // Create span element for time
        if (BattleLogs.Battle.BattleSettings["misc-time"]) {
            const spanTimeEl = document.createElement("span");
            spanTimeEl.classList.add("time");
            spanTimeEl.innerHTML = BattleLogs.Utils.getDateObject(log.time).toLocaleTimeString();
            pElem.appendChild(spanTimeEl);
        }

        // Create span element for message
        const spanMsgEl = document.createElement("span");
        spanMsgEl.classList.add("format-" + BattleLogs.Message.Settings.Format);
        spanMsgEl.innerHTML = message;
        pElem.appendChild(spanMsgEl);


        // Create span element for type
        const spanTypeEl = document.createElement("span");
        const subSpan = document.createElement("span");
        spanTypeEl.classList.add("type");
        subSpan.innerHTML = type;
        spanTypeEl.onclick = () => {
            this.deleteMessage(pElem)
        }
        spanTypeEl.appendChild(subSpan)
        pElem.appendChild(spanTypeEl);

        // Conserve only last 50 messages in html container
        if (this.__internal__messagesContainer.childNodes.length >= 100) {
            this.__internal__messagesContainer.firstElementChild.remove();
        }

        // Append p element to messages container
        this.__internal__messagesContainer.appendChild(pElem);

        // Scroll wrapper to bottom
        BattleLogs.Menu.BattleLogsWrapper.scrollTop = BattleLogs.Menu.BattleLogsWrapper.scrollHeight;
    }

    /**
     * @desc Update messages
     */
    static updateMessages() {
        this.__internal__messagesContainer.innerHTML = "";
        this.__internal__getLogsInOrders().forEach((log) => {
            if (BattleLogs[log.type]) {
                BattleLogs[log.type].appendMessage(log);
            } else {
                BattleLogs.Summarize.appendMessage(log);
            }
        });
    }

    /**
     * @desc Delete message
     *
     * @param {Element} pElem: Message element to delete
     */
    static deleteMessage(pElem) {
        const type = pElem.dataset.type
        const time = pElem.dataset.time

        if (type.slice(0, 1) === 'x') {
            let index = BattleLogs.Summarize.LogsArray[type].findIndex((log) => log.time === time);
            if (index !== -1) {
                BattleLogs.Summarize.LogsArray[type].splice(index, 1);
            }
            BattleLogs.Utils.LocalStorage.delLogValue(BattleLogs.Summarize.Settings[type].Logs, time)
        } else {
            let index = BattleLogs[type].LogsArray.findIndex((log) => log.time === time);
            if (index !== -1) {
                BattleLogs[type].LogsArray.splice(index, 1);
            }
            BattleLogs.Utils.LocalStorage.delLogValue(BattleLogs[type].Settings.Logs, time)
        }
        pElem.parentNode.removeChild(pElem);
    }

    /**
     * @desc Return logs if filter is enable
     *
     * @return Array of logs
     */
    static getLogs() {
        let logs = [];
        for (const key in BattleLogs.Message.Filters) {
            if (BattleLogs.Message.Filters[key].enable) {
                if (BattleLogs[key]) {
                    logs = logs.concat(BattleLogs[key]["LogsArray"]);
                } else if (/x\d/.test(key)) {
                    logs = logs.concat(BattleLogs.Summarize.LogsArray[key]);
                }
            }
        }
        return logs
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    static __internal__messagesContainer = null;
    static __internal__messagesActions = null;
    static __internal__format = {
        normal: {
            selected: false,
            title: "Affichage normal"
        },
        short: {
            selected: false,
            title: "Affichage court"
        },
        list: {
            selected: false,
            title: "Affichage en liste"
        }
    };
    static __internal__joiner = {
        fragments: {
            normal: " ",
            short: " ",
            list: "\n"
        }
    };

    /**
     * @desc Builds the menu
     */
    static __internal__buildMenu() {
        // Add messages container to battle logs menu
        this.__internal__messagesContainer = document.createElement("div");
        this.__internal__messagesContainer.id = "battlelogs-messages_container";
        this.__internal__messagesContainer.classList.add("messages");
        BattleLogs.Menu.BattleLogsWrapper.appendChild(
            this.__internal__messagesContainer
        );

        // Add actions tab
        this.__internal__addActions(
            "battlelogs-actions_messages",
            BattleLogs.Menu.BattleLogsActions
        );

        // Add settings and format buttons
        const buttonsGroup = BattleLogs.Menu.addButtonsGroup(
            BattleLogs.Menu.BattleLogsSettingsFooterLeft
        );
        this.__internal__addSettingsButton(
            this.Settings.MessageSettingsOpen,
            buttonsGroup
        );
        BattleLogs.Menu.addSeparator(buttonsGroup);
        this.__internal__addFormatButtons(buttonsGroup);
    }

    /**
     * @desc Add menu for actions
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addActions(id, containingDiv) {
        const actionsElem = document.createElement("div");
        actionsElem.id = id;
        actionsElem.classList.add("actions");

        // Add button to clear messages
        this.__internal__addClearButton("messagesClear", actionsElem);

        // Add filters
        const filtersElem = document.createElement("div");
        filtersElem.classList.add("buttons-group");
        actionsElem.appendChild(filtersElem);
        this.__internal__addFilters(filtersElem);

        this.__internal__messagesActions = actionsElem;
        containingDiv.append(this.__internal__messagesActions);
    }

    /**
     * @desc Add button to clear messages
     *
     * @param {string} id: The button id (that will be used for the corresponding local storage item id as well)
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addClearButton(id, containingDiv) {
        const clearButton = document.createElement("button");
        clearButton.id = id;
        clearButton.classList.add("svg_trash");
        clearButton.title = "Supprimer les messages";

        clearButton.onclick = () => {
            const confirmed = window.confirm("Tu vas supprimer les messages affichés, es-tu sûr ?");
            if (confirmed) {
                for (const [key, value] of Object.entries(BattleLogs.Message
                    .Filters)) {
                    if (value.enable) {
                        // Reset logs array and local storage
                        if (BattleLogs[key]) {
                            BattleLogs[key].LogsArray = [];
                            BattleLogs.Utils.LocalStorage.resetDefaultComplexValue(
                                BattleLogs[key].Settings.Logs,
                                []
                            );
                        } else if (/x\d/.test(key)) {
                            BattleLogs.Summarize.LogsArray[key] = [];
                            BattleLogs.Utils.LocalStorage.resetDefaultComplexValue(
                                BattleLogs.Summarize.Settings[key].Logs,
                                []
                            );
                        }
                    }
                }
                this.updateMessages();
            }
        };

        containingDiv.appendChild(clearButton);
    }

    /**
     * @desc Add filters to div
     *
     * @param {Element} containingDiv: The div element to append filters to
     */
    static __internal__addFilters(containingDiv) {
        // Group filters
        const grouped = this.__internal__groupFiltersBy("group");

        grouped.forEach((keys, index) => {
            // Create group for buttons
            const buttonsGroup = BattleLogs.Menu.addButtonsGroup(containingDiv);

            // Add filters in group
            keys.forEach((key) => {
                const filter = BattleLogs.Menu.addButtonFilter(
                    key,
                    this.Filters[key].title,
                    buttonsGroup
                );
                // Add event listener
                this.__internal__toggleFilterButton(filter);
            });

            // Add a separator if it is not the last group
            if (index !== grouped.size - 1) {
                BattleLogs.Menu.addSeparator(containingDiv);
            }
        });
    }

    /**
     * @desc Add format buttons to div
     *
     * @param {Element} containingDiv: The div element to append filters to
     */
    static __internal__addFormatButtons(containingDiv) {
        // Create group for format buttons
        const buttonsGroup = BattleLogs.Menu.addButtonsGroup(containingDiv);
        Object.keys(this.__internal__format).forEach((key) => {
            // Create button
            const formatButton = document.createElement("button");
            formatButton.id = "format-" + key;
            formatButton.title = this.__internal__format[key].title;
            formatButton.classList.add("svg_format-" + key);
            if (this.__internal__format[key].selected) {
                formatButton.classList.add("selected");
            }
            // Add event listener on format button
            this.__internal__toggleFormatButton(formatButton);

            // Append button to group
            buttonsGroup.appendChild(formatButton);
        });
    }

    /**
     * @desc Add a Settings button element
     *
     * @param {string} id: The button id (that will be used for the corresponding local storage item id as well)
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addSettingsButton(id, containingDiv) {
        const buttonElem = document.createElement("button");
        buttonElem.id = id;
        buttonElem.classList.add("svg_settings");

        let inSettings = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (inSettings) {
            this.__internal__messagesContainer.classList.add("hidden");
            this.__internal__messagesActions.classList.add("hidden");
            buttonElem.classList.add("selected");
            buttonElem.title = "Logs";
        } else {
            BattleLogs.Menu.BattleLogsSettings.classList.add("hidden");
            buttonElem.title = "Paramètres";
        }
        buttonElem.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                if (BattleLogs.Menu.BattleLogsSettings.classList.contains(
                    "hidden")) {
                    BattleLogs.Menu.BattleLogsSettings.classList.remove("hidden");
                    this.__internal__messagesActions.classList.add("hidden");
                    this.__internal__messagesContainer.classList.add("hidden");
                    buttonElem.classList.add("selected");
                    buttonElem.title = "Logs";
                }
            } else {
                if (!BattleLogs.Menu.BattleLogsSettings.classList.contains(
                    "hidden")) {
                    BattleLogs.Menu.BattleLogsSettings.classList.add("hidden");
                    this.__internal__messagesActions.classList.remove("hidden");
                    this.__internal__messagesContainer.classList.remove("hidden");
                    buttonElem.classList.remove("selected");
                    buttonElem.title = "Paramètres";
                }
            }

            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, newStatus);
        };

        containingDiv.appendChild(buttonElem);
    }

    /**
     * @desc Add event on filter button
     *
     * @param {Element} buttonElem: The button element to add toggle filter
     */
    static __internal__toggleFilterButton(buttonElem) {
        if (this.Filters[buttonElem.id.split(/-/).pop()].enable !== false)
            buttonElem.classList.add("selected");
        buttonElem.onclick = () => {
            if (buttonElem.classList.contains("selected")) {
                buttonElem.classList.remove("selected");
                this.Filters[buttonElem.id.split(/-/).pop()].enable = false;
            } else {
                buttonElem.classList.add("selected");
                this.Filters[buttonElem.id.split(/-/).pop()].enable = true;
            }
            BattleLogs.Utils.LocalStorage.setComplexValue(
                this.Settings.MessageFilters,
                this.Filters
            );
            this.updateMessages();
        };
    }

    /**
     * @desc Add event on format button
     *
     * @param {Element} buttonElem: The button element to add toggle filter
     */
    static __internal__toggleFormatButton(buttonElem) {
        buttonElem.onclick = () => {
            const formatButtons = buttonElem.parentNode.querySelectorAll(
                "button");
            formatButtons.forEach((button) => {
                button.classList.remove("selected");
                this.__internal__format[button.id.split(/-/).pop()].selected =
                    false;
            });
            buttonElem.classList.add("selected");
            this.__internal__format[buttonElem.id.split(/-/).pop()].selected =
                true;
            this.Settings.Format = buttonElem.id.split(/-/).pop();
            BattleLogs.Utils.LocalStorage.setValue(
                this.Settings.MessageFormat,
                this.Settings.Format
            );
            this.updateMessages();
        };
    }

    /**
     * @desc Regroup filters by attribute
     *
     * @param {string} attribute: Attribute used to group elements
     *
     * @returns Filters grouped by attribute
     */
    static __internal__groupFiltersBy(attribute) {
        const map = new Map();
        Object.keys(this.Filters).forEach((item) => {
            const key = this.Filters[item][attribute];
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }

    /**
     * @desc Return logs in orders sorted by date and sliced
     *
     * @returns Logs ordered by date and sliced
     */
    static __internal__getLogsInOrders() {
        const logs = this.getLogs();
        return BattleLogs.Utils.sortArrayByDate(logs).slice(-100);
    }

    /**
     * @desc Load the Message settings values stored in the local storage
     */
    static __internal__loadSettingValues() {
        const filters = BattleLogs.Utils.LocalStorage.getComplexValue(
            this.Settings.MessageFilters
        );
        if (filters !== null) {
            for (const key in this.Filters) {
                if (filters.hasOwnProperty(key)) {
                    this.Filters[key] = filters[key];
                }
            }
        }
        const format = BattleLogs.Utils.LocalStorage.getValue(
            this.Settings.MessageFormat
        );
        if (format !== null) {
            this.__internal__format[format].selected = true;
            this.Settings.Format = format;
        }
    }

    /**
     * @desc Sets the Message settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(
            this.Settings.MessageFilters,
            this.Filters
        );
        BattleLogs.Utils.LocalStorage.setDefaultValue(
            this.Settings.MessageFormat,
            "normal"
        );
    }
}