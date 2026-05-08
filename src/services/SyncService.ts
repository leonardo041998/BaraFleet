import NetInfo from '@react-native-community/netinfo';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { LocationData } from './LocationService';

// Fungsi untuk mengambil data yang belum terkirim
export const getUnsyncedData = async (db: SQLiteDatabase) => {
  const query = 'SELECT * FROM location_logs WHERE is_synced = 0';
  const results = await db.executeSql(query);
  const rows = results[0].rows;
  
  let data = [];
  for (let i = 0; i < rows.length; i++) {
    data.push(rows.item(i));
  }
  return data;
};

// Fungsi untuk menandai data bahwa sudah berhasil terkirim
export const markAsSynced = async (db: SQLiteDatabase, ids: number[]) => {
  if (ids.length === 0) return;
  
  // Membuat placeholder '?' sejumlah ID yang ada
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE location_logs SET is_synced = 1 WHERE id IN (${placeholders})`;
  
  await db.executeSql(query, ids);
};

// Fungsi utama untuk eksekusi sinkronisasi
export const syncDataToServer = async (db: SQLiteDatabase) => {
  // 1. Cek koneksi internet
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('[Sync] Tidak ada koneksi internet. Menunggu sinyal...');
    return;
  }

  // 2. Ambil antrean data
  const unsyncedData = await getUnsyncedData(db);
  if (unsyncedData.length === 0) {
    console.log('[Sync] Semua data sudah aman di server.');
    return;
  }

  console.log(`[Sync] Menemukan ${unsyncedData.length} log lokasi. Memulai pengiriman...`);

  try {
    // 3. Blok pengiriman ke Backend (Node.js)
    /* 
      Nanti saat API sudah siap, kita gunakan format ini:
      
      const response = await fetch('https://api.domain-perusahaan.com/v1/fleet/locations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: unsyncedData })
      });
      
      if (!response.ok) throw new Error('Gagal mengirim ke server');
    */

    // Simulasi delay jaringan (hapus ini nanti saat integrasi API asli)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 4. Update status di SQLite jika berhasil
    const syncedIds = unsyncedData.map(item => item.id);
    await markAsSynced(db, syncedIds);
    
    console.log(`[Sync] SUKSES! ${syncedIds.length} baris data berhasil disinkronkan ke server.`);
  } catch (error) {
    console.error('[Sync] Gagal mensinkronisasi:', error);
  }
};