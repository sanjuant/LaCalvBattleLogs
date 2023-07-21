/**
 * @class The BattleLogsOption regroups options functionalities
 */

class BattleLogsOption {
    static Settings = {
        MenuSettings: "Option-Settings",
        OptionChatHidden: "Option-Chat-Hidden",
        Type: "Option",
    }

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Set default settings
            this.__internal__setDefaultSettingsValues()
            this.__internal__optionSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
            BattleLogs.Menu.addSettings(this.__internal__menuSettings, this.__internal__optionSettings, "Option");

            // Add CSV button
            this.__internal__addChatButton(this.Settings.OptionChatHidden, BattleLogs.Menu.BattleLogsSettingsFooterLeft);
        }
    }

    /**
     * @desc Update settings of class
     */
    static updateSettings() {
        this.__internal__optionSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__optionSettings = null;
    static __internal__menuSettings = {
        display: {
            title: "Option du chat Twitch",
            stats: {
                hiddenByBattleLogs: {
                    name: "Masquer sous le BattleLogs",
                    display: true,
                    setting: true,
                    text: "Masquer sous le BattleLogs",
                    type: "checkbox"
                },
            }
        }
    }

    /**
     * @desc Add chat button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addChatButton(id, containingDiv) {
        // Add messages container to battle logs menu
        const chatButton = document.createElement("button");
        chatButton.id = id;
        chatButton.classList.add("svg_chat");

        let chatHidden = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (chatHidden) {
            // Si le chat est affiché, on le masque
            this.__internal__toggleChat(false)
            chatButton.classList.add("selected");
            chatButton.title = "Afficher le chat Twitch";
        } else {
            BattleLogs.Menu.BattleLogsSettings.classList.add("hidden");
            chatButton.title = "Masquer le chat Twitch";
        }
        chatButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) === "true");
            if (newStatus) {
                // Si le chat est affiché, on le masque
                this.__internal__toggleChat(false)
                chatButton.classList.add("selected");
                chatButton.title = "Afficher le chat Twitch";
            } else {
                // Si le chat est masqué, on l'affiche
                this.__internal__toggleChat(true)
                chatButton.classList.remove("selected");
                chatButton.title = "Masquer le chat Twitch";
            }

            BattleLogs.Utils.LocalStorage.setValue(chatButton.id, newStatus);
        };

        containingDiv.appendChild(chatButton);
    }

    static __internal__toggleChat(display) {
        const chatDiv = document.querySelector("#rightBar")
        const gameOutDiv = document.querySelector(".game-out")
        const hiddenByBattleLogs = this.__internal__optionSettings["display-hiddenByBattleLogs"]
        const side = BattleLogs.Utils.LocalStorage.getValue(BattleLogs.Menu.Settings.MenuSide)
        if (display) {
            chatDiv.style.display = "block";
            if (!(side === "left")) {
                gameOutDiv.style.marginRight = "unset";
                gameOutDiv.style.marginLeft = "18%";
                chatDiv.style.left = "0";
                chatDiv.style.removeProperty("right")
            } else {
                gameOutDiv.style.marginLeft = "unset";
                gameOutDiv.style.marginRight = "18%";
                chatDiv.style.right = "0";
                chatDiv.style.removeProperty("left")
            }
        } else if (hiddenByBattleLogs) {
            chatDiv.style.display = "block";
            if (side === "left") {
                chatDiv.style.left = "0";
                chatDiv.style.removeProperty("right")
            } else {
                chatDiv.style.right = "0";
                chatDiv.style.removeProperty("left")
            }
            gameOutDiv.style.marginRight = "0";
            gameOutDiv.style.marginLeft = "0";
        } else {
            chatDiv.style.display = "none";
            gameOutDiv.style.marginRight = "0";
            gameOutDiv.style.marginLeft = "0";
        }
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.MenuSettings, {});
    }
}