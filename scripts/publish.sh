#!/usr/bin/env bash
# =====================================================================
# Publish the AgentVault Move package to Sui mainnet.
#
# Prereqs:
#   1. `sui` CLI installed: https://docs.sui.io/guides/developer/getting-started/sui-install
#   2. Active wallet with SUI for gas: `sui client active-address`
#   3. Active env set to mainnet: `sui client switch --env mainnet`
#
# Usage:
#   ./scripts/publish.sh
#
# After publishing, copy the "PackageID" from the output into
# NEXT_PUBLIC_AGENT_PACKAGE_ID inside web/.env.local.
# =====================================================================

set -euo pipefail

cd "$(dirname "$0")/../move"

echo "==> Building Move package..."
sui move build

echo "==> Publishing to $(sui client active-env)..."
sui client publish --gas-budget 200000000 .
