const mongoose = require('mongoose');

/**
 * Validation du format de l'année scolaire (YYYY-YYYY)
 */
function validateAnneeScolaire(value) {
    return /^\d{4}-\d{4}$/.test(value);
}

/**
 * Validation du format du numéro de téléphone
 * Format : +243971234567 ou 0971234567
 */
function validateTelephone(value) {
    return /^(\+243\d{9}|\d{9})$/.test(value);
}

/**
 * Schéma des paiements d'un élève
 */
const PaiementSchema = new mongoose.Schema({
    montant: { type: Number, required: true, min: 0 },  // Montant du paiement (minimum 0)
    date: { type: Date, default: Date.now }  // Date du paiement (par défaut, date actuelle)
});

/**
 * Schéma des élèves
 */
const EleveSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    post_nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    sexe: { type: String, enum: ['M', 'F'], required: true },
    date_naissance: { type: Date, required: true },
    lieu_naissance: { type: String, required: true },
    nationalite: { type: String, required: true },
    adresse_eleve: { type: String, required: true },
    nom_pere: { type: String, required: true },
    nom_mere: { type: String, required: true },
    telephone_parent: { 
        type: String, 
        required: true, 
        validate: [validateTelephone, "Numéro de téléphone invalide"] 
    },
    annee_scolaire: { 
        type: String, 
        required: true, 
        validate: [validateAnneeScolaire, "Format d'année scolaire invalide (ex: 2024-2025)"]
    },
    paiements: { type: [PaiementSchema], default: [] } // Liste des paiements effectués
});

/**
 * Schéma des niveaux scolaires
 */
const NiveauSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    eleves: { type: [EleveSchema], default: [] }
});

/**
 * Schéma des établissements scolaires
 */
const EtablissementSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    categorie: { 
        type: String, 
        enum: ['Maternelle', 'Primaire', 'Secondaire'], 
        required: true 
    },
    niveaux: { type: [NiveauSchema], default: [] }
});

/**
 * 📌 MÉTHODES STATIQUES
 * Permettent de gérer les établissements et les élèves
 */

// 📌 Ajouter un élève dans un niveau spécifique
EtablissementSchema.methods.ajouterEleve = async function(niveauNom, eleveData) {
    const niveau = this.niveaux.find(n => n.nom === niveauNom);
    if (!niveau) throw new Error("Niveau non trouvé");
    
    niveau.eleves.push(eleveData);
    await this.save();
    return this;
};

// 📌 Enregistrer un paiement pour un élève
EtablissementSchema.methods.enregistrerPaiement = async function(niveauNom, eleveId, montant) {
    const niveau = this.niveaux.find(n => n.nom === niveauNom);
    if (!niveau) throw new Error("Niveau non trouvé");

    const eleve = niveau.eleves.id(eleveId);
    if (!eleve) throw new Error("Élève non trouvé");

    eleve.paiements.push({ montant });
    await this.save();
    return this;
};

// 📌 Modifier les informations d'un élève
EtablissementSchema.methods.modifierEleve = async function(niveauNom, eleveId, newData) {
    const niveau = this.niveaux.find(n => n.nom === niveauNom);
    if (!niveau) throw new Error("Niveau non trouvé");

    const eleve = niveau.eleves.id(eleveId);
    if (!eleve) throw new Error("Élève non trouvé");

    Object.assign(eleve, newData); // Mise à jour des données
    await this.save();
    return this;
};

// Création du modèle Etablissement
const Etablissement = mongoose.model('Etablissement', EtablissementSchema);

module.exports = Etablissement;
