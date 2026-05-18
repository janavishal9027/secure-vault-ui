#!/usr/bin/env bash
#
# Deploy the Secure Vault UI to one of the k3s clusters running inside an LXD
# container on the VPS.
#
# Architecture:
#   1. Render manifests locally (on the Bitbucket runner) with sed, so we
#      don't depend on envsubst being on the remote host AND we get full
#      visibility into the rendered YAML in the pipeline log.
#   2. scp the rendered manifests + the real deploy script (deploy-remote.sh)
#      to the VPS.
#   3. ssh and run deploy-remote.sh as a regular file. The SSH session is
#      short — it returns as soon as bash starts the script — so a flaky
#      network path (Bitbucket runner ↔ VPS) cannot kill a long-lived
#      heredoc mid-stream.
#
# All the actual deploy logic (k3s wait, apply, verify, routing test) lives
# in ci/deploy-remote.sh. That file is also runnable by hand on the VPS for
# debugging — same exact behavior, no pipeline needed:
#
#     cd /root/<cluster>/manifests && \
#       env APP_NAME=secure-vault-ui ... LXD_CONTAINER=<cluster> bash deploy-remote.sh
#
# Required environment variables (set per environment in Bitbucket
# Deployment variables):
#   VPS_USER, VPS_HOST, REMOTE_DIR, LXD_CONTAINER, KUBE_NAMESPACE,
#   APP_NAME, IMAGE_REPO, IMAGE_TAG, INGRESS_HOST, LXD_BRIDGE_IP
# Optional:
#   REPLICAS  (default 1)

set -euo pipefail

: "${VPS_USER:?}"
: "${VPS_HOST:?}"
: "${REMOTE_DIR:?}"
: "${LXD_CONTAINER:?}"
: "${KUBE_NAMESPACE:?}"
: "${APP_NAME:?}"
: "${IMAGE_REPO:?}"
: "${IMAGE_TAG:?}"
: "${INGRESS_HOST:?}"
: "${LXD_BRIDGE_IP:?}"
REPLICAS="${REPLICAS:-1}"

REMOTE_TARGET="${VPS_USER}@${VPS_HOST}"

# ServerAliveInterval keeps the (now short) SSH session alive across the few
# kilobytes we transfer; ConnectTimeout fails fast on a dead VPS.
SSH_OPTS=(
  -o StrictHostKeyChecking=no
  -o BatchMode=yes
  -o ConnectTimeout=15
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=10
)

# ---------------------------------------------------------------------------
# 1. Render manifests locally with sed.
#
# We use `|` as the sed delimiter so values containing `/` (e.g. image repos
# like "kittuvittu/secure-vault-ui") don't need escaping. Each substitution
# is its own `-e` clause so changes to one variable can't accidentally
# clobber another.
# ---------------------------------------------------------------------------
echo "==> Rendering manifests locally"
mkdir -p rendered
render_file() {
  local in="$1" out="$2"
  sed \
    -e "s|\${APP_NAME}|${APP_NAME}|g" \
    -e "s|\${KUBE_NAMESPACE}|${KUBE_NAMESPACE}|g" \
    -e "s|\${IMAGE_REPO}|${IMAGE_REPO}|g" \
    -e "s|\${IMAGE_TAG}|${IMAGE_TAG}|g" \
    -e "s|\${INGRESS_HOST}|${INGRESS_HOST}|g" \
    -e "s|\${REPLICAS}|${REPLICAS}|g" \
    "$in" > "$out"
}
render_file deployment.yml rendered/deployment.yml
render_file service.yml    rendered/service.yml
render_file ingress.yml    rendered/ingress.yml

# nginx location snippet — separate sed pass since LXD_BRIDGE_IP isn't used by
# the k8s manifests, and conf files don't need any of the k8s-specific vars.
echo "==> Rendering nginx location snippet"
sed -e "s|\${LXD_BRIDGE_IP}|${LXD_BRIDGE_IP}|g" \
    ci/nginx/ui.location.conf > rendered/ui.location.conf

echo "=== Rendered manifests ==="
for f in rendered/*.yml; do
  echo "--- $f ---"
  cat "$f"
done
echo "--- rendered/ui.location.conf ---"
cat rendered/ui.location.conf

# ---------------------------------------------------------------------------
# 2. Ship rendered manifests + the remote script to the VPS.
# ---------------------------------------------------------------------------
echo "==> Preparing remote staging dir ${REMOTE_DIR} on ${VPS_HOST}"
ssh "${SSH_OPTS[@]}" "$REMOTE_TARGET" "mkdir -p '${REMOTE_DIR}'"

echo "==> Shipping manifests + deploy-remote.sh to ${VPS_HOST}"
scp "${SSH_OPTS[@]}" \
    rendered/deployment.yml \
    rendered/service.yml \
    rendered/ingress.yml \
    rendered/ui.location.conf \
    ci/deploy-remote.sh \
    "${REMOTE_TARGET}:${REMOTE_DIR}/"

# ---------------------------------------------------------------------------
# 3. Execute the remote script.
#
# Pass env vars via `env VAR=val ...` so the remote bash sees them; quote
# every value to survive whitespace/special chars. The remote bash takes
# the script path as a positional arg — no stdin piping, so SSH's stdin
# can close immediately.
# ---------------------------------------------------------------------------
echo "==> Executing deploy-remote.sh on ${VPS_HOST}"
ssh "${SSH_OPTS[@]}" "$REMOTE_TARGET" \
    "env \
      APP_NAME='${APP_NAME}' \
      KUBE_NAMESPACE='${KUBE_NAMESPACE}' \
      IMAGE_REPO='${IMAGE_REPO}' \
      IMAGE_TAG='${IMAGE_TAG}' \
      INGRESS_HOST='${INGRESS_HOST}' \
      REPLICAS='${REPLICAS}' \
      REMOTE_DIR='${REMOTE_DIR}' \
      LXD_CONTAINER='${LXD_CONTAINER}' \
      LXD_BRIDGE_IP='${LXD_BRIDGE_IP}' \
      bash '${REMOTE_DIR}/deploy-remote.sh'"
