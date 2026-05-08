import Geolocation from '@react-native-community/geolocation';
import BackgroundTimer from 'react-native-background-timer';
import { SQLiteDatabase } from 'react-native-sqlite-storage';

// Mendefinisikan struktur data lokasi yang aman
export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

// Fungsi untuk menyimpan ke SQLite
const saveLocationToDB = async (db: SQLiteDatabase, data: LocationData): Promise<void> => {
  const query = `
    INSERT INTO location_logs (latitude, longitude, speed, timestamp, is_synced) 
    VALUES (?, ?, ?, ?, 0)
  `;
  const values = [data.latitude, data.longitude, data.speed, data.timestamp];

  try {
    await db.executeSql(query, values);
    console.log(`[Offline] Log tersimpan: Lat ${data.latitude}, Lon ${data.longitude}`);
  } catch (error) {
    console.error('Gagal menyimpan log lokasi ke SQLite:', error);
  }
};

// Fungsi untuk memulai tracking di background
export const startBackgroundTracking = (db: SQLiteDatabase) => {
  console.log('Memulai service background tracking...');

  // Eksekusi setiap 15 detik (15000 ms). Bisa disesuaikan dengan kebutuhan ritase tambang.
  BackgroundTimer.runBackgroundTimer(() => {
    console.log('[Timer] Mencoba mengambil kordinat GPS...')
    Geolocation.getCurrentPosition(
      async (position) => {
        const data: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toISOString(),
        };

        await saveLocationToDB(db, data);
      },
      (error) => {
        console.error('Gagal mendapatkan kordinat GPS:', error.message);
      },
      { 
        enableHighAccuracy: false, 
        timeout: 10000, 
        maximumAge: 10000 
      }
    );
  }, 15000);
};

// Fungsi untuk menghentikan tracking
export const stopBackgroundTracking = () => {
  BackgroundTimer.stopBackgroundTimer();
  console.log('Service background tracking dihentikan.');
};