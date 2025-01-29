const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const https = require("https");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ✅ Activer CORS pour accepter les connexions de tous les clients
app.use(cors({
    origin: "*", // Autorise toutes les requêtes
    methods: ["GET", "POST"]
}));

// ✅ Configuration de Socket.io avec CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ✅ Servir les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔹 Clé d'accès au jeu
const GAME_ACCESS_KEY = "Malabar"; // Remplace par ta vraie clé

console.log("🔑 Clé d'accès actuelle :", GAME_ACCESS_KEY);

// 🔹 Stockage des joueurs
let players = {};

// 🔹 Ping automatique pour Render (évite que le serveur s'endorme)
setInterval(() => {
    https.get("https://jdmec-v1.onrender.com"); // Remplace par ton URL Render
    console.log("📡 Ping envoyé pour garder le serveur actif.");
}, 600000); // Ping toutes les 10 minutes

// 🔹 Gestion des connexions
io.on("connection", (socket) => {
    console.log(`✅ Joueur connecté : ${socket.id}`);

    // Quand un joueur rejoint le jeu
    socket.on("joinGame", (data) => {
        console.log("🔹 Tentative de connexion :", data);

        const { accessKey, playerName } = data;

        // Vérification de la clé d’accès
        if (accessKey.trim() !== GAME_ACCESS_KEY.trim()) {
            socket.emit("joinError", "❌ Clé d'accès invalide !");
            console.log(`❌ Clé invalide pour ${playerName}`);
            return;
        }

        // Enregistrement du joueur
        players[socket.id] = {
            name: playerName,
            hasSubmitted: false,
            word: ""
        };

        console.log(`✅ Joueur accepté : ${playerName}`);

        // Confirmation d'entrée dans la partie
        socket.emit("joinSuccess", { playerName });

        // Mise à jour de la liste des joueurs
        io.emit("playersList", getAllPlayers());
    });

    // Quand un joueur soumet un mot
    socket.on("submitWord", (word) => {
        if (players[socket.id]) {
            players[socket.id].word = word;
            players[socket.id].hasSubmitted = true;

            console.log(`📝 Mot soumis par ${players[socket.id].name} : ${word}`);

            io.emit("playersList", getAllPlayers());

            // Vérifier si tous les joueurs ont soumis un mot
            if (allPlayersHaveSubmitted()) {
                // Lancer un timer de 5 secondes avant d'afficher le mot
                let countdown = 5;
                io.emit("startCountdown", countdown);

                let countdownInterval = setInterval(() => {
                    countdown--;
                    io.emit("updateCountdown", countdown);

                    if (countdown <= 0) {
                        clearInterval(countdownInterval);

                        // Sélection du joueur qui doit parler
                        const ids = Object.keys(players);
                        const speakerId = pickRandomId(ids);
                        const speaker = players[speakerId];

                        // Liste des joueurs ayant soumis un mot (autres que l'orateur)
                        const otherPlayers = ids.filter(id => id !== speakerId && players[id].hasSubmitted);

                        let chosenWord = "";
                        let wordOwnerName = "";

                        if (otherPlayers.length > 0) {
                            const wordOwnerId = pickRandomId(otherPlayers);
                            chosenWord = players[wordOwnerId].word;
                            wordOwnerName = players[wordOwnerId].name;
                        } else {
                            chosenWord = speaker.word;
                            wordOwnerName = speaker.name;
                        }

                        // Annonce de l'orateur et du mot
                        io.emit("randomPlayerChosen", {
                            speakerName: speaker.name,
                            chosenWord,
                            wordOwnerName
                        });

                        console.log(`🎤 ${speaker.name} doit dire : "${chosenWord}" (choisi de ${wordOwnerName})`);

                        // Réinitialisation pour le prochain tour
                        resetWords();
                    }
                }, 1000);
            }
        }
    });

    // Gestion de la déconnexion des joueurs
    socket.on("disconnect", () => {
        console.log(`🚫 Joueur déconnecté : ${socket.id}`);
        delete players[socket.id];
        io.emit("playersList", getAllPlayers());
    });
});

// 🔹 Fonctions utilitaires

function getAllPlayers() {
    return Object.keys(players).map(id => ({
        id,
        name: players[id].name,
        hasSubmitted: players[id].hasSubmitted
    }));
}

function allPlayersHaveSubmitted() {
    const ids = Object.keys(players);
    return ids.length > 0 && ids.every(id => players[id].hasSubmitted);
}

function pickRandomId(listOfIds) {
    return listOfIds[Math.floor(Math.random() * listOfIds.length)];
}

function resetWords() {
    Object.keys(players).forEach(id => {
        players[id].hasSubmitted = false;
        players[id].word = "";
    });
    io.emit("playersList", getAllPlayers());
}

// 🔹 Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});




// ✅ Quand tous les joueurs ont soumis un mot
if (allPlayersHaveSubmitted()) {
    const playerNames = Object.values(players).map(player => player.name);
    
    // Annonce du lancement de la roue
    io.emit("startWheel", playerNames);

    // Attendre que la roue tourne et récupère le résultat
    socket.on("playerChosen", (chosenPlayer) => {
        io.emit("wheelResult", chosenPlayer);
    });
}
