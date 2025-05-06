/**
 * @class BattleLogsCsv provides functionality to export battle logs to csv
 */
class BattleLogsCsv {

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Add CSV button
            this.__internal__addCsvButton("battlelogs-csv_button", BattleLogs.Menu.BattleLogsSettingsFooterRight);
        }
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__bannedSubKeys = ["type"]

    /**
     * @desc Add CSV button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addCsvButton(id, containingDiv) {
        // Add messages container to battle logs menu
        const csvButton = document.createElement("button");
        csvButton.id = id;
        csvButton.classList.add("svg_csv");
        csvButton.title = "Exporter les messages au format CSV";

        csvButton.onclick = () => {
            const logs = BattleLogs.Message.getLogs();
            const headers = this.__internal__buildHeaders(logs);
            const rows = this.__internal__buildRows(headers, logs);

            let csvContent = headers.join(';') + "\n" + rows.map(row => row.join(";")).join("\n");
            let link = document.createElement("a");
            link.setAttribute("href", "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURIComponent(csvContent));
            let fileName = this.__internal__buildFileName();
            link.setAttribute("download", fileName);
            link.click();
        }

        containingDiv.appendChild(csvButton);
    }

    /**
     * @desc Build file name with date and filters
     *
     * @return Return file name of csv
     */
    static __internal__buildFileName() {
        const fragmentsName = ["LaCalv", "BattleLogs"]

        let filtersEnabled = [];
        let count = 0;
        for (let filtersKey in BattleLogs.Message.Filters) {
            count += 1;
            if (BattleLogs.Message.Filters[filtersKey].enable) {
                filtersEnabled.push(filtersKey);
            }
        }
        let filters = filtersEnabled.length !== count ? filtersEnabled.join("-") : "";
        fragmentsName.push(filters)

        let date = new Date();
        let dateString = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0") + "-" + date.getHours().toString().padStart(2, '0') + "-" + date.getMinutes().toString().padStart(2, "0");
        fragmentsName.push(dateString)

        return fragmentsName.filter(Boolean).join("_") + ".csv"
    }

    /**
     * @desc Build headers of csv
     *
     * @param {Array} logs: Array with logs to convert in CSV
     * @return Array of key
     */
    static __internal__buildHeaders(logs) {
        let headers = new Set();
        logs.forEach(log => {
            // use a recursive function to get all keys
            this.__internal__getKeys(log, headers)
        });
        return [...headers];
    }

    /**
     * @desc Build rows of csv
     *
     * @param {Array} headers: Array with header keys
     * @param {Array} logs: Array with logs to convert in CSV
     * @return Array of row
     */
    static __internal__buildRows(headers, logs) {
        let rows = []
        logs.forEach(log => {
            // Create an empty array to store the data for this event
            let row = [];
            // Iterate through all headers
            headers.forEach(header => {
                // use a recursive function to get all values
                let value = this.__internal__getValue(header, log);
                if (header === "time") {
                    value = BattleLogs.Utils.getDateObject(value).toLocaleString();
                }
                // Remove breakline and semicolon
                value = value.replace(/&nbsp;|;/g, ' ').replace(/\n/g, '|')
                row.push(value);
            });
            // Add the row of data to the rows array
            rows.push(row);
        });

        return rows;
    }

    /**
     * @desc Get keys for CSV recursively from log
     *
     * @param {Object} log: Object containing attributes to convert in CSV
     * @param {Set} headers: Array containing header keys of CSV
     * @param {string} parentKey: Parent key for recursive
     */
    static __internal__getKeys(log, headers, parentKey = '') {
        for (let key in log) {
            const newKey = parentKey ? `${parentKey.charAt(0)}.${key}` : key;
            if (parentKey !== '' && this.__internal__bannedSubKeys.includes(key)) continue;
            if (BattleLogs.Utils.isObject(log[key]) && !["calv", "arme", "famAtk", "famDef"].includes(key) || key === "rewards") {
                this.__internal__getKeys(log[key], headers, key);
            } else {
                headers.add(newKey);
            }
        }
    }

    /**
     * @desc Get value for row recursively from log
     *
     * @param {string} headerKey: Key of header searched in object
     * @param {Object} log: Array containing header keys of CSV
     * @param {string} parentKey: Parent key for recursive
     *
     * @return value of header key
     */
    static __internal__getValue(headerKey, log, parentKey = '') {
        for (let key in log) {
            const newKey = parentKey ? `${parentKey.charAt(0)}.${key}` : key;

            if (newKey === headerKey && parentKey === '') {
                return log[headerKey] === null ? "" : log[headerKey].toString();
            } else if (newKey === headerKey && parentKey !== '') {
                if (BattleLogs.Utils.isArray(log[key]) && log[key].length > 0) {
                    return log[key].map(e => e.count && e.count>1?`${e.name} (${e.count})`:e.name).join(' | ');
                } else if (BattleLogs.Utils.isObject(log[key])){
                    return log[key]['name'];
                }
                return log[key] === null ? "" : log[key].toString();
            }

            if (BattleLogs.Utils.isObject(log[key])) {
                let value = this.__internal__getValue(headerKey, log[key], key);
                if (value) {
                    return value.toString();
                }
            }
        }
        return "";
    }
}