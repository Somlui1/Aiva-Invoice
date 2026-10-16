#!/usr/bin/env bash
# Loop Pi until the task is verified complete.
#   Done = VERIFY_CMD exits 0 (if set), otherwise the agent creates $DONE_FILE.
set -u
cd /workspace

TASK_FILE="${TASK_FILE:-/workspace/docs/plans/2026-10-15-ocr-bbox-autonomous-improvement-loop.md}"
DONE_FILE="${DONE_FILE:-/workspace/.pi_done}"
VERIFY_CMD="${VERIFY_CMD:-}"
MAX_ITER="${MAX_ITER:-8}"          # Max 8 rounds matching the plan
SLEEP_BETWEEN="${SLEEP_BETWEEN:-3}"
PI_MODEL="${PI_MODEL:-}"
LOG_DIR="/workspace/.pi_logs"; mkdir -p "$LOG_DIR"

[ -f "$TASK_FILE" ] || { echo "Task file not found: $TASK_FILE"; exit 2; }
rm -f "$DONE_FILE"

is_done() {
  if [ -n "$VERIFY_CMD" ]; then
    bash -c "$VERIFY_CMD" > "$LOG_DIR/verify.log" 2>&1
    return $?
  fi
  [ -f "$DONE_FILE" ]
}

FIRST_PROMPT="Read $TASK_FILE and execute the task strictly and autonomously.
Rules:
- Follow all instructions, rules, whitelist boundaries, and inspection protocols in $TASK_FILE.
- Single-flow execution: do NOT fan out parallel coding subagents.
- Do not ask questions. Make reasonable decisions yourself based on $TASK_FILE.
- Strictly adhere to safe permissions (Paperless API is READ-ONLY, do not alter tags).
- Never weaken existing test assertions in unit tests.
- Verify each round with pytest and visual overlay inspections as instructed in $TASK_FILE.
- Only when all stopping conditions are reached, write a summary into $DONE_FILE."

MODEL_ARG=""
[ -n "$PI_MODEL" ] && MODEL_ARG="-m $PI_MODEL"

i=0
while true; do
  i=$((i+1))
  echo "=================== ITERATION $i  $(date '+%F %T') ==================="

  if [ "$i" -eq 1 ]; then
    pi $MODEL_ARG -p --approve "$FIRST_PROMPT" 2>&1 | tee "$LOG_DIR/iter_$i.log"
  else
    EXTRA=""
    [ -n "$VERIFY_CMD" ] && EXTRA="Verification command ($VERIFY_CMD) failed. Last output:
$(tail -n 60 "$LOG_DIR/verify.log" 2>/dev/null)"
    pi $MODEL_ARG -c -p --approve "The task is NOT complete yet. Continue from where you left off, fix remaining problems, re-verify according to $TASK_FILE. $EXTRA
When truly done according to all criteria in $TASK_FILE, write a summary to $DONE_FILE." 2>&1 | tee "$LOG_DIR/iter_$i.log"
  fi

  if is_done; then
    echo ">>> TASK COMPLETE after $i iteration(s)"; exit 0
  fi
  if [ "$MAX_ITER" -ne 0 ] && [ "$i" -ge "$MAX_ITER" ]; then
    echo ">>> Reached MAX_ITER=$MAX_ITER without completion"; exit 1
  fi
  sleep "$SLEEP_BETWEEN"
done
