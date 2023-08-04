/**
 * @class The BattleLogsStatsRoues regroups functionality related to battle logs stuffs stats
 */
class BattleLogsStatsStuffs {
    static Settings = {
        Type: "Stuffs"
    }

    static Messages = {
        stuffs: {
            name: "Stats des stuffs",
            title: "{0} <span class='item-name'>{1}</span> ouvert{2}",
            cost: "premium"
        },
    };

    static Data;

    /**
     * @desc Creates and appends statistical panes for each type of wheel within the stats panel.
     *       Iterates through the data of each wheel type and creates a corresponding pane using the `BattleLogs.Stats.createPane` method.
     */
    static createStatsPanes() {
        Object.keys(this.Data).forEach(key => {
            const pane = BattleLogs.Stats.createPane(this.Data[key], this.Settings.Type)
            BattleLogs.Stats.StatsPanel.appendChild(pane)
            this.appendStatsToPane(this.Data[key])
        })
    }

    /**
     * @desc Appends or updates the content of the stats pane for a specific wheel type.
     *
     * @param {Object} statsData: The statistical data for a specific wheel type, containing details such as ID, total, cost, etc.
     */
    static appendStatsToPane(statsData) {
        const statPane = document.querySelector(`#Stats-${statsData.id}[data-key=${statsData.id}]`);
        console.log(`#Stats-${statsData.id}[data-key=${statsData.id}]`)
        console.log(statPane)
        if (statPane !== null) {
            // this.__internal__buildStatPane(statsData, statPane)
        }
    }

    static resetStats(id) {
        const statPanes = document.querySelectorAll(`#Stats-${id}[data-key=${id}] .stats-block`);
        statPanes.forEach(pane => {
            pane.remove()
        })
        this.appendStatsToPane(this.Data[id])
    }

    /**
     * @desc Sets the stats roues settings default values in the local storage
     */
    static setDefaultSettingsValues(key) {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(key, {
            "stuffs": this.__internal__defaultStats["stuffs"]
        });
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__defaultStats = {
        "stuffs": {
            "id": "stuffs",
            "time": new Date().toISOString(),
            "stuffs": {}
        }
    }
}