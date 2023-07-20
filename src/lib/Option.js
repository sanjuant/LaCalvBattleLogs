/**
 * @class The BattleLogsOption regroups options functionalities
 */

class BattleLogsOption {
    static Settings = {
        OptionChatHidden: "Option-Chat-Hidden",
    }

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Add CSV button
            this.__internal__addChatButton(this.Settings.OptionChatHidden, BattleLogs.Menu.BattleLogsSettingsFooterLeft);

            // Set default settings
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

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
            const chatDiv = document.querySelector("#rightBar")
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
        if (display) {
            chatDiv.style.display = "block";
            gameOutDiv.style.marginRight = "18%";
            gameOutDiv.style.marginLeft = "18%";
        } else {
            chatDiv.style.display = "none";
            gameOutDiv.style.marginRight = "0";
            gameOutDiv.style.marginLeft = "0";
        }
    }
}