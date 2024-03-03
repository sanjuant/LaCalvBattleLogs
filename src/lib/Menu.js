/**
 * @class The BattleLogsMenu regroups any utility methods used to create the GUI
 */
class BattleLogsMenu {
    static Settings = {
        MenuOpacity: "Menu-Opacity",
        MenuExpanded: "Menu-Expanded",
        MenuWidth: "Menu-Width",
        ToggleButtonPosition: "ToggleButton-Position",
        MenuPosition: "Menu-Position",
        MenuLock: "Menu-Lock",
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

        // Set default settings
        this.__internal__setDefaultSettingValues();

        // Create general container
        this.__internal__battleLogsContainer = document.createElement("div");
        this.__internal__battleLogsContainer.id = this.Settings.MenuPosition;
        this.__internal__battleLogsContainer.classList.add("draggable")
        this.__internal__battleLogsContainer.style.cssText = BattleLogs.Utils.LocalStorage.getValue(
            BattleLogs.Menu.Settings.MenuPosition
        )
        this.Menu = this.__internal__battleLogsContainer

        this.ToggleButton = document.createElement("button")
        this.ToggleButton.id = this.Settings.ToggleButtonPosition;
        this.ToggleButton.classList.add("toggle-button")
        this.ToggleButton.style.cssText = BattleLogs.Utils.LocalStorage.getValue(
            BattleLogs.Menu.Settings.ToggleButtonPosition
        )
        let btnImg = document.createElement("img")
        btnImg.src = BattleLogsComponentLoader.__baseUrl + "images/bl_icon.png";
        this.ToggleButton.appendChild(btnImg)

        if(BattleLogs.Utils.LocalStorage.getValue(BattleLogs.Menu.Settings.MenuLock) === "true") {
            this.__internal__battleLogsContainer.classList.add('battlelogs-locked')
        }

        // Append menu
        document.body.appendChild(this.Menu);
        // Append toggle button
        document.body.appendChild(this.ToggleButton);
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
        const menuHeader = document.getElementById("menu-header")
        const toggleButton = this.ToggleButton;
        const content = document.querySelector('.bl-content');
        let isDragging = false;
        let mouseMoved = false;
        let offsetX, offsetY;

        // Check if the menu should be expanded based on local storage value
        if (BattleLogs.Utils.LocalStorage.getValue(this.Settings.MenuExpanded) === "true") {
            menu.classList.add('open');
            toggleButton.classList.add("enable");
            content.style.display = 'block';
            menu.classList.add("resizable");
        }

        function mouseClick() {
            // Handle click event for toggling menu open/close
            if (!mouseMoved) {
                menu.classList.toggle('open');
                if (menu.classList.contains('open')) {
                    toggleButton.classList.add("enable");
                    content.style.display = 'block';
                    menu.classList.add("resizable")
                    BattleLogs.Utils.LocalStorage.setValue(BattleLogs.Menu.Settings.MenuExpanded, "true");
                    BattleLogs.Message.scrollDownMessages();
                } else {
                    toggleButton.classList.remove("enable");
                    content.style.display = 'none';
                    menu.classList.remove("resizable")
                    BattleLogs.Utils.LocalStorage.setValue(BattleLogs.Menu.Settings.MenuExpanded, "false");
                }
            }
            mouseMoved = false;
            BattleLogs.Menu.adjustMenuPosition()
        }

        // Event listeners for toggle button
        toggleButton.addEventListener('click', mouseClick)

        let timeout;

        // Convert pixel positions to percentages for responsive layout
        function applyPercentagePosition(element, x, y) {
            const widthPercentage = (x / window.innerWidth) * 100;
            const heightPercentage = (y / window.innerHeight) * 100;
            element.style.left = `${widthPercentage}%`;
            element.style.top = `${heightPercentage}%`;
        }

        // Handle drag movement for the toggle button
        function toggleButtonMove(e) {
            if (!isDragging) return;
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            applyPercentagePosition(toggleButton, x, y);
            BattleLogs.Utils.LocalStorage.setValue(toggleButton.id, `${x}px,${y}px`);
            mouseMoved = true;
        }

        function startDraggingToggleButton(e) {
            document.addEventListener('mousemove', toggleButtonMove);
            isDragging = true;
            document.querySelector("#GameDiv").classList.add("pointer-none");
            const rect = toggleButton.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        }

        toggleButton.addEventListener('mousedown', function (e) {
            timeout = setTimeout(() => startDraggingToggleButton(e), 100);
        });

        toggleButton.addEventListener('mouseup', function () {
            clearTimeout(timeout);
            isDragging = false;
            document.removeEventListener('mousemove', toggleButtonMove);
            document.querySelector("#GameDiv").classList.remove("pointer-none");
            toggleButton.addEventListener('click', mouseClick)
        });

        // Handle drag movement for the main menu
        function menuMove(e) {
            if (!isDragging) return;
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            applyPercentagePosition(menu, x, y);
            BattleLogs.Utils.LocalStorage.setValue(menu.id, `${x}px,${y}px`);
            mouseMoved = true;
        }

        function startDraggingMenu(e) {
            document.addEventListener('mousemove', menuMove);
            isDragging = true;
            document.querySelector("#GameDiv").classList.add("pointer-none");
            const rect = menu.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        }

        menuHeader.addEventListener('mousedown', function (e) {
            timeout = setTimeout(() => startDraggingMenu(e), 100);
        });

        menuHeader.addEventListener('mouseup', function () {
            clearTimeout(timeout);
            isDragging = false;
            document.removeEventListener('mousemove', menuMove);
            document.querySelector("#GameDiv").classList.remove("pointer-none");
            BattleLogs.Menu.adjustMenuPosition()
        });

        // Adjust the menu position when the window is resized
        window.addEventListener('resize', this.adjustMenuPosition);

        // Observer to save menu's position when it is resized
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    BattleLogs.Utils.LocalStorage.setValue(menu.id, menu.style.cssText);
                }
            });
        });
        observer.observe(this.Menu, { attributes: true });

        // Add opacity and expand buttons to the header
        const headerButtons = document.getElementById(
            "battlelogs-console_header-buttons"
        );
        this.__internal__addLockButton(this.Settings.MenuLock, headerButtons);
        this.__internal__addOpacityButton(this.Settings.MenuOpacity, headerButtons);
        this.__internal__addExpandButton(this.Settings.MenuExpanded, headerButtons);

        // If the user is on a phone, add special phone-related UI elements
        if (this.__internal__isPhone) {
            this.__internal__addPhoneElement(
                "battlelogs-phone_expand",
                this.__internal__battleLogsContainer
            );
        }

        // Set internal references to various UI elements
        this.BattleLogsWrapper = document.getElementById("battlelogs-wrapper");
        this.BattleLogsActions = document.getElementById("battlelogs-actions");
        this.BattleLogsSettingsFooterLeft = document.getElementById(
            "battlelogs-settings_footer-left"
        );
        this.BattleLogsSettingsFooterRight = document.getElementById(
            "battlelogs-settings_footer-right"
        );

        // Add settings container to the UI
        this.BattleLogsSettings = document.createElement("div");
        this.BattleLogsSettings.id = "battlelogs-menu_settings";
        this.BattleLogsSettings.classList.add('unlocked');
        this.BattleLogsWrapper.appendChild(this.BattleLogsSettings);
    }

    static adjustMenuPosition() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const toggleButton = document.getElementById(BattleLogs.Menu.Settings.ToggleButtonPosition);
        const toggleButtonWidth = toggleButton.offsetWidth;
        const toggleButtonHeight = toggleButton.offsetHeight;

        const toggleButtonLeft = parseInt(toggleButton.style.left, 10);
        const toggleButtonTop = parseInt(toggleButton.style.top, 10);
        if (toggleButtonLeft + toggleButtonWidth > viewportWidth) {
            toggleButton.style.left = (viewportWidth - toggleButtonWidth) + 'px';
        }
        if (toggleButtonTop + toggleButtonHeight > viewportHeight) {
            toggleButton.style.top = (viewportHeight - toggleButtonHeight) + 'px';
        }
        if (toggleButtonLeft < 0) {
            toggleButton.style.left = '0';
        }
        if (toggleButtonTop < 0) {
            toggleButton.style.top = '0';
        }
        BattleLogs.Utils.LocalStorage.setValue(toggleButton.id, toggleButton.style.cssText);

        const menu = document.getElementById(BattleLogs.Menu.Settings.MenuPosition);
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
        BattleLogs.Utils.LocalStorage.setValue(menu.id, menu.style.cssText);
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
                    this.__internal__inputsSettings.push({element: checkbox, type: type})

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
    
    /**
     * @desc Add a Settings button element
     *
     * @param {string} id: The button id (that will be used for the corresponding local storage item id as well)
     */
    static createMenuButton(targetClass, id, svgCss, panel, inTitle, outTitle, container = this.BattleLogsSettingsFooterLeft) {
        const classNames = ["Message", "Glossary", "Stats", "Builder"]
        const button = document.createElement("button");
        button.id = id;
        button.classList.add(svgCss);

        let inButton = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (inButton) {
            BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
            BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
            button.classList.add("selected");
            button.title = outTitle;
        } else {
            panel.classList.add("hidden");
            button.title = inTitle;
        }
        button.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) === "true");
            if (newStatus) {
                classNames.filter(e => !(e === targetClass)).forEach(e => BattleLogs[e].resetSelected())
                BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
                panel.classList.remove("hidden");
                button.classList.add("selected");
                button.title = outTitle;
                this.BattleLogsWrapper.scrollTop = 0;
            } else {
                BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
                panel.classList.add("hidden");
                button.classList.remove("selected");
                button.title = inTitle;
                this.BattleLogsWrapper.scrollTop = BattleLogs.Menu.BattleLogsWrapper.scrollHeight;
            }
            BattleLogs.Utils.LocalStorage.setValue(button.id, newStatus);
        };

        container.appendChild(button);
        return button;
    }

    /**
     * Reset selected status and update elements accordingly
     * 
     * @param {Element} button: The button element to reset
     * @param {Element} panel: The panel element to hide
     * @param {string} inTitle: The title replacment
     */
    static resetSelected(button, panel, inTitle) {
        if (button) {
            BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
            BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
            panel.classList.add("hidden");
            button.classList.remove("selected");
            button.title = inTitle;
            BattleLogs.Utils.LocalStorage.setValue(button.id, "false");
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

        const content = document.querySelector('.bl-content');
        const menu = document.getElementById(this.Settings.MenuPosition);

        if (this.__internal__isPhone) {
            buttonElem.classList.add("svg_chevron-left");
            buttonElem.title = "Réduire";
        } else {
            buttonElem.classList.add("svg_chevron-up");
            buttonElem.title = "Réduire";
        }
        buttonElem.onclick = () => {
            if (this.__internal__isPhone) {
                this.__internal__battleLogsConsole.classList.add("hidden");
                return;
            }
            content.style.display = 'none';
            let toggleButton = BattleLogs.Menu.ToggleButton
            toggleButton.classList.remove("hidden")
            menu.classList.remove('open');
            menu.classList.remove("resizable")
            if (menu.classList.contains('open')) {
                toggleButton.classList.add("enable");
                content.style.display = 'block';
                menu.classList.add("resizable")
                BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, "true");
            } else {
                toggleButton.classList.remove("enable");
                content.style.display = 'none';
                menu.classList.remove("resizable")
                BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, "false");
            }

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

    /**
     * @desc Add dock side button element
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addOpacityButton(id, containingDiv) {
        let buttonElem = document.createElement("button");
        buttonElem.id = id;
        buttonElem.classList.add("svg_opacity");
        buttonElem.title = "Réduire l'opacité";

        let opacity = BattleLogs.Utils.tryParseFloat(BattleLogs.Utils.LocalStorage.getValue(id), 1.0); // Ajout de cette variable pour suivre l'opacité actuelle
        this.__internal__battleLogsConsole.style.opacity = opacity; // Définir l'opacité initiale

        buttonElem.onclick = () => {
            opacity -= 0.05; // Réduire l'opacité de 5% à chaque clic
            if (opacity <= 0.1) {
                opacity = 1.0; // Si l'opacité atteint 10%, réinitialiser à 100%
            }
            this.__internal__battleLogsConsole.style.opacity = opacity; // Appliquer la nouvelle opacité
            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, opacity);
        };

        buttonElem.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Empêcher le menu contextuel de s'afficher
            opacity += 0.05; // Augmenter l'opacité de 5% sur le clic droit
            if (opacity > 1.0) {
                opacity = 0.1;
            }
            this.__internal__battleLogsConsole.style.opacity = opacity;
            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, opacity);
        });

        containingDiv.appendChild(buttonElem);
        this.__internal__battleLogsDockSideElement = buttonElem;
    }

    /**
     * @desc Add lock button element
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the button to
     */
    static __internal__addLockButton(id, containingDiv) {
        let buttonElem = document.createElement("button");
        buttonElem.id = id;
        buttonElem.classList.add("svg_lock_white");
        buttonElem.title = "Verrouiller la disposition";

        buttonElem.onclick = () => {
            let menu = document.getElementById(this.Settings.MenuPosition);
            menu.classList.contains('battlelogs-locked') ? menu.classList.remove('battlelogs-locked') : menu.classList.add('battlelogs-locked');
            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, menu.classList.contains('battlelogs-locked') ? "true": "false");
        };

        containingDiv.appendChild(buttonElem);
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
        BattleLogs.Utils.LocalStorage.setDefaultValue(this.Settings.MenuOpacity,
            "1.0");
        BattleLogs.Utils.LocalStorage.setDefaultValue(this.Settings.ToggleButtonPosition,
            "left: 10px; top: 10px;");
        BattleLogs.Utils.LocalStorage.setDefaultValue(this.Settings.MenuWidth,
            "500px");
        BattleLogs.Utils.LocalStorage.setDefaultValue(
            this.Settings.MenuExpanded,
            "false"
        );
        BattleLogs.Utils.LocalStorage.setDefaultValue(
            this.Settings.MenuPosition,
            "left: 10px; top: 10px;"
        );
    }
}