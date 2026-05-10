const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/login', async (req, res) => {
    // 1. Tangkap data yang dikirim dari aplikasi mobile
    const { driver_id, vehicle_id, pin } = req.body;

    try {
        // 2. Cek apakah NIK dan PIN Operator valid
        const driverQuery = await db.query(
            'SELECT * FROM drivers WHERE nik = $1 AND pin = $2',
            [driver_id, pin]
        );

        if (driverQuery.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Akses Ditolak: NIK atau PIN salah.'
            });
        }

        // 3. Cek apakah Unit Kendaraan (Vehicle ID) terdaftar
        const vehicleQuery = await db.query(
            'SELECT * FROM vehicles WHERE unit_id = $1',
            [vehicle_id]
        );

        if (vehicleQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Unit tidak dikenali oleh sistem.'
            });
        }

   
        res.json({
            success: true,
            message: 'Akses Sistem Diberikan',
            data: {
                operator_name: driverQuery.rows[0].name,
                nik: driverQuery.rows[0].nik,
                unit_id: vehicleQuery.rows[0].unit_id
            }
        });

    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server pusat.' });
    }
});

module.exports = router;