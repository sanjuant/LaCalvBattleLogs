/**
 * @class The BattleLogsVideo regroups the video functionalities
 */

class BattleLogsVideo {
    static Settings = {
        VideoEnable: "Video-Enable",
    }

    static BattleLogsTwitchVideo;
    static BattleLogsTwitchChat;
    static BattleLogsTwitchChannel;
    static BattleLogsTwitchIframe;

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Add Video button
            let twitch = document.querySelector(".nav-page > .container-fluid > .row");
            if (twitch) {
                twitch.innerHTML = twitch.innerHTML.replace(/<!--|-->|\r?\n|\r/g, "");
                this.BattleLogsTwitchVideo = twitch.querySelector(".video")
                this.BattleLogsTwitchVideo.style.display = "none";
                this.BattleLogsTwitchVideo.style.width = "100%";
                this.BattleLogsTwitchVideo.style.height = "190px";
                this.BattleLogsTwitchChat = twitch.querySelector(".tchat")
                this.BattleLogsTwitchIframe = this.BattleLogsTwitchVideo.querySelector("iframe.player");

                BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
                this.__internal__addVideoButton(this.Settings.VideoEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            }
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    /**
     * @desc Add Video button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addVideoButton(id, containingDiv) {
        const videoButton = document.createElement("button");
        videoButton.id = id;
        videoButton.classList.add("svg_video");

        let videoEnable = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (videoEnable) {
            videoButton.classList.add("selected");
            videoButton.title = "Masquer le lecteur Twitch";
            this.BattleLogsTwitchVideo.style.display = "block";
            this.BattleLogsTwitchChat.style.height = "80%";
        } else {
            videoButton.title = "Afficher le lecteur Twitch (nécessite le chat)";
            this.BattleLogsTwitchVideo.style.display = "none";
            this.BattleLogsTwitchChat.style.height = "inherit";
        }
        videoButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                videoButton.classList.add("selected");
                videoButton.title = "Masquer le lecteur Twitch";
                this.BattleLogsTwitchVideo.style.display = "block";
                this.BattleLogsTwitchChat.style.height = "80%";
            } else {
                videoButton.classList.remove("selected");
                videoButton.title = "Afficher le lecteur Twitch (nécessite le chat)";
                this.BattleLogsTwitchVideo.style.display = "none";
                this.BattleLogsTwitchChat.style.height = "inherit";
            }

            BattleLogs.Utils.LocalStorage.setValue(videoButton.id, newStatus);
        };

        videoButton.oncontextmenu = () => {
            this.__internal__showPrompt()
            return false;
        };

        containingDiv.appendChild(videoButton);
    }

    static __internal__showPrompt() {
        let defaultValue = "jirayalecochon";

        let promptContainer = document.createElement("div");
        promptContainer.classList.add("prompt");

        let label = document.createElement("label");
        label.textContent = "Veuillez saisir le nom d'une chaine Twitch :";
        promptContainer.appendChild(label);

        let input = document.createElement("input");
        input.type = "text";
        input.value = defaultValue;
        input.placeholder = "jirayalecochon";

        input.addEventListener("focus", function() {
            if (input.value === defaultValue) {
                input.value = "";
            }
        });

        input.addEventListener("blur", function() {
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
        button.addEventListener("click", function() {
            BattleLogs.Video.BattleLogsTwitchChannel = input.value;
            BattleLogs.Video.__internal__changeTwitchChannel(input.value)
            promptContainer.remove();
            removeEventListeners();
        });

        buttonContainer.appendChild(button);

        let closeButton = document.createElement("button");
        closeButton.textContent = "Fermer";
        closeButton.classList.add("danger")
        closeButton.addEventListener("click", function() {
            promptContainer.remove();
            removeEventListeners();
        });

        buttonContainer.appendChild(closeButton);

        promptContainer.appendChild(buttonContainer);

        document.addEventListener("click", function(event) {
            if (!promptContainer.contains(event.target) && document.querySelector(".prompt")) {
                promptContainer.remove();
                removeEventListeners();
            }
        });

        let removeEventListeners = function() {
            document.removeEventListener("keydown", keydownListener);
            document.removeEventListener("keyup", keyupListener);
        };

        let keydownListener = function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                BattleLogs.Video.BattleLogsTwitchChannel = input.value;
                BattleLogs.Video.__internal__changeTwitchChannel(input.value)
                promptContainer.remove();
                removeEventListeners();
            } else if (event.key === "Escape") {
                promptContainer.remove();
                removeEventListeners();
            }
        };

        let keyupListener = function(event) {
            // Gérer l'événement keyup si nécessaire
        };

        document.addEventListener("keydown", keydownListener);
        document.addEventListener("keyup", keyupListener);

        document.body.appendChild(promptContainer);
    }

    static __internal__changeTwitchChannel(twitchChannel) {
        if (twitchChannel) {
            let currentSrc = this.BattleLogsTwitchIframe.getAttribute("src");
            let newSrc = currentSrc.replace(/channel=([^&]+)/, "channel=" + encodeURIComponent(twitchChannel));
            this.BattleLogsTwitchIframe.setAttribute("src", newSrc);
        }
    }
}