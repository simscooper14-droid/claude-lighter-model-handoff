import { expect, test } from 'claude-code/testing'

const base = { id: 'intro', text: 'base', scope: 'shared' as const }

test('adds guidance on Opus with the Agent tool, skips Haiku and subagents', async ($, on) => {
  on('prompt.compose', () => ({ sections: [base] }))
  const ids = async (model: string, tools: string[]) =>
    (await $.prompt.compose({ model, promptModel: model, tools, surfaces: [], outputStyle: null, traits: [] })).sections.map(s => s.id)

  expect(await ids('claude-opus-5-5', ['Agent', 'Bash'])).toEqual(['intro', 'lighter-model-handoff:guidance'])
  expect(await ids('claude-sonnet-5-5', ['Agent'])).toEqual(['intro', 'lighter-model-handoff:guidance'])
  expect(await ids('claude-haiku-5-5', ['Agent'])).toEqual(['intro'])
  expect(await ids('claude-opus-5-5', ['Bash'])).toEqual(['intro'])
})

test('/handoffs counts lighter-model agents', async ($, on) => {
  on('command.register', () => ({ value: { command: 'handoffs' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Agent', description: 'x', prompt: 'y', model: 'haiku' })
  await $.tool.call({ tool: 'Agent', description: 'x', prompt: 'y' })
  const out = await $.command.run({ command: 'handoffs', args: '' } as unknown as Parameters<typeof $.command.run>[0])
  expect(out.text).toContain('0 to Sonnet, 1 to Haiku')
})
