<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Mini Jeu</title>
    <style>
      body {
        font-family: sans-serif;
        margin: 20px;
      }
      #game-container {
        display: none;
      }
      .player-submitted {
        color: green;
      }
    </style>
  </head>
  <body>
    <h1>Mini Jeu en Temps Réel</h1>

    <!-- Formulaire de connexion -->
    <div id="login-container">
      <label for="accessKey">Clé d'accès :</label>
      <input type="text" id="accessKey" placeholder="Entrez la clé d'accès" />
      <br /><br />
      <label for="playerName">Votre prénom :</label>
      <input type="text" id="playerName" placeholder="Ex: Alice" />
      <br /><br />
      <button id="joinBtn">Rejoindre</button>
      <p id="joinError" style="color: red;"></p>
    </div>

    <!-- Container du jeu -->
    <div id="game-container">
      <h2 id="welcome"></h2>
      <p>Liste des joueurs :</p>
      <ul id="playersList"></ul>

      <h3>Proposez un mot :</h3>
      <input type="text" id="wordInput" placeholder="Votre mot" />
      <button id="submitWordBtn">Envoyer</button>

      <div id="chosenAnnouncement" style="margin-top: 20px;"></div>
    </div>

    <!-- Socket.io client -->
    <script src="/socket.io/socket.io.js"></script>
    <!-- Notre script client -->
    <script src="client.js"></script>
  </body>
</html>
