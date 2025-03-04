const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');

const router = express.Router();

// 🔹 Enregistrer un paiement avec vérification
router.post('/payer', async (req, res) => {
    try {
        const { eleveId, montant, trimestre } = req.body;

        // Vérifier si l'élève existe
        const eleve = await User.findById(eleveId);
        if (!eleve) return res.status(404).json({ message: "Élève non trouvé" });

        // Vérifier si l'élève a déjà payé pour ce trimestre
        const paiementExiste = await Payment.findOne({ eleve: eleveId, trimestre });
        if (paiementExiste) {
            return res.status(400).json({ message: `L'élève a déjà payé pour le ${trimestre}` });
        }

        // Enregistrer le paiement
        const paiement = new Payment({ eleve: eleveId, montant, trimestre });
        await paiement.save();

        res.status(201).json({ message: "✅ Paiement enregistré avec succès", paiement });

    } catch (error) {
        console.error("Erreur lors du paiement :", error);
        res.status(500).json({ message: "❌ Erreur serveur", error: error.message });
    }
});

// 🔹 Vérifier si un élève a payé un trimestre donné
router.get('/verifier/:eleveId/:trimestre', async (req, res) => {
    try {
        const { eleveId, trimestre } = req.params;

        const paiement = await Payment.findOne({ eleve: eleveId, trimestre });

        if (paiement) {
            res.json({ message: `✅ L'élève a déjà payé pour le ${trimestre}`, paiement });
        } else {
            res.json({ message: `❌ L'élève n'a pas encore payé pour le ${trimestre}` });
        }

    } catch (error) {
        console.error("Erreur de vérification :", error);
        res.status(500).json({ message: "❌ Erreur serveur", error: error.message });
    }
});

// 🔹 Obtenir tous les paiements
router.get('/all', async (req, res) => {
    try {
        const paiements = await Payment.find().populate('eleve', 'nom prenom classe'); // Popule l'élève
        res.json(paiements);
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur serveur", error: error.message });
    }
});

module.exports = router;
