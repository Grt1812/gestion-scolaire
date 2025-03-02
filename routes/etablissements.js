const express = require('express');
const Etablissement = require('../models/Etablissement');
const router = express.Router();

/**
 * Liste des niveaux par catégorie
 * Chaque catégorie d'établissement a des niveaux spécifiques.
 */
const niveauxParCategorie = {
    Maternelle: ["Niveau 1", "Niveau 2", "Niveau 3"],
    Primaire: ["1ère A", "1ère B", "1ère C", "1ère D", "2ème A", "2ème B", "2ème C", "2ème D", 
               "3ème A", "3ème B", "3ème C", "4ème A", "4ème B", "4ème C", "5ème A", "5ème B", 
               "5ème C", "6ème A", "6ème B"],
    Secondaire: ["7ème EB/A", "7ème EB/B", "7ème EB/C", "8ème EB/A", "8ème EB/B", "8ème EB/C",
                 "1ère HP", "1ère HTS", "1ère HTN", "1ère HTC", "1ère HTEo",
                 "2ème HP", "2ème HTS", "2ème HTN", "2ème HTC", "2ème HTEo",
                 "3ème HP", "3ème HTS", "3ème HTN", "3ème HTC", "3ème HTEo",
                 "4ème HP", "4ème HTS", "4ème HTN", "4ème HTC", "4ème HTEo"]
};

/**
 * ✅ Route pour ajouter un établissement avec des niveaux prédéfinis
 * @route POST /api/etablissements
 */
router.post('/', async (req, res) => {
    try {
        const { nom, categorie } = req.body;

        // Vérification si la catégorie est valide
        if (!niveauxParCategorie[categorie]) {
            return res.status(400).json({ message: "Catégorie invalide" });
        }

        // Création des niveaux correspondant à la catégorie
        const niveaux = niveauxParCategorie[categorie].map(niveau => ({ nom: niveau, eleves: [] }));

        // Création de l'établissement
        const etablissement = new Etablissement({ nom, categorie, niveaux });
        await etablissement.save();

        res.status(201).json({ message: "Établissement ajouté avec succès", etablissement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Route pour récupérer les établissements d'une catégorie spécifique
 * @route GET /api/etablissements/categorie/:categorie
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
 * ✅ Route pour ajouter un élève à un niveau spécifique d'un établissement
 * @route POST /api/etablissements/:idEtablissement/niveau/:niveauNom/eleve
 */
router.post('/:idEtablissement/niveau/:niveauNom/eleve', async (req, res) => {
    try {
        const { idEtablissement, niveauNom } = req.params;
        const { nom, prenom, dateNaissance, sexe, adresse_eleve, telephone_parent, annee_scolaire } = req.body;

        // Vérification de l'établissement
        const etablissement = await Etablissement.findById(idEtablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        // Vérification du niveau
        const niveau = etablissement.niveaux.find(n => n.nom === niveauNom);
        if (!niveau) return res.status(404).json({ message: "Niveau non trouvé" });

        // Vérification du format de l'année scolaire
        const anneeScolaireRegex = /^\d{4}-\d{4}$/;
        if (!anneeScolaireRegex.test(annee_scolaire)) {
            return res.status(400).json({ message: "Format de l'année scolaire invalide (ex: 2024-2025)" });
        }

        // Vérification du numéro de téléphone
        const telephoneRegex = /^(\+243\d{9}|\d{9})$/;
        if (!telephoneRegex.test(telephone_parent)) {
            return res.status(400).json({ message: "Numéro de téléphone invalide" });
        }

        // Création de l'élève
        const nouvelEleve = { nom, prenom, dateNaissance, sexe, adresse_eleve, telephone_parent, annee_scolaire, paiements: [] };
        niveau.eleves.push(nouvelEleve);

        await etablissement.save();
        res.json({ message: "Élève ajouté avec succès", etablissement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Route pour enregistrer un paiement pour un élève
 * @route POST /api/etablissements/:idEtablissement/niveau/:niveauNom/eleve/:eleveId/paiement
 */
router.post('/:idEtablissement/niveau/:niveauNom/eleve/:eleveId/paiement', async (req, res) => {
    try {
        const { idEtablissement, niveauNom, eleveId } = req.params;
        const { montant } = req.body;

        // Vérification que le montant est positif
        if (montant <= 0) {
            return res.status(400).json({ message: "Le montant doit être positif" });
        }

        // Vérification de l'établissement
        const etablissement = await Etablissement.findById(idEtablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        // Enregistrement du paiement
        await etablissement.enregistrerPaiement(niveauNom, eleveId, montant);

        res.json({ message: "Paiement enregistré avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Route pour modifier les informations d'un élève
 * @route PUT /api/etablissements/:idEtablissement/niveau/:niveauNom/eleve/:eleveId
 */
router.put('/:idEtablissement/niveau/:niveauNom/eleve/:eleveId', async (req, res) => {
    try {
        const { idEtablissement, niveauNom, eleveId } = req.params;
        const newData = req.body;

        // Vérification de l'établissement
        const etablissement = await Etablissement.findById(idEtablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        // Modification des informations de l'élève
        await etablissement.modifierEleve(niveauNom, eleveId, newData);

        res.json({ message: "Élève modifié avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
/**
 * ✅ Route pour supprimer un élève d'un niveau spécifique d'un établissement
 * @route DELETE /api/etablissements/:idEtablissement/niveau/:niveauNom/eleve/:eleveId
 */
router.delete('/:idEtablissement/niveau/:niveauNom/eleve/:eleveId', async (req, res) => {
    try {
        const { idEtablissement, niveauNom, eleveId } = req.params;

        // Vérification de l'établissement
        const etablissement = await Etablissement.findById(idEtablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        // Trouver le niveau
        const niveau = etablissement.niveaux.find(n => n.nom === niveauNom);
        if (!niveau) return res.status(404).json({ message: "Niveau non trouvé" });

        // Trouver l'index de l'élève
        const indexEleve = niveau.eleves.findIndex(eleve => eleve._id.toString() === eleveId);
        if (indexEleve === -1) return res.status(404).json({ message: "Élève non trouvé" });

        // Suppression de l'élève
        niveau.eleves.splice(indexEleve, 1);
        await etablissement.save();

        res.json({ message: "Élève supprimé avec succès", etablissement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Route pour afficher l'historique des paiements d'un élève
 * @route GET /api/etablissements/:idEtablissement/niveau/:niveauNom/eleve/:eleveId/paiements
 */
router.get('/:idEtablissement/niveau/:niveauNom/eleve/:eleveId/paiements', async (req, res) => {
    try {
        const { idEtablissement, niveauNom, eleveId } = req.params;

        // Vérification de l'établissement
        const etablissement = await Etablissement.findById(idEtablissement);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });

        // Trouver le niveau
        const niveau = etablissement.niveaux.find(n => n.nom === niveauNom);
        if (!niveau) return res.status(404).json({ message: "Niveau non trouvé" });

        // Trouver l'élève
        const eleve = niveau.eleves.find(e => e._id.toString() === eleveId);
        if (!eleve) return res.status(404).json({ message: "Élève non trouvé" });

        // Retourner la liste des paiements
        res.json({ message: "Historique des paiements", paiements: eleve.paiements });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
