#!/usr/bin/env bash
#
# One-shot host bootstrap: installs Docker Engine on the VPS host and grants
# the `jenkins` user access to it, so the Jenkinsfile's build stage can run
# `docker build` / `docker push`.
#
# Run ONCE, on the VPS host (not inside the LXD container), as root or sudo:
#
#     sudo bash ci/setup-docker-host.sh
#
# Idempotent — safe to re-run. Skips steps already done.

set -euo pipefail

JENKINS_USER="jenkins"

log() { echo "==> $*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run as root (sudo bash ci/setup-docker-host.sh)" >&2
  exit 1
fi

# --- 1. Install Docker Engine -------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  log "Docker already installed: $(docker --version)"
else
  log "Installing Docker Engine via get.docker.com"
  # Docker's official convenience script — detects the distro, adds the
  # apt/dnf repo, installs docker-ce, and creates the `docker` group.
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
  log "Installed: $(docker --version)"
fi

# --- 2. Ensure the docker daemon is running + enabled on boot -----------------
log "Enabling + starting the docker service"
systemctl enable --now docker
systemctl is-active --quiet docker || {
  echo "ERROR: docker service failed to start" >&2
  systemctl status docker --no-pager >&2 || true
  exit 1
}

# --- 3. Grant the jenkins user access to the docker socket --------------------
if ! id "$JENKINS_USER" >/dev/null 2>&1; then
  echo "ERROR: user '$JENKINS_USER' does not exist — is Jenkins installed on this host?" >&2
  exit 1
fi

if id -nG "$JENKINS_USER" | tr ' ' '\n' | grep -qx docker; then
  log "User '$JENKINS_USER' is already in the docker group"
else
  log "Adding '$JENKINS_USER' to the docker group"
  usermod -aG docker "$JENKINS_USER"
fi

# --- 4. Restart Jenkins so it picks up the new group membership ---------------
# A process only sees group changes after it re-spawns; restarting the
# service is the clean way to apply it.
if systemctl list-unit-files | grep -q '^jenkins\.service'; then
  log "Restarting Jenkins to apply group membership"
  systemctl restart jenkins
else
  echo "WARN: jenkins.service not found — restart Jenkins manually so the" >&2
  echo "      docker group membership takes effect." >&2
fi

# --- 5. Verify jenkins can actually reach the docker daemon -------------------
log "Verifying '$JENKINS_USER' can talk to the docker daemon"
if sudo -u "$JENKINS_USER" docker ps >/dev/null 2>&1; then
  log "SUCCESS: '$JENKINS_USER' can run docker. Build stage is good to go."
else
  echo "WARN: '$JENKINS_USER' still cannot run docker." >&2
  echo "      Groups for $JENKINS_USER: $(id -nG "$JENKINS_USER")" >&2
  echo "      If 'docker' is listed above, the running Jenkins process just" >&2
  echo "      hasn't been restarted yet — run: systemctl restart jenkins" >&2
  exit 1
fi
