import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const database_name = "BaraFleetLocal.db";

// getDBConnection diperbarui agar menggunakan format objek yang benar
export const getDBConnection = async (): Promise<SQLiteDatabase> => {
  return SQLite.openDatabase({
    name: database_name,
    location: 'default',
  });
};

export const createTables = async (db: SQLiteDatabase): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS location_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      timestamp TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0
    );
  `;
  
  try {
    await db.executeSql(query);
    console.log("Tabel 'location_logs' siap digunakan!");
  } catch (error) {
    console.error("Gagal membuat tabel:", error);
  }
};

export const getStats = async (db: SQLiteDatabase) => {
  const totalRes = await db.executeSql('SELECT COUNT(*) as total FROM location_logs');
  const pendingRes = await db.executeSql('SELECT COUNT(*) as pending FROM location_logs WHERE is_synced = 0');
  
  return {
    total: totalRes[0].rows.item(0).total,
    pending: pendingRes[0].rows.item(0).pending
  };
};