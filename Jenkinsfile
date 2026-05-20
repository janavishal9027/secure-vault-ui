// Build pipeline for the Secure Vault UI.
//
// Jenkins ONLY builds + pushes the image and reports IMAGE_TAG / IMAGE_DIGEST.
// Deployment is NOT done here — env-specific config (REMOTE_DIR, LXD_*,
// INGRESS_HOST, etc.) is managed by Helm. To roll out a build, edit the
// Helm image-versions file for the target env with the tag + digest this
// job prints, then commit.
//
// Builds ONE image per push, pushes ONE tag (the commit SHA), captures ONE
// digest. The digest pins the image immutably so a re-tag on Docker Hub
// can't silently change what runs in cluster.
//
// ---------------------------------------------------------------------------
// Jenkins setup:
//   Credentials (Manage Jenkins > Credentials):
//     dockerhub-kittuvittu   Username/password — Docker Hub user "kittuvittu"
//                            + a push access token as the password.
//   Agent requirements:
//     - docker CLI on PATH for the `jenkins` user (add jenkins to the
//       `docker` group, then restart Jenkins).
// ---------------------------------------------------------------------------

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    DOCKER_USER = 'kittuvittu'
    IMAGE_REPO  = 'kittuvittu/secure-vault-ui'
    // Image tag = the full commit SHA, matching the backend pipelines.
    IMAGE_TAG   = "${env.GIT_COMMIT}"
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

    stage('Build & push image') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-kittuvittu',
          usernameVariable: 'DH_USER',
          passwordVariable: 'DH_PASS'
        )]) {
          script {
            sh '''
              set -eu
              echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

              # Build args here populate OCI image labels for traceability.
              # NOTE: CRA inlines REACT_APP_* at build time — if your envs
              # need different API URLs, pass --build-arg per env or make the
              # UI resolve URLs from window.location so one image is env-
              # agnostic.
              docker build \
                --build-arg GIT_COMMIT="$IMAGE_TAG" \
                --build-arg BUILD_NUMBER="$BUILD_NUMBER" \
                --build-arg BUILD_DATE="$BUILD_DATE" \
                -t "${IMAGE_REPO}:${IMAGE_TAG}" \
                .

              docker push "${IMAGE_REPO}:${IMAGE_TAG}" | tee push.log
            '''

            // Extract the pushed digest from `docker push` output. Same awk
            // as the digital-banking pipeline — pulls the sha256:... token.
            env.IMAGE_DIGEST = sh(
              returnStdout: true,
              script: "awk '/digest: sha256:/{print \$3; exit}' push.log"
            ).trim()

            if (!env.IMAGE_DIGEST) {
              sh 'cat push.log >&2'
              error 'Failed to extract image digest from docker push output'
            }
          }
        }
      }
    }

    stage('Report image') {
      steps {
        echo """
================================================================
 IMAGE_REPO    : ${env.IMAGE_REPO}
 IMAGE_TAG     : ${env.IMAGE_TAG}
 IMAGE_DIGEST  : ${env.IMAGE_DIGEST}
 BRANCH        : ${env.BRANCH_NAME ?: env.GIT_BRANCH}
================================================================

To deploy, set the tag + digest in the Helm image-versions file for
the target env (e.g. image-versions/secure-vault-ui-<env>_image.yaml):

  microservices:
    ui:
      image:
        tag: ${env.IMAGE_TAG}
        digest: ${env.IMAGE_DIGEST}

Both fields are required: the digest pins the image immutably so a
re-tag on Docker Hub can't silently change what runs in cluster.
Then commit + push so Helm picks it up.
================================================================
"""
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'push.log', allowEmptyArchive: true
      sh 'docker logout || true'
      cleanWs()
    }
  }
}
