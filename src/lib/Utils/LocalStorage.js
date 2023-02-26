/**
 * @class The BattleLogsUtilsLocalStorage regroups helpers related to battle logs local storage
 */
class BattleLogsUtilsLocalStorage
{
    /**
     * @desc Gets the value associated to @p key from the local storage
     *
     * @param {string} key: The key to get the value of
     *
     * @returns The value associated to the @p key
     */
    static getComplexValue(key)
    {
        return JSON.parse(localStorage.getItem(this.__internal__getSaveSpecificKey(key)));
    }


    /**
     * @desc Gets the value associated to @p key from the local storage
     *
     * @param {string} key: The key to set the value of
     * @param {any} value: The value
     */
    static setComplexValue(key, value)
    {
        const existingValue = this.getComplexValue(key)
        if (Array.isArray(existingValue)) {
            existingValue.push(value);
            value = existingValue
        }
        localStorage.setItem(this.__internal__getSaveSpecificKey(key), JSON.stringify(value));
    }

    /**
     * @desc Gets the value associated to @p key from the local storage
     *
     * @param {string} key: The key to set the value of
     * @param {string} time: Time of log to delete
     */
    static delLogValue(key, time)
    {
        const value = this.getComplexValue(key)
        if (Array.isArray(value)) {
            let index = value.findIndex((log) => log.time === time);
            if (index !== -1) {
                value.splice(index, 1);
            }
        }
        localStorage.setItem(this.__internal__getSaveSpecificKey(key), JSON.stringify(value));
    }

    /**
     * @desc Sets the value associated to @p key to @p defaultValue from the local storage,
     *        if it was never set before
     *
     * @param {string} key: The key to set the default value of
     * @param {any} defaultValue: The default value
     */
    static setDefaultComplexValue(key, defaultValue)
    {
        let playerKey = this.__internal__getSaveSpecificKey(key);
        if (localStorage.getItem(playerKey) === null)
        {
            localStorage.setItem(playerKey, JSON.stringify(defaultValue));
        }
    }

    /**
     * @desc Sets the value associated to @p key to @p defaultValue from the local storage,
     *        force
     *
     * @param {string} key: The key to set the default value of
     * @param {any} forceValue: The value force
     */
    static resetDefaultComplexValue(key, forceValue)
    {
        let playerKey = this.__internal__getSaveSpecificKey(key);
        localStorage.setItem(playerKey, JSON.stringify(forceValue));
    }

    /**
     * @desc Gets the value associated to @p key from the local storage
     *
     * @param {string} key: The key to get the value of
     *
     * @returns The value associated to the @p key
     */
    static getValue(key)
    {
        return localStorage.getItem(this.__internal__getSaveSpecificKey(key));
    }

    /**
     * @desc Sets the value associated to @p key to @p value from the local storage
     *
     * @param {string} key: The key to set the value of
     * @param {any} value: The value
     */
    static setValue(key, value)
    {
        localStorage.setItem(this.__internal__getSaveSpecificKey(key), value);
    }

    /**
     * @desc Sets the value associated to @p key to @p defaultValue from the local storage,
     *        if it was never set before
     *
     * @param {string} key: The key to set the default value of
     * @param {any} defaultValue: The default value
     */
    static setDefaultValue(key, defaultValue)
    {
        let playerKey = this.__internal__getSaveSpecificKey(key);
        if (localStorage.getItem(playerKey) === null)
        {
            localStorage.setItem(playerKey, defaultValue);
        }
    }

    /**
     * @desc Unsets the value associated to @p key from the local storage
     *
     * @param {string} key: The key to get the value of
     */
    static unsetValue(key)
    {
        return localStorage.removeItem(this.__internal__getSaveSpecificKey(key));
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    /**
     * @desc Creates a save specific battle logs local storage key from the given generic @p key
     *
     * @note This method is for internal use only, other classes should never call it
     *
     * @param {string} key: The local storage generic key to convert
     *
     * @returns The save specific battle logs local storage key
     */
    static __internal__getSaveSpecificKey(key)
    {
        // Always prepend 'BattleLogs' and the battlelogs save unique id
        return `BattleLogs-${key}`;
    }
}
