import type { Message, BaseMessage } from '../types/index';
import { generateMessageId } from './messageUtils';
import { Dispatch, SetStateAction } from 'react';
import { browser } from 'wxt/browser';

// Send message to background script
export const sendToBackground = (
  messagesForAI: BaseMessage[],
  model: string,
  //callId: string
) => {
  const port = browser.runtime.connect({ name: "chat" });
  port.postMessage({
    messages: messagesForAI,
    model: model,
    action: 'chat',
    //callId
  });
  return port;
};

// Handle port messages and disconnection
export const setupPortListeners = (
  port: Browser.runtime.Port,
  setLastMessage: Dispatch<SetStateAction<Message | null>>,
  setLoading: (() => void),
) => {
  // Track if onComplete has been called
  const onCompleteCalled = { current: false };

  const handleComplete = () => {
    if (onCompleteCalled.current) return;
    onCompleteCalled.current = true;
    setLoading();
  };

  // Handle incoming messages from background
  port.onMessage.addListener((chunk: any) => {
    if (chunk.stopped) return;

    if (chunk.error) {
      handleComplete();
      return;
    }

    const delta = chunk.choices?.[0]?.delta?.content || "";
    const finishReason = chunk.choices?.[0]?.finish_reason;
    
    if (delta) {
      setLastMessage((prev: Message | null) => {
        if (!prev) {
          return {
            id: generateMessageId(),
            role: 'assistant',
            content: delta,
          };
        }

        return {
          ...prev,
          content: (prev.content) + delta
        };
      });
    }
    if (finishReason) {
      handleComplete();
    }
  });

  // Handle port disconnection
  port.onDisconnect.addListener(() => {
    handleComplete();
  });
};

// Stop generation function
export const stopGeneration = (
  port: Browser.runtime.Port | null,
  stopLoading: (() => void)
) => {
  if (port) {
    try {
      stopLoading();
      port.postMessage({ action: "stop" });
      port.disconnect();
    } catch (e) {
      // Ignore error
    }
  }
};
