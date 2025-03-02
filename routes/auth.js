const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// 🔹 Inscription d’un utilisateur
router.post('/register', [
    body('nom').notEmpty().withMessage("Le nom est requis"),
    body('email').isEmail().withMessage("Email invalide"),
    body('motDePasse').isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères"),
    body('role').isIn(['admin', 'enseignant', 'eleve']).withMessage("Rôle invalide"),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nom, email, motDePasse, role, etablissement } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Utilisateur déjà existant" });

        const hashedPassword = await bcrypt.hash(motDePasse, 10);

        user = new User({ nom, email, motDePasse: hashedPassword, role, etablissement });
        await user.save();

        res.status(201).json({ message: "Utilisateur inscrit avec succès" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 🔹 Connexion d’un utilisateur
router.post('/login', [
    body('email').isEmail().withMessage("Email invalide"),
    body('motDePasse').notEmpty().withMessage("Le mot de passe est requis")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, motDePasse } = req.body;

    try {
        const user = await User.findOne({ email }).populate('etablissement');
        if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

        const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
        if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

        const token = jwt.sign({ userId: user._id, role: user.role, etablissement: user.etablissement }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
