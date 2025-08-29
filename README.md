# MCP Client Example

This project implements an MCP (Model Context Protocol) client using the official TypeScript SDK, following the concepts from the [ModelContextProtocol.io quickstart guide](https://modelcontextprotocol.io/quickstart/client).

## Features

- **MCP Client**: Connects to MCP servers via stdio transport
- **Tool Integration**: Lists and calls tools from connected MCP servers
- **Claude Integration**: Uses tools with Anthropic's Claude AI
- **TypeScript**: Fully typed implementation with proper error handling

## Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

## Usage

### Basic Client Instantiation

```typescript
import { MCPClient } from './index.js';

const client = new MCPClient();
await client.connect();
```

### Available Methods

- `connect()`: Connect to the MCP server
- `listAvailableTools()`: Get list of available tools from the server
- `callTool(toolName, parameters)`: Execute a specific tool
- `chatWithClaude(message)`: Send a message to Claude with available MCP tools
- `disconnect()`: Close the connection to the server

### Configuration

The client is currently configured to connect to `@modelcontextprotocol/server-everything` as an example. To connect to a different MCP server, modify the transport configuration in `index.ts`:

```typescript
this.transport = new StdioClientTransport({
    command: "your-mcp-server-command",
    args: ["--arg1", "value1"]
});
```

## Architecture

The implementation follows the MCP client pattern:

1. **Client Setup**: Initialize the MCP client with capabilities
2. **Transport**: Use stdio transport to communicate with MCP servers
3. **Tool Discovery**: List available tools from the server
4. **Tool Execution**: Call tools and handle responses
5. **AI Integration**: Pass tools to Claude for enhanced capabilities

## Testing

Run the test suite to verify the client works:

```bash
npm run build
node build/test.js
```

## Example MCP Servers

To test with real MCP servers, you can use:

- `@modelcontextprotocol/server-everything`: Demo server with various tools
- `@modelcontextprotocol/server-filesystem`: File system operations
- Custom MCP servers following the protocol

## Files

- `index.ts`: Main MCP client implementation
- `test.ts`: Simple test script
- `package.json`: Dependencies and build configuration
- `tsconfig.json`: TypeScript configuration
- `.env.example`: Environment variable template

## Requirements

- Node.js v18.x or higher
- TypeScript 5.x
- Anthropic API key (for Claude integration)
- An MCP server to connect to