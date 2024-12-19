/**
 * @class The BattleLogsUtilsIndexedDB regroups helpers related to battle logs local storage
 */
class BattleLogsUtilsIndexedDB
{
    static openRequest = null;
    static db = null;

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
            await new Promise((resolve, reject) => {
                this.openRequest = indexedDB.open("Battlelogs", 1);

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
        switch(event.oldVersion) { // existing db version
            case 0:
                // version 0 means that the client had no database
                // perform initialization
                db.createObjectStore('Sound');
                if(!db.objectStoreNames.contains('Boss-Logs')){
                    const store = db.createObjectStore(BattleLogs.Boss.Settings.Logs, { keyPath: 'time'});
                    let bossLogs = BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs.Boss.Settings.Logs)
                    if (bossLogs !== null){
                        console.log("toto")
                        bossLogs.forEach(log => {
                            store.add(log);
                        })
                    }
                }
            case 1:
                // client had version 1
                // update
        }
    }
}
