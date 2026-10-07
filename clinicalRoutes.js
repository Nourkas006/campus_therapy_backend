// clinicalRoutes.js
const express = require('express');
const db = require('./db');
const router = express.Router();

// Log Consultation Notes
router.post('/records', async (req, res) => {
    const { appointment_id, clinical_impression, issue_category, custom_category_tag, is_escalated } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO consultation_records 
             (appointment_id, clinical_impression, issue_category, custom_category_tag, is_escalated) 
             VALUES (?, ?, ?, ?, ?)`,
            [appointment_id, clinical_impression, issue_category, custom_category_tag || null, is_escalated || false]
        );

        // Update appointment status to COMPLETED
        await db.query('UPDATE appointments SET status = "COMPLETED" WHERE appointment_id = ?', [appointment_id]);

        res.status(201).json({ success: true, record_id: result.insertId, message: 'Consultation record logged successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Create External Referral
router.post('/referrals', async (req, res) => {
    const { record_id, specialist_name, specialist_type, referral_reason } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO external_referrals 
             (record_id, specialist_name, specialist_type, referral_reason) 
             VALUES (?, ?, ?, ?)`,
            [record_id, specialist_name, specialist_type, referral_reason]
        );

        res.status(201).json({ success: true, referral_id: result.insertId, message: 'External referral created' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;