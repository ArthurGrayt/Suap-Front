import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  taskId?: string;
  createdAt: number;
  read: boolean;
  type?: 'push' | 'system' | 'custom';
  icon?: string;
  color?: string;
}

interface NotificationStore {
  notifications: LocalNotification[];
  addNotification: (notification: Omit<LocalNotification, 'createdAt' | 'read'> & { id?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) => set((state) => {
        // Evita duplicação se o id já existir
        if (notification.id && state.notifications.some(n => n.id === notification.id)) return state;
        
        return {
          notifications: [
            {
              ...notification,
              id: notification.id || (Math.random().toString(36).substring(7) + Date.now().toString()),
              createdAt: Date.now(),
              read: false,
            },
            ...state.notifications,
          ]
        };
      }),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'suap-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
