# Agent Instructions — DMS_Invoice_Auto_mathing

## Layout

- `engine/` — Python invoice-matching engine (`src/system_a`, PDF extraction, LLM
  payloads). Verify with `cd engine && make test` (`python -m pytest -q`, `PYTHONPATH=src`).
- `frontend/` — web UI.
- `<project>/docs/plans/` — design docs, plans, and the live task tracker
  (`engine/docs/plans/task.md` shows the current table format).

## Skills: one shared set, no copies

Skills live in **`<project>/.agent/skills/`** — the same folder Antigravity reads.
Pi cannot read `.agent/`, so `<project>/.pi/skills` is a directory junction into
`<project>/.agent/skills`; both agents load the identical bytes and drift is
impossible. The junction is gitignored. After a fresh clone, recreate it:

```bash
python .pi/link-skills.py          # both projects   (--check = report only)
```

13 process skills: brainstorming, writing-plans, executing-plans,
single-flow-task-execution, test-driven-development, systematic-debugging,
requesting-code-review, receiving-code-review, verification-before-completion,
finishing-a-development-branch, using-git-worktrees, using-superpowers,
writing-skills. Load the matching one with `read` before starting; edit skills in
`.agent/skills/` only.

## Tool translation (the skills speak Antigravity)

`.agent/` was written for Antigravity. When a skill names a legacy tool, use the
Pi equivalent — the workflow stays, only the tool changes:

| Skill says | Use |
|---|---|
| `view_file`, `view_file_outline`, `view_code_item` | `read` |
| `write_to_file` | `write` |
| `replace_file_content`, `multi_replace_file_content` | `edit` |
| `run_command`, `list_dir` | `bash` |
| `grep_search`, `find_by_name` | `grep` / `find` via `bash` |
| `browser_subagent` | delegate in an isolated step (`subagent`) |
| `read_url_content`, `search_web` | `fetch_content`, `web_search` |
| `TodoWrite`, `task_boundary` | `docs/plans/task.md` tracker rows; "task boundary" = one unit of work |
| `~/.gemini/skills` | `~/.pi/agent/skills` |

Where a skill says **Pi/Antigravity "does NOT support parallel coding subagents"**,
that is a **repo policy, not a platform limit**: Pi *can* run `subagent`, and this
repo chooses not to for implementation work.

## Execution policy: single flow

1. One active task at a time, in the current session.
2. No parallel `subagent` fanout for coding — delegate only if the operator
   explicitly asks, or for isolated browser/UI steps.
3. Two-stage review per task: spec compliance first, then code quality.
4. Update `<project>/docs/plans/task.md` at each state change (table rows only).

## Verification before completion

Run the relevant command, read its exit status and output, update the task
tracker, then report the evidence. Never claim a test passes without running it
in this session.
