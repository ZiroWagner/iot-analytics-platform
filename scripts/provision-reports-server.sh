#!/bin/sh
# Provision the reports-server container with nginx config + static files
# Usage: ./scripts/provision-reports-server.sh

set -e

CONTAINER="perf_reports"
SRC="infra/reports-server"
NGINX_HTML="/usr/share/nginx/html"

echo "Provisioning $CONTAINER..."

# Wait until container is accepting connections
for i in $(seq 1 10); do
  if docker exec "$CONTAINER" nginx -t 2>/dev/null; then
    break
  fi
  echo "Waiting for $CONTAINER to be ready (attempt $i)..."
  sleep 1
done

docker cp "$SRC/nginx.conf" "$CONTAINER:/etc/nginx/conf.d/default.conf"
docker cp "$SRC/index.html" "$CONTAINER:$NGINX_HTML/"
docker cp "$SRC/print.html" "$CONTAINER:$NGINX_HTML/"
docker cp "$SRC/preview.html" "$CONTAINER:$NGINX_HTML/"
docker cp "$SRC/style.css" "$CONTAINER:$NGINX_HTML/"

docker exec "$CONTAINER" nginx -s reload

echo "Provisioning complete."
