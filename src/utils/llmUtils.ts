import OpenAI from "openai"
import type { ClientOptions } from "openai"
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions"

/**
 * Creates a chat completion stream using the OpenAI SDK.
 * 
 * @param clientOptions - Configuration options for the OpenAI client (apiKey, baseURL, etc.)
 * @param chatOptions - Configuration options for the chat completion (model, messages, etc.)
 * @param signal - Optional AbortSignal for cancellation
 * @returns A promise that resolves to the chat completion stream
 */
export async function createChatStream(
  clientOptions: ClientOptions,
  chatOptions: Omit<ChatCompletionCreateParams, 'stream'>,
  signal?: AbortSignal
) {
  const client = new OpenAI({
    ...clientOptions,
    dangerouslyAllowBrowser: true
  })

  return await client.chat.completions.create({
    ...chatOptions,
    stream: true
  }, { signal })
}
