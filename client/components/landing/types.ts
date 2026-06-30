export interface Chat {
  id: number;
  name: string;
  avatar: string;
  color: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  typing: boolean;
  type: "DIRECT" | "GROUP";
  isPinned?: boolean;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  self: boolean;
  isEdited?: boolean;
  isStarred?: boolean;
  media?: { type: "IMAGE" | "VIDEO" | "AUDIO" | "FILE"; value: string; duration?: string };
  reactions?: { emoji: string; count: number }[];
}

export interface StatusStory {
  id: number;
  userName: string;
  avatar: string;
  color: string;
  count: number;
  viewedCount: number;
  stories: { type: "text" | "image"; content: string; bg?: string }[];
}
