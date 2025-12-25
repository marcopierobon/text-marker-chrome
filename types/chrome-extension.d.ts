// Type augmentations for Chrome Extension APIs

export interface ChromeMessage {
  action: string;
  [key: string]: unknown;
}

export interface ChromeMessageResponse {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

export type MessageSender = chrome.runtime.MessageSender;
export type SendResponse = (response?: ChromeMessageResponse) => void;
