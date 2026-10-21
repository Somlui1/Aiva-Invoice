# R4-3c A/B: same documents, same input, n=2 per arm, arms interleaved in time so any drift hits both.
#   PERCEPTION_INK_SNAP=1 -> boxes corrected against the page's own ink
#   PERCEPTION_INK_SNAP=0 -> the raw model boxes
set -u
DOCS=127,171,170,159,107,117
for run in 1 2; do
  for arm in 1 0; do
    name=$([ "$arm" = 1 ] && echo snap_on || echo snap_off)
    echo "=== $name run$run  $(date +%T)"
    PERCEPTION_INK_SNAP=$arm python scripts/run_single_pass.py --doc-ids $DOCS --workers 2 \
        --out-dir "bbox_testing/round_05/${name}/run${run}"
  done
done
echo "=== ALL DONE $(date +%T)"
