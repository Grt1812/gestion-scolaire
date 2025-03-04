const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const router = express.Router();

/**
 * ✅ Inscription d’un utilisateur
 * Un mot de passe par défaut est attribué et peut être changé après
 */
router.post('/register', [
    body('nom').notEmpty().withMessage("Le nom est requis"),
    body('email').isEmail().withMessage("Email invalide"),
    body('role').isIn(['admin', 'enseignant', 'eleve']).withMessage("Rôle invalide"),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nom, email, role, etablissement } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Utilisateur déjà existant" });

        const motDePasseParDefaut = "password123"; // Mot de passe par défaut
        const hashedPassword = await bcrypt.hash(motDePasseParDefaut, 10);

        user = new User({ nom, email, motDePasse: hashedPassword, role, etablissement });
        await user.save();

        res.status(201).json({ message: "Utilisateur inscrit avec succès. Mot de passe par défaut: password123" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Connexion de l'utilisateur
 */
router.post('/login', [
    body('email').isEmail().withMessage("Email invalide"),
    body('motDePasse').notEmpty().withMessage("Le mot de passe est requis")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { email, motDePasse } = req.body;

        // Vérifier si l'utilisateur existe
        const utilisateur = await User.findOne({ email }).populate('etablissement');
        if (!utilisateur) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

        // Vérifier le mot de passe
        const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
        if (!motDePasseValide) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

        // Générer un token JWT
        const token = jwt.sign(
            { userId: utilisateur._id, role: utilisateur.role, etablissement: utilisateur.etablissement },
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        res.json({ message: "Connexion réussie", token, user: utilisateur });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * ✅ Obtenir les informations de l'utilisateur connecté
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-motDePasse').populate('etablissement');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});

module.exports = router;

