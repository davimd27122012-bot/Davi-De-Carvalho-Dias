export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
export type ThemeColor = 'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber';
export type TimeFormat = '24h' | '12h';
export type DetailLevel = 'concise' | 'balanced' | 'detailed';
export type WorkspaceMode = 'personal' | 'business';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: 'free' | 'pro';
  provider: 'google' | 'email' | 'guest';
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 encoded string
  previewUrl?: string;
  size?: number;
  type?: 'image' | 'video' | 'pdf' | 'audio' | 'document' | 'other';
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface ImageGenState {
  id: string;
  prompt: string;
  status: 'generating' | 'completed' | 'error';
  progress: number;
  stepDescription: string;
  imageUrl?: string;
  error?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  isStreaming?: boolean;
  audioUrl?: string;
  error?: string;
  groundingSources?: GroundingSource[];
  imageGen?: ImageGenState;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  personaId: string;
  projectId?: string;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  color?: string;
  files: Attachment[];
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  createdAt: number;
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export interface BugReport {
  id: string;
  category: 'ui' | 'voice' | 'response' | 'speed' | 'other';
  description: string;
  createdAt: number;
  userEmail?: string;
}

export interface AppSettings {
  workspaceMode: WorkspaceMode; // 'personal' | 'business'
  voice: VoiceName;
  autoPlayVoice: boolean;
  speechSpeed: number;
  themeColor: ThemeColor;
  timeFormat: TimeFormat;
  detailLevel: DetailLevel;
  customMemories: string[];
  autoMemories: string[];
  autoMemoryEnabled: boolean;
  webSearchEnabled: boolean;
  notificationsEnabled: boolean;
}
