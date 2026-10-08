import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const REGISTRY_URL = "https://www.ui-skills.com/skills/registry.json";
let cachedRegistry = null;
let lastFetch = 0;

async function getRegistry() {
  const now = Date.now();
  if (cachedRegistry && now - lastFetch < 300000) {
    return cachedRegistry;
  }
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cachedRegistry = await res.json();
    lastFetch = now;
    return cachedRegistry;
  } catch (err) {
    if (cachedRegistry) return cachedRegistry;
    throw err;
  }
}

const server = new Server(
  {
    name: "ui-skills",
    version: "0.2.4",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_skills",
        description: "List available UI skills from the UI Skills registry (filterable by category/topic).",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Optional topic/category filter (e.g. 'motion', 'visual', 'systems', 'interaction', 'accessibility')",
            },
          },
        },
      },
      {
        name: "get_skill",
        description: "Fetch full skill markdown specification by slug, name, or pathSlug from UI Skills.",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "Skill identifier slug (e.g. 'baseline-ui', 'fluid-functionalism', 'hairline-create')",
            },
          },
          required: ["slug"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const registry = await getRegistry();

  if (name === "list_skills") {
    const category = args?.category?.toLowerCase();
    const skills = registry.skills || [];
    const filtered = category
      ? skills.filter(
          (s) =>
            s.topics?.some((t) => t.toLowerCase() === category) ||
            s.name?.toLowerCase().includes(category) ||
            s.slug?.toLowerCase().includes(category)
        )
      : skills;

    const list = filtered.map((s) => ({
      slug: s.slug,
      name: s.name,
      topics: s.topics,
      description: s.description,
      githubUrl: s.githubUrl,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(list, null, 2),
        },
      ],
    };
  }

  if (name === "get_skill") {
    const slug = (args?.slug || "").trim().toLowerCase();
    const skills = registry.skills || [];
    const skill = skills.find(
      (s) =>
        s.slug?.toLowerCase() === slug ||
        s.name?.toLowerCase() === slug ||
        s.pathSlug?.toLowerCase() === slug
    );

    if (!skill) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Skill '${slug}' not found in UI Skills registry. Run list_skills to see available skills.`,
          },
        ],
      };
    }

    if (skill.rawUrl) {
      try {
        const rawRes = await fetch(skill.rawUrl);
        if (rawRes.ok) {
          const md = await rawRes.text();
          return {
            content: [
              {
                type: "text",
                text: `# ${skill.name}\n\n${md}`,
              },
            ],
          };
        }
      } catch (e) {
        // Fall back to description and metadata
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `# ${skill.name}\n\nDescription: ${skill.description}\nGitHub: ${skill.githubUrl}\nRaw URL: ${skill.rawUrl}`,
        },
      ],
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error("Fatal error starting UI Skills MCP:", err);
  process.exit(1);
});
