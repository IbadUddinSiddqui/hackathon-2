# Graph Looping Strategy — Bazaar Nest Remediation
### For Freebuff/Codebuff running on DeepSeek V4 Flash

## What this is

`TASK_GRAPH.md` (companion file) turns every weakness from the production-readiness audit into a graph of small, independently verifiable nodes with explicit dependencies. This file is the protocol — it tells the agent *how* to work through that graph reliably, one node at a time, without losing track of state across a long or interrupted run.

## Why a graph instead of one giant instruction

A flash-tier model asked to "fix everything in the audit" in one shot will do some real work, then start silently skipping steps, forgetting earlier context, or reporting success it didn't actually check. The fix isn't a smarter prompt — it's smaller units of work, a hard verification gate on each one, and state that lives on disk instead of in the model's memory. That's what the graph is for.

## The loop protocol — follow exactly, every single iteration

1. **Re-read `TASK_GRAPH.md` from disk right now.** Do not rely on your memory of it from earlier in this session — it may have changed, and your memory of a long session is not trustworthy.
2. Find every node with `status: todo` whose `depends_on` list is empty, or where every listed dependency has `status: done`.
3. **Skip any node with `human_required: true`.** Do not attempt these. List them in your end-of-turn report instead.
4. From the remaining eligible nodes, pick **exactly one** — the first one listed, top to bottom. Do not batch multiple nodes together.
5. Read only what that node's `touches` list names, plus anything named in its `verify` field. Do not re-read the whole repository "just to be safe" — that burns context you need for the actual edit.
6. Make the smallest change that satisfies the node's `done_when` description. **Do not fix, refactor, or "improve" anything outside that node's stated scope**, even if you spot something else wrong along the way — instead, append a new `todo` node describing it at the bottom of `TASK_GRAPH.md` and leave it for a future iteration.
7. Run the exact command(s) in that node's `verify` field. Not a similar command — that one.
8. **If verify passes:** set the node's `status` to `done`, commit with message `[<node-id>] <one line summary>`, then stop this turn and report in one paragraph what changed and why it's correct.
9. **If verify fails:** attempt a fix and retry, up to 2 retries total. If it's still failing after that, set `status: blocked`, write the exact failure output into that node's `notes` field, and stop. Do not move on to another node in the same turn. Do not mark it done anyway to make progress look better.
10. **Never mark a node `done` without having actually run its `verify` command in this turn and watched it pass.** Reporting success without checking is the single worst failure mode of this whole workflow — treat it as a hard rule, not a suggestion.

## Running it continuously

Once you trust how a single node executes, you can tell Codebuff to keep going:

> "Follow GRAPH_LOOP_STRATEGY.md. Work through TASK_GRAPH.md one node at a time until every non-human-required node in Phase 1 is either `done` or `blocked`, then stop and summarize what's left."

Because all state lives in `TASK_GRAPH.md` — not in the model's context — you can also just close the session and start a fresh one later with the same instruction. It picks up exactly where the file says it left off. This matters more on a flash-tier model with a smaller effective context budget than it would on a larger model.

## Model-specific notes for DeepSeek V4 Flash

- Confirm how your specific Codebuff install selects DeepSeek V4 Flash (model selection in Codebuff is generally via OpenRouter — check `codebuff --help` or your account/settings, since exact flag or config names can shift between versions; I don't have a verified current syntax to hand you and would rather you confirm it than follow a guessed command).
- This protocol works with any backend model, but steps 5, 6, and 10 matter more on a flash-tier model specifically: small context per step, narrow scope per step, and a hard proof-of-verification requirement are what keep a fast/cheap model reliable over a long run.
- If a node fails verification even after 2 retries, treat that as a signal the node itself is scoped too large — split it into two smaller nodes in `TASK_GRAPH.md` rather than continuing to retry the same one.

## Human-required nodes

Some nodes cannot be completed by any coding agent at all — a business decision, an external account approval, a legal review, confirming something in a third-party dashboard. These are tagged `human_required: true`. The agent must never attempt them, never mark them `done`, and must always surface the full current list of them at the end of any session so nothing sits silently blocked.
