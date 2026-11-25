import type { Register } from 'claude-code'

// Standing rule: cheaper models only with NO quality loss.
// This mod covers handing PIECES of work to a lighter subagent inside a task.
// The model-picker skill covers the other half: which model a whole thread or
// scheduled task runs on. The two don't overlap.

const SECTION_ID = 'lighter-model-handoff:guidance'

const GUIDANCE = `# Handing simple work to lighter models

Standing request from the person you work for: when it saves usage with no loss in quality, hand self-contained pieces of work to a lighter model through the Agent tool's \`model\` option ("sonnet" or "haiku"). This counts as them asking for subagents for that purpose. Quality always comes first; savings second.

Facts to weigh:
- A subagent starts cold. It re-reads whatever it needs, and its report then lands in your context. Handing off pays only when the piece would take many tool calls or a lot of reading on your side and the brief you write is short, such as sweeping many files, collecting facts from long pages or logs, mechanical edits across many places, or reformatting data.
- A small job is cheaper done yourself. A single read, search or edit is not worth a subagent.
- Haiku fits simple, low-stakes work where the result can't differ: lookups, listing, counting, renames, format conversion. Sonnet fits routine work it does as well as Opus: following a clear recipe, standard code changes with a known shape, summarizing for your own use.
- Keep for yourself anything where quality could suffer: judgment calls, plans, final wording anyone will read, creative or public-facing work, tricky debugging, security, and anything that failed on a lighter model.
- Write the brief so the subagent can't guess wrong: the goal, the exact files or sources, what to return, and any rule that matters. You stay responsible for the result: check it before you use it, and redo the piece yourself if it falls short.
- If you're already running on a lighter model, only hand down to a lighter one still (Sonnet to Haiku).
- Don't announce routine hand-offs; just do them. The model-picker skill, which recommends the model for a whole thread or scheduled task, is separate and still applies.`

const LIGHT = /haiku/i
const MID = /sonnet/i

let handoffs = { sonnet: 0, haiku: 0 }

export const register: Register = on => {
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    // Only the main thread delegates; subagents and Haiku itself have nowhere lighter to go.
    if (!e.tools.includes('Agent') || LIGHT.test(e.model)) return composed
    const text = MID.test(e.model)
      ? GUIDANCE + '\n- You are on Sonnet now, so the only hand-off left is to Haiku.'
      : GUIDANCE
    return { sections: [...composed.sections.filter(s => s.id !== SECTION_ID), { id: SECTION_ID, text, scope: 'session' }] }
  })

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && (e.model === 'sonnet' || e.model === 'haiku')) handoffs[e.model] += 1
    return ran
  })

  on('session.start', ($, e, next) => {
    handoffs = { sonnet: 0, haiku: 0 }
    $.command.register({ name: 'handoffs', description: 'Show how many tasks were handed to Sonnet or Haiku this session' })
    return next(e)
  })

  on('command.run', { command: 'handoffs' }, () => {
    const total = handoffs.sonnet + handoffs.haiku
    return {
      text: total === 0
        ? 'No work handed to lighter models yet this session.'
        : `Handed to lighter models this session: ${handoffs.sonnet} to Sonnet, ${handoffs.haiku} to Haiku.`,
    }
  })
}
