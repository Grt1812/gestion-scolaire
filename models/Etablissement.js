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
 * 📌 Schéma des paiements d'un élève
 */
const PaiementSchema = new mongoose.Schema({
    montant: { type: Number, required: true, min: 0 },  // Montant du paiement
    date: { type: Date, default: Date.now },  // Date du paiement
    mois: { type: String, required: true },  // Mois du paiement
    trimestre: { 
        type: String, 
        enum: ['1er trimestre', '2ème trimestre', '3ème trimestre'], 
        required: true 
    },  // Trimestre concerné
    anneeScolaire: { 
        type: String, 
        required: true, 
        validate: [validateAnneeScolaire, "Format d'année scolaire invalide (ex: 2024-2025)"]
    }
});


/**
 * 📌 Schéma des élèves
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
    cas_social: { type: Boolean, default: false }, // Élève dispensé des paiements
    paiements: { type: [PaiementSchema], default: [] } // Liste des paiements effectués
});

/**
 * 📌 Schéma des classes
 */
const ClasseSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    anneeScolaire: { 
        type: String, 
        required: true, 
        validate: [validateAnneeScolaire, "Format d'année scolaire invalide (ex: 2024-2025)"]
    },
    eleves: { type: [EleveSchema], default: [] }
});

/**
 * 📌 Schéma des établissements scolaires
 */
const EtablissementSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    adresse: String,
    telephone: {
        type: String,
        validate: [validateTelephone, "Numéro de téléphone invalide"]
    },
    categorie: { 
        type: String, 
        enum: ['Maternelle', 'Primaire', 'Secondaire'], 
        required: true 
    },
    classes: { type: [ClasseSchema], default: [] }
});

/**
 * 📌 MÉTHODES STATIQUES - Gestion des établissements et élèves
 */

// 📌 Ajouter un élève dans une classe spécifique
EtablissementSchema.methods.ajouterEleve = async function(classeNom, eleveData) {
    const classe = this.classes.find(c => c.nom === classeNom);
    if (!classe) throw new Error("Classe non trouvée");
    
    classe.eleves.push(eleveData);
    await this.save();
    return this;
};

// 📌 Enregistrer un paiement pour un élève (sauf si en cas social)
EtablissementSchema.methods.enregistrerPaiement = async function(classeNom, eleveId, montant, mois, trimestre, anneeScolaire) {
    const classe = this.classes.find(c => c.nom === classeNom);
    if (!classe) throw new Error("Classe non trouvée");

    const eleve = classe.eleves.id(eleveId);
    if (!eleve) throw new Error("Élève non trouvé");

    if (eleve.cas_social) {
        throw new Error("Cet élève est en situation de cas social et ne doit pas payer.");
    }

    eleve.paiements.push({ montant, mois, trimestre, anneeScolaire });
    await this.save();
    return this;
};


// 📌 Modifier les informations d'un élève
EtablissementSchema.methods.modifierEleve = async function(classeNom, eleveId, newData) {
    const classe = this.classes.find(c => c.nom === classeNom);
    if (!classe) throw new Error("Classe non trouvée");

    const eleve = classe.eleves.id(eleveId);
    if (!eleve) throw new Error("Élève non trouvé");

    Object.assign(eleve, newData); // Mise à jour des données
    await this.save();
    return this;
};

// 📌 Récupérer la liste des élèves d'une classe spécifique
EtablissementSchema.methods.getElevesByClasse = function(classeNom) {
    const classe = this.classes.find(c => c.nom === classeNom);
    if (!classe) throw new Error("Classe non trouvée");

    return classe.eleves;
};

// 📌 Récupérer les paiements d'un élève
EtablissementSchema.methods.getPaiementsByEleve = function(classeNom, eleveId) {
    const classe = this.classes.find(c => c.nom === classeNom);
    if (!classe) throw new Error("Classe non trouvée");

    const eleve = classe.eleves.id(eleveId);
    if (!eleve) throw new Error("Élève non trouvé");

    return eleve.paiements;
};

// 📌 Générer un rapport des paiements pour une année scolaire
EtablissementSchema.methods.getRapportPaiementsParTrimestre = function(anneeScolaire, trimestre) {
    let rapport = [];

    this.classes.forEach(classe => {
        classe.eleves.forEach(eleve => {
            const paiementsTrimestre = eleve.paiements.filter(p => 
                p.anneeScolaire === anneeScolaire && p.trimestre === trimestre
            );
            const totalPaye = paiementsTrimestre.reduce((total, p) => total + p.montant, 0);

            rapport.push({
                nom: `${eleve.nom} ${eleve.post_nom} ${eleve.prenom}`,
                classe: classe.nom,
                trimestre,
                totalPaye,
                casSocial: eleve.cas_social
            });
        });
    });

    return rapport;
};
