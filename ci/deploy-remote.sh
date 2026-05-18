#!/usr/bin/env bash
#
# Runs ON THE LXD HOST (the VPS), invoked by ci/deploy.sh via SSH after that
# script has scp'd both this file and the already-rendered manifests over.
#
# This is a regular file on disk (not piped via heredoc through ssh stdin),
# which is the whole point of the split:
#   - The SSH session can close cleanly as soon as bash starts; no fragile
#     long-lived stdin to be killed by NAT/firewall idle timeouts.
#   - You can `bash /root/<cluster>/manifests/deploy-remote.sh` by hand on
#     the host for debugging — same exact behavior, no pipeline needed.
#   - All output is teed to deploy.log on the host, so post-mortems are
#     possible even if the pipeline log itself gets truncated.
#
# Required environment (passed via `ssh ... env VAR=val bash this-file`):
#   APP_NAME, KUBE_NAMESPACE, IMAGE_REPO, IMAGE_TAG, INGRESS_HOST, REPLICAS,
#   REMOTE_DIR, LXD_CONTAINER, LXD_BRIDGE_IP
#
# Host nginx vhost is terraform-managed at /etc/nginx/sites-available/<cluster>
# and `include`s /etc/nginx/snippets/<cluster>/*.location.conf. This script
# drops ${APP_NAME}.location.conf into that snippet directory and reloads nginx.

set -euxo pipefail

: "${APP_NAME:?}"
: "${KUBE_NAMESPACE:?}"
: "${IMAGE_REPO:?}"
: "${IMAGE_TAG:?}"
: "${INGRESS_HOST:?}"
: "${REMOTE_DIR:?}"
: "${LXD_CONTAINER:?}"
: "${LXD_BRIDGE_IP:?}"
REPLICAS="${REPLICAS:-1}"

# Snap binaries (lxc / lxd) live in /snap/bin, which is only added to PATH
# by /etc/profile.d/apt.sh for *login* shells. Non-interactive SSH skips
# that, so without this we'd hit `lxc: command not found`.
export PATH="/snap/bin:$PATH"

# Tee everything to a log file on the host. Even if the SSH session dies,
# this script keeps running (started by ssh as a normal process), and the
# log captures the full record. Redirect both stdout and stderr.
mkdir -p "$REMOTE_DIR"
exec > >(tee -a "$REMOTE_DIR/deploy.log") 2>&1

echo "=== deploy-remote.sh starting at $(date -Iseconds) ==="
echo "    APP_NAME=$APP_NAME  LXD_CONTAINER=$LXD_CONTAINER  KUBE_NAMESPACE=$KUBE_NAMESPACE"
echo "    IMAGE=$IMAGE_REPO:$IMAGE_TAG  INGRESS_HOST=$INGRESS_HOST  REPLICAS=$REPLICAS"

cd "$REMOTE_DIR"

echo "=== Rendered manifests on host ==="
for f in deployment.yml service.yml ingress.yml; do
  echo "--- $f ---"
  cat "$f"
done

# `lxc exec` / `lxc file push` occasionally return `websocket: close 1006
# (abnormal closure)` when the lxd daemon's transport hiccups — typically a
# brief burst of memory/IO pressure on the host or container. The work the
# inner command was doing is usually idempotent (kubectl apply, mkdir -p,
# file push), so retrying a few times bridges past the flake without losing
# the deploy. Real failures (bad manifest, missing resource) just retry the
# same number of times then fail — small cost in exchange for resilience.
lxc_retry() {
  local attempt=1
  local max_attempts=4
  local rc=0
  while [ "$attempt" -le "$max_attempts" ]; do
    if "$@"; then
      return 0
    fi
    rc=$?
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "  lxc operation failed after ${max_attempts} attempts (rc=${rc}): $*" >&2
      return $rc
    fi
    echo "  lxc operation failed (attempt ${attempt}/${max_attempts}, rc=${rc}); retrying in 2s..." >&2
    sleep 2
    attempt=$((attempt + 1))
  done
}

# Wait for k3s to be ready inside the container before invoking kubectl.
# Cloud-init can take ~60-90s the first time. Each iteration prints
# progress so the log shows liveness.
echo "=== Waiting for k3s to be ready in $LXD_CONTAINER (max 5 min) ==="
ATTEMPT=0
MAX_ATTEMPTS=60   # 60 * 5s = 5 minutes
until lxc exec "$LXD_CONTAINER" -- /usr/local/bin/k3s kubectl get nodes >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "ERROR: k3s never came up in $LXD_CONTAINER after 5 minutes." >&2
    lxc_retry lxc exec "$LXD_CONTAINER" -- tail -n 80 /var/log/cloud-init-output.log >&2 || true
    exit 1
  fi
  echo "  attempt ${ATTEMPT}/${MAX_ATTEMPTS}: k3s API not yet responding, retrying in 5s..."
  sleep 5
done
echo "k3s is ready in $LXD_CONTAINER"

# Wrapper so every kubectl call below uses the absolute path AND benefits
# from lxc_retry. Defining it as a function keeps the call sites readable.
kubectl_in_container() {
  lxc_retry lxc exec "$LXD_CONTAINER" -- /usr/local/bin/k3s kubectl "$@"
}

echo "=== Cluster context ==="
kubectl_in_container get nodes -o wide
kubectl_in_container get ingressclass

echo "=== Namespace ==="
kubectl_in_container get namespace "$KUBE_NAMESPACE" >/dev/null 2>&1 \
  || kubectl_in_container create namespace "$KUBE_NAMESPACE"
