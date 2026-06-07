# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# CRA inlines REACT_APP_* env vars at build time, so per-environment URLs
# are baked into the bundle. These default to EMPTY on purpose: with no value,
# src/components/utils/url.js falls back to same-origin (relative) URLs in a
# production build, so the bundle works on any host where the backends are
# path-routed behind the same domain (/authentication, /roles, /notes via the
# ingress) — no per-environment host baking needed.
# To target cross-origin backends instead, pass absolute URLs via --build-arg.
ARG REACT_APP_AUTH_BASE_URL=
ARG REACT_APP_ROLE_BASE_URL=
ARG REACT_APP_NOTE_BASE_URL=
ARG REACT_APP_AI_BASE_URL=
ENV REACT_APP_AUTH_BASE_URL=$REACT_APP_AUTH_BASE_URL \
    REACT_APP_ROLE_BASE_URL=$REACT_APP_ROLE_BASE_URL \
    REACT_APP_NOTE_BASE_URL=$REACT_APP_NOTE_BASE_URL \
    REACT_APP_AI_BASE_URL=$REACT_APP_AI_BASE_URL

ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV GENERATE_SOURCEMAP=false
# CI=false keeps CRA's non-interactive behavior but does NOT promote
# ESLint warnings to build errors. Real lint issues should be caught
# locally (the dev server prints them) or by a separate lint step in
# the pipeline, not by silently killing prod builds.
ENV CI=false

ARG BUILD_CMD="npm run build"
RUN ${BUILD_CMD}

# Normalize build output to /app/out (support both build/ from CRA and
# dist/ from Vite, in case the build tool ever changes).
RUN mkdir -p /app/out && \
    if [ -d build ]; then cp -r build/* /app/out/; \
    elif [ -d dist ]; then cp -r dist/* /app/out/; \
    else echo "ERROR: no build output found (expected build/ or dist/)" >&2 && exit 1; fi

# Stage 2: serve with nginx
FROM nginx:stable-alpine AS prod

# Build-arg labels for traceability. Set by the pipeline:
#   GIT_COMMIT     full commit SHA (image tag matches)
#   BUILD_NUMBER   Bitbucket auto-incrementing pipeline build number
#   BUILD_DATE     ISO-8601 timestamp at build time
ARG GIT_COMMIT=unknown
ARG BUILD_NUMBER=unknown
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.source="https://bitbucket.org/<workspace>/secure-vault-ui"
LABEL bitbucket.build.number="${BUILD_NUMBER}"
# Convenience: docker inspect <image> --format '{{ index .Config.Labels "version" }}'
LABEL version="${BUILD_NUMBER}"

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/out /usr/share/nginx/html

# SPA fallback so /dashboard/create-note (or any client-side route)
# doesn't 404 from nginx on a hard refresh.
COPY ci/nginx/ui-container-default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
