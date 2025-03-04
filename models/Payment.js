const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    eleve: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    montant: { 
        type: Number, 
        required: true 
    },
    trimestre: { 
        type: String, 
        required: true,
        enum: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'] // Assure-toi que les valeurs sont cohérentes
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);
