// Build + deploy pipeline for the Secure Vault UI.
//
// This Jenkins instance runs ON THE VPS itself, alongside the LXD/k3s host,
// so there is no SSH hop — unlike the Bitbucket pipelines, which run on
// off-host cloud runners and must ssh/scp in via ci/deploy.sh.
//
// Steps:
//   1. Build the CRA bundle into an nginx image (Dockerfile is multi-stage).
//   2. Push the image to Docker Hub as kittuvittu/secure-vault-ui:<commitSHA>.
//   3. Render the k8s manifests + nginx snippet locally and run
//      ci/deploy-remote.sh directly (it does the lxc/kubectl/nginx work).
//
// The pipeline is environment-aware via the DEPLOY_ENV parameter. Each
// environment's cluster details come from Jenkins folder/global env vars —
// see the "Jenkins setup" notes below.
//
// ---------------------------------------------------------------------------
// Jenkins setup — credentials (Manage Jenkins > Credentials):
//   dockerhub-kittuvittu   Username/password — Docker Hub user "kittuvittu"
//                          + a push access token as the password.
//   (No SSH credential needed — deploy runs locally on the VPS.)
//
// The user the Jenkins process runs as must be able to, without a password
// prompt: run `lxc exec` / `lxc file push`, write to /etc/nginx/snippets/,
// run `nginx -t`, and `systemctl reload nginx`.
//
// Jenkins setup — per-environment variables. Define one set per DEPLOY_ENV
// value, scoped to the job/folder (e.g. via the EnvInject plugin, a folder
// "Environment variables" section, or "Manage Jenkins > System"). Suffix each
// with the env name, e.g. LXD_CONTAINER_DEV_A, LXD_CONTAINER_PROD:
//   REMOTE_DIR_<ENV>           Staging dir on the host (e.g. /root/secure-vault-dev-a/manifests)
//   LXD_CONTAINER_<ENV>        LXD container name (the k3s cluster)
//   KUBE_NAMESPACE_<ENV>       k8s namespace inside the container
//   INGRESS_HOST_<ENV>         Public hostname routed by host nginx
//   LXD_BRIDGE_IP_<ENV>        IP of the LXD container on lxdbr0
//   REPLICAS_<ENV>             Replica count (optional, defaults to 1)
//   REACT_APP_AUTH_BASE_URL_<ENV>   Baked into the bundle at build time
//   REACT_APP_ROLE_BASE_URL_<ENV>
//   REACT_APP_NOTE_BASE_URL_<ENV>
//   REACT_APP_AI_BASE_URL_<ENV>
// ---------------------------------------------------------------------------

