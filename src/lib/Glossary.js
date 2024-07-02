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
            this.__internal__addGlossaryPanel()
            this.GlossaryButton = BattleLogs.Menu.createMenuButton(
                "Glossary",
                this.Settings.GlossaryEnable, 
                "svg_glossary",
                this.GlossaryPanel,
                "Afficher le Glossaire",
                "Masquer le Glossaire"
            )

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
        }
    }

    /**
     * Reset selected status and update elements accordingly
     */
    static resetSelected() {
        BattleLogs.Menu.resetSelected(this.GlossaryButton, this.GlossaryPanel, "Afficher le Glossaire");
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    /**
     * @desc Adds the BattleLogs panel
     */
    static __internal__addGlossaryPanel() {
        // Add settings container
        this.GlossaryPanel = document.createElement("div");
        this.GlossaryPanel.id = "battlelogs-glossary_panel";
        this.GlossaryPanel.classList.add('unlocked');
        if (!(BattleLogs.Utils.LocalStorage.getValue(this.Settings.GlossaryEnable) === "true")) {
            this.GlossaryPanel.classList.add("hidden")
        }
        const glossaryIframes = document.createElement("div");
        glossaryIframes.classList.add("glossary")
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
        glossaryIframes.appendChild(this.Iframe)
        glossaryIframes.appendChild(this.IframeComparaison)
        this.GlossaryPanel.appendChild(glossaryIframes)
        BattleLogs.Menu.BattleLogsWrapper.appendChild(this.GlossaryPanel);
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