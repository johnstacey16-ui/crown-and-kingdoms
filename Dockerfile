FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node index.html styles.css engine.js multiplayer.js persistence.js sw.js ./
COPY --chown=node:node js ./js
COPY --chown=node:node assets ./assets
COPY --chown=node:node server/transport.mjs server/app.mjs ./server/
USER node
EXPOSE 8787
CMD ["node", "server/app.mjs"]
