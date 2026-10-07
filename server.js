const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Base Status Route
app.get('/', (req, res) => {
    res.json({ message: 'Campus Therapy & Counseling API is running' });
});

// GET: Fetch all active users
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT user_id, full_name, email, role, created_at FROM users');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET: Fetch appointments with student and counselor details
app.get('/api/appointments', async (req, res) => {
    try {
        const query = `
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.status,
                a.initial_notes,
                a.virtual_meeting_url,
                u1.full_name AS student_name,
                u2.full_name AS counselor_name,
                c.office_location
            FROM appointments a
            JOIN users u1 ON a.student_id = u1.user_id
            JOIN users u2 ON a.counselor_id = u2.user_id
            LEFT JOIN counselors c ON u2.user_id = c.counselor_id
            ORDER BY a.appointment_date ASC
        `;
        const [rows] = await db.query(query);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST: Schedule a new appointment
app.post('/api/appointments', async (req, res) => {
    const { student_id, counselor_id, appointment_date, initial_notes } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO appointments (student_id, counselor_id, appointment_date, initial_notes) VALUES (?, ?, ?, ?)',
            [student_id, counselor_id, appointment_date, initial_notes]
        );
        res.status(201).json({ success: true, appointment_id: result.insertId, message: 'Appointment requested successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
// Add these lines to server.js
const authRoutes = require('./authRoutes');
const clinicalRoutes = require('./clinicalRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/clinical', clinicalRoutes);
});
