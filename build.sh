#!/bin/bash

# Chrome Extension Build Script
# Automates the extension release process with version bumping and packaging

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
show_help() {
    echo -e "${BLUE}Chrome Extension Build Script${NC}"
    echo ""
    echo "Usage: ./build.sh -t <major|minor|patch> [-c] [-h]"
    echo ""
    echo "Options:"
    echo "  -t, --type <major|minor|patch>  Increment version number (required)"
    echo "  -c, --commit                    Create git commit after version bump"
    echo "  -h, --help                      Display this help message"
    echo ""
    echo "Examples:"
    echo "  ./build.sh -t patch              # Bump patch version (1.0.2 -> 1.0.3)"
    echo "  ./build.sh --type minor          # Bump minor version (1.0.2 -> 1.1.0)"
    echo "  ./build.sh -t major              # Bump major version (1.0.2 -> 2.0.0)"
    echo "  ./build.sh -t patch -c           # Bump version and create commit"
    echo ""
}

# Function to increment version
increment_version() {
    local version=$1
    local type=$2
    
    IFS='.' read -ra VERSION_PARTS <<< "$version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}Error: Invalid version type. Use major, minor, or patch.${NC}"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to update manifest version
update_manifest_version() {
    local new_version=$1
    
    # Use sed to update the version in manifest.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" manifest.json
    else
        # Linux
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" manifest.json
    fi
    
    echo -e "${GREEN}Updated manifest.json version to $new_version${NC}"
}

# Function to create distribution directory
create_dist() {
    local version=$1
    
    echo -e "${BLUE}Creating distribution package...${NC}"
    
    # Clean and create dist directory
    rm -rf dist
    mkdir -p dist
    
    # Copy production files
    echo "Copying extension files..."
    
    # Core extension files
    cp manifest.json dist/
    cp background.js dist/
    cp content.js dist/
    cp options.html dist/
    cp options.js dist/
    cp utils.js dist/
    cp Readability.js dist/
    
    # Copy icons directory
    cp -r icons dist/
    
    echo -e "${GREEN}Distribution files copied to dist/${NC}"
}

# Function to create zip file
create_zip() {
    local version=$1
    
    # Extract extension name from manifest.json and convert to lowercase with dashes
    local extension_name=$(grep '"name"' manifest.json | sed 's/.*"name": "\([^"]*\)".*/\1/' | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
    local zip_name="$extension_name-v$version.zip"
    
    echo -e "${BLUE}Creating zip package: $zip_name${NC}"
    
    # Remove existing zip if it exists
    rm -f "$zip_name"
    
    # Create zip from dist contents (not the dist folder itself)
    cd dist
    zip -r "../$zip_name" .
    cd ..
    
    echo -e "${GREEN}Package created: $zip_name${NC}"
    
    # Show file size
    local size=$(ls -lh "$zip_name" | awk '{print $5}')
    echo -e "${BLUE}Package size: $size${NC}"
}

# Function to create git commit
create_commit() {
    local version=$1
    
    if command -v git &> /dev/null && [ -d .git ]; then
        echo -e "${BLUE}Creating git commit...${NC}"
        git add manifest.json
        git commit -m "Bump version to $version"
        echo -e "${GREEN}Git commit created for version $version${NC}"
    else
        echo -e "${YELLOW}Warning: Not a git repository or git not available, skipping commit${NC}"
    fi
}

# Parse command line arguments
TYPE=""
COMMIT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TYPE="$2"
            shift 2
            ;;
        -c|--commit)
            COMMIT=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$TYPE" ]; then
    echo -e "${RED}Error: -t/--type parameter is required${NC}"
    show_help
    exit 1
fi

if [[ "$TYPE" != "major" && "$TYPE" != "minor" && "$TYPE" != "patch" ]]; then
    echo -e "${RED}Error: -t/--type must be major, minor, or patch${NC}"
    exit 1
fi

# Check if manifest.json exists
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}Error: manifest.json not found in current directory${NC}"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo -e "${BLUE}Current version: $CURRENT_VERSION${NC}"

# Calculate new version
NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$TYPE")
echo -e "${BLUE}New version: $NEW_VERSION${NC}"

# Update manifest.json
update_manifest_version "$NEW_VERSION"

# Create git commit if requested
if [ "$COMMIT" = true ]; then
    create_commit "$NEW_VERSION"
fi

# Create distribution
create_dist "$NEW_VERSION"

# Create zip package
create_zip "$NEW_VERSION"

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${BLUE}Version: $CURRENT_VERSION → $NEW_VERSION${NC}"

# Get the same extension name for final output
EXTENSION_NAME=$(grep '"name"' manifest.json | sed 's/.*"name": "\([^"]*\)".*/\1/' | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
echo -e "${BLUE}Package: $EXTENSION_NAME-v$NEW_VERSION.zip${NC}"
echo ""
echo "To load the extension in Chrome:"
echo "1. Open chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Extract $EXTENSION_NAME-v$NEW_VERSION.zip"
echo "4. Click 'Load unpacked' and select the extracted folder"