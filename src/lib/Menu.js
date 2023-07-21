/**
 * @class The BattleLogsMenu regroups any utility methods used to create the GUI
 */
class BattleLogsMenu {
    static Settings = {
        MenuSide: "Menu-Side",
        MenuExpanded: "Menu-Expanded",
        MenuWidth: "Menu-Width"
    };

    static BattleLogsActions;
    static BattleLogsWrapper;
    static BattleLogsSettings;
    static BattleLogsSettingsFooterLeft;
    static BattleLogsSettingsFooterRight;

    /**
     * @desc Builds the menu container, inside of which any interface element should be placed.
     *        It creates the `BattleLogs` menu panel as well.
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        // Only consider the BuildMenu init step
        if (initStep !== BattleLogs.InitSteps.BuildMenu) return;

        // Create general container
        this.__internal__battleLogsContainer = document.createElement("div");
        this.__internal__battleLogsContainer.id = "battleLogsContainer";

        // Append menu
        document.body.appendChild(this.__internal__battleLogsContainer);

        // Set default settings
        this.__internal__setDefaultSettingValues();
    }

    /**
     * @desc Adds the BattleLogs panel
     */
    static addMainBattleLogsPanel(initStep) {
        // Only consider the BuildMenu init step
        if (initStep !== BattleLogs.InitSteps.BuildMenu)
            return;

        // Add global elements
        this.__internal__injectBattleLogsHtml();
        this.__internal__injectBattleLogsCss();

        // Set internal console element and set width
        this.__internal__battleLogsConsole = document.getElementById(
            "battlelogs-console"
        );
        this.__internal__battleLogsConsole.style.width = BattleLogs.Utils
            .LocalStorage.getValue(
                this.Settings.MenuWidth
            );

        // Add resize element
        this.__internal_addResizeElement(
            this.Settings.MenuWidth,
            this.__internal__battleLogsConsole
        );

        // Add header actions
        const headerButtons = document.getElementById(
            "battlelogs-console_header-buttons"
        );
        this.__internal__addDockSideButton(this.Settings.MenuSide, headerButtons);
        this.__internal__addExpandButton(this.Settings.MenuExpanded,
            headerButtons);

        // If user is on phone
        if (this.__internal__isPhone) {
            this.__internal__addPhoneElement(
                "battlelogs-phone_expand",
                this.__internal__battleLogsContainer
            );
        }

        // Set elements
        this.BattleLogsWrapper = document.getElementById("battlelogs-wrapper");
        this.BattleLogsActions = document.getElementById("battlelogs-actions");
        this.BattleLogsSettingsFooterLeft = document.getElementById(
            "battlelogs-settings_footer-left"
        );
        this.BattleLogsSettingsFooterRight = document.getElementById(
            "battlelogs-settings_footer-right"
        );

        // Add settings container
        this.BattleLogsSettings = document.createElement("div");
        this.BattleLogsSettings.id = "battlelogs-menu_settings";
        this.BattleLogsWrapper.appendChild(this.BattleLogsSettings);
    }

    /**
     * @desc Adds a separator line to the given @p containingDiv
     *
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static addButtonsGroup(containingDiv) {
        const groupDiv = document.createElement("div");
        groupDiv.classList.add("buttons-group");
        containingDiv.appendChild(groupDiv);
        return groupDiv;
    }

    /**
     * @desc Adds a separator line to the given @p containingDiv
     *
     * @param {string} id: The button id
     * @param {string} title: The title of filter
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static addButtonFilter(id, title, containingDiv) {
        const filterButton = document.createElement("button");
        filterButton.id = "filter-" + id;
        filterButton.textContent = title;
        filterButton.classList.add("filter");
        containingDiv.appendChild(filterButton);
        return filterButton;
    }

    /**
     * @desc Adds a separator line to the given @p containingDiv
     *
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static addSeparator(containingDiv) {
        const separatorDiv = document.createElement("div");
        separatorDiv.classList.add("vl");
        containingDiv.appendChild(separatorDiv);
    }

    /**
     * @desc Add settings in battle logs menu
     *
     * @param {Object} settings: menu settings to add
     * @param {Object} ref: object to reference settings
     * @param {string} type: type of settings
     */
    static addSettings(settings, ref, type) {
        Object.entries(settings).forEach(entry => {
            const [topKey, values] = entry;

            // Create section for every stats settings
            const divElem = document.createElement("div");
            divElem.classList.add("settings-section")

            // Create title
            const title = document.createElement("h3");
            title.textContent = values.title

            // Create list
            const list = document.createElement("ul")
            Object.entries(values.stats).forEach(value => {
                const [key, objValue] = value
                // If stat can be set in settings
                if (objValue.setting) {
                    // Create item
                    const bullet = document.createElement("li")
                    bullet.classList.add("disable-select")

                    // Create input checkbox
                    const checkbox = document.createElement("input")
                    checkbox.id = topKey + '-' + key
                    checkbox.name = topKey + '-' + key
                    checkbox.type = objValue.type

                    if (ref !== null && checkbox.name in ref) {
                        if (checkbox.type === "checkbox") {
                            checkbox.checked = ref[checkbox.name] ? ref[checkbox.name] : checkbox.checked
                        } else if (checkbox.type === "color") {
                            checkbox.value = ref[checkbox.name] ? ref[checkbox.name] : checkbox.value
                        }
                    } else {
                        if (objValue.type === "checkbox") {
                            checkbox.checked = objValue.display
                        } else if (objValue.type === "color") {
                            checkbox.value = objValue.display
                        }
                        checkbox.checked = objValue.display
                        ref[checkbox.name] = objValue.display
                    }
                    this.toggleCheckedInput(checkbox, ref)
                    this.__internal__inputsSettings.push({element:checkbox, type:type})

                    // Create label
                    const label = document.createElement("label")
                    label.htmlFor = topKey + '-' + key
                    label.textContent = objValue.text

                    // Append input and label to item
                    bullet.appendChild(checkbox)
                    bullet.appendChild(label)

                    // Append item to list
                    list.appendChild(bullet)
                }
            })
            // Append title and list to section
            divElem.appendChild(title)
            divElem.appendChild(list)

            // Append section to menu settings
            this.BattleLogsSettings.appendChild(divElem)

            // Set inputs settings
            this.__internal__setInputsSettings(ref);
        })
    }


