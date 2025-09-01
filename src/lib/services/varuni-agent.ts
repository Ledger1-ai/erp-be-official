import { AzureOpenAI } from "openai";
import { Document } from "langchain/document";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

type ToolHandler = (args: Record<string, any>, context: AgentContext) => Promise<any>;

export interface AgentContext {
	userId?: string;
	accessToken?: string;
	graphqlEndpoint: string;
	callGraphQL: <T>(query: string, variables?: Record<string, any>) => Promise<T>;
}

export interface AgentToolSpec {
	name: string;
	description: string;
	parameters?: { type: 'object'; properties?: Record<string, any>; required?: string[]; additionalProperties?: boolean };
	handler: ToolHandler;
}

export interface AgentToolSet {
	name: string;
	description: string;
	tools: AgentToolSpec[];
}

export interface AgentInitOptions {
	model?: string;
	deployment?: string;
	apiVersion?: string;
	endpoint?: string;
}

export class VaruniAgent {
	private client: AzureOpenAI;
	private modelName: string;
	private deployment: string;
	private toolsets: Map<string, AgentToolSet> = new Map();

	constructor(options?: AgentInitOptions) {
		const endpoint = options?.endpoint || (process.env.AZURE_OPENAI_ENDPOINT as string);
		const apiKey = process.env.AZURE_OPENAI_API_KEY as string;
		const apiVersion = options?.apiVersion || (process.env.AZURE_OPENAI_API_VERSION as string) || "2024-04-01-preview";
		const deployment = options?.deployment || (process.env.AZURE_OPENAI_DEPLOYMENT as string) || "gpt-5";
		const modelName = options?.model || (process.env.AZURE_OPENAI_MODEL_NAME as string) || "gpt-5";

		if (!endpoint || !apiKey) {
			throw new Error("Missing Azure OpenAI configuration");
		}

		this.client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
		this.modelName = modelName;
		this.deployment = deployment;
	}

	registerToolSet(toolset: AgentToolSet): void {
		this.toolsets.set(toolset.name, toolset);
	}

	listToolSets(): Array<{ name: string; description: string; tools: string[] }> {
		return Array.from(this.toolsets.values()).map(ts => ({
			name: ts.name,
			description: ts.description,
			tools: ts.tools.map(t => t.name),
		}));
	}

	private async callTool(toolName: string, args: Record<string, any>, context: AgentContext): Promise<any> {
		for (const ts of this.toolsets.values()) {
			const tool = ts.tools.find(t => t.name === toolName);
			if (tool) {
				return tool.handler(args || {}, context);
			}
		}
		throw new Error(`Unknown tool: ${toolName}`);
	}

	async chat(prompt: string, context: AgentContext, toolsetName?: string): Promise<{ text: string; usedTools?: Array<{ name: string; args: any; result: any }>; }> {
		const available = toolsetName ? [this.toolsets.get(toolsetName)].filter(Boolean) as AgentToolSet[] : Array.from(this.toolsets.values());
		const toolDefs = available.flatMap(ts => ts.tools).map(t => ({
			type: 'function' as const,
			function: {
				name: t.name,
				description: t.description,
				parameters: t.parameters || { type: 'object', properties: {}, additionalProperties: true },
			},
		}));

		const systemPrompt = `You are Varuni, an AI operations strategist inspired by the Indian goddess Varuni. You assist restaurant backoffice users across modules: Inventory, Scheduling, Invoicing, Menu, HostPro, Analytics. Use tools when available to ground answers in live data. Offer short, actionable insights with concrete steps. When using a specialized toolset, prefer its tools; provide a one-line option to go back to the main toolset.`;

		const messages: ChatCompletionCreateParamsNonStreaming["messages"] = [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: prompt },
		];

		const usedTools: Array<{ name: string; args: any; result: any }> = [];

		// Simple, serial tool-calling loop with a maximum of 3 tool invocations
		for (let i = 0; i < 3; i++) {
			const resp = await this.client.chat.completions.create({
				model: this.deployment,
				messages,
				tools: toolDefs.length ? toolDefs : undefined,
				tool_choice: 'auto',
			});
			const choice = resp.choices[0];
			const assistantMsg = (choice as any).message;
			const toolCall = assistantMsg.tool_calls?.[0];
			if (!toolCall) {
				const text = choice.message.content || "";
				return { text, usedTools: usedTools.length ? usedTools : undefined };
			}
			const toolName = toolCall.function.name as string;
			const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
			const result = await this.callTool(toolName, args, context);
			usedTools.push({ name: toolName, args, result });
			// Per Azure tool protocol, include assistant message with tool_calls before the tool result
			messages.push(assistantMsg as any);
			messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) } as any);
		}

		return { text: "I gathered data from tools. Here are the next steps.", usedTools };
	}
}

// Built-in utility to create a minimal GraphQL tool
export function createGraphQLTool(name: string, description: string, query: string): AgentToolSpec {
	return {
		name,
		description,
		parameters: {
			type: "object",
			properties: {
				variables: { type: "object", description: "GraphQL variables" },
			},
			additionalProperties: false,
		},
		handler: async (args, context) => {
			const variables = (args && args.variables) || {};
			return await context.callGraphQL(query, variables);
		},
	};
}

