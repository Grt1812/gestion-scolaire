// Charge les variables d'environnement depuis le fichier .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialisation de l'application Express
const app = express();

// Middleware pour autoriser les requêtes CORS
app.use(cors());

// Middleware pour parser les données JSON des requêtes
app.use(express.json());

// Connexion à MongoDB avec gestion des erreurs
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connecté avec succès"))
  .catch(err => console.error("❌ Erreur de connexion à MongoDB :", err));

// Route principale pour tester si l'API fonctionne
app.get('/', (req, res) => {
    res.send("🎉 API de gestion scolaire opérationnelle !");
});

// Importation des routes d'établissement
const etablissementRoutes = require('./routes/etablissements');

// Utilisation des routes pour les établissements
app.use('/api/etablissements', etablissementRoutes);

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error("🔥 Erreur :", err.message);
    res.status(500).json({ message: "Une erreur interne est survenue." });
});

// Définition du port et démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
