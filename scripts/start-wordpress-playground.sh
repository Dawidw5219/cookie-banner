#!/bin/sh
set -eu
project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"
exec bun x --yes @wp-playground/cli@3.1.62 server --port=9400 --workers=2 \
  --mount-dir "$project_root/plugin" /wordpress/wp-content/plugins/cookie-banner-wp \
  --mount-dir "$project_root/plugin/tests/mu-plugins" /wordpress/wp-content/mu-plugins \
  --blueprint "$project_root/plugin/tests/blueprint.json" --define-bool WP_CACHE true
