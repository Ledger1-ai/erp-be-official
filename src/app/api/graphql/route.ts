import { NextRequest, NextResponse } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { connectDB } from '@/lib/db/connection';

interface Context {
  user: any;
  req: NextRequest;
}

// Create Apollo Server instance
const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (error: any) => {
    console.error('GraphQL Error:', error);
    
    // Don't expose internal errors to clients
    if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
      return {
        message: 'Internal server error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      };
    }
    
    return error;
  },
});

// Initialize the server
let serverStarted = false;

async function ensureServerStarted() {
  if (!serverStarted) {
    await server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
    serverStarted = true;
  }
}

export async function GET(request: NextRequest) {
  await ensureServerStarted();
  
  try {
    await connectDB();
    
    const response = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.text(),
        search: request.nextUrl.search,
      },
      context: async () => ({
        user: null, // TODO: Implement authentication
        req: request,
      }),
    });

    return new NextResponse(response.body.string, {
      status: response.status || 200,
      headers: response.headers,
    });
  } catch (error) {
    console.error('GraphQL handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await ensureServerStarted();
  
  try {
    await connectDB();
    
    const response = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.text(),
        search: request.nextUrl.search,
      },
      context: async () => ({
        user: null, // TODO: Implement authentication
        req: request,
      }),
    });

    return new NextResponse(response.body.string, {
      status: response.status || 200,
      headers: response.headers,
    });
  } catch (error) {
    console.error('GraphQL handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 