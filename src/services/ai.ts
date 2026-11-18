import { scriptedAnswer, type Block, type CopilotAnswer } from '@/data/copilot'

/**
 * AI service layer. The UI only talks to this module, so the mock can be swapped for a real
 * Azure OpenAI / AI Foundry backend (via an Azure Function proxy) without touching components.
 */
export interface AIChunk {
  blocks: Block[]
  sources: string[]
  done: boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const MODE = import.meta.env.VITE_AI_MODE ?? 'mock'

/* ---- Azure backend stub (enable with VITE_AI_MODE=azure) ---------------------------------
 * The Azure Function (POST /api/copilot) should call Azure OpenAI / Foundry Agent Service
 * with the user prompt + retrieved context (Azure AI Search, Fabric SQL endpoint) and stream
 * back server-sent events. Each event is JSON: { blocks: Block[], sources: string[], done: boolean }.
 *
 * async function* azureStream(prompt: string, signal?: AbortSignal): AsyncGenerator<AIChunk> {
 *   const res = await fetch(import.meta.env.VITE_AI_ENDPOINT, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ prompt }),
 *     signal,
 *   })
 *   const reader = res.body!.getReader()
 *   const decoder = new TextDecoder()
 *   let buf = ''
 *   for (;;) {
 *     const { value, done } = await reader.read()
 *     if (done) return
 *     buf += decoder.decode(value, { stream: true })
 *     const events = buf.split('\n\n'); buf = events.pop() ?? ''
 *     for (const e of events) yield JSON.parse(e.replace(/^data: /, '')) as AIChunk
 *   }
 * }
 * ------------------------------------------------------------------------------------------ */

async function* mockStream(prompt: string, signal?: AbortSignal): AsyncGenerator<AIChunk> {
  await sleep(600) // "thinking"
  const answer: CopilotAnswer = scriptedAnswer(prompt)
  const shown: Block[] = []
  for (const block of answer.blocks) {
    if (signal?.aborted) return
    if (block.type === 'text') {
      const words = block.text.split(/(\s+)/)
      let acc = ''
      const idx = shown.length
      shown.push({ type: 'text', text: '' })
      for (let i = 0; i < words.length; i++) {
        acc += words[i]
        if (i % 3 === 2 || i === words.length - 1) {
          shown[idx] = { type: 'text', text: acc }
          yield { blocks: [...shown], sources: [], done: false }
          await sleep(22)
          if (signal?.aborted) return
        }
      }
    } else {
      shown.push(block)
      yield { blocks: [...shown], sources: [], done: false }
      await sleep(250)
    }
  }
  yield { blocks: [...shown], sources: answer.sources, done: true }
}

export function askCopilot(prompt: string, signal?: AbortSignal): AsyncGenerator<AIChunk> {
  if (MODE === 'azure') {
    // Wire azureStream() from the stub above; fall back to the mock until configured.
    return mockStream(prompt, signal)
  }
  return mockStream(prompt, signal)
}

/** Types out text in a "reasoning log" style for agent traces. */
export async function* streamLines(lines: string[], delayMs = 420, signal?: AbortSignal): AsyncGenerator<string> {
  for (const l of lines) {
    if (signal?.aborted) return
    await sleep(delayMs + Math.random() * 250)
    yield l
  }
}
