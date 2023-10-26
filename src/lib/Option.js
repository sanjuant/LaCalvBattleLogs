/**
 * @class The BattleLogsOption regroups options functionalities
 */

class BattleLogsOption {
    static Settings = {
        OptionChatOpacity: "Option-Chat-Opacity",
        Type: "Option",
    }

    /**
     * @desc Builds the menu, and restores previous running state if needed
     *
     * @param initStep: The current battle logs init step
     */
    static async initialize(initStep) {
        if (initStep === BattleLogs.InitSteps.BuildMenu) {
            let twitch = document.querySelector(".modal iframe");
            if (twitch) {
                this.__internal__chat = document.querySelector(".modal");
                // Set default settings
                this.__internal__addOpacityButton(this.Settings.OptionChatOpacity, this.__internal__chat);
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
    static __internal__chat = null;

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
    static __internal__addOpacityButton(id, containingDiv) {
        let buttonElem = document.createElement("button");
        buttonElem.id = id;
        buttonElem.classList.add("svg_opacity");
        buttonElem.title = "Réduire l'opacité";

        let opacity = BattleLogs.Utils.tryParseFloat(BattleLogs.Utils.LocalStorage.getValue(id), 1.0); // Ajout de cette variable pour suivre l'opacité actuelle
        containingDiv.style.opacity = opacity; // Définir l'opacité initiale

        buttonElem.onclick = () => {
            opacity -= 0.05; // Réduire l'opacité de 5% à chaque clic
            if (opacity <= 0.1) {
                opacity = 1.0; // Si l'opacité atteint 10%, réinitialiser à 100%
            }
            containingDiv.style.opacity = opacity; // Appliquer la nouvelle opacité
            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, opacity);
        };

        buttonElem.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Empêcher le menu contextuel de s'afficher
            opacity += 0.05; // Augmenter l'opacité de 5% sur le clic droit
            if (opacity > 1.0) {
                opacity = 0.1;
            }
            containingDiv.style.opacity = opacity;
            BattleLogs.Utils.LocalStorage.setValue(buttonElem.id, opacity);
        });

        containingDiv.querySelector(".close-button").insertAdjacentElement("beforebegin", buttonElem);
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
}