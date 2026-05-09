import { create } from 'zustand';

interface FleetState {
    totalLogs: number;
    pendingSync: number;
    lastSyncTime: String | null;
    isTracking: boolean;
    setStats: (total: number, pending: number) => void;
    setTracking: (status: boolean) => void;
    setLastSync: (time: string) =>void;
}

export const useFleetStore = create<FleetState>((set) => ({
    totalLogs: 0,
    pendingSync: 0,
    lastSyncTime: null,
    isTracking: false,
    setStats: (total,pending) => set({ totalLogs: total, pendingSync: pending }),
    setTracking: (status) => set({ isTracking: status }),
    setLastSync: (time) => set({ lastSyncTime: time }),
}));