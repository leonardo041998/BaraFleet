import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo'; // Tambahan baru
import { getDBConnection, createTables, getStats } from './src/database/dbConfig';
import { requestLocationPermission } from './src/utils/permissions';
import { startBackgroundTracking, stopBackgroundTracking } from './src/services/LocationService';
import { syncDataToServer } from './src/services/SyncService';
import { useFleetStore } from './src/store/useFleetStore';

const App = () => {
  const {
    isLoggedIn, login, logout, driverId, vehicleId,
    totalLogs, pendingSync, isTracking, setStats, setTracking
  } = useFleetStore();

  const [inputVehicle, setInputVehicle] = useState('');
  const [inputDriver, setInputDriver] = useState('');
  const [inputPin, setInputPin] = useState('');

  const [dbInstance, setDbInstance] = useState<SQLiteDatabase | null>(null);

  // State baru untuk memantau status jaringan di UI
  const [isConnected, setIsConnected] = useState<boolean | null>(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        setDbInstance(db);
        await requestLocationPermission();
      } catch (error) {
        console.error('Gagal inisialisasi:', error);
      }
    };
    initApp();
  }, []);

  // RADAR JARINGAN & AUTO-SYNC
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);

      // Jika nyambung internet, langsung tembak Sync otomatis!
      if (state.isConnected && dbInstance && isLoggedIn) {
        syncDataToServer(dbInstance);
      }
    });

    return () => unsubscribe();
  }, [dbInstance, isLoggedIn]);

  useEffect(() => {
    let interval: any;
    if (dbInstance && isLoggedIn) {
      const refreshStats = async () => {
        const stats = await getStats(dbInstance);
        setStats(stats.total, stats.pending);
      };
      refreshStats();
      interval = setInterval(refreshStats, 5000);
    }
    return () => clearInterval(interval);
  }, [dbInstance, isLoggedIn]);

  const handleLogin = () => {
    if (!inputVehicle || !inputDriver || !inputPin) {
      Alert.alert('Perhatian', 'Semua form harus diisi.');
      return;
    }
    if (inputPin !== '123456') {
      Alert.alert('Akses Ditolak', 'PIN tidak valid.');
      return;
    }

    login(inputDriver, inputVehicle);
    setInputPin('');
    Keyboard.dismiss();
  };

  const handleLogout = () => {
    Alert.alert('Konfirmasi', 'Akhiri sesi operasional?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Akhiri Shift',
        style: 'destructive',
        onPress: () => {
          if (isTracking) {
            stopBackgroundTracking();
            setTracking(false);
          }
          logout();
        }
      }
    ]);
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

  // ==========================================
  // RENDER UI: HALAMAN LOGIN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center px-6">
              <View className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-lg">
                <View className="items-center mb-8">
                  <Text className="text-3xl font-black text-white tracking-widest uppercase">
                    Bara<Text className="text-amber-500">Fleet</Text>
                  </Text>
                  <View className="h-1 w-12 bg-amber-500 mt-3 rounded-full" />
                </View>

                <View className="space-y-4 mb-8">
                  <View>
                    <Text className="text-slate-400 font-bold mb-2 text-xs uppercase tracking-widest">Unit ID</Text>
                    <TextInput
                      className="h-14 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white font-bold text-base"
                      placeholder="Contoh: DT-012"
                      placeholderTextColor="#334155"
                      autoCapitalize="characters"
                      value={inputVehicle}
                      onChangeText={setInputVehicle}
                    />
                  </View>

                  <View>
                    <Text className="text-slate-400 font-bold mb-2 text-xs uppercase tracking-widest">Operator NIK</Text>
                    <TextInput
                      className="h-14 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white font-bold text-base"
                      placeholder="Contoh: 180299"
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      value={inputDriver}
                      onChangeText={setInputDriver}
                    />
                  </View>

                  <View>
                    <Text className="text-slate-400 font-bold mb-2 text-xs uppercase tracking-widest">Kode Akses</Text>
                    <TextInput
                      className="h-14 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white font-bold text-base tracking-widest"
                      placeholder="******"
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      secureTextEntry
                      value={inputPin}
                      onChangeText={setInputPin}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  className="h-14 bg-amber-500 rounded-xl justify-center items-center"
                >
                  <Text className="text-slate-950 font-black text-base uppercase tracking-widest">Akses Sistem</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER UI: HALAMAN DASHBOARD
  // ==========================================
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View className="flex-1 px-6 pt-6 pb-4">

        <View className="flex-row justify-between items-center mb-8 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <View>
            <View className="flex-row items-center space-x-2 mb-1">
              <View className="h-2 w-2 bg-amber-500 rounded-full" />
              <Text className="text-white font-bold text-sm tracking-widest uppercase">Terminal Aktif</Text>
            </View>
            <Text className="text-slate-400 font-medium text-xs">
              UNIT: <Text className="text-white font-bold">{vehicleId}</Text> | OPR: <Text className="text-white font-bold">{driverId}</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <Text className="text-red-400 font-bold text-xs uppercase tracking-wider">Keluar</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-6">
          <View className="bg-slate-900 p-5 rounded-xl w-[48%] border border-slate-800 justify-center items-center">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Data</Text>
            <Text className="text-3xl font-black text-white">{totalLogs}</Text>
          </View>
          <View className="bg-slate-900 p-5 rounded-xl w-[48%] border border-slate-800 justify-center items-center">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Antrean Sync</Text>
            <Text className={`text-3xl font-black ${pendingSync > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
              {pendingSync}
            </Text>
          </View>
        </View>

        <View className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white font-bold text-sm uppercase tracking-widest">Status Pelacakan</Text>
              <Text className="text-slate-400 text-xs mt-1">Layanan Lokasi Latar Belakang</Text>
            </View>
            <View className={`h-3 w-3 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
          </View>

          <TouchableOpacity
            onPress={isTracking ? handleStopTracking : handleStartTracking}
            className={`h-14 rounded-xl justify-center items-center ${isTracking ? 'bg-slate-800 border border-slate-700' : 'bg-amber-500'}`}
          >
            <Text className={`font-black text-base uppercase tracking-widest ${isTracking ? 'text-white' : 'text-slate-950'}`}>
              {isTracking ? 'Hentikan Pelacakan' : 'Mulai Pelacakan'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1" />

        {/* INDIKATOR STATUS JARINGAN (Pengganti Tombol Manual) */}
        <View className={`h-16 rounded-xl border flex-row items-center justify-center space-x-3 ${isConnected ? 'bg-emerald-950 border-emerald-900' : 'bg-slate-900 border-slate-800'}`}>
          <View className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
          <View>
            <Text className={`font-black text-sm uppercase tracking-widest ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isConnected ? 'Sinyal Terdeteksi' : 'Mode Offline'}
            </Text>
            <Text className="text-slate-500 text-[10px] uppercase font-bold text-center mt-1">
              {isConnected ? 'Auto-Sync Aktif' : 'Menyimpan di Lokal'}
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default App;