import { create } from "zustand";
import api from "@lib/api";
import { User } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";

export interface Status {
  id: string;
  userId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
  caption: string | null;
  backgroundColor: string | null;
  createdAt: string;
  expiresAt: string;
  views: Array<{
    id: string;
    statusId: string;
    userId: string;
    viewedAt: string;
    user: User;
  }>;
}

export interface StatusGroup {
  user: User;
  statuses: Status[];
}

interface StatusState {
  myStatus: StatusGroup | null;
  recent: StatusGroup[];
  viewed: StatusGroup[];
  loading: boolean;
  viewers: Record<string, Array<User & { viewedAt: string }>>; // statusId -> viewer user details
  
  // Player state
  activeGroupUserId: string | null;
  activeStatusIndex: number;
  
  fetchStatuses: () => Promise<void>;
  postStatus: (input: {
    content?: string;
    mediaUrl?: string;
    mediaType?: "IMAGE" | "VIDEO";
    caption?: string;
    backgroundColor?: string;
  }) => Promise<void>;
  viewStatus: (statusId: string, groupUserId: string) => Promise<void>;
  fetchStatusViewers: (statusId: string) => Promise<void>;

  // Player actions
  playStatusGroup: (userId: string) => void;
  closeStatusViewer: () => void;
  nextStatus: () => void;
  prevStatus: () => void;
}

export const useStatusStore = create<StatusState>((set, get) => ({
  myStatus: null,
  recent: [],
  viewed: [],
  loading: false,
  viewers: {},

  // Player state
  activeGroupUserId: null,
  activeStatusIndex: 0,

  fetchStatuses: async () => {
    set({ loading: true });
    try {
      const response = await api.get("/status");
      const { myStatus, recent, viewed } = response.data.data;
      set({ myStatus, recent, viewed });
    } catch (err) {
      console.error("Failed to fetch statuses", err);
    } finally {
      set({ loading: false });
    }
  },

  postStatus: async (input) => {
    try {
      await api.post("/status", input);
      // Refresh status list to reflect new status instantly
      await get().fetchStatuses();
    } catch (err) {
      console.error("Failed to post status", err);
      throw err;
    }
  },

  viewStatus: async (statusId, groupUserId) => {
    try {
      await api.post(`/status/${statusId}/view`);
      // Refresh status list to sync with server view lists
      await get().fetchStatuses();
    } catch (err) {
      console.error("Failed to log status view", err);
    }
  },

  fetchStatusViewers: async (statusId) => {
    try {
      const response = await api.get(`/status/${statusId}/viewers`);
      const { viewers } = response.data.data;
      // Extract viewer user profiles
      const users = viewers.map((v: any) => ({
        ...v.user,
        viewedAt: v.viewedAt, // append viewed timestamp
      }));
      set((state) => ({
        viewers: { ...state.viewers, [statusId]: users },
      }));
    } catch (err) {
      console.error("Failed to fetch status viewers", err);
    }
  },

  playStatusGroup: (userId) => {
    set({ activeGroupUserId: userId, activeStatusIndex: 0 });
    
    // Auto-log view for the first status of the group if it is not our own
    const { myStatus, recent, viewed } = get();
    let group: StatusGroup | null = null;
    if (myStatus && myStatus.user.id === userId) {
      group = myStatus;
    } else {
      group = recent.find((g) => g.user.id === userId) ||
              viewed.find((g) => g.user.id === userId) || null;
    }
    if (group && group.statuses.length > 0) {
      const firstStatus = group.statuses[0];
      const me = useAuthStore.getState().user;
      if (me && group.user.id !== me.id) {
        get().viewStatus(firstStatus.id, group.user.id);
      }
    }
  },

  closeStatusViewer: () => {
    set({ activeGroupUserId: null, activeStatusIndex: 0 });
  },

  nextStatus: () => {
    const { activeGroupUserId, activeStatusIndex, myStatus, recent, viewed } = get();
    if (!activeGroupUserId) return;

    // Find current active group
    let currentGroup: StatusGroup | null = null;
    if (myStatus && myStatus.user.id === activeGroupUserId) {
      currentGroup = myStatus;
    } else {
      currentGroup = recent.find((g) => g.user.id === activeGroupUserId) ||
                     viewed.find((g) => g.user.id === activeGroupUserId) || null;
    }

    if (!currentGroup) return;

    // If there is another status in the current group, go to it
    if (activeStatusIndex < currentGroup.statuses.length - 1) {
      const nextIndex = activeStatusIndex + 1;
      set({ activeStatusIndex: nextIndex });
      
      // Auto-log view for this next status if it is not our own
      const nextStatusItem = currentGroup.statuses[nextIndex];
      const me = useAuthStore.getState().user;
      if (me && currentGroup.user.id !== me.id) {
        get().viewStatus(nextStatusItem.id, currentGroup.user.id);
      }
      return;
    }

    // Otherwise, find the next user in the sequence
    const sequence: string[] = [];
    if (myStatus) sequence.push(myStatus.user.id);
    recent.forEach((g) => sequence.push(g.user.id));
    viewed.forEach((g) => sequence.push(g.user.id));

    const currentIndex = sequence.indexOf(activeGroupUserId);
    if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
      const nextUserId = sequence[currentIndex + 1];
      set({ activeGroupUserId: nextUserId, activeStatusIndex: 0 });
      
      // Auto-log view for the first status of the next group
      let nextGroup: StatusGroup | null = null;
      if (myStatus && myStatus.user.id === nextUserId) {
        nextGroup = myStatus;
      } else {
        nextGroup = recent.find((g) => g.user.id === nextUserId) ||
                    viewed.find((g) => g.user.id === nextUserId) || null;
      }
      if (nextGroup && nextGroup.statuses.length > 0) {
        const firstStatusItem = nextGroup.statuses[0];
        const me = useAuthStore.getState().user;
        if (me && nextGroup.user.id !== me.id) {
          get().viewStatus(firstStatusItem.id, nextGroup.user.id);
        }
      }
    } else {
      // End of sequence, close viewer
      set({ activeGroupUserId: null, activeStatusIndex: 0 });
    }
  },

  prevStatus: () => {
    const { activeGroupUserId, activeStatusIndex, myStatus, recent, viewed } = get();
    if (!activeGroupUserId) return;

    // If we can go back in the current group, do it
    if (activeStatusIndex > 0) {
      set({ activeStatusIndex: activeStatusIndex - 1 });
      return;
    }

    // Otherwise, find the previous user in the sequence
    const sequence: string[] = [];
    if (myStatus) sequence.push(myStatus.user.id);
    recent.forEach((g) => sequence.push(g.user.id));
    viewed.forEach((g) => sequence.push(g.user.id));

    const currentIndex = sequence.indexOf(activeGroupUserId);
    if (currentIndex > 0) {
      const prevUserId = sequence[currentIndex - 1];
      let prevGroup: StatusGroup | null = null;
      if (myStatus && myStatus.user.id === prevUserId) {
        prevGroup = myStatus;
      } else {
        prevGroup = recent.find((g) => g.user.id === prevUserId) ||
                    viewed.find((g) => g.user.id === prevUserId) || null;
      }
      if (prevGroup) {
        set({ activeGroupUserId: prevUserId, activeStatusIndex: prevGroup.statuses.length - 1 });
      }
    }
  },
}));
