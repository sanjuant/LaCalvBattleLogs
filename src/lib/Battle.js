/**
 * @class The BattleLogsBattle regroups battle functionalities
 */
class BattleLogsBattle {

    static Settings = {
        MenuSettings: "Battle-Settings",
    };

    static Messages = {
        normal: {
            user: "Joueur",
            opponent: "Adversaire",
            rewards: "Récompenses",
            stat: "{0}&nbsp;{1}"
        },
        short: {
            user: "",
            opponent: "",
            rewards: "",
            stat: "{0}:{1}"
        },
        list: {
            user: "Joueur",
            opponent: "Adversaire",
            rewards: "Récompenses",
            stat: "&nbsp;&nbsp;&nbsp;&nbsp;{0} : {1}"
        },
    }

    /**
     * @desc Initialize Class, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingsValues()
            this.__internal__battleSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
            // this.__internal__addSettings();
            BattleLogs.Menu.addSettings(this.__internal__menuSettings, this.__internal__battleSettings, "Battle");
            // BattleLogs.Menu.setInputsSettings(this.Settings.BattleSettings);
        } else if (initStep === BattleLogs.InitSteps.Finalize) {
        }
    }

    /**
     * @desc Convert data to objects used in log
     *
     * @param {JSON} data: data JSON from LaCalv responses
     *
     * @returns stats user, opponent and rewards
     */
    static getStatsFromData(data) {
        if (!data["A"] || !data["B"]) return;
        const user = this.__internal__createPlayer("user", data["A"]["name"]);
        const opponent = this.__internal__createPlayer("opponent", data["B"]["name"]);
        const rewards = this.__internal__createRewards("rewards");

        let actions = data["data"];
        this.__internal__setResults(user, opponent, data);
        this.__internal__setRewards(rewards, data, user.result)
        this.__internal__setDmg(user, opponent, data);


        for (let [, action] of actions.entries()) {
            this.__internal__setShields(user, opponent, action);
            this.__internal__setHealth(user, opponent, action);

            // let current;
            // if (action.from === user.name) {
            //     current = user;
            // } else if (action.from === opponent.name) {
            //     current = opponent;
            // }

            if (action.events && action.events.length > 0) {
                this.__internal__incrementTour(user, opponent, action);
                for (let event in action.events) {
                    event = action.events[event]
                    if (event.type === "Attaque") {
                        if (event.name === "ATTAQUE") {
                            this.__internal__incrementEsquive(user, opponent, event);
                        } else if (event.name === "bouclier") {

                        }

                    }
                }

                // this.__internal__incrementDoubleCoup(current, action);
                // this.__internal__incrementVdv(current, action);
                // this.__internal__incrementStun(user, opponent, action);
                // this.__internal__incrementErosion(current, action);
                // this.__internal__incrementRenvoi(user, opponent, action);

            }
            // else if (action.data && action.action === "poison") {
            //     this.__internal__incrementPoison(current, action);
            // } else if (action.data && action.action === "chance") {
            //     this.__internal__incrementVieGain(current, action);
            // }
        }

        return {user, opponent, rewards};
    }

    /**
     * @desc Build message of battle, used in class of log
     *
     * @param {Object} log
     * @param {Boolean} summarize: Set to true if it's summarize log
     *
     * @returns battle message for battle logs message
     */
    static buildBattleMessage(log, summarize = false) {
        const type = summarize ? log.logType : log.type
        const displaySummary = BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs.Battle.Settings.MenuSettings)["misc-summary"];
        let fragments = []

