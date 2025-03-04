const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Payment = require('../models/Payment'); 

// 📌 Vérifier si un élève a déjà payé un trimestre avant d'enregistrer un paiement
router.post('/verifier-paiement', async (req, res) => {
    const { eleveId, trimestre } = req.body;

    try {
        const paiementExiste = await Payment.findOne({ eleveId, trimestre });

        if (paiementExiste) {
            return res.status(400).json({ message: "Cet élève a déjà payé ce trimestre." });
        }
        
        res.status(200).json({ message: "Aucun paiement trouvé pour ce trimestre, l'élève peut payer." });

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la vérification du paiement.", error: error.message });
    }
});

// 📌 Générer un rapport PDF des paiements
router.get('/rapport/pdf', async (req, res) => {
    try {
        const paiements = await Payment.find(); 

        const doc = new PDFDocument();
        const filePath = path.join(__dirname, '../public/reports', `rapport_paiements.pdf`);
        const writeStream = fs.createWriteStream(filePath);
        
        doc.pipe(writeStream);
        doc.fontSize(18).text("Rapport des Paiements", { align: "center" });
        doc.moveDown();
        
        paiements.forEach((paiement) => {
            doc.fontSize(12).text(`Nom: ${paiement.nom}`);
            doc.text(`Montant: ${paiement.montant} USD`);
            doc.text(`Trimestre: ${paiement.trimestre}`);
            doc.text(`Date: ${paiement.date}`);
            doc.moveDown();
        });

        doc.end();

        writeStream.on('finish', () => {
            res.download(filePath);
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la génération du PDF", error: error.message });
    }
});

// 📌 Générer un rapport Excel des paiements
router.get('/rapport/excel', async (req, res) => {
    try {
        const paiements = await Payment.find();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rapport des Paiements');

        worksheet.columns = [
            { header: 'Nom', key: 'nom', width: 25 },
            { header: 'Montant (USD)', key: 'montant', width: 15 },
            { header: 'Trimestre', key: 'trimestre', width: 15 },
            { header: 'Date', key: 'date', width: 20 }
        ];

        paiements.forEach((paiement) => {
            worksheet.addRow({
                nom: paiement.nom,
                montant: paiement.montant,
                trimestre: paiement.trimestre,
                date: paiement.date
            });
        });

        const filePath = path.join(__dirname, '../public/reports', `rapport_paiements.xlsx`);
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath);

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la génération du fichier Excel", error: error.message });
    }
});

// 📌 Générer un bilan annuel sur le taux de solvabilité
router.get('/bilan-annuel', async (req, res) => {
    try {
        const paiements = await Payment.find();

        let totalPayé = 0;
        let totalAttendu = 0;
        let tauxSolvabilité = 0;

        paiements.forEach((paiement) => {
            totalPayé += paiement.montant;
            totalAttendu += 100; // Exemple : 100 USD par trimestre
        });

        if (totalAttendu > 0) {
            tauxSolvabilité = ((totalPayé / totalAttendu) * 100).toFixed(2);
        }

        res.status(200).json({
            totalPayé: totalPayé + " USD",
            totalAttendu: totalAttendu + " USD",
            tauxSolvabilité: tauxSolvabilité + " %"
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur lors du calcul du bilan annuel.", error: error.message });
    }
});

module.exports = router;
