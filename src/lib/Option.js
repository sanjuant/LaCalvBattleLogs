/**
 * @class The BattleLogsOption regroups options functionalities
 */

class BattleLogsOption {
    static Settings = {
        MenuSettings: "Option-Settings",
        OptionChatHidden: "Option-Chat-Hidden",
        Type: "Option",
    }

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            let twitch = document.querySelector(".nav-page > .container-fluid > .row");
            if (twitch) {
                // Set default settings
                this.__internal__setDefaultSettingsValues()
                this.__internal__optionSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
                BattleLogs.Menu.addSettings(this.__internal__menuSettings, this.__internal__optionSettings, "Option");

                // this.__internal__addChatButton(this.Settings.OptionChatHidden, BattleLogs.Video.BattleLogsVideoButton);

                this.__internal__addKonamiCode()

            }
            this.__internal__addTypeEffectiveness()
        }
    }

    /**
     * @desc Update settings of class
     */
    static updateSettings() {
        this.__internal__optionSettings = BattleLogs.Utils.LocalStorage.getComplexValue(this.Settings.MenuSettings)
    }

    /*********************************************************************\
     /***    Internal members, should never be used by other classes    ***\
     /*********************************************************************/

    static __internal__optionSettings = null;
    static __internal__menuSettings = {
        display: {
            title: "Option du chat Twitch",
            stats: {
                hiddenByBattleLogs: {
                    name: "Masquer sous le BattleLogs",
                    display: true,
                    setting: true,
                    text: "Masquer sous le BattleLogs",
                    type: "checkbox"
                },
            }
        }
    }
    // Konami Code sequence to be entered by the user
    static __internal__konamiCode = [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a"
    ];
    // Index to keep track of the progress of Konami Code input
    static __internal__konamiIndex = 0;
    // Timeout variable to reset the Konami Code input if the user takes too long
    static __internal__konamiTimeout;
    static __internal__konamiIsPlaying = false;
    static __internal__konamiAudio = null;

    /**
     * @desc Add chat button
     *
     * @param {string} id: The button id
     * @param {Element} containingDiv: The div element to append the separator to
     */
    static __internal__addChatButton(id, containingDiv) {
        // Add messages container to battle logs menu
        const chatButton = document.createElement("button");
        chatButton.id = id;
        chatButton.classList.add("svg_chat");

        let chatHidden = BattleLogs.Utils.LocalStorage.getValue(id) === "true";
        if (chatHidden) {
            // Si le chat est affiché, on le masque
            this.__internal__toggleChat(false)
            chatButton.classList.add("selected");
            chatButton.title = "Afficher le chat Twitch";
        } else {
            chatButton.title = "Masquer le chat Twitch";
        }
        chatButton.onclick = () => {
            const newStatus = !(BattleLogs.Utils.LocalStorage.getValue(id) === "true");
            if (newStatus) {
                // Si le chat est affiché, on le masque
                this.__internal__toggleChat(false)
                chatButton.classList.add("selected");
                chatButton.title = "Afficher le chat Twitch";
            } else {
                // Si le chat est masqué, on l'affiche
                this.__internal__toggleChat(true)
                chatButton.classList.remove("selected");
                chatButton.title = "Masquer le chat Twitch";
            }

            BattleLogs.Utils.LocalStorage.setValue(chatButton.id, newStatus);
        };

        containingDiv.insertAdjacentElement("afterend", chatButton);
    }

    static __internal__toggleChat(display) {
        const chatDiv = document.querySelector("#rightBar")
        const gameOutDiv = document.querySelector(".game-out")
        const hiddenByBattleLogs = this.__internal__optionSettings["display-hiddenByBattleLogs"]
        const side = BattleLogs.Utils.LocalStorage.getValue(BattleLogs.Menu.Settings.MenuOpacity)
        if (display) {
            chatDiv.style.display = "block";
            chatDiv.style.height = "100vh"
            chatDiv.style.top = "0"
            if (!(side === "left")) {
                gameOutDiv.style.marginRight = "unset";
                gameOutDiv.style.marginLeft = "18%";
                chatDiv.style.left = "0";
                chatDiv.style.removeProperty("right")
            } else {
                gameOutDiv.style.marginLeft = "unset";
                gameOutDiv.style.marginRight = "18%";
                chatDiv.style.right = "0";
                chatDiv.style.removeProperty("left")
            }
        } else if (hiddenByBattleLogs) {
            chatDiv.style.display = "block";
            chatDiv.style.height = "calc(100vh - 34px)"
            chatDiv.style.top = "34px"
            if (side === "left") {
                chatDiv.style.left = "0";
                chatDiv.style.removeProperty("right")
            } else {
                chatDiv.style.right = "0";
                chatDiv.style.removeProperty("left")
            }
            gameOutDiv.style.marginRight = "0";
            gameOutDiv.style.marginLeft = "0";
        } else {
            chatDiv.style.display = "none";
            chatDiv.style.height = "100vh"
            chatDiv.style.top = "0"
            gameOutDiv.style.marginRight = "0";
            gameOutDiv.style.marginLeft = "0";
        }
    }


    static __internal__resetKonamiIndex() {
        this.__internal__konamiIndex = 0;
    }

    static __internal__addKonamiCode() {
        this.__internal__konamiTimeout = setTimeout(() => {
            this.__internal__resetKonamiIndex();
        }, 5000);

        document.addEventListener("keydown", (event) => {
            clearTimeout(this.__internal__konamiTimeout);

            if (event.key === this.__internal__konamiCode[this.__internal__konamiIndex]) {
                this.__internal__konamiIndex++;

                if (this.__internal__konamiIndex === this.__internal__konamiCode.length) {
                    // Créez une nouvelle instance d'Audio lorsque le Konami Code est découvert
                    if (this.__internal__konamiAudio === null) {
                        this.__internal__konamiAudio = new Audio(BattleLogsComponentLoader.__baseUrl + "sounds/song.mp3"); // Remplacez par le chemin de votre fichier audio
                        this.__internal__konamiAudio.load(); // Précharge l'audio
                    }
                    this.__internal__konamiAudio.play(); // Joue l'audio
                    // Code Konami réussi : exécutez votre easter egg ici
                    // alert("EASTER EGG ! Vous avez trouvé le Konami Code !");
                    // Vous pouvez ajouter d'autres actions ici, comme afficher des images ou changer le style de la page, etc.
                    this.__internal__showAbout()

                    // Réinitialiser l'index pour permettre à l'utilisateur d'entrer à nouveau le code
                    this.__internal__resetKonamiIndex();
                }
            } else {
                // Réinitialiser l'index si l'utilisateur a mal entré la séquence du code
                this.__internal__resetKonamiIndex();
            }

            this.__internal__konamiTimeout = setTimeout(() => {
                this.__internal__resetKonamiIndex();
            }, 2000);
        });
    }

    static __internal__showAbout() {
        let programmingQuotes = [
            "“N'importe quel idiot peut écrire du code qu'un ordinateur peut comprendre. Les bons programmeurs écrivent du code que les humains peuvent comprendre.” – Martin Fowler",
            "“Résolvez d'abord le problème. Ensuite, écrivez le code.” – John Johnson",
            "“L'expérience est le nom que tout le monde donne à ses erreurs.” – Oscar Wilde",
            "“Pour être irremplaçable, il faut toujours être différent” – Coco Chanel",
            "“Java est à JavaScript ce qu'une voiture est à un tapis.” – Chris Heilmann"
        ];

        let contributors = [
            "Sorrow",
            "Baltimousse",
            "Et toute la communauté qui a remonté les bugs et proposé de nouvelles fonctionnalités."
            // Ajoutez d'autres noms de contributeurs ici
        ];

        let randomQuote = programmingQuotes[Math.floor(Math.random() * programmingQuotes.length)];

        let promptContainer = document.createElement("div");
        promptContainer.classList.add("prompt", "about-popup");

        let quoteContainer = document.createElement("div");
        quoteContainer.textContent = randomQuote;
        quoteContainer.classList.add("about-quote");

        let contributorsContainer = document.createElement("div");
        contributorsContainer.textContent = "Contributeurs :";
        contributorsContainer.classList.add("about-contributors");

        let contributorsList = document.createElement("ul");
        contributors.forEach(contributor => {
            let li = document.createElement("li");
            li.textContent = contributor;
            li.classList.add("about-contributor");
            contributorsList.appendChild(li);
        });

        contributorsContainer.appendChild(contributorsList);

        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("about-buttons");

        let closeButton = document.createElement("button");
        closeButton.textContent = "Fermer";
        closeButton.classList.add("about-button", "about-button-primary")
        closeButton.addEventListener("click", function() {
            promptContainer.remove();
            console.log(BattleLogs.Option.__internal__konamiAudio)
            // Arrête la lecture du son quand le popup est fermé
            BattleLogs.Option.__internal__konamiAudio.pause();
            BattleLogs.Option.__internal__konamiAudio.currentTime = 0; // Réinitialise le temps de lecture à 0
            removeEventListeners();
        });

        buttonContainer.appendChild(closeButton);

        promptContainer.appendChild(quoteContainer);
        promptContainer.appendChild(contributorsContainer);
        promptContainer.appendChild(buttonContainer);

        document.addEventListener("click", function(event) {
            if (!promptContainer.contains(event.target) && document.querySelector(".prompt")) {
                promptContainer.remove();
                console.log(BattleLogs.Option.__internal__konamiAudio)
                // Arrête la lecture du son quand le popup est fermé
                BattleLogs.Option.__internal__konamiAudio.pause();
                BattleLogs.Option.__internal__konamiAudio.currentTime = 0; // Réinitialise le temps de lecture à 0
                removeEventListeners();
            }
        });

        let removeEventListeners = function() {
            document.removeEventListener("keydown", keydownListener);
        };

        let keydownListener = function(event) {
            if (event.key === "Escape") {
                promptContainer.remove();
                removeEventListeners();
            }
        };

        document.addEventListener("keydown", keydownListener);

        document.body.appendChild(promptContainer);
    }

    static __internal__addTypeEffectiveness() {
        const typeEffectivenessContainer = document.createElement("div");
        typeEffectivenessContainer.classList.add("type-effectiveness");
        const typeEffectivenessChart = document.createElement("img");
        typeEffectivenessChart.src = BattleLogsComponentLoader.__baseUrl + "images/type_effectiveness_chart.svg";
        typeEffectivenessChart.alt = "Diagramme d'efficacité des types";
        typeEffectivenessChart.classList.add("dynamic-image");
        typeEffectivenessContainer.appendChild(typeEffectivenessChart);
        BattleLogs.Glossary.GlossaryPanel.appendChild(typeEffectivenessContainer);
    }

    /**
     * @desc Sets the Menu settings default values in the local storage
     */
    static __internal__setDefaultSettingsValues() {
        BattleLogs.Utils.LocalStorage.setDefaultComplexValue(this.Settings.MenuSettings, {});
    }
}