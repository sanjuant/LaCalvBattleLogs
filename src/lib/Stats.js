/**
 * @class The BattleLogsStats regroups the stats functionalities
 */

// TODO: Refactor this class to change name

class BattleLogsStats {
    static Settings = {
        StatsEnable: "Stats-Enable",
        StatsCompare: "Stats-Compare"
    }

    static StatsPanel;
    static StatsButton;
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
            this.__internal__addStatsButton(this.Settings.StatsEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);
        }
    }

    /**
     * Reset selected status and update elements accordingly
     */
    static resetSelected() {
        if (this.StatsButton) {
            BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
            BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
            this.StatsPanel.classList.add("hidden");
            this.StatsButton.classList.remove("selected");
            this.StatsButton.title = "Afficher les stats";
            BattleLogs.Utils.LocalStorage.setValue(this.StatsButton.id, "false");
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
        this.StatsPanel = document.createElement("div");
        this.StatsPanel.id = "battlelogs-stats_panel";
        this.StatsPanel.classList.add("stats")
        if (!(BattleLogs.Utils.LocalStorage.getValue(this.Settings.StatsEnable) === "true")) {
            this.StatsPanel.classList.add("hidden")
        }
        this.Iframe = document.createElement("iframe");
        this.Iframe.id = 'statsLacalv';
        this.Iframe.src = '/stats/';
        this.Iframe.style = "height: 100%; background: #18181b; width: 100%; border: none; display: block;";
        this.IframeComparaison = document.createElement("iframe");
        this.IframeComparaison.id = 'statsLacalvComparaison';
        this.IframeComparaison.src = '/stats/';
        this.IframeComparaison.style = "height: 100%; background: #18181b; width: 100%; border: none; ";
        if (BattleLogs.Utils.LocalStorage.getValue(this.Settings.StatsCompare) === "true") {
            this.IframeComparaison.style.display = "block";
        } else {
            this.IframeComparaison.style.display = "none";
        }
        this.StatsPanel.appendChild(this.Iframe);
        this.StatsPanel.appendChild(this.IframeComparaison);
        BattleLogs.Menu.BattleLogsWrapper.appendChild(this.StatsPanel);
    }

    /**
     * @desc Add Sound button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addStatsButton(id, containingDiv) {
        // Add messages container to battle logs menu
        this.StatsButton = document.createElement("button");
        this.StatsButton.id = id;
        this.StatsButton.classList.add("svg_stats");

        let inStats = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (inStats) {
            BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
            BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
            this.StatsButton.classList.add("selected");
            this.StatsButton.title = "Masquer les stats";
        } else {
            this.StatsButton.title = "Afficher les stats";
        }
        this.StatsButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) ===
                "true");
            if (newStatus) {
                BattleLogs.Message.resetSelectedSettings()
                BattleLogs.Message.__internal__messagesActions.classList.add("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.add("hidden");
                this.StatsPanel.classList.remove("hidden");
                this.StatsButton.classList.add("selected");
                this.StatsButton.title = "Masquer les stats";
            } else {
                BattleLogs.Message.__internal__messagesActions.classList.remove("hidden");
                BattleLogs.Message.__internal__messagesContainer.classList.remove("hidden");
                this.StatsPanel.classList.add("hidden")
                this.StatsButton.classList.remove("selected");
                this.StatsButton.title = "Afficher les stats";
                BattleLogs.Menu.BattleLogsWrapper.scrollTop = BattleLogs.Menu.BattleLogsWrapper.scrollHeight;
            }

            BattleLogs.Utils.LocalStorage.setValue(this.StatsButton.id, newStatus);
        };

        this.StatsButton.oncontextmenu = () => {
            this.__internal__toggleStatsComparaison()
            return false;
        };

        this.StatsButton.onmouseup = (e) => {
            // Check whether the wheel button has been clicked (central mouse button).
            if (e.which === 2 || e.button === 4) {
                const urlNewTab = "https://lacalv.fr/stats/";
                window.open(urlNewTab, '_blank');
            }
        };

        containingDiv.appendChild(this.StatsButton);
    }

    static __internal__toggleStatsComparaison() {
        const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(this.Settings.StatsCompare) === "true");
        if (newStatus) {
            this.IframeComparaison.style.display = "block"
        } else {
            this.IframeComparaison.style.display = "none"
        }
        BattleLogs.Utils.LocalStorage.setValue(this.Settings.StatsCompare, newStatus);
    }
}