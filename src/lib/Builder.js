/**
 * @class The BattleLogsBuilder regroups the builder functionalities
 */

class BattleLogsBuilder {

    static Settings = {
        BuilderEnable: "Builder_Enable",
        BuilderPanes: "Builder-Panes",
        Type: "Builder"
    }

    static Messages = {
        output: "Visualisation du set d'équipement",
        input: "Choix des équipements",
    };

    static NotUpdateAttributes = ["id", "time"]

    static BuilderPanel;
    static BuilderPanes;

    static cachedLevel = 1;
    static PlayerBaseStats = {};
    static STATS_TABLE = {
        force: null,
        esquive: null,
        pv: null,
        speed: null,
        itemConst: 2,
        playerMultiplier: 2,
        setMultiplier: 3,
        levelMultiplier: {
            1: 1,
            2: 1.05,
            3: 1.1,
            4: 1.15,
            5: 1.20,
            6: 1.25,
            7: 1.30,
            8: 1.35,
            9: 1.40,
            10: 1.45,
            11: 1.50,
            12: 1.55,
            13: 1.60,
            14: 1.65,
            15: 1.70,
        },
    };

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static async initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            // Add separator
            BattleLogs.Menu.addSeparator(BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            // Add panel
            this.__internal__addBuilderPanel();
            // Add button
            //this.__internal__addBuilderButton(this.Settings.BuilderEnable, BattleLogs.Menu.BattleLogsSettingsFooterLeft);
            this.__internal__builderButton = BattleLogs.Menu.createMenuButton(
                "Builder",
                this.Settings.BuilderEnable,
                "svg_builder",
                this.BuilderPanel,
                "Afficher le Builder",
                "Masquer le Builder"
            )
            
            this.__internal__computeAllStats();

        } else if (initStep === BattleLogs.InitSteps.Finalize) {
            while (true) {
                if (BattleLogs.Load.hasLoaded() && BattleLogs.Update.hasLoaded()) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1 seconde (ajustez selon vos besoins)
            }
            this.PlayerBaseStats = BattleLogs.Update.getPlayerBaseStats();
            this.cachedLevel = BattleLogs.Update.Level || this.cachedLevel;
            this.BuilderPanel.querySelector(".loader").classList.add("hidden");
            this.__internal__createPane(this.BuilderPanel);
        }
    }


    static calculateEquipmentStat(stat, value, level) {
        return Math.ceil((this.STATS_TABLE[stat][Math.abs(value)][this.cachedLevel] / this.STATS_TABLE.itemConst) * this.STATS_TABLE.levelMultiplier[level]);
    }


    static calculateSetStat(stat, value) {
        return Math.ceil((this.STATS_TABLE[stat][Math.abs(value)][this.cachedLevel] / this.STATS_TABLE.itemConst)) * this.STATS_TABLE.setMultiplier;
    }
    //test method
    static calculate(stat, value, cachedLevel, itemConst, level) {
        return Math.ceil((this.STATS_TABLE[stat][Math.abs(value)][cachedLevel - 1] / itemConst) * level);
    }

    static calculatePlayerStat(stat, value) {
        return Math.ceil((this.STATS_TABLE[stat][Math.abs(value)][this.cachedLevel - 1] / this.STATS_TABLE.itemConst) * this.STATS_TABLE.playerMultiplier);
    }
    /**
     * Reset selected status and update elements accordingly
     */
    static resetSelected() {
        BattleLogs.Menu.resetSelected(this.__internal__builderButton, this.BuilderPanel, "Afficher le Builder");
    }


    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__builderButton;
    static __internal__builderAllowedKey = ["force", "esquive", "pv", "speed"];

    static __internal__computeAllStats() {
        const MODES = [
            {
                name: 'force',
                min: -201,
                max: 201,
            },
            {
                name: 'esquive',
                min: -201,
                max: 201,
            },
            {
                name: 'speed',
                min: -201,
                max: 201,
            },
            {
                name: 'pv',
                min: -201,
                max: 201,
            },
        ];
    
    
        for (const entry in MODES) {
            this.STATS_TABLE[MODES[entry].name] = {};
    
            const min = MODES[entry].min;
            const max = MODES[entry].max;
    
            const extra = 20;
            const accA = 250, accB = 250;
    
            for (let seed = min; seed <= max; seed++) {
                const loc = [];
                for (let i = 0; i < 3000; i++) {
                    loc.push(Math.ceil(seed + ((seed * ((i - 1) ^ (0.9 + (accA / 250))) * i * (i + 1)) / (6 + (((i ^ 2) / 50) / accB) + ((i - 1) * extra))) / (seed + 1) + (i * seed / 4)));
                }
                this.STATS_TABLE[MODES[entry].name][seed] = loc;
            }
        }
    }


    static __internal__isOverweight() {
        const maxWeight = 32;
        const ids = ["calv-select", "arme-select", "item-1-select", "item-2-select", "item-3-select", "item-4-select", "item-5-select"]
        const weight = ids.map(id => this.BuilderPanel.querySelector(`#${id} option[value="${document.getElementById(id).value}"]`).dataset["weight"])
                          .reduce((sum, weight) => sum + +(weight), 0)
        console.log(`${weight}/32`)
        return { overweight: weight > maxWeight, value: weight };
    }


    static __internal__updateOutput() {
        const ids = ["calv-select", "arme-select", "item-1-select", "item-2-select", "item-3-select", "item-4-select", "item-5-select"];
        const outputPane = document.getElementById("Builder-output");
        outputPane.classList.add("hidden");
        this.cachedLevel = document.getElementById("player-level-select").value;
        const selectedEquipment = ids.map(id => ({
                short: document.getElementById(id).value, 
                level: document.getElementById(`lvl-${id}`).value
        }));
        let equipmentStats = {force: 0, esquive: 0, pv: 0, speed: 0 };//this.defaultStats;
        let panoStats = { force: 0, esquive: 0, pv: 0, speed: 0 };
        let panos = {}
        selectedEquipment
            .filter(e => e.short !== "")
            .forEach((object) => {
                const equipment = BattleLogs.Utils.getObjectByShortName(object.short);
                for( const stat in equipmentStats) {
                    equipmentStats[stat] += this.calculateEquipmentStat(stat, equipment.effect[stat], object.level);
                }
                equipment.panoplies?.forEach( pano => panos[pano] = panos[pano] ? panos[pano] + 1 : 1);
        });
        Object.keys(panos)
            .filter(pano => panos[pano] > 1)
            .forEach( pano => {
                const bonusPanos = BattleLogs.Load.Panos[pano][panos[pano]];
                bonusPanos
                    .filter(bonus => this.__internal__builderAllowedKey.includes(bonus[0].slice(1)))
                    .forEach( bonus => {
                        const key = bonus[0].slice(1);
                        panoStats[key] += this.calculateSetStat(key, bonus[1]) // bonus[0] : key, bonus[1] : value
                });
        });
        this.__internal__builderAllowedKey.forEach( stat => {
            const output = this.BuilderPanel.querySelector(`.builder-output-stats .${stat} .value`);
            const playerStat = this.calculatePlayerStat(stat, this.PlayerBaseStats[stat])
            output.textContent = `${ playerStat + equipmentStats[stat] + panoStats[stat]}`; 
            if(panoStats[stat] > 0) {
                output.textContent += ` (+${panoStats[stat]})`;
            }
        })
        outputPane.classList.remove("hidden");
        console.log(equipmentStats)
        console.log(panoStats)
        console.log(panos)
    }

    /**
     * @desc Adds the BattleLogs panel
     */
    static __internal__addBuilderPanel() {
        // Add settings container
        this.BuilderPanel = document.createElement("div");
        this.BuilderPanel.id = "battlelogs-builder_panel";
        this.BuilderPanel.classList.add("builder", "unlocked");
        if (!(BattleLogs.Utils.LocalStorage.getValue(this.Settings.BuilderEnable) === "true")) {
            this.BuilderPanel.classList.add("hidden")
        }
        const loaderBox = document.createElement("div");
        loaderBox.classList.add("loader");
        const loaderInfo = document.createElement("span");
        loaderInfo.textContent =  "En attente du chargement du jeu...";
        loaderBox.appendChild(loaderInfo);
        this.BuilderPanel.appendChild(loaderBox);
        // Add Builder panel to DOM
        BattleLogs.Menu.BattleLogsWrapper.appendChild(this.BuilderPanel);
    }

    static __internal__buildContainer(type){
        // Build pane for builder container
        const paneContainer = document.createElement("div");
        paneContainer.id = `${this.Settings.Type}-${type}`;
        paneContainer.dataset["key"] = type;

        // Build header
        const paneHeader = document.createElement("div");
        paneHeader.classList.add(`builder-title`)

        // Create title left part of header
        let paneHeaderTitle = document.createElement("span");
        paneHeaderTitle.textContent = this.Messages[type];
        paneHeaderTitle.classList.add("builder-title-name");

        paneHeader.appendChild(paneHeaderTitle);
        paneContainer.appendChild(paneHeader);
        return paneContainer;
    }

    static __internal__createPane(BuilderPanel) {
        // Build pane for builder output
        const paneOutput = this.__internal__buildContainer("output");

        // Create output
        const outputContainer = document.createElement("div");
        outputContainer.classList.add("builder-output-body");
        const outputValues = document.createElement("div");
        outputValues.classList.add("builder-output-stats");
        this.__internal__builderAllowedKey.forEach((key) => {
            this.__internal__appendAttributes(0, key, outputValues);
        })
        const blockEffects = document.createElement("div");
        blockEffects.classList.add("builder-output-effects");
        outputContainer.appendChild(outputValues);
        outputContainer.appendChild(blockEffects);
        paneOutput.appendChild(outputContainer);
        this.__internal__builderBlockValue = outputValues;
        paneOutput.classList.add("hidden");
        BuilderPanel.appendChild(paneOutput);

        // Build pane for builder input
        const paneInput = this.__internal__buildContainer("input")

        //create input
        const inputBody = document.createElement("div");
        inputBody.classList.add("builder-input-body");
        this.__internal__appendFilters(inputBody);
        
        const inputValues = document.createElement("div");
        inputValues.classList.add("builder-input-equipment");
        const inputLeft =document.createElement("div");
        inputLeft.classList.add("builder-input-left");
        const calvs = BattleLogs.Load.Calvs.sort((a, b) => a.rarity < b.rarity);
        const armes = BattleLogs.Load.Armes.sort((a, b) => a.rarity < b.rarity);
        const items = BattleLogs.Load.Items.sort((a, b) => a.rarity < b.rarity);
        this.__internal__appendInput(calvs, "Choisir une calv", "calv", "calv", inputLeft);
        this.__internal__appendInput(armes, "Choisir une arme", "arme", "arme", inputLeft);
        this.__internal__appendInput(items, "Choisir un item", "item", "item-1", inputLeft);
        this.__internal__appendInput(items, "Choisir un item", "item", "item-2", inputLeft);
        this.__internal__appendInput(items, "Choisir un item", "item", "item-3", inputLeft);
        this.__internal__appendInput(items, "Choisir un item", "item", "item-4", inputLeft);
        this.__internal__appendInput(items, "Choisir un item", "item", "item-5", inputLeft);

        // Create right part of input
        const inputRight = document.createElement("div");
        inputRight.classList.add("builder-input-right");
        const playerLevel = document.createElement("div");
        const playerLevelLabel = document.createElement("label");
        playerLevelLabel.classList.add("key");
        playerLevelLabel.for = "player-level-select";
        playerLevelLabel.textContent = "Niv. Joueur";
        const playerLevelSelect = document.createElement("select");
        playerLevelSelect.classList.add("value");
        playerLevelSelect.id = "player-level-select";
        [...Array(101).keys()].slice(1).forEach( level => {
            const option = document.createElement("option");
            option.value = level;
            option.textContent = level;
            playerLevelSelect.appendChild(option);
        });
        const weightBox = document.createElement("div");
        const weightValue = document.createElement("span");
        weightValue.classList.add("builder-input-weight")
        weightValue.textContent = "0";
        const weightInfo = document.createElement("span");
        weightInfo.textContent = "/32";
        weightBox.appendChild(weightValue);
        weightBox.appendChild(weightInfo);
        playerLevel.appendChild(playerLevelLabel);
        playerLevel.appendChild(playerLevelSelect);
        inputRight.appendChild(playerLevel);
        inputRight.appendChild(weightBox);

        const validateContainer = document.createElement("div");
        const validateButton = document.createElement("button");
        //validateButton.id= "builder-validate";
        validateButton.textContent= "VALIDER";
        validateButton.classList.add("builder-validate-btn");
        validateButton.onclick = () => {
            this.__internal__updateOutput();
        };
        validateContainer.appendChild(validateButton);
        inputValues.appendChild(inputLeft);
        inputValues.appendChild(inputRight);
        inputBody.appendChild(inputValues);
        inputBody.appendChild(validateContainer);
        paneInput.appendChild(inputBody);
        BuilderPanel.appendChild(paneInput);

    }

    /**
     * @desc Append attributes of stuff in container
     *
     * @param {Object} value: Value of data
     * @param {string} key: Key of data.
     * @param {Element} container: HTML element representing the stuff block.
     */
    static __internal__appendAttributes(value, key, container) {
        const keyOutput = {force:"force", esquive:"esquive", pv:"vitalité", speed:"vitesse"};
        //const color = { force:"rarity-1", esquive:"rarity-2", pv:"rarity-5", speed:"rarity-4"};
        const attrContainer = document.createElement("div");
        attrContainer.classList.add(key);
        attrContainer.dataset["key"] = key;

        const label = document.createElement("span");
        label.classList.add("key");
        label.textContent = keyOutput[key].capitalize();
        const name = document.createElement("span");
        name.classList.add("value");
        ///name.classList.add(color[key]);
        name.textContent = value;

        attrContainer.appendChild(label);
        attrContainer.appendChild(name);
        container.appendChild(attrContainer);
    }

    static __internal__appendFilters(container) {
        const onclickFunc = (pano) => {
            const options = this.BuilderPanel.querySelectorAll(".builder-input-equipment .filtered-select option");
            console.log(pano);
            options.forEach( opt => {
                if(pano === "" || opt.title.includes(pano)){
                    opt.classList.remove("hidden");
                } else {
                    opt.classList.add("hidden");
                }
            });
        }

        const filtersBody = document.createElement("div");
        filtersBody.id = "builder-input-filter";
        const panosFilter = document.createElement("select");
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "--Toutes les panoplies--";
        defaultOption.onclick = onclickFunc.bind(this, "");
        panosFilter.appendChild(defaultOption);
        for (let pano in BattleLogs.Load.Panos) {
            const option = document.createElement("option");
            option.value = pano;
            option.textContent = pano;
            option.onclick = onclickFunc.bind(this, pano);
            panosFilter.appendChild(option);
        }
        filtersBody.appendChild(panosFilter);
        container.appendChild(filtersBody);
    }

    /**
     * @desc Append attributes of stuff in container
     *
     * @param {Object} value: Value of data
     * @param {string} key: Key of data.
     * @param {Element} container: HTML element representing the stuff block.
     */
    static __internal__appendInput(objects, labelMessage, type, key, container) {
        const weight = {
            calv: {0:0, 1:1, 2:2, 3:4, 4:11, 5:15, 6:15},
            arme: {0:0, 1:1, 2:2, 3:4, 4:11, 5:15, 6:15},
            item: {0:0, 1:1, 2:2, 3:4, 4:9, 5:15, 6:15}
        }
        const onclickFunc = () => {
            const validateBtn = this.BuilderPanel.querySelector("button");
            const weightSpan = this.BuilderPanel.querySelector(".builder-input-weight")
            const currentWeight = this.__internal__isOverweight();
            weightSpan.textContent = currentWeight.value;
            if (currentWeight.overweight){
                validateBtn.setAttribute("disabled", "");
                validateBtn.classList.add("warning");
                validateBtn.textContent = "POIDS MAX DÉPASSÉ !";
            }else {
                validateBtn.removeAttribute("disabled");
                validateBtn.classList.remove("warning");
                validateBtn.textContent = "VALIDER";
            }
        };
        const inputContainer = document.createElement("div");

        const label = document.createElement("label");
        label.classList.add("key");
        label.for=`${key}-select`
        label.textContent = labelMessage;
        const selectBox = document.createElement("select");
        selectBox.id =`${key}-select`;
        selectBox.classList.add("value");
        selectBox.classList.add("filtered-select");
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "--Vide--";
        defaultOption.dataset["weight"] = 0;
        defaultOption.onclick = onclickFunc;
        selectBox.appendChild(defaultOption);
        objects.sort((a, b) => a.rarity < b.rarity);
        objects.forEach( object => {
            const option = document.createElement("option");
            option.value = object.short;
            option.title = object.panoplies?.length > 0 ? `${object.panoplies.join(", ")}` : ""; // quelques armes n'ont pas de propriété "panoplies"
            option.textContent = `${object.name}`;
            option.dataset["weight"] = weight[type][object.rarity];
            option.classList.add(`bar-rarity-${object.rarity}`);
            if(object.rarity === 1) {
                option.classList.add("hidden");
            }

            option.onclick = onclickFunc;
            selectBox.appendChild(option);
        });
        const levelLabel = document.createElement("label");
        levelLabel.classList.add("key");
        levelLabel.for=`lvl-${key}-select`
        levelLabel.textContent = `Niv.`;
        const levelBox = document.createElement("select");
        levelBox.id =`lvl-${key}-select`;
        levelBox.classList.add("value");
        [...Array(16).keys()].slice(1).forEach( level => {
            const option = document.createElement("option");
            option.value = level;
            option.textContent = level;
            levelBox.appendChild(option);
        });

        const leftPart = document.createElement("div");
        const rightPart = document.createElement("div");
        
        leftPart.appendChild(label)
        leftPart.appendChild(selectBox)
        rightPart.appendChild(levelLabel)
        rightPart.appendChild(levelBox)
        inputContainer.appendChild(leftPart)
        inputContainer.appendChild(rightPart)
        container.appendChild(inputContainer)
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.BuilderPanes, {});
    }
}