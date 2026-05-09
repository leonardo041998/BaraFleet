import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, Text, View, TouchableOpacity } from 'react-native';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDBConnection, createTables } from './src/database/dbConfig';
import { requestLocationPermission } from './src/utils/permissions';
import { startBackgroundTracking, stopBackgroundTracking } from './src/services/LocationService';
import { syncDataToServer } from './src/services/SyncService';
import { getStats } from './src/database/dbConfig';
import { useFleetStore } from './src/store/useFleetStore';

const App = () => {
  const [dbStatus, setDbStatus] = useState<string>('Menginisialisasi Database...');
  const [permissionStatus, setPermissionStatus] = useState<string>('Memeriksa Izin...');
  const [dbInstance, setDbInstance] = useState<any>(null);
  const { totalLogs, pendingSync, isTracking, setStats, setTracking } = useFleetStore();

  const refreshStats = async (db: any) => {
    const stats = await getStats(db);
    setStats(stats.total, stats.pending);
  };

  useEffect(() => {
    if (dbInstance) {
      const interval = setInterval(() => refreshStats(dbInstance), 5000); // Refresh stats setiap 5 detik
      return () => clearInterval(interval);
    }
  }, [dbInstance]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        setDbInstance(db);
        setDbStatus('Database Offline Siap Digunakan');

        const hasPermission = await requestLocationPermission();
        setPermissionStatus(hasPermission ? 'Izin Lokasi: Diberikan' : 'Izin Lokasi: Ditolak');

        // Coba sinkronisasi data yang tertunda saat aplikasi baru dibuka
        if (hasPermission) await syncDataToServer(db);
      } catch (error) {
        console.error('Gagal inisialisasi:', error);
        setDbStatus('Gagal Memuat Database');
      }
    };

    initApp();
  }, []);

  // Fungsi Manual Sync untuk testing
  const handleManualSync = async () => {
    if (dbInstance) {
      await syncDataToServer(dbInstance);
    }
  };

  const handleStartTracking = () => {
    if (dbInstance) {
      startBackgroundTracking(dbInstance);
      setTracking(true); 
    }
  };

  const handleStopTracking = () => {
    stopBackgroundTracking();
    setTracking(false); 
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl font-bold mb-2 text-gray-800 text-center">BaraFleet Mobile</Text>
        <View className="bg-white p-4 rounded-xl shadow-sm w-full mb-6">
          <Text className="text-sm text-gray-500 uppercase font-semibold">Status System</Text>
          <Text className="text-base text-gray-800">{dbStatus}</Text>
          <Text className="text-sm text-blue-600 font-medium">{permissionStatus}</Text>
        </View>

        <View className="flex-row space-x-2 mb-4 w-full">
          <TouchableOpacity
            className={`flex-1 py-4 rounded-xl items-center ${isTracking ? 'bg-red-500' : 'bg-emerald-600'}`}
            onPress={isTracking ? handleStopTracking : handleStartTracking}
          >
            <Text className="text-white font-bold text-lg">
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        
        <TouchableOpacity
          className="bg-blue-100 border border-blue-300 py-3 px-6 rounded-xl w-full items-center"
          onPress={handleManualSync}
        >
          <Text className="text-blue-700 font-semibold">Sync Data ke Server</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default App;