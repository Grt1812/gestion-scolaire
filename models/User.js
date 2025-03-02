const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    motDePasse: { type: String, required: true },
    role: { type: String, enum: ['admin', 'enseignant', 'eleve'], required: true },
    etablissement: { type: mongoose.Schema.Types.ObjectId, ref: 'Etablissement' } // Référence à un établissement
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

