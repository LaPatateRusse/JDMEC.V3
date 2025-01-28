// ✅ Connexion dynamique selon l’environnement (localhost ou Render)
const socket = io(
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://jdmec-v1.onrender.com"
);

// ✅ Récupération des éléments HTML
const loginContainer = document.getElementById("login-container");
const gameContainer = document.getElementById("game-container");

const accessKeyInput = document.getElementById("accessKey");
const playerNameInput = document.getElementById("playerName");
const joinBtn = document.getElementById("joinBtn");
const joinError = document.getElementById("joinError");

const welcome = document.getElementById("welcome");
const playersList = document.getElementById("playersList");

const wordInput = document.getElementById("wordInput");
const submitWordBtn = document.getElementById("submitWordBtn");
const chosenAnnouncement = document.getElementById("chosenAnnouncement");

// ✅ Masquer le jeu au chargement de la page
gameContainer.style.display = "none";

// ✅ Gestion du bouton "Rejoindre"
joinBtn.addEventListener("click", () => {
    const accessKey = accessKeyInput.value.trim();
    const playerName = playerNameInput.value.trim();

    console.log("🔹 Tentative de connexion avec :", { accessKey, playerName });

    if (!accessKey || !playerName) {
        joinError.textContent = "❌ Veuillez entrer la clé et votre prénom.";
        return;
    }

    // ✅ Envoi des informations au serveur
    socket.emit("joinGame", { accessKey, playerName });
});

// ✅ Gestion des erreurs de connexion
socket.on("joinError", (errMsg) => {
    joinError.textContent = errMsg;
    console.log("❌ Erreur reçue :", errMsg);
});

// ✅ Connexion réussie
socket.on("joinSuccess", (data) => {
    console.log(`✅ Connexion réussie : ${data.playerName}`);

    loginContainer.style.display = "none"; // Cache le formulaire
    gameContainer.style.display = "block"; // Affiche le jeu

    welcome.textContent = `Bienvenue, ${data.playerName} !`;
});

// ✅ Mise à jour de la liste des joueurs
socket.on("playersList", (players) => {
    console.log("🔄 Mise à jour des joueurs :", players);

    playersList.innerHTML = ""; // Réinitialiser la liste

    players.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = p.name;

        if (p.hasSubmitted) {
            li.classList.add("player-submitted"); // ✅ Ajoute le style vert et la coche
        }

        playersList.appendChild(li);
    });
});

// ✅ Quand un joueur soumet un mot
submitWordBtn.addEventListener("click", () => {
    const word = wordInput.value.trim();
    if (!word) return;

    console.log(`📝 Envoi du mot : ${word}`);
    socket.emit("submitWord", word);
    wordInput.value = ""; // ✅ Effacer le champ après l’envoi
});

const countdown = document.getElementById("countdown");
const timer = document.getElementById("timer");

// ✅ Affichage du compte à rebours avant d'afficher le mot
socket.on("randomPlayerChosen", (data) => {
    console.log(`🎤 ${data.speakerName} doit dire "${data.chosenWord}" (choisi par ${data.wordOwnerName})`);

    // ✅ Afficher le chronomètre et cacher l'annonce
    countdown.style.display = "block";
    chosenAnnouncement.style.display = "none";

    let timeLeft = 5;
    timer.textContent = timeLeft;

    let countdownInterval = setInterval(() => {
        timeLeft -= 1;
        timer.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdown.style.display = "none"; // Masquer le chrono
            chosenAnnouncement.style.display = "block"; // Afficher le mot

            // ✅ Afficher l'annonce du joueur qui doit dire le mot
            chosenAnnouncement.textContent = `${data.speakerName} doit dire le mot de ${data.wordOwnerName} : "${data.chosenWord}"`;
        }
    }, 1000);
});
