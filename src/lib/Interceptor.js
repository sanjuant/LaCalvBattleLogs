/**
 * @class The BattleLogsInterceptor intercept response from lacalv to parse it
 */
class BattleLogsInterceptor {
    /**
     * @desc Initializes the Interceptor
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep !== BattleLogs.InitSteps.BuildMenu) return;
        this.hijackAjax();
    }

    /**
     * @desc Hijacks all AJAX requests and logs the response.
     */
    static hijackAjax() {
        // Check if realProcess function exists, if not, assign it a default function
        if (typeof this.__internal__realProcess != "function") {
            this.__internal__realProcess = function(e) {
                console.log(e);
            };
        }
        // Listen for hijack_ajax event and call realProcess function with the event
        // detail as argument
        window.addEventListener("hijack_ajax", (event) => {
            this.__internal__realProcess(event.detail);
        }, false);

        // Inject custom open method to XMLHttpRequest prototype
        function injection() {
            let open = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function() {
                this.addEventListener("load", function() {
                    // Dispatch hijack_ajax event with current XMLHttpRequest object as detail
                    window.dispatchEvent(new CustomEvent("hijack_ajax", {
                        detail: this
                    }));
                }, false);
                open.apply(this, arguments);
            };
        }

        // Execute the injection function after 0 milliseconds
        window.setTimeout("(" + injection.toString() + ")()", 0);
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    /**
     * @desc Processes the hijackAjax event detail and logs the type of response.
     *
     * @param {XMLHttpRequest} xhr: The XMLHttpRequest object.
     */
    static __internal__realProcess(xhr) {
        const gameUrl = BattleLogsComponentLoader.gameUrl;
        const baseUrl = gameUrl.endsWith("/") ? gameUrl : gameUrl + "/";

        if (xhr.responseURL === baseUrl + "play/load") {
            BattleLogs.Load.parseResponse(xhr)
        } else if (xhr.responseURL.startsWith(baseUrl + "play/update")) {
            BattleLogs.Update.parseResponse(xhr)
        } else if (xhr.responseURL === baseUrl + "play/wbclassement") {
            BattleLogs.Wbclassement.parseResponse(xhr)
        } else if (xhr.responseURL === baseUrl + "play/battlewbtry") {
            BattleLogs.Battlewbtry.parseResponse(xhr)
        } else if (xhr.responseURL.startsWith(baseUrl + "play/battle?opponent")) {
            BattleLogs.Pvp.parseResponse(xhr);
        } else if (xhr.responseURL.match(new RegExp(`^${baseUrl}play/(battlepve|multibattlepve)\\?step`))) {
            BattleLogs.Tob.parseResponse(xhr);
        } else if (xhr.responseURL === baseUrl + "play/battlewb") {
            BattleLogs.Boss.parseResponse(xhr);
        } else if (xhr.responseURL.startsWith(baseUrl + "play/battleDonjon")) {
            BattleLogs.Survie.parseResponse(xhr);
        } else if (xhr.responseURL.startsWith(baseUrl + "play/battleHistoire")) {
            BattleLogs.Histoire.parseResponse(xhr);
        } else if (xhr.responseURL.startsWith(baseUrl + "play/multiBattleHistoire")) {
            BattleLogs.Histoire.parseResponse(xhr);
        } else if (xhr.responseURL.startsWith(baseUrl + "play/roues")) {
            BattleLogs.Roues.parseResponse(xhr)
        } else if (xhr.responseURL.startsWith(baseUrl + "play/shop")) {
            BattleLogs.Shop.parseResponse(xhr)
        } else if (xhr.responseURL.match(new RegExp(`^${baseUrl}play/(c|d|r|re|beta)\\?count`))
            || xhr.responseURL.match(new RegExp(`^${baseUrl}play/(coquille_c|coquille_d|coquille_r|coquille_re)\\?count`))
            || xhr.responseURL.startsWith(baseUrl + "play/exclusive")) {
            BattleLogs.Roues.parseResponse(xhr)
        } else if (xhr.responseURL.startsWith(baseUrl + "play/stopexpedition")) {
            BattleLogs.Expedition.parseResponse(xhr)
        }
    }
}
