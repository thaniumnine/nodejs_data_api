FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

#TESTING -NOT PRODUCTION
RUN apk add --no-cache \
  postgresql-client \
  netcat-openbsd \
  bind-tools \
  ca-certificates \
  openssl

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3500
CMD ["node", "dist/main.js"]
# CMD ["tail -f /dev/null"]

# kubectl get pods
# kubectl exec -it podIdcopy paste -- bash
#kubectl logs podIdcopfromgetpods 