/**
 * @class The BattleLogsGlossary regroups the glossary functionalities
 */

// TODO: Refactor this class to change name

class BattleLogsGlossary {
    static Settings = {
        GlossaryEnable: "Glossary-Enable",
        GlossaryCompare: "Glossary-Compare"
    }

    static GlossaryPanel;
    static GlossaryButton;
    static Iframe;
    static IframeComparaison;

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            // Add CSV button
            this.__internal__addStatsPanel()
            this.__internal__addStatsButton(this.Settings.GlossaryEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);
        }
    }

    /**
     * Reset selected status and update elements accordingly
     */
    static resetSelected() {
        if (this.GlossaryButton) {
            BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
            BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
            this.GlossaryPanel.classList.add("hidden");
            this.GlossaryButton.classList.remove("selected");
            this.GlossaryButton.title = "Afficher le glossaire";
            BattleLogs.Utils.LocalStorage.setValue(this.GlossaryButton.id, "false");
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    /**
     * @desc Adds the BattleLogs panel
     */
    static __internal__addStatsPanel() {
        // Add settings container
        this.GlossaryPanel = document.createElement("div");
        this.GlossaryPanel.id = "battlelogs-glossary_panel";
        this.GlossaryPanel.classList.add("glossary")
        if (!(BattleLogs.Utils.LocalStorage.getValue(this.Settings.GlossaryEnable) === "true")) {
            this.GlossaryPanel.classList.add("hidden")
        }
        this.Iframe = document.createElement("iframe");
        this.Iframe.id = 'glossaryLacalv';
        this.Iframe.src = '/stats/';
        this.Iframe.style = "height: 100%; background: #18181b; width: 100%; border: none; display: block;";
        this.IframeComparaison = document.createElement("iframe");
        this.IframeComparaison.id = 'glossaryLacalvComparaison';
        this.IframeComparaison.src = '/stats/';
        this.IframeComparaison.style = "height: 100%; background: #18181b; width: 100%; border: none; ";
        if (BattleLogs.Utils.LocalStorage.getValue(this.Settings.GlossaryCompare) === "true") {
            this.IframeComparaison.style.display = "block";
        } else {
            this.IframeComparaison.style.display = "none";
        }
        this.GlossaryPanel.appendChild(this.Iframe);
        this.GlossaryPanel.appendChild(this.IframeComparaison);
        BattleLogs.Menu.BattleLogsWrapper.appendChild(this.GlossaryPanel);
    }

    /**
     * @desc Add Sound button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addStatsButton(id, containingDiv) {
        // Add messages container to battle logs menu
        this.GlossaryButton = document.createElement("button");
        this.GlossaryButton.id = id;
        this.GlossaryButton.classList.add("svg_glossary");

        let inStats = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (inStats) {
            BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
            BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
            this.GlossaryButton.classList.add("selected");
            this.GlossaryButton.title = "Masquer le glossaire";
        } else {
            this.GlossaryButton.title = "Afficher le glossaire";
        }
        this.GlossaryButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                BattleLogs.Message.resetSelectedSettings()
                BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
                this.GlossaryPanel.classList.remove("hidden");
                this.GlossaryButton.classList.add("selected");
                this.GlossaryButton.title = "Masquer le glossaire";
            } else {
                BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
                this.GlossaryPanel.classList.add("hidden")
                this.GlossaryButton.classList.remove("selected");
                this.GlossaryButton.title = "Afficher le glossaire";
                BattleLogs.Menu.BattleLogsWrapper.scrollTop = BattleLogs.Menu.BattleLogsWrapper.scrollHeight;
            }

            BattleLogs.Utils.LocalStorage.setValue(this.GlossaryButton.id, newStatus);
        };

        this.GlossaryButton.oncontextmenu = () => {
            this.__internal__toggleGlossaryComparaison()
            return false;
        };

        this.GlossaryButton.onmouseup = (e) => {
            // Check whether the wheel button has been clicked (central mouse button).
            if (e.which === 2 || e.button === 4) {
                const urlNewTab = "https://lacalv.fr/stats/";
                window.open(urlNewTab, '_blank');
            }
        };

        containingDiv.appendChild(this.GlossaryButton);
    }

    static __internal__toggleGlossaryComparaison() {
        const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(this.Settings.GlossaryCompare) === "true");
        if (newStatus) {
            this.IframeComparaison.style.display = "block"
        } else {
            this.IframeComparaison.style.display = "none"
        }
        BattleLogs.Utils.LocalStorage.setValue(this.Settings.GlossaryCompare, newStatus);
    }
}