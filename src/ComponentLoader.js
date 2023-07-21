/**
 * @class The battlelogs loader abstraction class.
 *
 * This class contains a @c loadFromUrl function that is used by the userscript to load the module.
 * This is possible because Github is allowed.
 */
class BattleLogsComponentLoader
{
    static __baseUrl = null;
    static __loadingList = [];
    static __loadingProgressTable = {};
    static __loadingOrder = 0;

    /**
     * @desc Loads the BattleLogs classes from the given @p baseUrl
     *
     * @param {string}  baseUrl: The base URL to download the lib component files from
     *
     * @warning This function should never change its prototype, otherwise it would break the API
     */
    static loadFromUrl(baseUrl)
    {
        // Don't load script on subpage
        const locationHref = window.location.href.endsWith("/") ? window.location.href.slice(0,-1) : window.location.href;
        if (locationHref !== "https://lacalv.fr" && locationHref !== "https://lacalv.fr/m" && locationHref !== "https://lacalv.fr/soon") return;

        this.__baseUrl = baseUrl;

        // From the least dependant, to the most dependent
        this.__addScript("src/lib/Utils/LocalStorage.js");

        this.__loadingOrder += 1;
        this.__addScript("src/lib/Interceptor.js");
        this.__addScript("src/lib/Load.js");
        this.__addScript("src/lib/Roues.js");
        this.__addScript("src/lib/Shop.js");
        this.__addScript("src/lib/Update.js");
        this.__addScript("src/lib/Wbclassement.js");
        this.__addScript("src/lib/Boss.js");
        this.__addScript("src/lib/Pvp.js");
        this.__addScript("src/lib/Tob.js");
        this.__addScript("src/lib/Summarize.js");
        this.__addScript("src/lib/Notif.js");
        this.__addScript("src/lib/Battle.js");
        this.__addScript("src/lib/Message.js");
        this.__addScript("src/lib/Menu.js");
        this.__addScript("src/lib/Utils.js");
        this.__addScript("src/lib/Csv.js");
        this.__addScript("src/lib/Sound.js");
        this.__addScript("src/lib/Battlewbtry.js");
        this.__addScript("src/lib/Video.js");
        this.__addScript("src/lib/Survie.js");
        this.__addScript("src/lib/Option.js");
        this.__addScript("src/lib/Stats.js");

        this.__loadingOrder += 1;
        this.__addScript("src/BattleLogs.js");

        this.__setupBattleLogsRunner();
    }

    /**
     * @desc Adds the given @p fileRelativePath js file to the loading list
     *
     * @param {string} fileRelativePath: The file path relative to the @p __baseUrl
     */
    static __addScript(fileRelativePath)
    {
        this.__loadingList.push({ order: this.__loadingOrder, filePath: fileRelativePath });
    }

    /**
     * @desc Download the given @p fileRelativePath js file, and loads it into the page as a script component
     *
     * @param {string} fileRelativePath: The file path relative to the @p __baseUrl
     */
    static __loadScript(fileRelativePath)
    {
        let scriptName = this.__extractNameFromFile(fileRelativePath);
        this.__loadingProgressTable[scriptName] = false;

        // Github only serves plain-text so we can't load it as a script object directly
        let request = new XMLHttpRequest();
        request.onreadystatechange = function()
            {
                if ((request.readyState === 4) && (request.status === 200))
                {
                    // Store the content into a script div
                    const script = document.createElement('script');
                    script.innerHTML = request.responseText;
                    script.id = "battlelogs-" + scriptName;
                    document.head.appendChild(script);
                    this.__loadingProgressTable[scriptName] = true;
                }
            }.bind(this);

        // Download the content
        request.open("GET", this.__baseUrl + fileRelativePath, true);
        request.send();
    }

    /**
     * @desc Extracts the script name from the given @p filePath
     *
     * @param {string} filePath: The path to extract the script name from
     */
    static __extractNameFromFile(filePath)
    {
        let libPrefix = "src/lib/";
        if (filePath.startsWith(libPrefix))
        {
            let result = filePath.substring(libPrefix.length, filePath.length - 3);
            return result.replace("/", "-").toLowerCase();
        }
        return filePath.match(/^(.*\/)?([^/]+)\.js$/)[2].toLowerCase();
    }

    /**
     * @desc Sets a loading watcher which prevent loading the battle logs before the game components are fully up and running.
     *        Once all scripts are properly loaded, it runs the battle logs.
     */
    static __setupBattleLogsRunner()
    {
        let currentLoadingOrder = -1;

        let watcher = setInterval(function ()
            {
                let isLoadingCompleted = Object.keys(this.__loadingProgressTable).every(key => this.__loadingProgressTable[key]);

                if (!isLoadingCompleted)
                {
                    return;
                }

                // Load the next batch (dependency requirement)
                if (currentLoadingOrder !== this.__loadingOrder)
                {
                    currentLoadingOrder += 1;
                    for (const scriptData of this.__loadingList)
                    {
                        if (scriptData.order === currentLoadingOrder)
                        {
                            this.__loadScript(scriptData.filePath);
                        }
                    }
                    return;
                }

                clearInterval(watcher);

                // Start the battle logs
                BattleLogs.start();
            }.bind(this), 200); // Check every 200ms
    }
}
