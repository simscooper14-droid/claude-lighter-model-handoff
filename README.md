# lighter-model-handoff

A Claude Code mod that adds one short section to the main thread's system prompt: when it saves usage with no loss in quality, Claude hands self-contained pieces of work (big file sweeps, fact gathering, mechanical edits, reformatting) to a Sonnet or Haiku subagent, then checks the result. Judgment, final wording, creative and tricky work stay on the main model. `/handoffs` shows how many hand-offs happened this session.

It complements the model-picker skill, which picks the model for a whole thread or scheduled task.

## Install

```
/plugin marketplace add simscooper14-droid/claude-lighter-model-handoff
/plugin install lighter-model-handoff@claude-lighter-model-handoff
```