        const userSpanFragments = [];
        const userSpan = document.createElement("span");
        userSpan.style.color = this.__internal__battleSettings["user-color"];
        if (this.Messages[BattleLogs.Message.Settings.Format].user !== "") {
            const uLabelSpan = document.createElement("span");
            uLabelSpan.classList.add(`${BattleLogs.Message.Settings.Format}-label`);
            uLabelSpan.textContent = this.Messages[BattleLogs.Message.Settings.Format].user;
            userSpanFragments.push(uLabelSpan.outerHTML);
        }
        const uBannedStats = displaySummary
            ? BattleLogs[type].BannedStats[BattleLogs.Message.Settings.Format].user
            : []
        ;
        const uAttrsMessage = this.__internal__convertAttributesToMessage(log.user, uBannedStats);
        if (uAttrsMessage) {
            userSpanFragments.push(uAttrsMessage);
            userSpan.innerHTML = userSpanFragments.filter(Boolean).join(this.__internal__joiner.labelWithStats[BattleLogs.Message.Settings.Format]);
            fragments.push(userSpan.outerHTML)
        }


        const opponentSpanFragments = [];
        const opponentSpan = document.createElement("span");
        opponentSpan.style.color = this.__internal__battleSettings["opponent-color"];
        if (this.Messages[BattleLogs.Message.Settings.Format].opponent !== "") {
            const oLabelSpan = document.createElement("span");
            oLabelSpan.classList.add(`${BattleLogs.Message.Settings.Format}-label`);
            oLabelSpan.textContent = this.Messages[BattleLogs.Message.Settings.Format].opponent;
            opponentSpanFragments.push(oLabelSpan.outerHTML);
        }
        const oBannedStats = displaySummary
            ? BattleLogs[type].BannedStats[BattleLogs.Message.Settings.Format].opponent
            : []
        ;
        const oAttrsMessage = this.__internal__convertAttributesToMessage(log.opponent, oBannedStats);
        if (oAttrsMessage) {
            opponentSpanFragments.push(oAttrsMessage);
            opponentSpan.innerHTML = opponentSpanFragments.filter(Boolean).join(this.__internal__joiner.labelWithStats[BattleLogs.Message.Settings.Format]);
            fragments.push(opponentSpan.outerHTML);
        }

        const rewardsSpanFragments = [];
        const rewardsSpan = document.createElement("span");
        rewardsSpan.style.color = this.__internal__battleSettings["rewards-color"];
        if (this.Messages[BattleLogs.Message.Settings.Format].rewards !== "") {
            const rLabelSpan = document.createElement("span");
            rLabelSpan.classList.add(`${BattleLogs.Message.Settings.Format}-label`);
            rLabelSpan.textContent = this.Messages[BattleLogs.Message.Settings.Format].rewards;
            rewardsSpanFragments.push(rLabelSpan.outerHTML);
        }
        const rAttrsMessage = this.__internal__convertAttributesToMessage(log.rewards);
        if (rAttrsMessage) {
            rewardsSpanFragments.push(rAttrsMessage);
            rewardsSpan.innerHTML = rewardsSpanFragments.filter(Boolean).join(this.__internal__joiner.labelWithStats[BattleLogs.Message.Settings.Format]);
            fragments.push(rewardsSpan.outerHTML);
        }

