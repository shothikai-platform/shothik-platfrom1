# MCP Server Configuration for Vercel

## Installation

```bash
# Install MCP server globally
npm install -g @modelcontextprotocol/server-vercel

# Or use npx
npx @modelcontextprotocol/server-vercel
```

## Configuration

### Create `.mcp.json` in project root:
```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-vercel"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token"
      }
    }
  }
}
```

### Or use environment variable:
```bash
export VERCEL_TOKEN=your-vercel-token
npx @modelcontextprotocol/server-vercel
```

## Getting Vercel Token

1. Go to https://vercel.com/account/tokens
2. Create new token
3. Copy token value
4. Set as `VERCEL_TOKEN` environment variable

## Usage with Claude/Cursor

Once MCP server is running, you can:
- Deploy projects
- Check deployment status
- View logs
- Manage environment variables
- All through natural language

## Example Commands

```
"Deploy my project to Vercel"
"Check deployment status"
"Show me the latest logs"
"Add environment variable X"
```
