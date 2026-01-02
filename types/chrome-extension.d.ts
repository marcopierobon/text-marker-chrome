// Type augmentations for Chrome Extension APIs

export interface ChromeMessage {
  action: string;
  payload?: Record<string, unknown>;
}

export interface ChromeMessageResponse {
  success?: boolean;
  error?: string;
  data?: Record<string, unknown>;
  configuration?: unknown;
  badgeCount?: number;
  [key: string]: unknown;
}

export type MessageSender = chrome.runtime.MessageSender;
export type SendResponse = (response?: ChromeMessageResponse) => void;
