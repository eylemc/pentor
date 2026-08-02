FROM node:22-alpine
ARG SQLMAP_REF=master
RUN apk add --no-cache ca-certificates git nmap python3 \
  && git clone --depth 1 --branch "$SQLMAP_REF" https://github.com/sqlmapproject/sqlmap.git /opt/sqlmap \
  && rm -rf /opt/sqlmap/.git /var/cache/apk/*
WORKDIR /app
COPY tool-scanner.mjs ./tool-scanner.mjs
ENV NODE_ENV=production PORT=3100
USER node
EXPOSE 3100
CMD ["node", "/app/tool-scanner.mjs"]
