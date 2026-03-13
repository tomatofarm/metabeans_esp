import { create } from 'zustand';
import type { AlarmEvent } from '../types/system.types';

interface AlertState {
  alerts: AlarmEvent[];
  unreadCount: number;
  addAlert: (alert: AlarmEvent) => void;
  acknowledgeAlert: (alarmId: number) => void;
  resolveAlert: (alarmId: number) => void;
  clearAlerts: () => void;
  setAlerts: (alerts: AlarmEvent[]) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    })),

  acknowledgeAlert: (alarmId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.alarmId === alarmId
          ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledgedAt: new Date().toISOString() }
          : a,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  resolveAlert: (alarmId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.alarmId === alarmId
          ? { ...a, status: 'RESOLVED' as const, resolvedAt: new Date().toISOString() }
          : a,
      ),
    })),

  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),

  setAlerts: (alerts) =>
    set({
      alerts,
      unreadCount: alerts.filter((a) => a.status === 'ACTIVE').length,
    }),
}));
