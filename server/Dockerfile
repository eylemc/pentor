FROM projectdiscovery/nuclei:v3.11.0 AS nuclei

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=nuclei /usr/local/bin/nuclei /usr/local/bin/nuclei
COPY index.mjs ./index.mjs
COPY data-security.mjs ./data-security.mjs
COPY rls-security.mjs ./rls-security.mjs
COPY client-source-security.mjs ./client-source-security.mjs
COPY start.sh ./start.sh
ENV NODE_ENV=production
RUN chmod 0755 /app/start.sh && mkdir -p /home/node/nuclei-templates /app/data && chown -R node:node /home/node /app
USER node
EXPOSE 3000
CMD ["/app/start.sh"]
