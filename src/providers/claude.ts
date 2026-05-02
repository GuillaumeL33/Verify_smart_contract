import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider } from './base'

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic
  readonly name = 'claude'
  readonly model: string

  constructor(model: string, apiKey?: string) {
    this.model = model
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY })
  }

  async complete(system: string, user: string, contractCode?: string): Promise<string> {
    // System prompt is stable per agent — cache it.
    const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
      {
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' }
      }
    ]

    // Contract code is the same across all 4 agents for a given audit run.
    // Caching it avoids re-tokenising the same large source on each call.
    const userBlocks: Anthropic.Messages.ContentBlockParam[] = contractCode
      ? [
          {
            type: 'text',
            text: `## Smart contract source code\n\n\`\`\`solidity\n${contractCode}\n\`\`\``,
            cache_control: { type: 'ephemeral' }
          } as Anthropic.Messages.TextBlockParam,
          { type: 'text', text: user }
        ]
      : [{ type: 'text', text: user }]

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemBlocks,
      messages: [{ role: 'user', content: userBlocks }]
    })

    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected content block type from Claude')
    return block.text
  }
}
