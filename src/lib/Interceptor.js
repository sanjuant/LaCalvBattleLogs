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
        if (xhr.responseURL === "https://lacalv.fr/play/load") {
            BattleLogs.Load.parseResponse(xhr)
        } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/update")) {
            BattleLogs.Update.parseResponse(xhr)
        } else if (xhr.responseURL === "https://lacalv.fr/play/wbclassement") {
            BattleLogs.Wbclassement.parseResponse(xhr)
        } else if (xhr.responseURL === "https://lacalv.fr/play/battlewbtry") {
            BattleLogs.Battlewbtry.parseResponse(xhr)
        } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/battle?opponent")) {
            BattleLogs.Pvp.parseResponse(xhr);
        } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/battlepve")) {
            BattleLogs.Tob.parseResponse(xhr);
        } else if (xhr.responseURL === "https://lacalv.fr/play/battlewb") {
            BattleLogs.Boss.parseResponse(xhr);
        } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/battleDonjon")) {
            BattleLogs.Survie.parseResponse(xhr);
        } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/roues")) {
            BattleLogs.Roues.parseResponse(xhr)
        } else if (xhr.responseURL.startsWith("https://lacalv.fr/play/shop")) {
            BattleLogs.Shop.parseResponse(xhr)
        } else if (xhr.responseURL.match(/^https:\/\/lacalv\.fr\/play\/(c|d|r|re|beta)\?count/)
            || xhr.responseURL.match(/^https:\/\/lacalv\.fr\/play\/(coquille_c|coquille_d|coquille_r|coquille_re)\?count/)
            || xhr.responseURL.startsWith("https://lacalv.fr/play/exclusive")) {
            BattleLogs.Roues.parseResponse(xhr)
        }
    }
}