kubectl_in_container get namespace "$KUBE_NAMESPACE"

echo "=== Pushing manifests into $LXD_CONTAINER ==="
lxc_retry lxc exec "$LXD_CONTAINER" -- mkdir -p /tmp/manifests
for f in deployment.yml service.yml ingress.yml; do
  lxc_retry lxc file push "$f" "${LXD_CONTAINER}/tmp/manifests/${f}"
  if ! lxc_retry lxc exec "$LXD_CONTAINER" -- test -s "/tmp/manifests/${f}"; then
    echo "ERROR: /tmp/manifests/${f} missing or empty inside container after push" >&2
    exit 1
  fi
done
lxc_retry lxc exec "$LXD_CONTAINER" -- ls -la /tmp/manifests/

echo "=== Applying manifests to namespace '$KUBE_NAMESPACE' ==="
for f in deployment.yml service.yml ingress.yml; do
  echo "--- applying $f ---"
  kubectl_in_container -n "$KUBE_NAMESPACE" apply -f "/tmp/manifests/$f" -o name
done

# Verify each expected resource is queryable by name in the target namespace.
# Catches "apply silently went elsewhere" — exactly the failure mode that
# previously let a green pipeline ship an empty cluster.
echo "=== Post-apply existence check ==="
verify_resource() {
  local kind="$1" name="$2"
  if ! kubectl_in_container -n "$KUBE_NAMESPACE" get "$kind" "$name" >/dev/null 2>&1; then
    echo "ERROR: $kind/$name not found in namespace $KUBE_NAMESPACE after apply" >&2
    kubectl_in_container -n "$KUBE_NAMESPACE" get all,ingress -o wide >&2 || true
    exit 1
  fi
  kubectl_in_container -n "$KUBE_NAMESPACE" get "$kind" "$name"
}
verify_resource deployment "${APP_NAME}-deployment"
verify_resource service    "${APP_NAME}-service"
verify_resource ingress    "${APP_NAME}-ingress"

# Stricter than `rollout status` — fails on image-pull errors, scheduling
# failures, crashloops.
echo "=== Waiting for deployment to be Available (max 3 min) ==="
kubectl_in_container -n "$KUBE_NAMESPACE" \
  wait "deployment/${APP_NAME}-deployment" \
  --for=condition=Available --timeout=180s

echo "=== Service endpoints ==="
endpoints=$(kubectl_in_container -n "$KUBE_NAMESPACE" \
  get "endpoints/${APP_NAME}-service" -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || true)
if [[ -z "$endpoints" ]]; then
  echo "ERROR: service ${APP_NAME}-service has no endpoints — pod not Ready or selector mismatch" >&2
  kubectl_in_container -n "$KUBE_NAMESPACE" describe "endpoints/${APP_NAME}-service" >&2 || true
  kubectl_in_container -n "$KUBE_NAMESPACE" get pods -o wide --show-labels >&2 || true
  exit 1
fi
echo "endpoints: $endpoints"

echo "=== Routing test (Traefik picked up the ingress?) ==="
status=$(lxc_retry lxc exec "$LXD_CONTAINER" -- curl -sf -o /dev/null -w '%{http_code}' \
  --max-time 10 -H "Host: $INGRESS_HOST" http://127.0.0.1/ || true)
case "$status" in
  200|301|302|304)
    echo "OK: Traefik returned HTTP $status for Host: $INGRESS_HOST"
    ;;
  404)
    echo "ERROR: Traefik returned 404 — ingress not registered for $INGRESS_HOST" >&2
    kubectl_in_container -n "$KUBE_NAMESPACE" describe "ingress/${APP_NAME}-ingress" >&2 || true
    kubectl_in_container -n kube-system logs -l app.kubernetes.io/name=traefik --tail=40 >&2 || true
    exit 1
    ;;
  *)
    echo "WARN: Traefik returned HTTP '$status' for Host: $INGRESS_HOST (continuing)" >&2
    ;;
esac

# ---------------------------------------------------------------------------
# Install host nginx location snippet.
#
# Terraform's vhost template includes /etc/nginx/snippets/<cluster>/*.location.conf,
# so all we do here is drop our snippet into that directory and reload nginx.
# `nginx -t` validates the WHOLE config — if our snippet (or any other) is
# broken, the test fails and we exit before reload, leaving the previously-
# working config in place.
# ---------------------------------------------------------------------------
echo "=== Installing nginx location snippet for $APP_NAME ==="
SNIPPET_DIR="/etc/nginx/snippets/${KUBE_NAMESPACE}"
SNIPPET_DST="${SNIPPET_DIR}/${APP_NAME}.location.conf"
mkdir -p "$SNIPPET_DIR"
cp "$REMOTE_DIR/ui.location.conf" "$SNIPPET_DST"
echo "Installed snippet at $SNIPPET_DST"

echo "=== nginx -t (config validation) ==="
nginx -t

echo "=== Reloading nginx ==="
systemctl reload nginx
echo "nginx reloaded"

echo "=== Final namespace state ==="
kubectl_in_container -n "$KUBE_NAMESPACE" get all,ingress -o wide
echo "=== Deploy complete: $APP_NAME -> $LXD_CONTAINER/$KUBE_NAMESPACE @ $IMAGE_REPO:$IMAGE_TAG ==="
echo "=== deploy-remote.sh finished at $(date -Iseconds) ==="
