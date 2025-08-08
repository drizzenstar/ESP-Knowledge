# Microsoft Teams App Manifest

This folder contains the Microsoft Teams app manifest and required assets for integrating the Knowledge Base application with Teams.

## Files Required

1. **manifest.json** - The Teams app manifest configuration
2. **color.png** - 192x192 pixel full-color icon
3. **outline.png** - 32x32 pixel white outline icon on transparent background

## Setup Instructions

### 1. Update manifest.json
Replace the following placeholders in `manifest.json`:
- `REPLACE_WITH_YOUR_APP_ID` - Your Azure app registration ID
- `your-ngrok-url.ngrok.io` - Your actual ngrok URL

### 2. Add Icon Files
Create or add the following icon files:

**color.png** (192x192 pixels):
- Full-color version of your app icon
- Should represent your knowledge base/organization
- PNG format with transparency support

**outline.png** (32x32 pixels):  
- White outline version on transparent background
- Simple, recognizable icon that works at small sizes
- Used in Teams UI elements

### 3. Create App Package
```bash
# Navigate to teams-manifest folder
cd teams-manifest

# Create zip package (ensure no parent folder)
zip -r knowledge-base-teams-app.zip manifest.json color.png outline.png

# Verify package contents
unzip -l knowledge-base-teams-app.zip
```

### 4. Upload to Teams
1. Open Microsoft Teams
2. Go to **Apps** in left sidebar
3. Click **Manage your apps**
4. Click **Upload an app** → **Upload a custom app**
5. Select the `knowledge-base-teams-app.zip` file
6. Follow installation prompts

## Features Enabled

The Teams integration provides:

### Bot Commands
- `/search [query]` - Search knowledge base
- `/categories` - Browse categories
- `/recent` - Show recent articles
- `/help` - Show available commands

### Personal Tab
- Direct access to knowledge base interface
- Personal view of accessible content
- Search and browse functionality

### Configurable Tab
- Add knowledge base tab to team channels
- Shared team access to relevant content
- Customizable category filtering

### Messaging Extension
- Search knowledge base from compose box
- Share articles directly in conversations
- Quick access to information during chats

## Troubleshooting

**Manifest Validation Errors:**
- Ensure all URLs use HTTPS
- Verify app ID matches Azure registration
- Check icon file dimensions and formats

**Installation Issues:**
- Confirm bot endpoint is accessible
- Verify permissions in Azure app registration
- Check ngrok tunnel is active and stable

**Functionality Problems:**
- Test bot endpoint manually
- Review console logs for errors
- Verify environment variables are set correctly

## Production Notes

For production deployment:
1. Replace ngrok URLs with your production domain
2. Update all HTTPS endpoints
3. Use production Azure app registration
4. Test thoroughly before organization-wide deployment
5. Consider app store submission for broader distribution