    /**
     * @desc Add event on settings inputs
     *
     * @param {Element} inputElem: The input element to add toggle checked
     * @param {Object} ref: object to reference settings
     */
    static toggleCheckedInput(inputElem, ref) {
        inputElem.onchange = () => {
            this.__internal__setInputsSettings(ref);
            this.__internal__updateMessages();
        }
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    static __internal__battleLogsContainer = null;
    static __internal__battleLogsConsole = null;
    static __internal__battleLogsPosition = null;
    static __internal__battleLogsResizeElement = null;
    static __internal__battleLogsDockSideElement = null;
    static __internal__isPhone = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    static __internal__inputsSettings = [];
    static __internal__delayUpdate = null;

    /**
     * @desc Set input settings value in local storage on update
     */
    static __internal__setInputsSettings() {
        this.__internal__inputsSettings.forEach((input) => {
            const settings = BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs[input.type].Settings.MenuSettings);
            if (input.element.type === "checkbox") {
                settings[input.element.name] = input.element.checked;
            } else if (input.element.type === "color") {
                settings[input.element.name] = input.element.value;
            }
            BattleLogs.Utils.LocalStorage.setComplexValue(BattleLogs[input.type].Settings.MenuSettings, settings);
            BattleLogs[input.type].updateSettings();
        });
    }

    /**
     * @desc Update message and add delay to prevent excessive reload when user toggle filters in settings
     */
    static __internal__updateMessages() {
        clearTimeout(this.__internal__delayUpdate);
        this.__internal__delayUpdate = setTimeout(function () {
            BattleLogs.Message.updateMessages()
        }, 1500);
    }

