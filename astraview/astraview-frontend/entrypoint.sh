#!/bin/sh
set -e

BACKEND_TARGET="${BACKEND_URL:-http://astraview-backend:8080}"
sed -i "s|__BACKEND_URL__|$BACKEND_TARGET|g" /etc/nginx/conf.d/default.conf

# Extract DNS resolver from /etc/resolv.conf
DNS_RESOLVER=$(awk 'BEGIN{ORS=" "} $1=="nameserver" {print $2}' /etc/resolv.conf 2>/dev/null || true)
if [ -z "$DNS_RESOLVER" ]; then
    DNS_RESOLVER="127.0.0.11 8.8.8.8"
fi
sed -i "s|__DNS_RESOLVER__|$DNS_RESOLVER|g" /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
