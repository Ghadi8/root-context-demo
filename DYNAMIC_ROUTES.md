# Dynamic ENS Routes

The ENS Root-Context AI now supports dynamic routing for direct access to specific ENS agents.

## Usage

### Direct URL Access
Navigate directly to any ENS name by using the URL pattern:
```
http://localhost:3000/[ENS_NAME]
```

### Examples
- `http://localhost:3000/vitalik.eth`
- `http://localhost:3000/example.eth`
- `http://localhost:3000/myagent.eth`

## Features

### Auto-Resolution
- When visiting a dynamic route, the ENS resolution process starts automatically
- No need to manually enter the ENS name or click resolve
- Visual indicators show the ENS name was loaded from the URL

### Enhanced Navigation
- Breadcrumb navigation shows: Home → [ENS Name]
- Page title updates to show the specific ENS agent
- "Go to Home" button replaces "Try Another ENS Name" when on dynamic routes

### Agent Greeting
- Agents automatically introduce themselves as "Hello! I am the agent of [ENS Name]"
- System prompt includes the ENS name context
- Welcome message appears immediately when agent is ready

### Shareable Links
- "Share Agent" button in chat interface copies direct URL
- Easy sharing of specific AI agents with others
- Persistent agent access through bookmarkable URLs

### SEO & Metadata
- Dynamic page titles: "ENS Agent: [name] | ENS Root-Context AI"
- Custom descriptions for each ENS agent
- Open Graph and Twitter card support for social sharing

## Technical Implementation

### File Structure
```
src/app/
├── [ensName]/
│   ├── page.tsx          # Dynamic route handler
│   └── layout.tsx        # Dynamic metadata generation
├── components/
│   └── ENSRootContextDemo.tsx  # Enhanced with auto-resolve
└── api/chat/route.ts     # Updated to include ENS name context
```

### URL Validation
- Basic validation ensures URLs contain a dot (.) for ENS format
- Invalid formats redirect to home page
- Proper URL decoding handles special characters

### Component Props
The main component now accepts:
- `initialEnsName?: string` - Pre-populate ENS name field
- `autoResolve?: boolean` - Automatically start resolution process

## User Experience

### From Home Page
1. User enters ENS name manually
2. Clicks "Resolve ENS" button
3. Resolution process begins

### From Dynamic Route
1. User visits `localhost:3000/example.eth`
2. ENS name auto-populates
3. Resolution starts automatically after 500ms
4. Input field shows "Loaded from URL route" indicator

### Error Handling
- Failed resolutions show appropriate error messages
- Reset functionality adapts based on route type
- Navigation maintains context awareness

## Benefits

- **Direct Access**: Skip manual ENS entry for known agents
- **Bookmarkable**: Save favorite AI agents as browser bookmarks
- **Shareable**: Send direct links to specific agents
- **SEO Friendly**: Each agent gets its own optimized page
- **User Friendly**: Clear navigation and context indicators
