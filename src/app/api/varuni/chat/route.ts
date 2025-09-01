import { NextRequest, NextResponse } from 'next/server';
import { VaruniAgent, createGraphQLTool } from '@/lib/services/varuni-agent';
import { marked } from 'marked';

export async function POST(req: NextRequest) {
  try {
    const { message, toolset } = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql';

    const agent = new VaruniAgent();
    // Register top-level toolset navigator
    agent.registerToolSet({
      name: 'main',
      description: 'Main tools for Varuni',
      tools: [
        { name: 'list_toolsets', description: 'List available toolsets', handler: async () => ({
          toolsets: agent.listToolSets().map(t => ({ name: t.name, description: t.description }))
        }) },
      ],
    });
    // Inventory toolset
    agent.registerToolSet({
      name: 'inventory',
      description: 'Inventory analytics and stock tools',
      tools: [
        {
          name: 'getInventoryAnalyticsSummary',
          description: 'Fetch inventory analytics summary',
          parameters: { type: 'object', properties: { startDate: { type: 'string' }, endDate: { type: 'string' } }, required: ['startDate','endDate'] },
          handler: async (args, ctx) => ctx.callGraphQL(
            `query($startDate: Date!, $endDate: Date!){ inventoryAnalyticsSummary(startDate:$startDate,endDate:$endDate){ totalInventoryValue totalItems lowStockItems criticalItems wasteCostInPeriod wasteQtyInPeriod turnoverRatio } }`,
            { startDate: args.startDate, endDate: args.endDate }
          )
        },
        {
          name: 'getLowStockItems',
          description: 'Fetch low stock items',
          parameters: { type: 'object', properties: {} },
          handler: async (_args, ctx) => ctx.callGraphQL(`query{ lowStockItems{ id name currentStock minThreshold unit costPerUnit status } }`)
        },
        { name: 'back_to_main', description: 'Return to main tools', handler: async () => ({ navigate: 'main' }) },
      ],
    });

    const callGraphQL = async (query: string, variables?: Record<string, any>) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json();
      return json.data;
    };

    const result = await agent.chat(String(message || ''), {
      graphqlEndpoint: endpoint,
      callGraphQL,
    }, toolset);

    // Ensure markdown support
    const html = await marked.parse(result.text || '');
    return NextResponse.json({ success: true, ...result, html }, { status: 200 });
  } catch (err: any) {
    console.error('Varuni chat error', err);
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export const GET = async () => new NextResponse('Method Not Allowed', { status: 405 });

