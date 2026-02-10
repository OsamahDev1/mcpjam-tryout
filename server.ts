import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import type { MockData, Program } from "./src/types.js";
import { searchPrograms, filterPrograms } from "./src/search.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load moack.json
const raw = readFileSync(resolve(__dirname, "moack.json"), "utf-8");
const data: MockData = JSON.parse(raw);
const programs: Program[] = data.nano_degrees;

// Load compiled UI HTML
const uiHtml = readFileSync(
  resolve(__dirname, "dist", "enrollment-app.html"),
  "utf-8"
);

// Register UI resource at ui://enrollment/enrollment-app.html
const RESOURCE_URI = "ui://enrollment/enrollment-app.html";

// Tool _meta for MCP App widget rendering — tells the inspector this tool has a UI
const TOOL_UI_META = { ui: { resourceUri: RESOURCE_URI } };

function registerToolsAndResources(server: McpServer) {
  server.resource(
    "enrollment-app",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: uiHtml,
        },
      ],
    })
  );

  server.registerTool(
    "search_programs",
    {
      description: "Search for educational programs by describing your background or interests in English (e.g. 'software engineer', 'cyber security', 'health'). Returns matching educational programs.",
      inputSchema: { query: z.string().describe("Search query in English describing your background or interests") },
      _meta: TOOL_UI_META,
    },
    async ({ query }) => {
      const results = searchPrograms(programs, query).slice(0, 10);
      const summary =
        results.length > 0
          ? `Found ${results.length} programs matching "${query}": ${results.map((p) => p.title).join("، ")}`
          : `No programs found matching "${query}". Try different keywords like: software, cyber, health, business, data, education, law, tourism, design.`;

      return {
        content: [{ type: "text", text: summary }],
        _meta: TOOL_UI_META,
        structuredContent: {
          programs: results,
          action: "search_results",
          query,
        },
      } as any;
    }
  );

  server.registerTool(
    "list_programs",
    {
      description: "List and filter educational programs. Filter by type (academic_degree or nanodegree), organization name, or maximum price.",
      inputSchema: {
        type: z
          .enum(["academic_degree", "nanodegree"])
          .optional()
          .describe("Program type filter"),
        organization: z
          .string()
          .optional()
          .describe("Organization name (partial match in Arabic)"),
        maxPrice: z
          .number()
          .optional()
          .describe("Maximum total price in SAR"),
      },
      _meta: TOOL_UI_META,
    },
    async ({ type, organization, maxPrice }) => {
      const results = filterPrograms(programs, { type, organization, maxPrice }).slice(0, 10);
      const typeLabel = type === "nanodegree" ? "nano-degree" : type === "academic_degree" ? "diploma" : "all";
      const summary =
        results.length > 0
          ? `Found ${results.length} ${typeLabel} programs${organization ? ` from "${organization}"` : ""}${maxPrice !== undefined ? ` under ${maxPrice} SAR` : ""}.`
          : `No programs found with the given filters.`;

      return {
        content: [{ type: "text", text: summary }],
        _meta: TOOL_UI_META,
        structuredContent: {
          programs: results,
          action: "list_results",
        },
      } as any;
    }
  );

  server.registerTool(
    "enroll_in_program",
    {
      description: "Simulate enrollment in a specific program by its ID.",
      inputSchema: {
        programId: z.number().describe("The program ID to enroll in"),
      },
      _meta: TOOL_UI_META,
    },
    async ({ programId }) => {
      const program = programs.find((p) => p.id === programId);
      if (!program) {
        return {
          content: [{ type: "text", text: `Program with ID ${programId} not found.` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Successfully enrolled in "${program.title}" from ${program.organization.name}. This is a simulated enrollment for demonstration purposes.`,
          },
        ],
        _meta: TOOL_UI_META,
        structuredContent: {
          program,
          action: "enrollment_success",
        },
      } as any;
    }
  );
}

// Start server
async function main() {
  const mode = process.env.TRANSPORT || "stdio";

  if (mode === "http") {
    const app = express();
    app.use(express.json());

    // CORS for ChatGPT
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") return res.sendStatus(200);
      next();
    });

    // Store active transports by session ID
    const transports = new Map<string, SSEServerTransport>();

    // SSE endpoint - GET to establish SSE stream (ChatGPT connects here)
    app.get("/sse", async (req, res) => {
      const transport = new SSEServerTransport("/messages", res);
      const sessionServer = new McpServer({
        name: "educonnect-enrollment",
        version: "1.0.0",
      });
      registerToolsAndResources(sessionServer);
      transports.set(transport.sessionId, transport);

      transport.onclose = () => {
        transports.delete(transport.sessionId);
      };

      await sessionServer.connect(transport);
    });

    // Messages endpoint - POST to send messages to a session
    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports.get(sessionId);
      if (!transport) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      await transport.handlePostMessage(req, res, req.body);
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`HTTP server running on port ${port}`);
      console.log(`MCP SSE endpoint: http://localhost:${port}/sse`);
    });
  } else {
    // STDIO for local MCPJam
    const server = new McpServer({
      name: "educonnect-enrollment",
      version: "1.0.0",
    });
    registerToolsAndResources(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch(console.error);
