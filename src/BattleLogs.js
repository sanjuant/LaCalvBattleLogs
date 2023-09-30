/**
 * @desc The battle logs main class
 */
class BattleLogs
{
    // Aliases on the other classes so every calls in the code can use the `BattleLogs.<Alias>` form
    static Interceptor = BattleLogsInterceptor;
    static Load = BattleLogsLoad;
    static Roues = BattleLogsRoues;
    static Shop = BattleLogsShop;
    static Update = BattleLogsUpdate;
    static Wbclassement = BattleLogsWbclassement;
    static Boss = BattleLogsBoss;
    static Pvp = BattleLogsPvp;
    static Tob = BattleLogsTob;
    static Summarize = BattleLogsSummarize;
    static Notif = BattleLogsNotif;
    static Battle = BattleLogsBattle;
    static Message = BattleLogsMessage;
    static Menu = BattleLogsMenu;
    static Utils = BattleLogsUtils;
    static Csv = BattleLogsCsv;
    static Sound = BattleLogsSound;
    static Battlewbtry = BattleLogsBattlewbtry;
    static Video = BattleLogsVideo;
    static Survie = BattleLogsSurvie;
    static Option = BattleLogsOption;
    static Glossary = BattleLogsGlossary;
    static Expedition = BattleLogsExpedition;
    // static StatsOld = BattleLogsStatsOld;
    static Stats = BattleLogsStats;

    static InitSteps = class BattleLogsInitSteps
    {
        static BuildMenu = 0;
        static Finalize = 1;
    };

    /**************************/
    /*    PUBLIC INTERFACE    */
    /**************************/

    /**
     * @desc BattleLogs entry point
     */
    static start()
    {
        console.log(`%cStarting BattleLogs..`, "color:#00A7FF;font-weight:900;");

        for (let initKey in this.InitSteps)
        {
            let initStep = this.InitSteps[initKey];

            // Load interceptor to hijack xhr responses
            this.Interceptor.initialize(initStep)

            // Load utils used in other components
            this.Utils.initialize(initStep);

            // Initialise menu
            this.Menu.initialize(initStep);
            // Then add the main menu
            this.Menu.addMainBattleLogsPanel(initStep);

            // 'BattleLogs' message panel
            this.Message.initialize(initStep);

            // Battle components
            this.Battle.initialize(initStep);
            this.Boss.initialize(initStep);
            this.Pvp.initialize(initStep);
            this.Tob.initialize(initStep);
            this.Survie.initialize(initStep);
            this.Summarize.initialize(initStep);
            this.Notif.initialize(initStep);

            // Game components
            this.Update.initialize(initStep);
            this.Wbclassement.initialize(initStep);
            this.Roues.initialize(initStep);
            this.Expedition.initialize(initStep);

            // Additionnal components
            this.Csv.initialize(initStep);
            this.Sound.initialize(initStep);
            this.Video.initialize(initStep);
            this.Glossary.initialize(initStep);
            this.Stats.initialize(initStep);
            this.Option.initialize(initStep);
        }

        console.log(`%cBattleLogs started`, "color:#00A7FF;font-weight:900;");
    }
}