        return fragments.join(this.__internal__joiner.stats[BattleLogs.Message.Settings.Format]);
    }

    /**
     * @desc Create player object
     *
     * @param {string} type: user or opponent
     * @param {string} name: name of player
     * @returns player object
     */
    static createPlayer(type, name = "") {
        return this.__internal__createPlayer(type, name)
    }

    /**
     * @desc Create rewards object
     *
     * @param {string} type: rewards
     * @returns rewards object
     */
    static createRewards(type = "rewards") {
        return this.__internal__createRewards(type)
    }

    /**
     * @desc Update settings of class
     */
    static updateSettings() {
        this.__internal__battleSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
    }

    /*********************************************************************\
    /***    Internal members, should never be used by other classes    ***\
    /*********************************************************************/

    static __internal__battleSettings = null;
    static __internal__joiner = {
        stats: {
            normal: ", ",
            short: " ",
            list: "\n"
        },
        labelWithStats: {
            normal: " ",
            short: " ",
            list: " : \n"
        }
    }
    static __internal__stats = {
        tour: {
            name: {
                normal: "Tour",
                short: "Tour",
                list: "Tour"
            },
            display: true,
            setting: true,
            text: "Nombre de tours",
            type: "checkbox"
        },
        vie: {
            name: {
                normal: "Vie",
                short: "Vie",
                list: "Vie"
            },
            display: true,
            setting: true,
            text: "Vie restante",
            type: "checkbox"
        },
        dmg: {
            name: {
                normal: "Dommage",
                short: "Dmg",
                list: "Dommage"
            },
            display: true,
            setting: true,
            text: "Dégâts infligés",
            type: "checkbox"
        },
        vieBase: {
            name: {
                normal: "Vie de base",
                short: "Vie de base",
                list: "Vie de base"
            },
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        vieGain: {
            name: {
                normal: "Gain de vie",
                short: "Gdv",
                list: "Gain de vie"
            },
            display: false,
            setting: true,
            text: "Vie gagnés",
            type: "checkbox"
        },
        bouclier: {
            name: {
                normal: "Bouclier",
                short: "Bouc",
                list: "Bouclier"
            },
            display: true,
            setting: true,
            text: "Bouclier restant",
            type: "checkbox"
        },
        esquive: {
            name: {
                normal: "Esquive",
                short: "Esq",
                list: "Esquive"
            },
            display: true,
            setting: true,
            text: "Nombre d'esquives",
            type: "checkbox"
        },
        stun: {
            name: {
                normal: "Stun",
                short: "Stun",
                list: "Stun"
            },
            display: true,
            setting: true,
            text: "Nombre d'étourdissements",
            type: "checkbox"
        },
        dc: {
            name: {
                normal: "Double coup",
                short: "Dc",
                list: "Double coup"
            },
            display: true,
            setting: true,
            text: "Double coup",
            type: "checkbox"
        },
        vdv: {
            name: {
                normal: "Vol de vie",
                short: "Vdv",
                list: "Vol de vie"
            },
            display: false,
            setting: true,
            text: "Vol de vie",
            type: "checkbox"
        },
        renvoi: {
            name: {
                normal: "Renvoi",
                short: "Rnv",
                list: "Renvoi"
            },
            display: true,
            setting: true,
            text: "Dégâts renvoyés",
            type: "checkbox"
        },
        erosion: {
            name: {
                normal: "Erosion",
                short: "Ero",
                list: "Erosion"
            },
            display: false,
            setting: true,
            text: "Points de vie rongés",
            type: "checkbox"
        },
        poison: {
            name: {
                normal: "Poison",
                short: "Poi",
                list: "Poison"
            },
            display: false,
            setting: true,
            text: "Dégâts empoisonnés",
            type: "checkbox"
        },
        result: {
            name: {
                normal: "Résultat",
                short: "Rslt",
                list: "Résultat"
            },
            display: false,
            setting: true,
            text: "Afficher le résultat",
            type: "checkbox"
        },
        name: {
            name: {
                normal: "Nom",
                short: "Nom",
                list: "Nom"
            },
            display: false,
            setting: true,
            text: "Afficher le nom",
            type: "checkbox"
        }
    }
    static __internal__stats_user = {
        color: {
            name: "Couleur",
            display: "#8094ff",
            setting: true,
            text: "Couleur des messages",
            type: "color"
        }
    }
    static __internal__stats_opponent = {
        color: {
            name: "Couleur",
            display: "#ff6464",
            setting: true,
            text: "Couleur des messages",
            type: "color"
        }
    }
    static __internal__rewards = {
        alo: {
            name: {
                normal: "Alopièce",
                short: "Alo",
                list: "Alopièce"
            },
            display: true,
            setting: true,
            text: "Alopièces gagnées",
            type: "checkbox"
        },
        event: {
            name: {
                normal: "Event",
                short: "Evt",
                list: "Event"
            },
            display: true,
            setting: true,
            text: "Points d'évents gagnés",
            type: "checkbox"
        },
        exp: {
            name: {
                normal: "Expérience",
                short: "Exp",
                list: "Expérience"
            },
            display: true,
            setting: true,
            text: "Expériences gagnées",
            type: "checkbox"
        },
        elo: {
            name: {
                normal: "Elo",
                short: "Elo",
                list: "Elo"
            },
            display: true,
            setting: true,
            text: "Progression elo",
            type: "checkbox"
        },
        items: {
            name: {
                normal: "Items",
                short: "Itm",
                list: "Items"
            },
            display: true,
            setting: true,
            text: "Afficher les objets gagnés",
            type: "checkbox"
        },
        color: {
            name: "Couleur",
            display: "#ffd064",
            setting: true,
            text: "Couleur des messages",
            type: "color"
        }
    }
    static __internal__misc = {
        summary: {
            name: "Résumé",
            display: true,
            setting: true,
            text: "Afficher le résumé des combats",
            type: "checkbox"
        },
    }
    static __internal__menuSettings = {
        user: {
            title: "Statistiques du joueur",
            stats: Object.assign({}, this.__internal__stats, this.__internal__stats_user)
        },
        opponent: {
            title: "Statistiques de l'adversaire",
            stats: Object.assign({}, this.__internal__stats, this.__internal__stats_opponent)
        },
        rewards: {
            title: "Affichages des récompenses",
            stats: Object.assign({}, this.__internal__rewards)
        },
        misc: {
            title: "Affichages divers",
            stats: Object.assign({}, this.__internal__misc)
        }
    }

    /**
     * @desc Convert attributes of objects in message
     *
     * @param {Object} attributes: Attributes to convert in message
     * @param {Array} bannedAttrs: Attributes that won't be displayed
     *
     * @returns Converted attributes in messages
     */
    static __internal__convertAttributesToMessage(attributes, bannedAttrs = []) {
        let stats = [];
        Object.entries(attributes).forEach(attribute => {
            const [key, value] = attribute;
            const settingKey = attributes.type + '-' + key

            // Only display stat if value is not 0 and not banned
            if (this.__internal__battleSettings[settingKey]
                && (typeof value === "number" && value !== 0 || Array.isArray(value) && value.length > 0 || typeof value === "string" && value.length > 0)
                && !bannedAttrs.includes(key)
            ) {
                const labelSpan = document.createElement("span");
                if (attributes.type === "rewards") {
                    labelSpan.textContent = this.__internal__rewards[key].name[BattleLogs.Message.Settings.Format];
                } else {
                    labelSpan.textContent = this.__internal__stats[key].name[BattleLogs.Message.Settings.Format];
                }
                labelSpan.classList.add("normal-stat")

                const valueSpan = document.createElement("span");
                if (Array.isArray(value)) {
                    let items = []
                    value.forEach(item => {
                        if (typeof item === "string") {
                            items.push(item)
                        } else {
                            const objectSpan = document.createElement("span");
                            objectSpan.classList.add("rarity-" + item.rarity);
                            objectSpan.textContent = item.count > 1 ? `${item.name} (x${item.count})` : item.name;
                            items.push(objectSpan.outerHTML)
                        }
                    })
                    valueSpan.innerHTML = items.join(', ');
                } else {
                    valueSpan.textContent = value.toString();
                }
                stats.push(this.Messages[BattleLogs.Message.Settings.Format].stat.format(labelSpan.outerHTML, valueSpan.outerHTML));
            }
        })
        return stats.join(this.__internal__joiner.stats[BattleLogs.Message.Settings.Format]);
    }

    /**
     * @desc Set result of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} data: data of battle
     */
    static __internal__setResults(user, opponent, data) {
        if ("winner" in data && "looser" in data && user.name === data.winner) {
            user.result = "winner";
            opponent.result = "looser";
        } else if ("winner" in data && "looser" in data) {
            user.result = "looser";
            opponent.result = "winner";
        }
    }

    /**
     * @desc Set rewards of battle
     *
     * @param {Object} rewards: Rewards of battle
     * @param {JSON} data: Data of battle
     * @param {string} result: Result of battle
     */
    static __internal__setRewards(rewards, data, result) {
        if (data["rewards"]) {
            const dataRewards = data["rewards"]
            if (dataRewards["alopieces"]) {
                rewards.alo = dataRewards["alopieces"]
            }
            if (dataRewards["event"]) {
                rewards.event = dataRewards["event"]
            }
            rewards.items = this.__internal__createRewardItems(dataRewards);
        } else {
            if (data["aloUser"]) {
                rewards.alo = data["aloUser"]
            }
            if (data["eloUser"]) {
                rewards.elo = result === "winner" ? data["eloUser"] : -Math.abs(data["eloUser"]);
            }
            if (data["event"]) {
                rewards.event = data["event"]
            }
        }
        if (data["experienceA"]) {
            rewards.exp = data["experienceA"]
        }
        if (data["aloA"]) {
            rewards.alo = data["aloA"]
        }
        if (data["eloA"]) {
            rewards.elo = data["eloA"]
        }
    }

    /**
     * @desc Create rewards of battle
     *
     * @param {Object} dataRewards: Rewards of battle
     *
     * @return rewards of battle
     */
    static __internal__createRewardItems(dataRewards) {
        const rewardsType = {
            item: {class: "Load"},
            arme: {class: "Load"},
            calv: {class: "Load"},
            object: {class: "Roues"}
        };
        let items = [];
        for (const type of Object.keys(rewardsType)) {
            if (type in dataRewards) {
                for (const item of dataRewards[type]) {
                    let object = BattleLogs[rewardsType[type]["class"]].getObjectByShortName(item.value);
                    if (typeof object === "string"){
                        object = {name: item.value, count: item.count, rarity: -1, type:type};
                    }
                    let existingItem = items.find(i => i.name === object["name"]);
                    if (existingItem === undefined) {
                        items.push({name: object["name"], count: item.count, rarity: object["rarity"], type:type});
                    } else {
                        existingItem.count += 1
                    }
                }
            }
        }

        return items;
    }

    /**
     * @desc Set shield of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__setShields(user, opponent, action) {
        if (action["attacker"] && action["defender"]) {
            if (action["turn"] === 0) {
                user.bouclierBase = action["attacker"]["computed"]["bouclier"] ? action["attacker"]["computed"]["bouclier"] : 0;
                opponent.bouclierBase = action["defender"]["computed"]["bouclier"] ? action["defender"]["computed"]["bouclier"] : 0;
            }

            if (action["attacker"]["name"] === user.name) {
                user.bouclier = action["attacker"]["computed"]["bouclier"] ? action["attacker"]["computed"]["bouclier"] : 0;
                opponent.bouclier = action["defender"]["computed"]["bouclier"] ? action["defender"]["computed"]["bouclier"] : 0;
            } else if (action["attacker"]["name"] === opponent.name) {
                opponent.bouclier = action["attacker"]["computed"]["bouclier"] ? action["attacker"]["computed"]["bouclier"] : 0;
                user.bouclier = action["defender"]["computed"]["bouclier"] ? action["defender"]["computed"]["bouclier"] : 0;
            }
        }
    }

    /**
     * @desc Set health of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__setHealth(user, opponent, action) {
        if (action["attacker"] && action["defender"]) {
            if (action["turn"] === 0) {
                user.vieBase = action["pvs"]["A"];
                opponent.vieBase = action["pvs"]["B"];
            }
            user.vie = action["pvs"]["A"];
            opponent.vie = action["pvs"]["B"];
        }
    }

    /**
     * @desc Set dmg of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: action of battle
     */
    static __internal__setDmg(user, opponent, action) {
        if ("damages" in action) user.dmg = action["damages"];
        if ("damagesOpponent" in action) opponent.dmg = action["damagesOpponent"];
    }

    /**
     * @desc Increment tour of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementTour(user, opponent, action) {
        if (action.attacker.name === user.name) {
            user.tour += 1;
        } else if (action.attacker.name === opponent.name) {
           opponent.tour += 1;
        }
    }

    /**
     * @desc Increment double coup of player
     *
     * @param {Object} current: Current player of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementDoubleCoup(current, action) {
        if (action["data"]["dc"] === true) current.dc += 1;
    }

    /**
     * @desc Increment vol de vie of player
     *
     * @param {Object} current: Current player of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementVdv(current, action) {
        if (action["data"]["vdv"]) current.vdv += action["data"]["vdv"];
    }

    /**
     * @desc Increment erosion of player
     *
     * @param {Object} current: Current player of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementErosion(current, action) {
        if ("erosion" in action["data"]) current.erosion += action["data"]["erosion"];
    }

    /**
     * @desc Increment renvoi of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementRenvoi(user, opponent, action) {
        if (action["from"] === user.getName()) {
            if ("renvoi" in action["data"]) opponent.renvoi += action["data"]["renvoi"];
        } else if (action["from"] === opponent.getName()) {
            if ("renvoi" in action["data"]) user.renvoi += action["data"]["renvoi"];
        }
    }

    /**
     * @desc Increment stun of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementStun(user, opponent, action) {
        if (action["from"] === user.getName()) {
            if (action["data"]["ublocked"] === true) opponent.stun += 1;
        } else if (action["from"] === opponent.getName()) {
            if (action["data"]["ublocked"] === true) user.stun += 1;
        }
    }

    /**
     * @desc Increment esquive of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} event: Event of battle
     */
    static __internal__incrementEsquive(user, opponent, event) {
        if (event.target === user.name) {
            if ("esquived" in event && event.esquived) user.esquive += 1;
        } else {
            if ("esquived" in event && event.esquived) opponent.esquive += 1;
        }
    }

    /**
     * @desc Increment poison of player
     *
     * @param {Object} current: Current player of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementPoison(current, action) {
        if ("pv" in action["data"]) current.poison += action["data"]["pv"];
    }

    /**
     * @desc Increment gain de vie of player
     *
     * @param {Object} current: Current player of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementVieGain(current, action) {
        if ("pv" in action["data"]) current.vieGain += action["data"]["pv"];
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.MenuSettings, {});
    }

    /**
     * @desc Create player object
     *
     * @param {string} type: user or opponent
     * @param {string} name: name of player
     * @returns player object
     */
    static __internal__createPlayer(type, name) {
        const player = new this.Player(type, name);
        player.tour = 0;
        player.vie = 0;
        player.dmg = 0;
        player.vieBase = 0;
        player.vieGain = 0;
        player.bouclier = 0;
        player.bouclierBase = 0;
        player.esquive = 0;
        player.stun = 0;
        player.dc = 0;
        player.vdv = 0;
        player.renvoi = 0;
        player.erosion = 0;
        player.poison = 0;
        player.result = "";
        return player;
    }

    /**
     * @desc Create rewards object
     *
     * @param {string} type: rewards
     * @returns rewards object
     */
    static __internal__createRewards(type = "rewards") {
        const rewards = new this.Rewards(type);
        rewards.elo = 0;
        rewards.alo = 0;
        rewards.exp = 0;
        rewards.event = 0;
        rewards.items = [];
        return rewards;
    }

    static Player = class {
        constructor(type, name) {
            this.type = type;
            this.name = name;
        }

        getName() {
            return this.name;
        }

        setName(value) {
            this.name = value;
        }

        getType() {
            return this.type;
        }

        setType(value) {
            this.type = value;
        }
    }

    static Rewards = class {
        constructor(type) {
            this.type = type;
        }

        getType() {
            return this.type;
        }

        setType(value) {
            this.type = value;
        }
    }
}
