import OpenAI from 'openai'
import type { LLMProvider } from './base'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI
  readonly name = 'openai'
  readonly model: string

  constructor(model: string, apiKey?: string) {
    this.model = model
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY })
  }

  async complete(system: string, user: string, contractCode?: string): Promise<string> {
    const userContent = contractCode
      ? `## Smart contract source code\n\n\`\`\`solidity\n${contractCode}\n\`\`\`\n\n${user}`
      : user

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent }
      ]
    })

    return response.choices[0]?.message?.content ?? ''
  }
}