    /**
     * @desc Add phone element
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addPhoneElement(id, containingDiv) {
        // Create horizontal element
        const phoneElem = document.createElement("div");
        phoneElem.id = id;
        phoneElem.classList.add("header");

        // Add title
        const titleDiv = document.createElement("div");
        titleDiv.classList.add("title");
        titleDiv.innerText = "LaCalv Battle Logs";

        // Set SVG
        const svgSpan = document.createElement("span");
        svgSpan.classList.add("svg_chevron-right");

        // Append spans to phone element
        phoneElem.appendChild(titleDiv);
        phoneElem.appendChild(svgSpan);

        // Add onclick event
        phoneElem.onclick = () => {
            this.__internal__battleLogsConsole.classList.toggle("hidden");
            this.BattleLogsWrapper.scrollTop = this.BattleLogsWrapper
                .scrollHeight;
        };

        // Append element to container
        containingDiv.appendChild(phoneElem);

        // Set class to change comportment
        this.__internal__battleLogsConsole.classList.add("hidden");
        this.__internal__battleLogsResizeElement.classList.add("hidden");
        this.__internal__battleLogsDockSideElement.classList.add("hidden");
        this.__internal__battleLogsConsole.classList.add("phone");
    }

    /**
     * @desc Add an Expand button element
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addExpandButton(id, containingDiv) {
        const buttonElem = document.createElement("button");
        buttonElem.id = id;

        let isExpanded = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (this.__internal__isPhone) {
            buttonElem.classList.add("svg_chevron-left");
            buttonElem.title = "Réduire";
        } else if (isExpanded) {
            this.__internal__battleLogsConsole.classList.add("expanded");
            buttonElem.classList.add("svg_chevron-up");
            buttonElem.title = "Réduire";
        } else {
            buttonElem.classList.add("svg_chevron-down");
            buttonElem.title = "Développer";
        }
        buttonElem.onclick = () => {
            if (this.__internal__isPhone) {
                this.__internal__battleLogsConsole.classList.add("hidden");
                return;
            }
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                // Only update the class if the console was not expanded
                if (!this.__internal__battleLogsConsole.classList.contains(
                    "expanded")) {
                    buttonElem.classList.remove("svg_chevron-down");
                    buttonElem.classList.add("svg_chevron-up");
                    buttonElem.title = "Réduire";
                    this.__internal__battleLogsConsole.classList.add("expanded");
                }
            } else {
                // Only update the class if the console expanded
                if (this.__internal__battleLogsConsole.classList.contains(
                    "expanded")) {
                    buttonElem.classList.remove("svg_chevron-up");
                    buttonElem.classList.add("svg_chevron-down");
                    buttonElem.title = "Développer";
                    this.__internal__battleLogsConsole.classList.remove("expanded");
                }
            }

            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, newStatus);
        };

        containingDiv.appendChild(buttonElem);
    }

    /**
     * @desc Add dock side button element
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addDockSideButton(id, containingDiv) {
        let buttonElem = document.createElement("button");
        buttonElem.id = id;

        let sideRight = BattleLogs.Utils.LocalStorage.getValue(id) === "right";
        if (sideRight) {
            buttonElem.classList.add("svg_dock-left");
            buttonElem.title = "Ancrer à gauche";
            this.__internal__battleLogsConsole.classList.add("side-right");
            this.__internal_changeGameSide("right");
        } else {
            buttonElem.classList.add("svg_dock-right");
            buttonElem.title = "Ancrer à droite";
            this.__internal__battleLogsConsole.classList.add("side-left");
            this.__internal_changeGameSide("left");
        }

        buttonElem.onclick = () => {
            const newSide = BattleLogs.Utils.LocalStorage.getValue(id) ===
            "right" ? "left" : "right";
            if (newSide === "right") {
                if (!this.__internal__battleLogsConsole.classList.contains(
                    "side-right")) {
                    buttonElem.classList.remove("svg_dock-right");
                    buttonElem.classList.add("svg_dock-left");
                    buttonElem.title = "Ancrer à gauche";
                    this.__internal__battleLogsConsole.classList.remove("side-left");
                    this.__internal__battleLogsConsole.classList.add("side-right");
                    this.__internal__battleLogsResizeElement.classList.remove(
                        "side-right");
                    this.__internal__battleLogsResizeElement.classList.add(
                        "side-left");
                    this.__internal_changeGameSide(newSide);
                }
            } else {
                if (!this.__internal__battleLogsConsole.classList.contains(
                    "side-left")) {
                    buttonElem.classList.remove("svg_dock-left");
                    buttonElem.classList.add("svg_dock-right");
                    buttonElem.title = "Ancrer à droite";
                    this.__internal__battleLogsConsole.classList.remove("side-right");
                    this.__internal__battleLogsConsole.classList.add("side-left");
                    this.__internal__battleLogsResizeElement.classList.remove(
                        "side-left");
                    this.__internal__battleLogsResizeElement.classList.add(
                        "side-right");
                    this.__internal_changeGameSide(newSide);
                }
            }

            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, newSide);
        };

        containingDiv.appendChild(buttonElem);
        this.__internal__battleLogsDockSideElement = buttonElem;
    }

    /**
     * @desc Change game side
     *
     * @param {string} side: Side of console element
     */
    static __internal_changeGameSide(side) {
        const rightBar = document.querySelector("#rightBar")
        const gameOut = document.querySelector(".game-out")
        const game = document.querySelector(".game");
        const menuSettings = BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs.Option.Settings.MenuSettings);
        const hiddenByBattleLogs = menuSettings ? menuSettings["display-hiddenByBattleLogs"] : null;
        if (!game)
            return;
        if (!(side === "right")) {
            game.style.margin = "unset"
            game.style.marginLeft = "auto";
            gameOut.style.removeProperty("margin-left")
            gameOut.style.marginRight = BattleLogs.Utils.LocalStorage.getValue(BattleLogs.Option.Settings.OptionChatHidden) === "true" ? "0" : "18%";
            if (hiddenByBattleLogs) {
                rightBar.style.left = "0";
                rightBar.style.removeProperty("right")
            } else {
                rightBar.style.right = "0";
                rightBar.style.removeProperty("left")
            }
        } else {
            game.style.margin = "unset"
            game.style.marginRight = "auto";
            gameOut.style.removeProperty("margin-right")
            gameOut.style.marginLeft = BattleLogs.Utils.LocalStorage.getValue(BattleLogs.Option.Settings.OptionChatHidden) === "true" ? "0" : "18%";
            if (hiddenByBattleLogs) {
                rightBar.style.right = "0";
                rightBar.style.removeProperty("left")
            } else {
                rightBar.style.left = "0";
                rightBar.style.removeProperty("right")
            }
        }
    }

    /**
     * @desc Add resize element
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal_addResizeElement(id, containingDiv) {
        const divElem = document.createElement("div");
        divElem.id = id;
        divElem.classList.add("console-resize");

        let sideLeft = BattleLogs.Utils.LocalStorage.getValue(
            BattleLogs.Menu.Settings.MenuSide
        ) === "left";
        if (sideLeft) {
            divElem.classList.add("side-right");
        } else {
            divElem.classList.add("side-left");
        }

        divElem.onmousedown = (e) => {
            BattleLogsMenu.__internal__battleLogsPosition = e.x;
            if (!divElem.classList.contains("side-right")) {
                document.addEventListener(
                    "mousemove",
                    BattleLogs.Menu.__internal_resizeRight,
                    false
                );
            } else {
                document.addEventListener(
                    "mousemove",
                    BattleLogs.Menu.__internal_resizeLeft,
                    false
                );
            }
        };

        containingDiv.appendChild(divElem);
        this.__internal__battleLogsResizeElement = divElem;
    }

    /**
     * @desc Resize console side right
     *
     * @param {Event} e: Event passed in argument
     */
    static __internal_resizeRight(e) {
        const resizeElem = document.getElementById(BattleLogs.Menu.Settings
            .MenuWidth);
        const parent = resizeElem.parentNode;
        const dx = BattleLogs.Menu.__internal__battleLogsPosition - e.x;
        BattleLogs.Menu.__internal__battleLogsPosition = e.x;
        BattleLogs.Menu.__internal__battleLogsContainer.classList.add(
            "disable-select");
        parent.style.width = parseInt(getComputedStyle(parent, "").width) + dx +
            "px";
        document.onmouseup = () => {
            document.removeEventListener(
                "mousemove",
                BattleLogs.Menu.__internal_resizeRight
            );
            BattleLogs.Menu.__internal__battleLogsContainer.classList.remove(
                "disable-select"
            );
            BattleLogs.Utils.LocalStorage.setValue(resizeElem.id, parent.style
                .width);
        };
    }

    /**
     * @desc Resize console side right
     *
     * @param {Event} e: Event passed in argument
     */
    static __internal_resizeLeft(e) {
        const resizeElem = document.getElementById(BattleLogs.Menu.Settings
            .MenuWidth);
        const parent = resizeElem.parentNode;
        const dx = BattleLogs.Menu.__internal__battleLogsPosition - e.x;
        BattleLogs.Menu.__internal__battleLogsPosition = e.x;
        BattleLogs.Menu.__internal__battleLogsContainer.classList.add(
            "disable-select");
        parent.style.width = parseInt(getComputedStyle(parent, "").width) - dx +
            "px";
        document.onmouseup = () => {
            document.removeEventListener(
                "mousemove",
                BattleLogs.Menu.__internal_resizeLeft
            );
            BattleLogs.Menu.__internal__battleLogsContainer.classList.remove(
                "disable-select"
            );
            BattleLogs.Utils.LocalStorage.setValue(resizeElem.id, parent.style
                .width);
        };
    }

    /**
     * @desc Injects the battle logs menu html to the document body
     */
    static __internal__injectBattleLogsHtml() {
        // Github only serves plain-text so we can't load it as a script object directly
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                // Append the content into battle logs container
                this.__internal__battleLogsContainer.innerHTML = request
                    .responseText;
            }
        }.bind(this);

        // Download the content
        request.open(
            "GET",
            BattleLogsComponentLoader.__baseUrl + "battlelogs.html",
            false
        );
        request.send();
    }

    /**
     * @desc Injects the battle logs menu css to the document heading
     */
    static __internal__injectBattleLogsCss() {
        // Github only serves plain-text so we can't load it as a script object directly
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                // Store the content into a style div
                const style = document.createElement("style");
                style.innerHTML = request.responseText;
                document.head.appendChild(style);
            }
        }.bind(this);

        // Download the content
        request.open(
            "GET",
            BattleLogsComponentLoader.__baseUrl + "battlelogs.css",
            false
        );
        request.send();
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultValue(this.Settings.MenuSide,
            "left");
        BattleLogs.Utils.LocalStorage.setDefaultValue(this.Settings.MenuWidth,
            "500px");
        BattleLogs.Utils.LocalStorage.setDefaultValue(
            this.Settings.MenuExpanded,
            "false"
        );
    }
}