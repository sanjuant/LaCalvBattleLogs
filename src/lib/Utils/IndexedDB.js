/**
 * @class The BattleLogsUtilsIndexedDB regroups helpers related to battle logs local storage
 */
class BattleLogsUtilsIndexedDB
{
    static openRequest = null;
    static db = null;
    static playerId = null;

    /**
     * @desc Parse XMLHttpRequest response
     *
     * @param {XMLHttpRequest} xhr: The xhr request
     */
    static async parseResponse(xhr) {
        let data;
        try {
            data = xhr.response;
            if (typeof data !== "string") return;
            this.playerId = data;
        } catch (e) {
            return
        }
    }

    /**
     * @desc Open and initialize database
     *
     * @param initStep: The current battle logs init step
     */
    static async initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            const gameUrl = BattleLogsComponentLoader.gameUrl;
            const baseUrl = gameUrl.endsWith("/") ? gameUrl : gameUrl + "/";

            await fetch(baseUrl+"play/isOnline")
                .then(response => console.log(response.status) || response)
                .then(response => response.text())
                .then(body => this.playerId = body) 
            console.log(this.playerId);
            if (this.playerId.includes("disconnected")) { return false; }
            await new Promise((resolve, reject) => {
                this.openRequest = indexedDB.open(`Battlelogs-${this.playerId}`, 1);

                this.openRequest.onupgradeneeded = this.__internal__onUpgradeNeeded.bind(this);
                
                this.openRequest.onerror = event => reject(event.target.error);
                
                this.openRequest.onsuccess = function() {
                    this.db = this.openRequest.result;
                    this.db.onversionchange = function() {
                        this.db.close();
                        alert("Database is outdated, please reload the page.");
                        reject("Database is outdated, please reload the page.");
                    }.bind(this);
                    resolve(this.db);
                }.bind(this);

                this.openRequest.onblocked = function() {
                    // this event shouldn't trigger if we handle onversionchange correctly
                
                    // it means that there's another open connection to the same database
                    // and it wasn't closed after db.onversionchange triggered for it
                };
            });
        }
        return true;
    }
    
    /**
     * @desc Gets the value associated to @p key from the indexedDB
     *
     * @param {string} key: The key to get the value of
     *
     * @returns The value associated to the @p key
     */
    static async getValue(storeName, key)
    {
        return new Promise((resolve, reject) => {
            const txn = this.db.transaction(storeName);
            const store = txn.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = event => resolve(event.target.result);
            request.onerror = event => reject(event.target.error);
        });
    }

    /**
     * @desc Sets the value associated to @p key to @p value from the local storage
     *
     * @param {string} key: The key to set the value of
     * @param {any} value: The value
     */
    static async setValue(storeName, key, value)
    {
        return new Promise((resolve, reject) => {
            const txn = this.db.transaction(storeName, "readwrite");
            const store = txn.objectStore(storeName);
            const request = store.put(value, key);
            request.onsuccess = event => resolve(event.target.result);
            request.onerror = event => reject(event.target.error);
        });
    }

    /**
     * @desc Gets the value associated to @p key from the local storage
     *
     * @param {string} storeName: The key to set the value of
     * @param {any} value: The value
     * @param {Number} limit: The limit size of messages logs
     */
    static async setComplexValue(storeName, value, limit=null)
    {
        await new Promise(async (resolve, reject) => {
            const txn = this.db.transaction(storeName, "readwrite");
            const store = txn.objectStore(storeName);
            let count = 0;
            const countRequest = store.count();
            countRequest.onsuccess = function() {
                count = countRequest.result;
                console.log(count)
                
                if (limit != null) {
                    const multilogsType = [
                        BattleLogs.Survie.Settings.Type,
                        BattleLogs.Histoire.Settings.Type
                    ]
                    if ( !multilogsType.includes(value.type) && count === (limit - 1) ||
                            multilogsType.includes(value.type) && count === (limit - 3) ) {
                        BattleLogs.Message.appendMessage(`Tu approches de la limite de ${limit} messages pour le type ${value.type}. Pour tout conserver, pense à les exporter. Fais de la place en supprimant les anciens, ou laisse faire le nettoyage automatique.`, "Info", {"type": "Info", "time": new Date().toISOString()});
                    }
                    if (count === limit) {
                        let cursorRequest = store.openCursor();
                        cursorRequest.onsuccess = () => store.delete(cursorRequest.result.key);
                    }
                }
                store.add(value);
                txn.oncomplete = () => resolve();
                txn.onerror = error => reject(error);
                txn.onabort = event => reject(event);
            }
        })
    }
    
    /**
     * @desc Sets the value associated to @p key to @p value from the local storage
     *
     * @param {string} key: The key to set the value of
     * @param {any} value: The value
     */
    static async addItemsFromArray(storeName, items)
    {
        return new Promise((resolve, reject) => {
            const txn = this.db.transaction(storeName, "readwrite");
            const store = txn.objectStore(storeName);
            items.forEach(item => {
                store
                    .add(item)
                    .onerror = event => reject(event.target.error);
            })
            txn.oncomplete = event => resolve(event.target.result);
        });
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    /**
     * @desc Creates or update the database
     *
     * @note This method is for internal use only, other classes should never call it
     *
     * @param {Object} event: The event from indexedDB
     */
    static __internal__onUpgradeNeeded(event)
    {
        let db = this.openRequest.result;
        const populateDB = (storeName, key='time') => {
            if(!db.objectStoreNames.contains(storeName)){
                const store = db.createObjectStore(storeName, { keyPath: key});
                let items = BattleLogs.Utils.LocalStorage.getComplexValue(storeName)
                if (items !== null){
                    console.log("toto")
                    items.forEach(item => {
                        store.add(item);
                    })
                }
            }
        };

        switch(event.oldVersion) { // existing db version
            case 0:
                // version 0 means that the client had no database
                // perform initialization
                db.createObjectStore('Sound');
                populateDB(BattleLogs.Boss.Settings.Logs);
                populateDB(BattleLogs.Summarize.Settings.x10.Logs);
                populateDB(BattleLogs.Summarize.Settings.x50.Logs);
                populateDB(BattleLogs.Summarize.Settings.x100.Logs);
                populateDB(BattleLogs.Histoire.Settings.Logs);
                populateDB(BattleLogs.Notif.Settings.Logs);
                populateDB(BattleLogs.Pvp.Settings.Logs);
                populateDB(BattleLogs.Survie.Settings.Logs);
                populateDB(BattleLogs.Tob.Settings.Logs);
            case 1:
                // client had version 1
                // update
        }
    }
}
