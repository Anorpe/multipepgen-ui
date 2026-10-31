# Stage 1: Build the React application
FROM docker.io/library/node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM docker.io/library/nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# The nginx entrypoint renders templates into /etc/nginx/conf.d/ at startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

# APIs reached over the internal container network
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    GENERATION_API_UPSTREAM=http://multipepgen-api-container:9000 \
    PREDICTION_API_UPSTREAM=http://ampclass-api-container:5000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
