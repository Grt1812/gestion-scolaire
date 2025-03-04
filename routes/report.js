const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Payment = require('../models/Payment'); // Assurez-vous d'avoir un modèle Payment

// 🔹 Générer un rapport PDF
router.get('/rapport/pdf', async (req, res) => {
    try {
        const paiements = await Payment.find(); // Récupérer les paiements depuis la BD

        const doc = new PDFDocument();
        const filePath = path.join(__dirname, '../public/reports', `rapport_paiements.pdf`);
        const writeStream = fs.createWriteStream(filePath);
        
        doc.pipe(writeStream);
        doc.fontSize(18).text("Rapport des Paiements", { align: "center" });
        doc.moveDown();
        
        paiements.forEach((paiement, index) => {
            doc.fontSize(12).text(`Nom: ${paiement.nom}`);
            doc.text(`Montant: ${paiement.montant} USD`);
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

// 🔹 Générer un rapport Excel
router.get('/rapport/excel', async (req, res) => {
    try {
        const paiements = await Payment.find(); 

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rapport des Paiements');

        worksheet.columns = [
            { header: 'Nom', key: 'nom', width: 25 },
            { header: 'Montant (USD)', key: 'montant', width: 15 },
            { header: 'Date', key: 'date', width: 20 }
        ];

        paiements.forEach((paiement) => {
            worksheet.addRow({
                nom: paiement.nom,
                montant: paiement.montant,
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

module.exports = router;
