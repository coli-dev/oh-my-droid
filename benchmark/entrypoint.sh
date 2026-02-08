#!/bin/bash
set -e

echo "=== SWE-bench Evaluation Environment ==="
echo "Run Mode: ${RUN_MODE:-vanilla}"
echo "Droid version: $(droid --version 2>/dev/null || echo 'not installed')"

# Configure Droid if auth token is provided
if [ -n "$ANTHROPIC_AUTH_TOKEN" ]; then
    echo "Anthropic auth token configured"
    export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_AUTH_TOKEN"
else
    echo "WARNING: ANTHROPIC_AUTH_TOKEN not set"
fi

# Configure custom base URL if provided
if [ -n "$ANTHROPIC_BASE_URL" ]; then
    echo "Using custom Anthropic base URL: $ANTHROPIC_BASE_URL"
    export ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL"
fi

# Install OMD if in omd mode
if [ "$RUN_MODE" = "omd" ]; then
    echo "Installing oh-my-droid for enhanced mode..."

    # Check if OMD source is mounted
    if [ -d "/workspace/omd-source" ]; then
        echo "Installing OMD from mounted source..."
        cd /workspace/omd-source && npm install && npm link
    else
        echo "Installing OMD from npm..."
        npm install -g oh-my-droid
    fi

    # Initialize OMD configuration
    mkdir -p ~/.droid

    echo "OMD installation complete"
fi

# Execute the command passed to the container
exec "$@"
