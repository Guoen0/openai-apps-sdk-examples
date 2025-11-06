import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL, fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

type PostWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "assets");
const MOCK_DATA_PATH = path.resolve(__dirname, "mock-data.json");
const SCRAPING_MOCK_DATA_PATH = path.resolve(__dirname, "post-scraping-mock-data.json");

function readWidgetHtml(componentName: string): string {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `Widget assets not found. Expected directory ${ASSETS_DIR}. Run "pnpm run build" before starting the server.`
    );
  }

  const directPath = path.join(ASSETS_DIR, `${componentName}.html`);
  let htmlContents: string | null = null;

  if (fs.existsSync(directPath)) {
    htmlContents = fs.readFileSync(directPath, "utf8");
  } else {
    const candidates = fs
      .readdirSync(ASSETS_DIR)
      .filter(
        (file) => file.startsWith(`${componentName}-`) && file.endsWith(".html")
      )
      .sort();
    const fallback = candidates[candidates.length - 1];
    if (fallback) {
      htmlContents = fs.readFileSync(path.join(ASSETS_DIR, fallback), "utf8");
    }
  }

  if (!htmlContents) {
    throw new Error(
      `Widget HTML for "${componentName}" not found in ${ASSETS_DIR}. Run "pnpm run build" to generate the assets.`
    );
  }

  return htmlContents;
}

function widgetMeta(widget: PostWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const widgets: PostWidget[] = [
  {
    id: "post",
    title: "Show Post",
    templateUri: "ui://widget/post.html",
    invoking: "Creating a post",
    invoked: "Post created",
    html: readWidgetHtml("post"),
    responseText: "Rendered a post!",
  },
  {
    id: "post-scraping",
    title: "Web Scraping",
    templateUri: "ui://widget/post-scraping.html",
    invoking: "Scraping webpage",
    invoked: "Webpage scraped",
    html: readWidgetHtml("post-scraping"),
    responseText: "Scraped webpage content!",
  },
];

const widgetsById = new Map<string, PostWidget>();
const widgetsByUri = new Map<string, PostWidget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});

// 为不同 widget 定义不同的输入 schema
const toolInputSchemas: Record<string, any> = {
  post: {
    type: "object",
    properties: {
      Topic: {
        type: "string",
        description: "Topic to search for.",
      },
    },
    required: ["Topic"],
    additionalProperties: false,
  } as const,
  "post-scraping": {
    type: "object",
    properties: {
      Topic: {
        type: "string",
        description: "Topic to search for.",
      },
    },
    required: ["Topic"],
    additionalProperties: false,
  } as const,
};

// 为不同 widget 定义不同的 parser
const toolInputParsers: Record<string, z.ZodObject<any>> = {
  post: z.object({
    Topic: z.string(),
  }),
  "post-scraping": z.object({
    Topic: z.string(),
  }),
};

// 为不同 widget 定义不同的 mock 数据路径
const widgetMockDataPaths: Record<string, string> = {
  post: MOCK_DATA_PATH,
  "post-scraping": SCRAPING_MOCK_DATA_PATH,
};

const tools: Tool[] = widgets.map((widget) => ({
  name: widget.id,
  description: widget.title,
  inputSchema: toolInputSchemas[widget.id] || toolInputSchemas.post,
  title: widget.title,
  _meta: widgetMeta(widget),
  // To disable the approval prompt for the widgets
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
}));

const resources: Resource[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget),
}));

const resourceTemplates: ResourceTemplate[] = widgets.map((widget) => ({
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget),
}));

function createPostServer(): Server {

  const server = new Server(
    {
      name: "post-node",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources,
    })
  );

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const widget = widgetsByUri.get(request.params.uri);

      if (!widget) {
        throw new Error(`Unknown resource: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: widgetMeta(widget),
          },
        ],
      };
    }
  );

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates,
    })
  );

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools,
    })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const widget = widgetsById.get(request.params.name);

      if (!widget) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      // 根据 widget id 使用对应的 parser
      const parser = toolInputParsers[widget.id] || toolInputParsers.post;
      const args = parser.parse(request.params.arguments ?? {});

      // 根据 widget id 读取对应的 mock 数据
      const mockDataPath = widgetMockDataPaths[widget.id] || MOCK_DATA_PATH;
      const mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf8"));

      return {
        content: [
          {
            type: "text",
            text: widget.responseText,
          },
        ],
        structuredContent: mockData,
        _meta: widgetMeta(widget),
      };
    }
  );

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createPostServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

// 单次请求处理：直接处理 MCP 请求，无需 SSE 会话。支持 Coze 调用。
async function handleDirectMcpRequest(
  req: IncomingMessage,
  res: ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Content-Type", "application/json");

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const request = JSON.parse(body);
      let result;

      // 处理 resources/list
      if (request.method === "resources/list") {
        result = { resources };
      }
      // 处理 resources/read
      else if (request.method === "resources/read") {
        const widget = widgetsByUri.get(request.params?.uri);
        if (!widget) {
          throw new Error(`Unknown resource: ${request.params?.uri}`);
        }
        result = {
          contents: [
            {
              uri: widget.templateUri,
              mimeType: "text/html+skybridge",
              text: widget.html,
              _meta: widgetMeta(widget),
            },
          ],
        };
      }
      // 处理 tools/list
      else if (request.method === "tools/list") {
        result = { tools };
      }
      // 处理 tools/call
      else if (request.method === "tools/call") {
        const widget = widgetsById.get(request.params?.name);
        if (!widget) {
          throw new Error(`Unknown tool: ${request.params?.name}`);
        }
        // 根据 widget id 使用对应的 parser
        const parser = toolInputParsers[widget.id] || toolInputParsers.post;
        const args = parser.parse(request.params?.arguments ?? {});
        // 根据 widget id 读取对应的 mock 数据
        const mockDataPath = widgetMockDataPaths[widget.id] || MOCK_DATA_PATH;
        const mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf8"));
        result = {
          content: [
            {
              type: "text",
              text: widget.responseText,
            },
          ],
          structuredContent: mockData,
          _meta: widgetMeta(widget),
        };
      }
      else {
        res.writeHead(400).end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: request.id || 1,
            error: { code: -32601, message: "Method not found" },
          })
        );
        return;
      }

      res.writeHead(200).end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: request.id || 1,
          result: result,
        })
      );
    } catch (error: any) {
      console.error("Direct MCP request error:", error);
      res.writeHead(500).end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: error.message || "Internal error",
          },
        })
      );
    }
  });
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (
      req.method === "OPTIONS" &&
      (url.pathname === ssePath || url.pathname === postPath || url.pathname === "/mcp")
    ) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    // 单次请求端点：直接处理 MCP 请求，无需 SSE 会话
    if (req.method === "POST" && url.pathname === "/mcp") {
      await handleDirectMcpRequest(req, res);
      return;
    }

    res.writeHead(404).end("Not Found");
  }
);

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

httpServer.listen(port, () => {
  console.log(`Post MCP server listening on http://localhost:${port}`);
  console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
  console.log(
    `  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`
  );
});

