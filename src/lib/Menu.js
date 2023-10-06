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

    static ToggleButton
    static Menu

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

        const menuContainer = document.createElement("div");
        menuContainer.id = "menu-container";
        this.__internal__battleLogsContainer = document.createElement("div");
        this.__internal__battleLogsContainer.id = "menu"
        this.__internal__battleLogsContainer.classList.add("draggable")
        menuContainer.appendChild(this.__internal__battleLogsContainer)
        this.Menu = this.__internal__battleLogsContainer

        this.ToggleButton = document.createElement("button")
        this.ToggleButton.id = "toggle-button";
        this.ToggleButton.classList.add("toggle-button")

        // Append menu
        document.body.appendChild(menuContainer);
        // Append toggle button
        document.body.appendChild(this.ToggleButton);

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

        const menu = this.Menu
        const toggleButton = this.ToggleButton;
        const content = document.querySelector('.content');
        let isDragging = false;
        let mouseMoved = false;
        let offsetX, offsetY;


        function mouseClick() {
            if (!mouseMoved) {
                menu.classList.toggle('open');
                if (menu.classList.contains('open')) {
                    toggleButton.innerHTML = 'x';
                    content.style.display = 'block';
                    menu.classList.add("resizable")
                } else {
                    toggleButton.innerHTML = '';
                    content.style.display = 'none';
                    menu.classList.remove("resizable")
                }
            }
            mouseMoved = false;
            BattleLogs.Menu.adjustMenuPosition()
        }

        toggleButton.addEventListener('click', mouseClick)

        let timeout;

        function toggleButtonMove(e) {
            toggleButton.removeEventListener('click', mouseClick);
            if (isDragging) {
                toggleButton.style.left = (e.clientX - offsetX) + 'px';
                toggleButton.style.top = (e.clientY - offsetY) + 'px';
            }
            mouseMoved = true
        }
        function startDraggingToggleButton(e) {
            document.addEventListener('mousemove', toggleButtonMove);
            isDragging = true;
            document.querySelector("#GameDiv").classList.add("pointer-none");
            offsetX = e.clientX - toggleButton.offsetLeft;
            offsetY = e.clientY - toggleButton.offsetTop;
        }

        toggleButton.addEventListener('mousedown', function(e) {
            timeout = setTimeout(() => startDraggingToggleButton(e), 100);
        });

        toggleButton.addEventListener('mouseup', function() {
            clearTimeout(timeout);
            isDragging = false;
            document.removeEventListener('mousemove', toggleButtonMove);
            document.querySelector("#GameDiv").classList.remove("pointer-none");
            toggleButton.addEventListener('click', mouseClick)
        });


        function menuMove(e) {
            menu.removeEventListener('click', mouseClick);
            if (isDragging) {
                menu.style.left = (e.clientX - offsetX) + 'px';
                menu.style.top = (e.clientY - offsetY) + 'px';
            }
            mouseMoved = true
        }
        function startDraggingMenu(e) {
            document.addEventListener('mousemove', menuMove);
            isDragging = true;
            document.querySelector("#GameDiv").classList.add("pointer-none");
            offsetX = e.clientX - menu.offsetLeft;
            offsetY = e.clientY - menu.offsetTop;
        }

        menu.addEventListener('mousedown', function(e) {
            timeout = setTimeout(() => startDraggingMenu(e), 100);
        });

        menu.addEventListener('mouseup', function() {
            clearTimeout(timeout);
            isDragging = false;
            document.removeEventListener('mousemove', menuMove);
            document.querySelector("#GameDiv").classList.remove("pointer-none");
        });


        window.addEventListener('resize', this.adjustMenuPosition);

        // Add header actions
        const headerButtons = document.getElementById(
            "battlelogs-console_header-buttons"
        );
        this.__internal__addExpandButton(this.Settings.MenuExpanded, headerButtons);

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


    static moveToggleButtonByMenuPosition() {
        const menu = document.getElementById('menu');
        const toggleButton = document.getElementById('toggle-button');
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const middleX = rect.left + (rect.width / 2);
        const middleY = rect.top + (rect.height / 2);

        // if (middleX < windowWidth / 2) {
        //     if (middleY < windowHeight / 2) {
        //         toggleButton.style.left = '0';
        //         toggleButton.style.right = 'auto';
        //         toggleButton.style.top = '0';
        //         toggleButton.style.bottom = 'auto';
        //     } else {
        //         toggleButton.style.left = '0';
        //         toggleButton.style.right = 'auto';
        //         toggleButton.style.top = 'auto';
        //         toggleButton.style.bottom = '0';
        //     }
        // } else {
        //     if (middleY < windowHeight / 2) {
        //         toggleButton.style.left = 'auto';
        //         toggleButton.style.right = '0';
        //         toggleButton.style.top = '0';
        //         toggleButton.style.bottom = 'auto';
        //     } else {
        //         toggleButton.style.left = 'auto';
        //         toggleButton.style.right = '0';
        //         toggleButton.style.top = 'auto';
        //         toggleButton.style.bottom = '0';
        //     }
        // }
    }

    static adjustMenuPosition() {
        const menu = document.getElementById('menu');
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;

        const menuLeft = parseInt(menu.style.left, 10);
        const menuTop = parseInt(menu.style.top, 10);

        if (menuLeft + menuWidth > viewportWidth) {
            menu.style.left = (viewportWidth - menuWidth) + 'px';
        }
        if (menuTop + menuHeight > viewportHeight) {
            menu.style.top = (viewportHeight - menuHeight) + 'px';
        }
        if (menuLeft < 0) {
            menu.style.left = '0';
        }
        if (menuTop < 0) {
            menu.style.top = '0';
        }
        // this.moveToggleButtonByMenuPosition();
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
     * @desc Add an Expand button element
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addExpandButton(id, containingDiv) {
        const buttonElem = document.createElement("button");
        buttonElem.id = id;

        const toggleButton = document.getElementById('toggle-button');
        const content = document.querySelector('.content');
        const menu = document.getElementById('menu');

        let isExpanded = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (this.__internal__isPhone) {
            buttonElem.classList.add("svg_chevron-left");
            buttonElem.title = "Réduire";
        } else if (isExpanded) {
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
            content.style.display = 'none';
            toggleButton.classList.remove("hidden")
            menu.classList.remove('open');
            menu.classList.remove("resizable")
            // this.adjustMenuPosition()
        };

        containingDiv.appendChild(buttonElem);
    }


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

    // /**
    //  * @desc Add an Expand button element
    //  *
    //  * @param {string} id: The button id
    //  * @param {Element} containingDiv: The div element to append the button to
    //  */
    // static __internal__addExpandButton(id, containingDiv) {
    //     const buttonElem = document.createElement("button");
    //     buttonElem.id = id;
    //
    //     let isExpanded = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
    //     if (this.__internal__isPhone) {
    //         buttonElem.classList.add("svg_chevron-left");
    //         buttonElem.title = "Réduire";
    //     } else if (isExpanded) {
    //         this.__internal__battleLogsConsole.classList.add("expanded");
    //         buttonElem.classList.add("svg_chevron-up");
    //         buttonElem.title = "Réduire";
    //     } else {
    //         buttonElem.classList.add("svg_chevron-down");
    //         buttonElem.title = "Développer";
    //     }
    //     buttonElem.onclick = () => {
    //         if (this.__internal__isPhone) {
    //             this.__internal__battleLogsConsole.classList.add("hidden");
    //             return;
    //         }
    //         const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
    //             "true");
    //         if (newStatus) {
    //             // Only update the class if the console was not expanded
    //             if (!this.__internal__battleLogsConsole.classList.contains(
    //                 "expanded")) {
    //                 buttonElem.classList.remove("svg_chevron-down");
    //                 buttonElem.classList.add("svg_chevron-up");
    //                 buttonElem.title = "Réduire";
    //                 this.__internal__battleLogsConsole.classList.add("expanded");
    //             }
    //         } else {
    //             // Only update the class if the console expanded
    //             if (this.__internal__battleLogsConsole.classList.contains(
    //                 "expanded")) {
    //                 buttonElem.classList.remove("svg_chevron-up");
    //                 buttonElem.classList.add("svg_chevron-down");
    //                 buttonElem.title = "Développer";
    //                 this.__internal__battleLogsConsole.classList.remove("expanded");
    //             }
    //         }
    //
    //         BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, newStatus);
    //     };
    //
    //     containingDiv.appendChild(buttonElem);
    // }

    // /**
    //  * @desc Add dock side button element
    //  *
    //  * @param {string} id: The button id
    //  * @param {Element} containingDiv: The div element to append the button to
    //  */
    // static __internal__addDockSideButton(id, containingDiv) {
    //     let buttonElem = document.createElement("button");
    //     buttonElem.id = id;
    //
    //     let sideRight = BattleLogs.Utils.LocalStorage.getValue(id) === "right";
    //     if (sideRight) {
    //         buttonElem.classList.add("svg_dock-left");
    //         buttonElem.title = "Ancrer à gauche";
    //         this.__internal__battleLogsConsole.classList.add("side-right");
    //         this.__internal_changeGameSide("right");
    //     } else {
    //         buttonElem.classList.add("svg_dock-right");
    //         buttonElem.title = "Ancrer à droite";
    //         this.__internal__battleLogsConsole.classList.add("side-left");
    //         this.__internal_changeGameSide("left");
    //     }
    //
    //     buttonElem.onclick = () => {
    //         const newSide = BattleLogs.Utils.LocalStorage.getValue(id) ===
    //         "right" ? "left" : "right";
    //         if (newSide === "right") {
    //             if (!this.__internal__battleLogsConsole.classList.contains(
    //                 "side-right")) {
    //                 buttonElem.classList.remove("svg_dock-right");
    //                 buttonElem.classList.add("svg_dock-left");
    //                 buttonElem.title = "Ancrer à gauche";
    //                 this.__internal__battleLogsConsole.classList.remove("side-left");
    //                 this.__internal__battleLogsConsole.classList.add("side-right");
    //                 this.__internal__battleLogsResizeElement.classList.remove(
    //                     "side-right");
    //                 this.__internal__battleLogsResizeElement.classList.add(
    //                     "side-left");
    //                 this.__internal_changeGameSide(newSide);
    //             }
    //         } else {
    //             if (!this.__internal__battleLogsConsole.classList.contains(
    //                 "side-left")) {
    //                 buttonElem.classList.remove("svg_dock-left");
    //                 buttonElem.classList.add("svg_dock-right");
    //                 buttonElem.title = "Ancrer à droite";
    //                 this.__internal__battleLogsConsole.classList.remove("side-right");
    //                 this.__internal__battleLogsConsole.classList.add("side-left");
    //                 this.__internal__battleLogsResizeElement.classList.remove(
    //                     "side-left");
    //                 this.__internal__battleLogsResizeElement.classList.add(
    //                     "side-right");
    //                 this.__internal_changeGameSide(newSide);
    //             }
    //         }
    //
    //         BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, newSide);
    //     };
    //
    //     containingDiv.appendChild(buttonElem);
    //     this.__internal__battleLogsDockSideElement = buttonElem;
    // }

    // /**
    //  * @desc Change game side
    //  *
    //  * @param {string} side: Side of console element
    //  */
    // static __internal_changeGameSide(side) {
    //     const rightBar = document.querySelector("#rightBar")
    //     const gameOut = document.querySelector(".game-out")
    //     const game = document.querySelector(".game");
    //     const menuSettings = BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs.Option.Settings.MenuSettings);
    //     const hiddenByBattleLogs = menuSettings ? menuSettings["display-hiddenByBattleLogs"] : null;
    //     const chatHidden = BattleLogs.Utils.LocalStorage.getValue(BattleLogs.Option.Settings.OptionChatHidden) === "true"
    //     if (!game)
    //         return;
    //     if (!(side === "right")) {
    //         game.style.margin = "unset"
    //         game.style.marginLeft = "auto";
    //         if (hiddenByBattleLogs && chatHidden) {
    //             rightBar.style.left = "0";
    //             rightBar.style.removeProperty("right")
    //             rightBar.style.height = "calc(100vh - 34px)"
    //             rightBar.style.top = "34px"
    //             gameOut.style.marginLeft = "unset"
    //             gameOut.style.marginRight = "0";
    //         } else {
    //             rightBar.style.right = "0";
    //             rightBar.style.removeProperty("left")
    //             rightBar.style.height = "100vh"
    //             rightBar.style.top = "0"
    //             gameOut.style.marginLeft = "unset"
    //             gameOut.style.marginRight = chatHidden ? "0" : "18%";
    //         }
    //     } else {
    //         game.style.margin = "unset"
    //         game.style.marginRight = "auto";
    //         if (hiddenByBattleLogs && chatHidden) {
    //             rightBar.style.right = "0";
    //             rightBar.style.removeProperty("left")
    //             rightBar.style.height = "calc(100vh - 34px)"
    //             rightBar.style.top = "34px"
    //             gameOut.style.marginRight = "unset"
    //             gameOut.style.marginLeft = "0";
    //         } else {
    //             rightBar.style.left = "0";
    //             rightBar.style.removeProperty("right")
    //             rightBar.style.height = "100vh"
    //             rightBar.style.top = "0"
    //             gameOut.style.marginRight = "unset"
    //             gameOut.style.marginLeft = chatHidden ? "0" : "18%";
    //         }
    //     }
    // }

    // /**
    //  * @desc Add resize element
    //  *
    //  * @param {string} id: The button id
    //  * @param {Element} containingDiv: The div element to append the button to
    //  */
    // static __internal_addResizeElement(id, containingDiv) {
    //     const divElem = document.createElement("div");
    //     divElem.id = id;
    //     divElem.classList.add("console-resize");
    //
    //     let sideLeft = BattleLogs.Utils.LocalStorage.getValue(
    //         BattleLogs.Menu.Settings.MenuSide
    //     ) === "left";
    //     if (sideLeft) {
    //         divElem.classList.add("side-right");
    //     } else {
    //         divElem.classList.add("side-left");
    //     }
    //
    //     divElem.onmousedown = (e) => {
    //         BattleLogsMenu.__internal__battleLogsPosition = e.x;
    //         if (!divElem.classList.contains("side-right")) {
    //             document.addEventListener(
    //                 "mousemove",
    //                 BattleLogs.Menu.__internal_resizeRight,
    //                 false
    //             );
    //         } else {
    //             document.addEventListener(
    //                 "mousemove",
    //                 BattleLogs.Menu.__internal_resizeLeft,
    //                 false
    //             );
    //         }
    //     };
    //
    //     containingDiv.appendChild(divElem);
    //     this.__internal__battleLogsResizeElement = divElem;
    // }

    // /**
    //  * @desc Resize console side right
    //  *
    //  * @param {Event} e: Event passed in argument
    //  */
    // static __internal_resizeRight(e) {
    //     const resizeElem = document.getElementById(BattleLogs.Menu.Settings
    //         .MenuWidth);
    //     const parent = resizeElem.parentNode;
    //     const dx = BattleLogs.Menu.__internal__battleLogsPosition - e.x;
    //     BattleLogs.Menu.__internal__battleLogsPosition = e.x;
    //     BattleLogs.Menu.__internal__battleLogsConsole.classList.add(
    //         "disable-select");
    //     BattleLogs.Menu.__internal__battleLogsConsole.classList.add("pointer-none");
    //     document.querySelector("#GameDiv").classList.add("pointer-none");
    //     parent.style.width = parseInt(getComputedStyle(parent, "").width) + dx +
    //         "px";
    //     document.onmouseup = () => {
    //         document.removeEventListener(
    //             "mousemove",
    //             BattleLogs.Menu.__internal_resizeRight
    //         );
    //         BattleLogs.Menu.__internal__battleLogsConsole.classList.remove(
    //             "disable-select"
    //         );
    //         BattleLogs.Menu.__internal__battleLogsConsole.classList.remove("pointer-none");
    //         document.querySelector("#GameDiv").classList.remove("pointer-none");
    //         BattleLogs.Utils.LocalStorage.setValue(resizeElem.id, parent.style
    //             .width);
    //     };
    // }
    //
    // /**
    //  * @desc Resize console side right
    //  *
    //  * @param {Event} e: Event passed in argument
    //  */
    // static __internal_resizeLeft(e) {
    //     const resizeElem = document.getElementById(BattleLogs.Menu.Settings
    //         .MenuWidth);
    //     const parent = resizeElem.parentNode;
    //     const dx = BattleLogs.Menu.__internal__battleLogsPosition - e.x;
    //     BattleLogs.Menu.__internal__battleLogsPosition = e.x;
    //     BattleLogs.Menu.__internal__battleLogsConsole.classList.add(
    //         "disable-select");
    //     BattleLogs.Menu.__internal__battleLogsConsole.classList.add("pointer-none");
    //     document.querySelector("#GameDiv").classList.add("pointer-none");
    //     parent.style.width = parseInt(getComputedStyle(parent, "").width) - dx +
    //         "px";
    //     document.onmouseup = () => {
    //         document.removeEventListener(
    //             "mousemove",
    //             BattleLogs.Menu.__internal_resizeLeft
    //         );
    //         BattleLogs.Menu.__internal__battleLogsConsole.classList.remove(
    //             "disable-select"
    //         );
    //         BattleLogs.Menu.__internal__battleLogsConsole.classList.remove("pointer-none");
    //         document.querySelector("#GameDiv").classList.remove("pointer-none");
    //         BattleLogs.Utils.LocalStorage.setValue(resizeElem.id, parent.style
    //             .width);
    //     };
    // }

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