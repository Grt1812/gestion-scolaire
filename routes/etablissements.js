const express = require('express');
const Etablissement = require('../models/Etablissement');
const auth = require('../middlewares/auth'); // Corrected path
const router = express.Router();

// ... rest of the code

/**
 * Middleware pour restreindre l'accès aux admins uniquement
 */
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès interdit" });
    }
    next();
};

/**
 * Liste des niveaux par catégorie
 */
const niveauxParCategorie = {
    Maternelle: ["Niveau 1", "Niveau 2", "Niveau 3"],
    Primaire: ["1ère A", "1ère B", "2ème A", "2ème B", "3ème A", "3ème B", "4ème A", "4ème B", "5ème A", "5ème B", "6ème A", "6ème B"],
    Secondaire: ["7ème EB/A", "8ème EB/A", "1ère HP", "1ère HTS", "2ème HP", "2ème HTS", "3ème HP", "3ème HTS", "4ème HP", "4ème HTS"]
};

/**
 * ✅ Ajouter un établissement (Admin seulement)
 */
router.post('/', auth, requireAdmin, async (req, res) => {
    try {
        const { nom, categorie } = req.body;
        
        // Vérification de la catégorie
        if (!niveauxParCategorie[categorie]) {
            return res.status(400).json({ message: "Catégorie invalide" });
        }

        // Ajout des niveaux à l’établissement
        const niveaux = niveauxParCategorie[categorie].map(niveau => ({ nom: niveau, eleves: [] }));
        const etablissement = new Etablissement({ nom, categorie, niveaux });

        await etablissement.save();
        res.status(201).json({ message: "Établissement ajouté avec succès", etablissement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Récupérer les établissements d’une catégorie spécifique
 */
router.get('/categorie/:categorie', async (req, res) => {
    try {
        const etablissements = await Etablissement.find({ categorie: req.params.categorie });
        res.json(etablissements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Ajouter un élève à un niveau spécifique (Admin ou enseignant)
 */
router.post('/:idEtablissement/niveau/:niveauNom/eleve', auth, async (req, res) => {
    try {
        const { idEtablissement, niveauNom } = req.params;
        const { nom, prenom, dateNaissance, sexe, adresse_eleve, telephone_parent, annee_scolaire } = req.body;

        // Vérification des droits (Admin ou Enseignant)
        if (req.user.role !== 'admin' && req.user.role !== 'enseignant') {
            return res.status(403).json({ message: "Accès interdit" });
        }

        // Vérification de l'établissement
        const etablissement = await Etablissement.findById(idEtablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        // Vérification du niveau
        const niveau = etablissement.niveaux.find(n => n.nom === niveauNom);
        if (!niveau) return res.status(404).json({ message: "Niveau non trouvé" });

        // Vérification de l'année scolaire
        if (!/^\d{4}-\d{4}$/.test(annee_scolaire)) {
            return res.status(400).json({ message: "Format de l'année scolaire invalide (ex: 2024-2025)" });
        }

        // Vérification du numéro de téléphone
        if (!/^(\+243\d{9}|\d{9})$/.test(telephone_parent)) {
            return res.status(400).json({ message: "Numéro de téléphone invalide" });
        }

        // Ajout de l'élève
        const nouvelEleve = { nom, prenom, dateNaissance, sexe, adresse_eleve, telephone_parent, annee_scolaire, paiements: [] };
        niveau.eleves.push(nouvelEleve);

        await etablissement.save();
        res.json({ message: "Élève ajouté avec succès", etablissement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Supprimer un élève (Admin seulement)
 */
router.delete('/:idEtablissement/niveau/:niveauNom/eleve/:eleveId', auth, requireAdmin, async (req, res) => {
    try {
        const { idEtablissement, niveauNom, eleveId } = req.params;

        // Vérification de l'établissement
        const etablissement = await Etablissement.findById(idEtablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        // Trouver le niveau et supprimer l'élève
        const niveau = etablissement.niveaux.find(n => n.nom === niveauNom);
        if (!niveau) return res.status(404).json({ message: "Niveau non trouvé" });

        const indexEleve = niveau.eleves.findIndex(e => e._id.toString() === eleveId);
        if (indexEleve === -1) return res.status(404).json({ message: "Élève non trouvé" });

        niveau.eleves.splice(indexEleve, 1);
        await etablissement.save();

        res.json({ message: "Élève supprimé avec succès", etablissement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Récupérer les établissements accessibles à l'utilisateur connecté
 */
router.get('/mon-etablissement', auth, async (req, res) => {
    try {
        const etablissement = await Etablissement.findById(req.user.etablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        res.json(etablissement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

