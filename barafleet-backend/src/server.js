require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Tambahan baru

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Test koneksi database saat server diakses
app.get('/api/ping', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() AS current_time');
        res.json({
            status: 'ok',
            message: 'BaraFleet Backend is ready',
            db_time: result.rows[0].current_time
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Database tidak terhubung' });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});