pipeline {
  agent any

  parameters {
    choice(
      name: 'DEPLOY_ENV',
      choices: ['dev-a', 'dev-b', 'test', 'stage', 'prod'],
      description: 'Target environment. Build-only (no deploy) if SKIP_DEPLOY is checked.'
    )
    booleanParam(
      name: 'SKIP_DEPLOY',
      defaultValue: false,
      description: 'Build + push the image but do not run ci/deploy.sh.'
    )
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    DOCKER_USER = 'kittuvittu'
    IMAGE_REPO  = 'kittuvittu/secure-vault-ui'
    APP_NAME    = 'secure-vault-ui'
    // Image tag = the full commit SHA, matching the Bitbucket pipelines.
    IMAGE_TAG   = "${env.GIT_COMMIT}"
    // Uppercased env suffix used to look up the per-environment variables,
    // e.g. dev-a -> DEV_A so VPS_HOST_DEV_A resolves.
    ENV_SUFFIX  = "${params.DEPLOY_ENV.toUpperCase().replace('-', '_')}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.BUILD_DATE = sh(returnStdout: true, script: 'date -u +%Y-%m-%dT%H:%M:%SZ').trim()
        }
      }
    }

    stage('Resolve environment') {
      steps {
        script {
          // Pull the per-environment values from the suffixed Jenkins env
          // vars into the unsuffixed names ci/deploy.sh expects.
          def need = { String name ->
            def v = env."${name}_${env.ENV_SUFFIX}"
            if (!v?.trim()) {
              error "Missing Jenkins env var ${name}_${env.ENV_SUFFIX} for DEPLOY_ENV=${params.DEPLOY_ENV}"
            }
            return v.trim()
          }
          env.REMOTE_DIR    = need('REMOTE_DIR')
          env.LXD_CONTAINER = need('LXD_CONTAINER')
          env.KUBE_NAMESPACE = need('KUBE_NAMESPACE')
          env.INGRESS_HOST  = need('INGRESS_HOST')
          env.LXD_BRIDGE_IP = need('LXD_BRIDGE_IP')
          env.REPLICAS      = (env."REPLICAS_${env.ENV_SUFFIX}"?.trim()) ?: '1'

          // REACT_APP_* URLs are inlined into the bundle at docker build
          // time. Fall back to the Dockerfile's localhost defaults if a
          // given env doesn't override them.
          env.REACT_APP_AUTH_BASE_URL = (env."REACT_APP_AUTH_BASE_URL_${env.ENV_SUFFIX}"?.trim()) ?: 'http://localhost:3211'
          env.REACT_APP_ROLE_BASE_URL = (env."REACT_APP_ROLE_BASE_URL_${env.ENV_SUFFIX}"?.trim()) ?: 'http://localhost:3212'
          env.REACT_APP_NOTE_BASE_URL = (env."REACT_APP_NOTE_BASE_URL_${env.ENV_SUFFIX}"?.trim()) ?: 'http://localhost:3213'
          env.REACT_APP_AI_BASE_URL   = (env."REACT_APP_AI_BASE_URL_${env.ENV_SUFFIX}"?.trim()) ?: 'http://localhost:8001'

          echo "Target: ${params.DEPLOY_ENV}  cluster=${env.LXD_CONTAINER}  ns=${env.KUBE_NAMESPACE}  host=${env.INGRESS_HOST}"
        }
      }
    }

    stage('Build & push image') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-kittuvittu',
          usernameVariable: 'DH_USER',
          passwordVariable: 'DH_PASS'
        )]) {
          sh '''
            set -eu
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

            docker build \
              --build-arg GIT_COMMIT="$IMAGE_TAG" \
              --build-arg BUILD_NUMBER="$BUILD_NUMBER" \
              --build-arg BUILD_DATE="$BUILD_DATE" \
              --build-arg REACT_APP_AUTH_BASE_URL="$REACT_APP_AUTH_BASE_URL" \
              --build-arg REACT_APP_ROLE_BASE_URL="$REACT_APP_ROLE_BASE_URL" \
              --build-arg REACT_APP_NOTE_BASE_URL="$REACT_APP_NOTE_BASE_URL" \
              --build-arg REACT_APP_AI_BASE_URL="$REACT_APP_AI_BASE_URL" \
              -t "${IMAGE_REPO}:${IMAGE_TAG}" \
              -t "${IMAGE_REPO}:latest" \
              .

            docker push "${IMAGE_REPO}:${IMAGE_TAG}"
            docker push "${IMAGE_REPO}:latest"
          '''
        }
      }
    }

    stage('Deploy') {
      when { expression { return !params.SKIP_DEPLOY } }
      steps {
        // Jenkins is on the VPS, so we skip ci/deploy.sh's ssh/scp layer:
        // render the manifests straight into REMOTE_DIR and run
        // ci/deploy-remote.sh in place. deploy-remote.sh cd's into
        // REMOTE_DIR and expects deployment.yml, service.yml, ingress.yml
        // and ui.location.conf to already be there.
        sh '''
          set -eu

          mkdir -p "$REMOTE_DIR"

          render_file() {
            sed \
              -e "s|\\${APP_NAME}|${APP_NAME}|g" \
              -e "s|\\${KUBE_NAMESPACE}|${KUBE_NAMESPACE}|g" \
              -e "s|\\${IMAGE_REPO}|${IMAGE_REPO}|g" \
              -e "s|\\${IMAGE_TAG}|${IMAGE_TAG}|g" \
              -e "s|\\${INGRESS_HOST}|${INGRESS_HOST}|g" \
              -e "s|\\${REPLICAS}|${REPLICAS}|g" \
              "$1" > "$2"
          }
          render_file deployment.yml "$REMOTE_DIR/deployment.yml"
          render_file service.yml    "$REMOTE_DIR/service.yml"
          render_file ingress.yml    "$REMOTE_DIR/ingress.yml"

          sed -e "s|\\${LXD_BRIDGE_IP}|${LXD_BRIDGE_IP}|g" \
              ci/nginx/ui.location.conf > "$REMOTE_DIR/ui.location.conf"

          cp ci/deploy-remote.sh "$REMOTE_DIR/deploy-remote.sh"
          chmod +x "$REMOTE_DIR/deploy-remote.sh"

          env \
            APP_NAME="$APP_NAME" \
            KUBE_NAMESPACE="$KUBE_NAMESPACE" \
            IMAGE_REPO="$IMAGE_REPO" \
            IMAGE_TAG="$IMAGE_TAG" \
            INGRESS_HOST="$INGRESS_HOST" \
            REPLICAS="$REPLICAS" \
            REMOTE_DIR="$REMOTE_DIR" \
            LXD_CONTAINER="$LXD_CONTAINER" \
            LXD_BRIDGE_IP="$LXD_BRIDGE_IP" \
            bash "$REMOTE_DIR/deploy-remote.sh"
        '''
      }
    }
  }

  post {
    success {
      echo "Deployed ${IMAGE_REPO}:${IMAGE_TAG} to ${params.DEPLOY_ENV}"
    }
    always {
      sh 'docker logout || true'
      cleanWs()
    }
  }
}
