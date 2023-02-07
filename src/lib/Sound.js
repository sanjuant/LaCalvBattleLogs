/**
 * @class BattleLogsSound provides functionality to play sounds in battle logs
 */
class BattleLogsSound {
    static Settings = {
        SoundEnable: "Sound-Enable",
    }

    static SoundEmitted = {
        bossAvailable: false,
        bossFightAvailable: false
    }

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Add CSV button
            BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            this.__internal__addSoundButton(this.Settings.SoundEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);

            // Set default settings
            this.__internal__setDefaultSettingValues();
        }
    }

    /**
     * @desc Play sound when boss available
     */
    static notifWhenBossAvailable() {
        if (BattleLogs.Utils.LocalStorage.getValue(this.Settings.SoundEnable) === "true" && !this.SoundEmitted.bossAvailable) {
            this.SoundEmitted.bossAvailable = true;
            this.__internal__playSound(this.__internal__sounds.gong);
        }
    }

    /**
     * @desc Play sound when boss fight available
     */
    static notifWhenBossFightAvailable() {
        if (BattleLogs.Utils.LocalStorage.getValue(this.Settings.SoundEnable) === "true" && !this.SoundEmitted.bossFightAvailable) {
            this.SoundEmitted.bossFightAvailable = true;
            this.__internal__playSound(this.__internal__sounds.bell);
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__sounds = {
        bell: {
            name: "bell.mp3",
            volume: 1
        },
        gong: {
            name: "gong.mp3",
            volume: 1
        },
    }

    /**
     * @desc Play sound
     * @param {Object} sound:sound to play
     */
    static __internal__playSound(sound) {
        let audio = new Audio(BattleLogsComponentLoader.__baseUrl + "sounds/" + sound.name);
        audio.volume = sound.volume
        audio.play();
    }

    /**
     * @desc Add Sound button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addSoundButton(id, containingDiv) {
        // Add messages container to battle logs menu
        const soundButton = document.createElement("button");
        soundButton.id = id;
        soundButton.classList.add("svg_sound-off");
        soundButton.title = "Activer les notifications sonores";

        let isEnable = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (isEnable) {
            soundButton.classList.add("svg_sound-on");
            soundButton.title = "Désactiver les notifications sonores";
        } else {
            soundButton.classList.add("svg_sound-off");
            soundButton.title = "Activer les notifications sonores";
        }

        soundButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) === "true");
            if (newStatus) {
                if (soundButton.classList.contains("svg_sound-off")) {
                    soundButton.classList.remove("svg_sound-off");
                    soundButton.classList.add("svg_sound-on");
                    soundButton.title = "Désactiver les notifications sonores";
                }
            } else {
                if (soundButton.classList.contains("svg_sound-on")) {
                    soundButton.classList.remove("svg_sound-on");
                    soundButton.classList.add("svg_sound-off");
                    soundButton.title = "Activer les notifications sonores";
                }
            }
            BattleLogs.Utils.LocalStorage.setValue(soundButton.id, newStatus);
        }

        containingDiv.appendChild(soundButton);
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingValues() {
        BattleLogs.Utils.LocalStorage.setDefaultValue(this.Settings.SoundEnable, false);
    }
}