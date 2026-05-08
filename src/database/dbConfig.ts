import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const database_name = "BaraFleetLocal.db";
const database_version = "1.0";
const database_displayname = "BaraFleet Offline Database";
const database_size = 200000;

export const getDBConnection = async (): Promise<SQLiteDatabase> => {
  return SQLite.openDatabase(
    database_name,
    database_version,
    database_displayname,
    database_size
  );
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