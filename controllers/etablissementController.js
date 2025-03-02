const Etablissement = require('../models/Etablissement');

// 📌 Récupérer tous les établissements
exports.getAllEtablissements = async (req, res) => {
    try {
        const etablissements = await Etablissement.find();
        res.json(etablissements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 📌 Récupérer un établissement par ID
exports.getEtablissementById = async (req, res) => {
    try {
        const etablissement = await Etablissement.findById(req.params.id);
        if (!etablissement) return res.status(404).json({ message: "Établissement non trouvé" });
        res.json(etablissement);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 📌 Créer un nouvel établissement
exports.createEtablissement = async (req, res) => {
    try {
        const { nom, adresse, directeur } = req.body;
        const nouvelEtablissement = new Etablissement({ nom, adresse, directeur });
        const savedEtablissement = await nouvelEtablissement.save();
        res.status(201).json(savedEtablissement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 📌 Mettre à jour un établissement
exports.updateEtablissement = async (req, res) => {
    try {
        const updatedEtablissement = await Etablissement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEtablissement) return res.status(404).json({ message: "Établissement non trouvé" });
        res.json(updatedEtablissement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 📌 Supprimer un établissement
exports.deleteEtablissement = async (req, res) => {
    try {
        const deletedEtablissement = await Etablissement.findByIdAndDelete(req.params.id);
        if (!deletedEtablissement) return res.status(404).json({ message: "Établissement non trouvé" });
        res.json({ message: "Établissement supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
