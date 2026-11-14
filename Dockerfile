FROM oven/bun:1-alpine AS builder

WORKDIR /app

ARG SITE_URL

COPY package.json bun.lock ./

ENV VITE_MDRIVE_WEB_SITE_URL=$SITE_URL

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM nginx:alpine AS runner

ARG VERSION
ARG BUILD_TIME

COPY ./nginx.conf /etc/nginx/nginx.conf
# Rendered to /etc/nginx/conf.d/default.conf at start-up (API_ORIGIN is substituted)
COPY ./docker/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

ENV NODE_ENV=production
ENV VUE_APP_VERSION=$VERSION
ENV VUE_APP_BUILD_TIME=$BUILD_TIME
# Origin of the MDrive API that /api and /media are proxied to (no trailing slash)
ENV API_ORIGIN=http://host.docker.internal:3004

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
