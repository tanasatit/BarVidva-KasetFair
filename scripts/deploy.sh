#!/bin/bash
# Deployment script for Bar Vidva Kaset Fair 2026
# Usage: ./scripts/deploy.sh [backend|frontend|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        log_error "Fly CLI not installed. Install with: curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
    log_info "Fly CLI found: $(fly version)"
}

check_logged_in() {
    if ! fly auth whoami &> /dev/null; then
        log_error "Not logged in to Fly.io. Run: fly auth login"
        exit 1
    fi
    log_info "Logged in as: $(fly auth whoami)"
}

deploy_backend() {
    log_info "Deploying backend..."
    cd "$PROJECT_ROOT/backend"

    # Check if app exists, create if not
    if ! fly apps list | grep -q "barvidva-api"; then
        log_info "Creating backend app..."
        fly apps create barvidva-api --org personal
    fi

    # Check if postgres is attached
    if ! fly postgres list | grep -q "barvidva-db"; then
        log_warn "No PostgreSQL database found. Create one with:"
        log_warn "  fly postgres create --name barvidva-db --region sin"
        log_warn "  fly postgres attach barvidva-db -a barvidva-api"
        exit 1
    fi

    # Deploy
    fly deploy

    log_info "Backend deployed successfully!"
    log_info "URL: https://barvidva-api.fly.dev"
}

deploy_frontend() {
    log_info "Deploying frontend..."
    cd "$PROJECT_ROOT/frontend"

    # Check if app exists, create if not
    if ! fly apps list | grep -q "barvidva-web"; then
        log_info "Creating frontend app..."
        fly apps create barvidva-web --org personal
    fi

    # Deploy
    fly deploy

    log_info "Frontend deployed successfully!"
    log_info "URL: https://barvidva-web.fly.dev"
}

show_secrets_reminder() {
    echo ""
    log_warn "Remember to set secrets before first deploy:"
    echo ""
    echo "Backend secrets:"
    echo "  fly secrets set -a barvidva-api \\"
    echo "    STAFF_PASSWORD=your_staff_password \\"
    echo "    ADMIN_PASSWORD=your_admin_password \\"
    echo "    ORDER_EXPIRY_MINUTES=60 \\"
    echo "    EXPIRY_CHECK_INTERVAL_SECONDS=60"
    echo ""
    echo "Frontend secrets (for build args):"
    echo "  fly secrets set -a barvidva-web \\"
    echo "    VITE_PROMPTPAY_NUMBER=your_promptpay_number"
    echo ""
}

case "$1" in
    backend)
        check_fly_cli
        check_logged_in
        deploy_backend
        ;;
    frontend)
        check_fly_cli
        check_logged_in
        deploy_frontend
        ;;
    all)
        check_fly_cli
        check_logged_in
        deploy_backend
        deploy_frontend
        ;;
    secrets)
        show_secrets_reminder
        ;;
    *)
        echo "Usage: $0 [backend|frontend|all|secrets]"
        echo ""
        echo "Commands:"
        echo "  backend   - Deploy backend API to Fly.io"
        echo "  frontend  - Deploy frontend to Fly.io"
        echo "  all       - Deploy both backend and frontend"
        echo "  secrets   - Show required secrets to set"
        exit 1
        ;;
esac
