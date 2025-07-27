
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  attachments?: { name: string; type: string }[];
}

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: 'html' | 'css' | 'javascript';
}

export interface Project {
  id:string;
  name: string;
  files: ProjectFile[];
  chatHistory: ChatMessage[];
  lastUpdated: string;
  isArchived?: boolean;
}

export interface AiSettings {
  // geminiApiKey is now handled via the process.env.API_KEY environment variable.
  ollamaApiUrl: string;
  coremlApiUrl: string;
}

export type AiProvider = 'gemini' | 'ollama' | 'coreml';