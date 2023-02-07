/**
 * @class The BattleLogsUtils regroups any utility methods needed across the different functionalities
 */
class BattleLogsUtils {
    // Aliases on the other classes
    static LocalStorage = BattleLogsUtilsLocalStorage;

    /**
     * @desc Initializes the Utils components
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        this.__internal__customStringPrototype()
    }

    /**
     * @desc Truncate numbers and return int if ends with 0
     *
     * @param {Number} number: Number to truncate
     *
     * @return int or float truncate to 2 digits
     */
    static truncateNumber(number) {
        const trunc = number.toFixed(2);
        if (trunc.endsWith('.00')) {
            return parseInt(trunc);
        }
        return parseFloat(trunc);
    }

    /**
     * @brief Converts the string representation of a number to its integer equivalent
     *
     * @param {string} str: The string to parse
     * @param {number} defaultValue: The default value (in case the string was not representing an int)
     *
     * @returns The int value if the string could be parsed, the default value otherwise
     */
    static tryParseInt(str, defaultValue = 0)
    {
        let result = parseInt(str);
        if (result === 0) {
            return 0;
        }
        return isNaN(result) ? defaultValue : result;
    }

    /**
     * @desc Parse date and return date object
     *
     * @param {string, Date} time: Date in string or date format
     *
     * @return Date in date object
     */
    static getDate(time) {
        return typeof time === "string" ? new Date(time) : time;
    }

    /**
     * @desc Minutes elapsed between two date
     *
     * @param {Date} lastDate
     * @param {Date} date
     *
     * @return Number of minutes elapsed
     */
    static minElapsedBetweenDate(lastDate, date) {
        const diff = Math.abs(date - lastDate);
        return Math.floor((diff/1000)/60);
    }

    /**
     * @desc Seconds elapsed between two date
     *
     * @param {Date} lastDate
     * @param {Date} date
     *
     * @return Number of seconds elapsed
     */
    static secElapsedBetweenDate(lastDate, date) {
        const diff = date - lastDate;
        return Math.abs((diff/1000));
    }

    /**
     * @desc Check if var is array
     *
     * return Boolean
     */
    static isArray(array) {
        return Object.prototype.toString.call(array) === '[object Array]';
    }

    /**
     * @desc Check if var is object
     *
     * return Boolean
     */
    static isObject(object) {
        return Object.prototype.toString.call(object) === '[object Object]';
    }

    /**
     * @desc Sort array by time attribute
     *
     * @param {Array} array: Array of object to sort
     *
     * @return Sorted array
     */
    static sortArrayByDate(array) {
        return array.sort((a, b) =>
            this.getDate(a.time) - this.getDate(b.time)
        );
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    /**
     * @desc Inject string prototype functions
     */
    static __internal__customStringPrototype() {
        String.prototype.format = function () {
            let num = arguments.length;
            let oStr = this;
            for (let i = 0; i < num; i++) {
                let pattern = "\\{" + (i) + "\\}";
                let re = new RegExp(pattern, "g");
                oStr = oStr.replace(re, arguments[i]);
            }
            return oStr.capitalize();
        }
        String.prototype.capitalize = function () {
            return this.charAt(0).toUpperCase() + this.slice(1);
        }
    }
}