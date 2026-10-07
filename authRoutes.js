// authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const router = express.Router();

// USER REGISTER
router.post('/register', async (req, res) => {
    const { full_name, email, password, role, student_number, department, office_location } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Insert into Users table
        const [userResult] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [full_name, email, hashedPassword, role]
        );

        const userId = userResult.insertId;

        // 2. Insert into role-specific tables
        if (role === 'STUDENT' && student_number) {
            await db.query(
                'INSERT INTO students (student_id, student_number, department) VALUES (?, ?, ?)',
                [userId, student_number, department || null]
            );
        } else if (role === 'COUNSELOR' && office_location) {
            await db.query(
                'INSERT INTO counselors (counselor_id, office_location) VALUES (?, ?)',
                [userId, office_location]
            );
        }

        res.status(201).json({ success: true, message: 'User registered successfully!', userId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// USER LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user.user_id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.user_id, name: user.full_name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;