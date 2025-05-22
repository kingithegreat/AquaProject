// Declare module for services/claudeService.ts
declare module '@/services/claudeService' {
  export interface ChatMessage {
    type: 'user' | 'ai';
    message: string;
    timestamp?: number;
  }

  export interface ChatHistory {
    userId: string | null;
    messages: ChatMessage[];
  }

  export const suggestedTopics: string[];
  export function isClaudeApiKeyValid(): Promise<boolean>;
  export function isGeminiApiKeyValid(): Promise<boolean>; // Backward compatibility
  export function initializeClaudeClient(): any;
  export function initializeGeminiModel(): any; // Backward compatibility
  export function getChatSession(userId?: string | null): Promise<any>;
  export function sendMessageToClaude(userMessage: string, userId?: string | null): Promise<string>;
  export function sendMessageToGemini(userMessage: string, userId?: string | null): Promise<string>; // Backward compatibility
  export function resetChatSession(): void;
  export function saveChatMessage(userId: string | null, type: 'user' | 'ai', message: string): Promise<void>;
  export function loadChatHistory(userId: string | null): Promise<ChatHistory | null>;
  export function clearChatHistory(userId: string | null): Promise<void>;
}
