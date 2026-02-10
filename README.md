# EduConnect Enrollment Widget

An MCP (Model Context Protocol) App that provides an interactive widget for searching and enrolling in educational programs. Works with ChatGPT and MCPJam Inspector.

## Features

- 🔍 Search programs by interests/background
- 📋 Filter by type, organization, and price
- 🎓 Interactive enrollment flow
- 🌐 Arabic language support
- 💬 ChatGPT integration

## Prerequisites

- Node.js 20+
- npm or yarn
- HTTPS-enabled server (for ChatGPT deployment)

## Installation

```bash
# Clone repository
git clone <your-repo-url>
cd trying-mcpjam

# Install dependencies
npm install

# Build React widget
npm run build
```

## Local Development

### Test with MCPJam Inspector

1. Start server in STDIO mode:
```bash
npm start
```

2. Open MCPJam Inspector at http://127.0.0.1:6274

3. Add server with absolute path:
```
/absolute/path/to/node_modules/.bin/tsx /absolute/path/to/server.ts
```

### Test HTTP Mode Locally

```bash
# Start on default port 3000
npm run start:http

# Or custom port
PORT=8080 npm run start:http

# Test endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Production Deployment

### 1. Upload to Server

```bash
# Via git
git clone <your-repo-url>
cd trying-mcpjam

# Or via scp/sftp
scp -r ./trying-mcpjam user@server:/path/to/deploy/
```

### 2. Install and Build

```bash
npm install
npm run build
```

### 3. Start with PM2

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start server
PORT=3005 pm2 start npm --name "educonnect-enrollment" -- run start:http

# Save PM2 process list
pm2 save

# Enable auto-restart on server reboot
pm2 startup
```

### 4. Configure Nginx Reverse Proxy

Add to your Nginx site configuration:

```nginx
location /mcp {
    proxy_pass http://localhost:3005/mcp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;  # Long timeout for SSE
}
```

Reload Nginx:
```bash
sudo nginx -t && sudo nginx -s reload
```

### 5. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Test HTTPS endpoint
curl -X POST https://your-domain.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Connect to ChatGPT

1. Open ChatGPT → **Settings** → **Apps & Connectors**
2. **Advanced settings** → Enable **"Developer mode"**
3. **Settings** → **Connectors** → **Create**
4. Fill in:
   - **Name**: EduConnect Enrollment
   - **Description**: Search and enroll in educational programs
   - **URL**: `https://your-domain.com/mcp`
5. **Click Create**

## Usage in ChatGPT

Once connected, you can:

```
"Search for software engineering programs"
"Show me cybersecurity courses"
"List programs under 5000 SAR"
```

The widget will appear in the chat with interactive program cards.

## Available Tools

### search_programs
Search programs by describing interests (e.g., "software engineer", "health")

### list_programs
Filter programs by:
- Type: `academic_degree` or `nanodegree`
- Organization name
- Maximum price (SAR)

### enroll_in_program
Simulate enrollment in a specific program

## Environment Variables

Create `.env` file (see `.env.example`):

```bash
TRANSPORT=http      # "stdio" for local, "http" for production
PORT=3000          # HTTP server port
```

## Project Structure

```
.
├── server.ts              # MCP server with 3 tools
├── src/
│   ├── enrollment-app.tsx # React widget
│   ├── search.ts         # Search logic
│   └── types.ts          # TypeScript types
├── dist/
│   └── enrollment-app.html # Built widget (auto-generated)
├── moack.json            # Program data (gitignored)
└── package.json
```

## PM2 Management Commands

```bash
# View logs
pm2 logs educonnect-enrollment

# Restart
pm2 restart educonnect-enrollment

# Stop
pm2 stop educonnect-enrollment

# Delete
pm2 delete educonnect-enrollment

# Monitor
pm2 monit
```

## Troubleshooting

### Port already in use
```bash
# Find process
lsof -ti:3005

# Kill process
lsof -ti:3005 | xargs kill -9
```

### Rebuild after code changes
```bash
npm run build
pm2 restart educonnect-enrollment
```

### Widget not appearing in ChatGPT
1. Check server is running: `pm2 status`
2. Verify endpoint responds: `curl -X POST https://your-domain.com/mcp ...`
3. Check Nginx logs: `tail -f /var/log/nginx/error.log`

## License

MIT
