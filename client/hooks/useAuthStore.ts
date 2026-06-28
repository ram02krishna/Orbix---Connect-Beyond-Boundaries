import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  blockedUserIds: string[];
  setAuth: (user: UserProfile, token: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (fields: Partial<UserProfile>) => void;
  setBlockedUsers: (userIds: string[]) => void;
  addBlockedUser: (userId: string) => void;
  removeBlockedUser: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      blockedUserIds: [],
      setAuth: (user, token) => set({ user, accessToken: token }),
      setAccessToken: (token) => set({ accessToken: token }),
      updateUser: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        })),
      setBlockedUsers: (userIds) => set({ blockedUserIds: userIds }),
      addBlockedUser: (userId) =>
        set((state) => ({
          blockedUserIds: state.blockedUserIds.includes(userId) ? state.blockedUserIds : [...state.blockedUserIds, userId]
        })),
      removeBlockedUser: (userId) =>
        set((state) => ({
          blockedUserIds: state.blockedUserIds.filter(id => id !== userId)
        })),
      logout: () => set({ user: null, accessToken: null, blockedUserIds: [] }),
    }),
    {
      name: "orbix-auth", 
    }
  )
);
