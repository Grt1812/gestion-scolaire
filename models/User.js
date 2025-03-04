const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String }, // Champ optionnel
    email: { type: String, required: true, unique: true },
    motDePasse: { type: String, required: true },
    role: { type: String, enum: ['admin', 'enseignant', 'parent', 'eleve'], required: true },
    etablissement: { type: mongoose.Schema.Types.ObjectId, ref: 'Etablissement' }, // Référence à un établissement
}, { timestamps: true });

/**
 * ✅ Hashage automatique du mot de passe avant sauvegarde
 */
UserSchema.pre('save', async function (next) {
    if (!this.isModified('motDePasse')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('User', UserSchema);
