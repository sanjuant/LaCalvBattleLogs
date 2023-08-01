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
            stuff: "Stuff <span class='stuff-name'>(#{0} - {1})</span>",
            stat: "{0}&nbsp;{1}",
            familier: "<span class='normal-familier'>(F:{0})</span>"
        },
        short: {
            user: "",
            opponent: "",
            rewards: "",
            stuff: "#{0}-{1}</span>",
            stat: "{0}:{1}",
            familier: "<span class='short-familier'>(F:{0})</span>"
        },
        list: {
            user: "Joueur",
            opponent: "Adversaire",
            rewards: "Récompenses",
            stuff: "Stuff <span class='stuff-name'>(#{0} - {1})</span>",
            stat: "&nbsp;&nbsp;&nbsp;&nbsp;{0} : {1}",
            familier: " <span class='list-familier'>(F:{0})</span>"
        },
    }

    static BattleSettings = null;


    /**
     * @desc Initialize Class, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            this.__internal__setDefaultSettingsValues()
            this.BattleSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
            // this.__internal__addSettings();
            BattleLogs.Menu.addSettings(this.__internal__menuSettings, this.BattleSettings, "Battle");
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
        if ("fA" in data) {
            user.famName = data["fA"]["name"]
        }
        const opponent = this.__internal__createPlayer("opponent", data["B"]["name"]);
        if ("fB" in data) {
            opponent.famName = data["fB"]["name"]
        }
        const rewards = this.__internal__createRewards("rewards");
        const stuff = this.__internal__createStuff("stuff");

        let actions = data["data"];
        this.__internal__setResults(user, opponent, data);
        this.__internal__setRewards(rewards, data, user.result)
        this.__internal__setStuff(stuff, BattleLogs.Update.stuffAtk, BattleLogs.Update.stuffs)

        for (let [, action] of actions.entries()) {
            this.__internal__setShields(user, opponent, action);
            this.__internal__setHealth(user, opponent, action);
            if (action.turn === 0) continue;

            this.__internal__incrementDoubleCoup(user, opponent, action);
            this.__internal__incrementVdv(user, opponent, action);
            this.__internal__incrementErosion(user, opponent, action);
            this.__internal__incrementRenvoi(user, opponent, action);
            this.__internal__incrementTour(user, opponent, action);

            if (action.events && action.events.length > 0) {
                for (let event in action.events) {
                    event = action.events[event]
                    if (event.type.toLowerCase()  === "attaque" ) {
                        if (event.name.toLowerCase() === "attaque" ) {
                            this.__internal__incrementEsquive(user, opponent, action, event);
                            this.__internal__incrementDmg(user, opponent, action, event);
                        } else if (event.name.toLowerCase()  === "bloquage" ) {
                            this.__internal__incrementStun(user, opponent, action);
                        } else if (event.name.toLowerCase()  === "saignement" ) {
                            this.__internal__incrementSaignement(user, opponent, action, event);
                        } else if (event.name.toLowerCase()  === "paralysie" ) {
                            this.__internal__incrementParalysie(user, opponent, action);
                        }
                    } else if (event.type.toLowerCase() === "chaque début de tour") {
                        if (event.name.toLowerCase() === "heal") {
                            this.__internal__incrementVieGain(user, opponent, action, event);
                        }
                    } else if (event.type.toLowerCase() === "une fois par combat") {
                        if (event.name.toLowerCase() === "heal") {
                            this.__internal__incrementVieGain(user, opponent, action, event);
                        }
                    } else if (event.type.toLowerCase() === "un sort lancé par un monstre ou un familier") {
                        if (event.name.toLowerCase() === "heal") {
                            this.__internal__incrementVieGain(user, opponent, action, event);
                        }
                    } else if (event.type.toLowerCase() === "électrocuté" && event.name.toLowerCase() === "électrocuté") {
                        this.__internal__incrementElectrocution(user, opponent, action, event);
                    } else if (event.type.toLowerCase()  === "brûlé" && event.name.toLowerCase()  === "brulé") {
                            this.__internal__incrementBrulure(user, opponent, action, event);
                    } else if (event.type.toLowerCase() === "poison") {
                        if (event.name.toLowerCase() === "maraboutage") {
                            this.__internal__incrementMaraboutage(user, opponent, action, event);
                        } else if (event.name.toLowerCase() === "poison") {
                            this.__internal__incrementPoison(user, opponent, action, event);
                        }
                    }  else if (event.type.toLowerCase() === "venin" && event.name.toLowerCase() === "venin") {
                        this.__internal__incrementVenin(user, opponent, action, event);
                    } else if (event.type.toLowerCase() === "confusion") {
                        if (event.name.toLowerCase() === "intimidé") {
                            this.__internal__incrementIntimidation(user, opponent, action, event);
                        }
                    }
                }
            }
        }

        this.__internal__setDmgTotal(user, opponent)

        return {user, opponent, rewards, stuff};
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
        const displayStuff = BattleLogs.Utils.LocalStorage.getComplexValue(BattleLogs.Battle.Settings.MenuSettings)["misc-stuff"];
        let fragments = []

        const userSpanFragments = [];
        const userSpan = document.createElement("span");
        userSpan.style.color = this.BattleSettings["user-color"];
        if (this.Messages[BattleLogs.Message.Settings.Format].user !== "") {
            const uLabelSpan = document.createElement("span");
            uLabelSpan.classList.add(`${BattleLogs.Message.Settings.Format}-label`);
            uLabelSpan.textContent = this.Messages[BattleLogs.Message.Settings.Format].user;
            userSpanFragments.push(uLabelSpan.outerHTML);
        }
        let uBannedStats = []
        const uBannedStatsForSummary = displaySummary
            ? BattleLogs[type].BannedStats[BattleLogs.Message.Settings.Format].user
            : []
        ;
        uBannedStats = uBannedStats.concat(uBannedStatsForSummary)
        const uAttrsMessage = this.__internal__convertAttributesToMessage(log.user, uBannedStats);
        if (uAttrsMessage) {
            userSpanFragments.push(uAttrsMessage);
            userSpan.innerHTML = userSpanFragments.filter(Boolean).join(this.__internal__joiner.labelWithStats[BattleLogs.Message.Settings.Format]);
            fragments.push(userSpan.outerHTML)
        }


        const opponentSpanFragments = [];
        const opponentSpan = document.createElement("span");
        opponentSpan.style.color = this.BattleSettings["opponent-color"];
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
        rewardsSpan.style.color = this.BattleSettings["rewards-color"];
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

        if (displayStuff && log.stuff) {
            const stuffSpanFragments = [];
            const sLabelSpan = document.createElement("span");
            sLabelSpan.classList.add(`${BattleLogs.Message.Settings.Format}-label`);
            sLabelSpan.innerHTML = this.Messages[BattleLogs.Message.Settings.Format].stuff.format(log.stuff.slot, log.stuff.name);
            stuffSpanFragments.push(sLabelSpan.outerHTML);

            const stuffSpan = document.createElement("span");
            const sAttrsMessage = this.__internal__convertStuffToMessage(log.stuff);
            if (sAttrsMessage) {
                stuffSpanFragments.push(sAttrsMessage);
                stuffSpan.innerHTML = stuffSpanFragments.filter(Boolean).join(this.__internal__joiner.labelWithStats[BattleLogs.Message.Settings.Format]);
                fragments.push(stuffSpan.outerHTML);
            }
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
        this.BattleSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

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
        dmgTotal: {
            name: {
                normal: "Dommage Total",
                short: "DmgTot",
                list: "Dommage Total"
            },
            display: true,
            setting: true,
            text: "Dégâts totaux",
            type: "checkbox"
        },
        dmg: {
            name: {
                normal: "Dommage",
                short: "Dmg",
                list: "Dommage"
            },
            display: false,
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
        venin: {
            name: {
                normal: "Venin",
                short: "Ven",
                list: "Venin"
            },
            display: false,
            setting: true,
            text: "Dégâts de venin",
            type: "checkbox"
        },
        electrocution: {
            name: {
                normal: "Électrocution",
                short: "Elc",
                list: "Électrocution"
            },
            display: false,
            setting: true,
            text: "Dégâts d'électrocution",
            type: "checkbox"
        },
        brulure: {
            name: {
                normal: "Brulure",
                short: "Bru",
                list: "Brulure"
            },
            display: false,
            setting: true,
            text: "Dégâts brulés",
            type: "checkbox"
        },
        maraboutage: {
            name: {
                normal: "Maraboutage",
                short: "Mar",
                list: "Maraboutage"
            },
            display: false,
            setting: true,
            text: "Dégâts maraboutage",
            type: "checkbox"
        },
        saignement: {
            name: {
                normal: "Saignement",
                short: "Sai",
                list: "Saignement"
            },
            display: false,
            setting: true,
            text: "Dégâts saignement",
            type: "checkbox"
        },
        intimidation: {
            name: {
                normal: "Intimidation",
                short: "Int",
                list: "Intimidation"
            },
            display: false,
            setting: true,
            text: "Dégâts intimidation",
            type: "checkbox"
        },
        paralysie: {
            name: {
                normal: "Paralysie",
                short: "Par",
                list: "Paralysie"
            },
            display: false,
            setting: true,
            text: "Nombre de paralysie",
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
        },
        famTour: {
            name: "Tour",
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        famVie: {
            name: "",
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        famDmg: {
            name: "",
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        famVieBase: {
            name: "",
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        famEsquive: {
            name: "",
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        famVieGain: {
            name: "",
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        famRenvoi: {
            name: "",
            display: false,
            setting: false,
            text: "",
            type: "checkbox"
        },
        famName: {
            name: {
                normal: "Familier",
                short: "Fam",
                list: "Familier"
            },
            display: false,
            setting: true,
            text: "Afficher le nom du familier",
            type: "checkbox"
        },
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
        expFamAtk: {
            name: {
                normal: "Familier d'attaque",
                short: "FamAtk",
                list: "Expérience familier d'attaque"
            },
            display: false,
            setting: true,
            text: "Expériences familier d'attaque",
            type: "checkbox"
        },
        expFamDef: {
            name: {
                normal: "Familier de défense",
                short: "FamDef",
                list: "Expérience familier de défense"
            },
            display: false,
            setting: true,
            text: "Expériences familier de défense",
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
        stuff: {
            name: "Stuff",
            display: false,
            setting: true,
            text: "Afficher le stuff utilisé",
            type: "checkbox"
        },
        time: {
            name: "Heure",
            display: true,
            setting: true,
            text: "Afficher l'heure",
            type: "checkbox"
        },
        arme: {
            name: {
                normal: "Arme",
                short: "Arm",
                list: "Arme"
            },
            display: false,
            setting: false,
            text: "arme",
            type: "checkbox"
        },
        calv: {
            name: {
                normal: "Calv",
                short: "Clv",
                list: "Calv"
            },
            display: false,
            setting: false,
            text: "calv",
            type: "checkbox"
        },
        famAtk: {
            name: {
                normal: "FamAtk",
                short: "FamA",
                list: "FamAtk"
            },
            display: false,
            setting: false,
            text: "famatk",
            type: "checkbox"
        },
        famDef: {
            name: {
                normal: "FamDef",
                short: "FamD",
                list: "FamDef"
            },
            display: false,
            setting: false,
            text: "famdef",
            type: "checkbox"
        },
        items: {
            name: {
                normal: "Items",
                short: "Itm",
                list: "Items"
            },
            display: false,
            setting: false,
            text: "items",
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
            const famKey = "fam" + key.capitalize()
            let famValue = null
            if (famKey in attributes) {
                famValue = attributes[famKey]
            }

            // Only display stat if value is not 0 and not banned
            if (this.BattleSettings[settingKey]
                && (typeof value === "number" && value !== 0 || typeof famValue === "number" && famValue !== 0 || Array.isArray(value) && value.length > 0 || typeof value === "string" && value.length > 0)
                && !bannedAttrs.includes(key)
            ) {
                const labelSpan = document.createElement("span");
                if (attributes.type === "rewards") {
                    labelSpan.textContent = this.__internal__rewards[key].name[BattleLogs.Message.Settings.Format];
                } else {
                    const internal_stats = Object.assign(this.__internal__stats, this.__internal__stats_user, this.__internal__stats_opponent)
                    labelSpan.textContent = internal_stats[key].name[BattleLogs.Message.Settings.Format];
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
                    if (typeof famValue === "number" && famValue !== 0) {
                        valueSpan.innerHTML = value.toString() + this.Messages[BattleLogs.Message.Settings.Format].familier.format(famValue);
                    } else if (typeof value === "number" && value !== 0) {
                        valueSpan.textContent = value.toString();
                    } else if (typeof value === "string") {
                        valueSpan.textContent = value.toString();
                    }
                }
                stats.push(this.Messages[BattleLogs.Message.Settings.Format].stat.format(labelSpan.outerHTML, valueSpan.outerHTML));
            }
        })
        return stats.join(this.__internal__joiner.stats[BattleLogs.Message.Settings.Format]);
    }

    /**
     * @desc Convert stuff in message
     *
     * @param {Object} stuff: Stuff to convert in message
     *
     * @returns Converted attributes in messages
     */
    static __internal__convertStuffToMessage(stuff) {
        let stuffMsg = [];
        Object.entries(stuff).forEach(attribute => {
            const [key, value] = attribute;

            if (["arme", "calv", "items", "famAtk", "famDef"].includes(key)) {
                const labelSpan = document.createElement("span");
                labelSpan.textContent = this.__internal__misc[key].name[BattleLogs.Message.Settings.Format];
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
                            objectSpan.textContent = item.name;
                            items.push(objectSpan.outerHTML)
                        }
                    })
                    valueSpan.innerHTML = items.join(', ');
                } else {
                    if (typeof value === "string") {
                        valueSpan.textContent = value.toString();
                    } else {
                        valueSpan.classList.add("rarity-" + value.rarity);
                        valueSpan.textContent = value.name;
                    }
                }
                stuffMsg.push(this.Messages[BattleLogs.Message.Settings.Format].stat.format(labelSpan.outerHTML, valueSpan.outerHTML));
            }
        })
        return stuffMsg.join(this.__internal__joiner.stats[BattleLogs.Message.Settings.Format]);
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
     * @desc Set total dmg of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     */
    static __internal__setDmgTotal(user, opponent) {
        user.dmgTotal = user.dmg + user.brulure + user.maraboutage + user.poison + user.saignement + user.renvoi + user.famDmg + user.famRenvoi;
        opponent.dmgTotal = opponent.dmg + opponent.brulure + opponent.maraboutage + opponent.poison + opponent.saignement + opponent.renvoi + opponent.famDmg + opponent.famRenvoi;
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
            if (data["eventA"]) {
                rewards.event = data["eventA"]
            }
        }
        if (data["experienceA"]) {
            rewards.exp = data["experienceA"]
        }
        if (data["experiencefAtk"]) {
            rewards.expFamAtk = data["experiencefAtk"]
        }
        if (data["experiencefDef"]) {
            rewards.expFamDef = data["experiencefDef"]
        }
        if (data["aloA"]) {
            rewards.alo = data["aloA"]
        }
        if (data["eloA"]) {
            rewards.elo = data["eloA"]
        }
        if (data["eventA"]) {
            rewards.event = data["eventA"]
        }
    }

    /**
     * @desc Set stuff of battle
     *
     * @param {Object} stuff: Stuff of battle
     * @param {int} stuffAtk: Stuff equiped in atk
     * @param {Object} stuffs: Sutffs of player
     */
    static __internal__setStuff(stuff, stuffAtk, stuffs) {
        stuff.slot = stuffAtk
        stuff.name = stuffs[stuffAtk - 1].name;
        let objectCalv = BattleLogs.Utils.getObjectByName(stuffs[stuffAtk - 1].calv);
        stuff.calv = objectCalv.short === '_' ? objectCalv : {name: objectCalv["name"], rarity: objectCalv["rarity"]};
        let objectArme = BattleLogs.Utils.getObjectByName(stuffs[stuffAtk - 1].arme);
        stuff.arme = objectArme.short === '_' ? objectArme : {name: objectArme["name"], rarity: objectArme["rarity"]};
        stuff.element = objectArme.short === '_' ? "Banal" : objectArme["element"];

        stuff.items = [];
        for (const item of stuffs[stuffAtk - 1].items) {
            let objectItem = BattleLogs.Utils.getObjectByName(item);
            stuff.items.push({name: objectItem["name"], rarity: objectItem["rarity"]})
        }

        let objectFamAtk = BattleLogs.Utils.getObjectByShortName(stuffs[stuffAtk - 1].famAtk);
        stuff.famAtk = objectFamAtk === '_' ? objectFamAtk : {name: objectFamAtk["name"], rarity: objectFamAtk["rarity"]};
        let objectFamDef = BattleLogs.Utils.getObjectByShortName(stuffs[stuffAtk - 1].famDef);
        stuff.famDef = objectFamDef === '_' ? objectFamDef : {name: objectFamDef["name"], rarity: objectFamDef["rarity"]};
    }

    /**
     * @desc Create rewards of battle
     *
     * @param {Object} dataRewards: Rewards of battle
     *
     * @return rewards of battle
     */
    static __internal__createRewardItems(dataRewards) {
        const rewardsType = [
            "item",
            "arme",
            "calv",
            "object"
        ]
        let items = [];
        for (const type of rewardsType) {
            if (type in dataRewards) {
                for (const item of dataRewards[type]) {
                    let object = BattleLogs.Utils.getObjectByShortName(item.value);
                    if (typeof object === "string") {
                        object = {name: item.value, count: item.count, rarity: -1, type: type};
                    }
                    let existingItem = items.find(i => i.name === object["name"]);
                    if (existingItem === undefined) {
                        items.push({name: object["name"], count: item.count, rarity: object["rarity"], type: type});
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
            user.famVie = action["pvs"]["fA"];
            opponent.vie = action["pvs"]["B"];
            opponent.famVie = action["pvs"]["fB"];
        }
    }

    /**
     * @desc Increment tour of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementTour(user, opponent, action) {
        if (action["attacker"]["name"] === user.name) {
            user.tour += 1;
        } else if (action["attacker"]["name"] === user.famName) {
            user.famTour += 1;
        } else if (action["attacker"]["name"] === opponent.name) {
            opponent.tour += 1;
        } else if (action["attacker"]["name"] === opponent.famName) {
            opponent.famTour += 1;
        }
    }

    /**
     * @desc Increment esquive of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: Event of battle
     */
    static __internal__incrementEsquive(user, opponent, action, event) {
        if ("esquived" in event && event.esquived) {
            if (event.target === user.name) {
                user.esquive += 1;
            } else if (event.target === user.famName) {
                user.famEsquive += 1;
            } else if (event.target === opponent.name) {
                opponent.esquive += 1;
            } else if (event.target === opponent.famName) {
                opponent.famEsquive += 1;
            }
        }
    }

    /**
     * @desc Increment dommage of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: Event of battle
     */
    static __internal__incrementDmg(user, opponent, action, event) {
        if (event.target.includes(opponent.name)) {
            if (action["attacker"]["name"] === user.name) {
                if ("change" in event && "old" in event.change && "new" in event.change) user.dmg += event.change["old"] - event.change["new"];
            } else if (action["attacker"]["name"] === user.famName) {
                if ("change" in event && "old" in event.change && "new" in event.change) user.famDmg += event.change["old"] - event.change["new"];
            }
        } else if (event.target.includes(user.name)) {
            if (action["attacker"]["name"] === opponent.name) {
                if ("change" in event && "old" in event.change && "new" in event.change) opponent.dmg += event.change["old"] - event.change["new"];
            } else if (action["attacker"]["name"] === opponent.famName) {
                if ("change" in event && "old" in event.change && "new" in event.change) opponent.famDmg += event.change["old"] - event.change["new"];
            }
        }
    }

    /**
     * @desc Increment saignement of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: Event of battle
     */
    static __internal__incrementSaignement(user, opponent, action, event) {
        if (action["attacker"]["name"] === user.name) {
            if ("change" in event) {
                opponent.saignement += event["change"]["old"] - event["change"]["new"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("change" in event) {
                user.saignement += event["change"]["old"] - event["change"]["new"];
            }
        }
    }

    /**
     * @desc Increment double coup of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementDoubleCoup(user, opponent, action) {
        if (action["attacker"]["name"] === user.name) {
            if ("doubleCoup" in action["attacker"]["computed"] && action["attacker"]["computed"]["doubleCoup"] === true) {
                user.dc += 1;
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("doubleCoup" in action["attacker"]["computed"] && action["attacker"]["computed"]["doubleCoup"] === true) {
                opponent.dc += 1;
            }
        }
    }

    /**
     * @desc Increment vol de vie of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementVdv(user, opponent, action) {
        if (action["attacker"]["name"] === user.name) {
            if ("vdv" in action["attacker"]["computed"]) {
                user.vdv += action["attacker"]["computed"]["vdv"][0]["value"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("vdv" in action["attacker"]["computed"]) {
                opponent.vdv += action["attacker"]["computed"]["vdv"][0]["value"];
            }
        }
    }

    /**
     * @desc Increment erosion of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementErosion(user, opponent, action) {
        if (action["defender"]["name"] === user.name) {
            if ("eroded" in action["defender"]["computed"]) {
                opponent.erosion = action["defender"]["computed"]["eroded"];
            }
        } else if (action["defender"]["name"] === opponent.name) {
            if ("eroded" in action["defender"]["computed"]) {
                user.erosion = action["defender"]["computed"]["eroded"];
            }
        }
    }

    /**
     * @desc Increment renvoi of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementRenvoi(user, opponent, action) {
        if (action["defender"]["name"] === user.name) {
            if ("renvoi" in action["defender"]["computed"]) {
                user.renvoi += action["defender"]["computed"]["renvoi"]["value"];
            }
        } else if (action["defender"]["name"] === opponent.name) {
            if ("renvoi" in action["defender"]["computed"]) {
                opponent.renvoi += action["defender"]["computed"]["renvoi"]["value"];
            }
        } else if (action["defender"]["name"] === user.famName) {
            if ("renvoi" in action["defender"]["computed"]) {
                user.famRenvoi += action["defender"]["computed"]["renvoi"]["value"];
            }
        } else if (action["defender"]["name"] === opponent.famName) {
            if ("renvoi" in action["defender"]["computed"]) {
                opponent.famRenvoi += action["defender"]["computed"]["renvoi"]["value"];
            }
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
        if (action["attacker"]["name"] === user.name) {
            opponent.stun += 1;
        } else if (action["attacker"]["name"] === opponent.name) {
            user.stun += 1;
        }
    }

    /**
     * @desc Increment poison of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: event of battle
     */
    static __internal__incrementPoison(user, opponent, action, event) {
        if (action["attacker"]["name"] === user.name) {
            if ("change" in event) {
                opponent.poison += event["change"]["old"] - event["change"]["new"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("change" in event) {
                user.poison += event["change"]["old"] - event["change"]["new"];
            }
        }
    }

    /**
     * @desc Increment venin of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: event of battle
     */
    static __internal__incrementVenin(user, opponent, action, event) {
        if (action["attacker"]["name"] === user.name) {
            if ("change" in event) {
                opponent.venin += event["change"]["old"] - event["change"]["new"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("change" in event) {
                user.venin += event["change"]["old"] - event["change"]["new"];
            }
        }
    }

    /**
     * @desc Increment intimidation degats of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: event of battle
     */
    static __internal__incrementIntimidation(user, opponent, action, event) {
        if (action["attacker"]["name"] === user.name) {
            if ("change" in event) {
                opponent.intimidation += event["change"]["old"] - event["change"]["new"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("change" in event) {
                user.intimidation += event["change"]["old"] - event["change"]["new"];
            }
        }
    }

    /**
     * @desc Increment paralysie of battle
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     */
    static __internal__incrementParalysie(user, opponent, action) {
        if (action["attacker"]["name"] === user.name) {
            opponent.paralysie += 1;
        } else if (action["attacker"]["name"] === opponent.name) {
            user.paralysie += 1;
        }
    }

    /**
     * @desc Increment gain de vie of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: event of battle
     */
    static __internal__incrementVieGain(user, opponent, action, event) {
        if (event.target.includes(user.name)) {
            if (action["attacker"]["name"] === user.name) {
                if ("change" in event) {
                    user.vieGain += event["change"]["new"] - event["change"]["old"];
                }
            } else if (action["attacker"]["name"] === user.famName) {
                if ("change" in event && "old" in event.change && "new" in event.change) {
                    user.famVieGain += event["change"]["new"] - event["change"]["old"];
                }
            }
        } else if (event.target.includes(opponent.name)) {
            if (action["attacker"]["name"] === opponent.name) {
                if ("change" in event) {
                    opponent.vieGain += event["change"]["new"] - event["change"]["old"];
                }
            } else if (action["attacker"]["name"] === opponent.famName) {
                if ("change" in event && "old" in event.change && "new" in event.change) {
                    opponent.famVieGain += event["change"]["new"] - event["change"]["old"];
                }
            }
        }
    }

    /**
     * @desc Increment electrocution of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: event of battle
     */
    static __internal__incrementElectrocution(user, opponent, action, event) {
        if (action["attacker"]["name"] === user.name) {
            if ("change" in event) {
                opponent.electrocution += event["change"]["old"] - event["change"]["new"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("change" in event) {
                user.electrocution += event["change"]["old"] - event["change"]["new"];
            }
        }
    }

    /**
     * @desc Increment brulure of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: event of battle
     */
    static __internal__incrementBrulure(user, opponent, action, event) {
        if (action["attacker"]["name"] === user.name) {
            if ("change" in event) {
                opponent.brulure += event["change"]["old"] - event["change"]["new"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("change" in event) {
                user.brulure += event["change"]["old"] - event["change"]["new"];
            }
        }
    }

    /**
     * @desc Increment maraboutage of player
     *
     * @param {Object} user: User of battle
     * @param {Object} opponent: Opponent of battle
     * @param {JSON} action: Action of battle
     * @param {JSON} event: event of battle
     */
    static __internal__incrementMaraboutage(user, opponent, action, event) {
        if (action["attacker"]["name"] === user.name) {
            if ("change" in event) {
                opponent.maraboutage += event["change"]["old"] - event["change"]["new"];
            }
        } else if (action["attacker"]["name"] === opponent.name) {
            if ("change" in event) {
                user.maraboutage += event["change"]["old"] - event["change"]["new"];
            }
        }
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
        player.dmgTotal = 0;
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
        player.venin = 0;
        player.electrocution = 0;
        player.brulure = 0;
        player.maraboutage = 0;
        player.saignement = 0;
        player.intimidation = 0;
        player.paralysie = 0
        player.famTour = 0;
        player.famVie = 0;
        player.famDmg = 0;
        player.famVieBase = 0;
        player.famEsquive = 0;
        player.famVieGain = 0;
        player.famRenvoi = 0;
        player.famName = "";
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
        rewards.exp = 0;
        rewards.expFamAtk = 0;
        rewards.expFamDef = 0;
        rewards.event = 0;
        rewards.items = [];
        return rewards;
    }

    /**
     * @desc Create stuff object
     *
     * @param {string} type: stuff
     * @returns stuff object
     */
    static __internal__createStuff(type = "stuff") {
        const stuff = new this.Stuff(type);
        stuff.slot = 0;
        stuff.element = null;
        stuff.name = null;
        stuff.calv = null;
        stuff.arme = null;
        stuff.items = [];
        stuff.famAtk = "";
        stuff.famDef = "";
        return stuff;
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

    static Stuff = class {
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
