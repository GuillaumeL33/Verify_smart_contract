import type { AgentConfig } from '../types'
import type { LLMProvider } from './base'
import { ClaudeProvider } from './claude'
import { OpenAIProvider } from './openai'

export function createProvider(config: AgentConfig): LLMProvider {
  switch (config.provider) {
    case 'claude':
      return new ClaudeProvider(config.model, config.apiKey)
    case 'openai':
      return new OpenAIProvider(config.model, config.apiKey)
    default: {
      const exhaustive: never = config.provider
      throw new Error(`Unknown provider: ${exhaustive}`)
    }
  }
}
