# syntax=docker/dockerfile:1

# Stage 1: serve with nginx
FROM nginx:alpine

# The build happens in the GitHub Action runner for better caching/performance
# We just need to copy the resulting dist folder
COPY artifacts/gusto-pos/dist/public /usr/share/nginx/html

# Simple SPA routing for history API fallback + API proxying
COPY artifacts/gusto-pos/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
