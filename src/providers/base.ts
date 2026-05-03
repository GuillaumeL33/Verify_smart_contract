/**
 * Minimal interface every LLM provider must implement.
 *
 * contractCode is passed separately so providers can apply prompt caching
 * on this large, stable input independently of the task-specific user prompt.
 */
export interface LLMProvider {
  complete(system: string, user: string, contractCode?: string): Promise<string>
  readonly name: string
  readonly model: string
}
