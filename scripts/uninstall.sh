#!/bin/bash
# Oh-My-Droid-Sisyphus Uninstaller
# Completely removes all Sisyphus-installed files and configurations

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Oh-My-Droid-Sisyphus Uninstaller${NC}"
echo ""

# Droid config directory (always ~/.factory)
DROID_CONFIG_DIR="$HOME/.factory"

echo "This will remove ALL Sisyphus components from:"
echo "  $DROID_CONFIG_DIR"
echo ""
echo "Components to be removed:"
echo "  - Agents (oracle, librarian, explore, etc.)"
echo "  - Commands (sisyphus, ultrawork, plan, etc.)"
echo "  - Skills (ultrawork, git-master, frontend-ui-ux)"
echo "  - Hooks (keyword-detector, silent-auto-update, stop-continuation)"
echo "  - Version and state files"
echo "  - Hook configurations from settings.json"
echo ""
if [ -t 0 ]; then
    read -p "Continue? (y/N) " -n 1 -r
    echo
else
    # Try reading from terminal if script is piped
    if [ -c /dev/tty ]; then
        echo -n "Continue? (y/N) " >&2
        read -n 1 -r < /dev/tty
        echo
    else
        echo "Non-interactive mode detected or terminal not available. Uninstallation cancelled."
        exit 1
    fi
fi

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Remove agents
echo -e "${BLUE}Removing agents...${NC}"
rm -f "$DROID_CONFIG_DIR/agents/oracle.md"
rm -f "$DROID_CONFIG_DIR/agents/librarian.md"
rm -f "$DROID_CONFIG_DIR/agents/explore.md"
rm -f "$DROID_CONFIG_DIR/agents/frontend-engineer.md"
rm -f "$DROID_CONFIG_DIR/agents/document-writer.md"
rm -f "$DROID_CONFIG_DIR/agents/multimodal-looker.md"
rm -f "$DROID_CONFIG_DIR/agents/momus.md"
rm -f "$DROID_CONFIG_DIR/agents/metis.md"
rm -f "$DROID_CONFIG_DIR/agents/sisyphus-junior.md"
rm -f "$DROID_CONFIG_DIR/agents/prometheus.md"

# Remove commands
echo -e "${BLUE}Removing commands...${NC}"
rm -f "$DROID_CONFIG_DIR/commands/sisyphus.md"
rm -f "$DROID_CONFIG_DIR/commands/ultrawork.md"
rm -f "$DROID_CONFIG_DIR/commands/deepsearch.md"
rm -f "$DROID_CONFIG_DIR/commands/analyze.md"
rm -f "$DROID_CONFIG_DIR/commands/plan.md"
rm -f "$DROID_CONFIG_DIR/commands/review.md"
rm -f "$DROID_CONFIG_DIR/commands/prometheus.md"
rm -f "$DROID_CONFIG_DIR/commands/orchestrator.md"
rm -f "$DROID_CONFIG_DIR/commands/update.md"

# Remove skills
echo -e "${BLUE}Removing skills...${NC}"
rm -rf "$DROID_CONFIG_DIR/skills/ultrawork"
rm -rf "$DROID_CONFIG_DIR/skills/git-master"
rm -rf "$DROID_CONFIG_DIR/skills/frontend-ui-ux"

# Remove hooks
echo -e "${BLUE}Removing hooks...${NC}"
rm -f "$DROID_CONFIG_DIR/hooks/keyword-detector.sh"
rm -f "$DROID_CONFIG_DIR/hooks/stop-continuation.sh"
rm -f "$DROID_CONFIG_DIR/hooks/silent-auto-update.sh"

# Remove version, state, and config files
echo -e "${BLUE}Removing state and config files...${NC}"
rm -f "$DROID_CONFIG_DIR/.omd-version.json"
rm -f "$DROID_CONFIG_DIR/.omd-silent-update.json"
rm -f "$DROID_CONFIG_DIR/.omd-update.log"
rm -f "$DROID_CONFIG_DIR/.omd-config.json"

# Remove hook configurations from settings.json
SETTINGS_FILE="$DROID_CONFIG_DIR/settings.json"
if [ -f "$SETTINGS_FILE" ] && command -v jq &> /dev/null; then
    echo -e "${BLUE}Removing hook configurations from settings.json...${NC}"

    # Create a backup
    cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak"

    # Remove Sisyphus-specific hooks from settings.json
    # This removes hooks that reference sisyphus hook scripts
    TEMP_SETTINGS=$(mktemp)

    # Use jq to filter out Sisyphus hooks
    jq '
      # Remove Sisyphus hooks from UserPromptSubmit
      if .hooks.UserPromptSubmit then
        .hooks.UserPromptSubmit |= map(
          if .hooks then
            .hooks |= map(select(.command | (contains("keyword-detector.sh") or contains("silent-auto-update.sh") or contains("stop-continuation.sh")) | not))
          else .
          end
        ) | .hooks.UserPromptSubmit |= map(select(.hooks | length > 0))
      else . end |

      # Remove Sisyphus hooks from Stop
      if .hooks.Stop then
        .hooks.Stop |= map(
          if .hooks then
            .hooks |= map(select(.command | (contains("keyword-detector.sh") or contains("silent-auto-update.sh") or contains("stop-continuation.sh")) | not))
          else .
          end
        ) | .hooks.Stop |= map(select(.hooks | length > 0))
      else . end |

      # Clean up empty hooks sections
      if .hooks.UserPromptSubmit == [] then del(.hooks.UserPromptSubmit) else . end |
      if .hooks.Stop == [] then del(.hooks.Stop) else . end |
      if .hooks == {} then del(.hooks) else . end
    ' "$SETTINGS_FILE" > "$TEMP_SETTINGS" 2>/dev/null

    if [ $? -eq 0 ] && [ -s "$TEMP_SETTINGS" ]; then
        mv "$TEMP_SETTINGS" "$SETTINGS_FILE"
        echo -e "${GREEN}✓ Removed Sisyphus hooks from settings.json${NC}"
        echo -e "${YELLOW}  Backup saved to: $SETTINGS_FILE.bak${NC}"
    else
        rm -f "$TEMP_SETTINGS"
        echo -e "${YELLOW}⚠ Could not modify settings.json automatically${NC}"
        echo "  Please manually remove Sisyphus hooks from the 'hooks' section"
    fi
else
    if [ -f "$SETTINGS_FILE" ]; then
        echo -e "${YELLOW}⚠ jq not installed - cannot auto-remove hooks from settings.json${NC}"
        echo "  Please manually edit $SETTINGS_FILE and remove the following hooks:"
        echo "    - keyword-detector.sh"
        echo "    - silent-auto-update.sh"
        echo "    - stop-continuation.sh"
    fi
fi

# Remove .omd directory if it exists (plans, notepads, drafts)
if [ -d "$DROID_CONFIG_DIR/../.omd" ] || [ -d ".omd" ]; then
    echo -e "${YELLOW}Note: .omd directory (plans/notepads) was not removed.${NC}"
    echo "  To remove project plans and notepads, run:"
    echo "    rm -rf .omd"
fi

echo ""
echo -e "${GREEN}Uninstallation complete!${NC}"
echo ""
echo -e "${YELLOW}Items NOT removed (manual cleanup if desired):${NC}"
echo "  - AGENTS.md: rm $DROID_CONFIG_DIR/AGENTS.md"
echo "  - settings.json backup: rm $DROID_CONFIG_DIR/settings.json.bak"
echo ""
echo "To verify complete removal, check:"
echo "  ls -la $DROID_CONFIG_DIR/"
