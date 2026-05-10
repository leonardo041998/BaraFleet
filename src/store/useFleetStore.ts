import { create } from 'zustand';

interface FleetState {
    driverId: string | null;
    vehicleId: string | null;
    isLoggedIn: boolean;
    login: (driverId: string, vehicleId: string) => void;
    logout: () => void;

    totalLogs: number;
    pendingSync: number;
    lastSyncTime: String | null;
    isTracking: boolean;
    setStats: (total: number, pending: number) => void;
    setTracking: (status: boolean) => void;
    setLastSync: (time: string) =>void;
}

export const useFleetStore = create<FleetState>((set) => ({
    driverId: null,
    vehicleId: null,
    isLoggedIn: false,
    login: (driverId, vehicleId) => set({ driverId, vehicleId, isLoggedIn: true }),
    logout: () => set({ driverId: null, vehicleId: null, isLoggedIn: false, isTracking: false }),

    totalLogs: 0,
    pendingSync: 0,
    lastSyncTime: null,
    isTracking: false,
    setStats: (total,pending) => set({ totalLogs: total, pendingSync: pending }),
    setTracking: (status) => set({ isTracking: status }),
    setLastSync: (time) => set({ lastSyncTime: time }),
}));