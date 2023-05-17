/**
 * @class The BattleLogsVideo regroups the video functionalities
 */

class BattleLogsVideo {
    static Settings = {
        VideoEnable: "Video-Enable",
    }

    static BattleLogsTwitchVideo;
    static BattleLogsTwitchChat;

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Add Video button
            let twitch = document.querySelector(".nav-page > .container-fluid > .row")
            twitch.innerHTML = twitch.innerHTML.replace(/<!--|-->|\r?\n|\r/g, "");
            this.BattleLogsTwitchVideo = twitch.querySelector(".video")
            this.BattleLogsTwitchVideo.style.display = "none";
            this.BattleLogsTwitchChat = twitch.querySelector(".tchat")

            BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            this.__internal__addVideoButton(this.Settings.VideoEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);
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
            videoButton.title = "Masquer la vidéo Twitch";
            this.BattleLogsTwitchVideo.style.display = "block";
            this.BattleLogsTwitchChat.style.height = "84%";
        } else {
            videoButton.title = "Afficher la vidéo Twitch";
            this.BattleLogsTwitchVideo.style.display = "none";
            this.BattleLogsTwitchChat.style.height = "inherit";
        }
        videoButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                videoButton.classList.add("selected");
                videoButton.title = "Masquer la vidéo Twitch";
                this.BattleLogsTwitchVideo.style.display = "block";
                this.BattleLogsTwitchChat.style.height = "84%";
            } else {
                videoButton.classList.remove("selected");
                videoButton.title = "Afficher la vidéo Twitch";
                this.BattleLogsTwitchVideo.style.display = "none";
                this.BattleLogsTwitchChat.style.height = "inherit";
            }

            BattleLogs.Utils.LocalStorage.setValue(videoButton.id, newStatus);
        };

        videoButton.oncontextmenu = () => {
            let newChannel = prompt("Veuillez saisir le nom d'une chaine Twitch :");
            if (newChannel) {
                let iframe = this.BattleLogsTwitchVideo.querySelector("iframe.player");
                let currentSrc = iframe.getAttribute("src");
                let newSrc = currentSrc.replace(/channel=([^&]+)/, "channel=" + encodeURIComponent(newChannel));
                iframe.setAttribute("src", newSrc);
            }
            return false;
        };

        containingDiv.appendChild(videoButton);
    }
}