import { NextRequest, NextResponse } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { demoResolvers } from '@/lib/graphql/demo-resolvers';
import { isDemoMode, isDemoStubsEnabled } from '@/lib/config/demo';
import { connectDB } from '@/lib/db/connection';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/auth/jwt';
import { User } from '@/lib/models/User';

// Environment check constant
const isProduction = (process.env.NODE_ENV as string) === 'production';

interface Context {
  user: JWTPayload | null;
  req: NextRequest;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}

// Use a more robust singleton pattern that survives Next.js hot reloads
const globalForApollo = globalThis as unknown as {
  apolloServer: ApolloServer<Context> | undefined;
  serverStartPromise: Promise<void> | undefined;
};

// Force clear the Apollo server to pick up schema changes
if (globalForApollo.apolloServer) {
  console.log('🔄 Clearing cached Apollo Server for schema refresh');
  globalForApollo.apolloServer = undefined;
  globalForApollo.serverStartPromise = undefined;
}

function createApolloServer() {
  console.log('🚀 Creating new Apollo Server instance');
  // Compose resolvers. In demo with stubs enabled, only override specific Toast/menu resolvers,
  // and keep DB-backed inventory resolvers intact to avoid reducing item counts.
  const baseResolvers: any = resolvers as any;
  let composedResolvers: any = baseResolvers;
  if (isDemoMode() && isDemoStubsEnabled()) {
    const demo: any = demoResolvers as any;
    const selectiveDemo = {
      Query: {
        indexedMenus: demo?.Query?.indexedMenus,
        menuItemStock: demo?.Query?.menuItemStock,
        menuItemCost: demo?.Query?.menuItemCost,
        menuItemCapacity: demo?.Query?.menuItemCapacity,
      },
      Mutation: {
        // Safe to override; does not depend on live integrations
        setMenuVisibility: demo?.Mutation?.setMenuVisibility,
      },
    };
    composedResolvers = {
      ...baseResolvers,
      Query: { ...(baseResolvers?.Query || {}), ...(selectiveDemo.Query || {}) },
      Mutation: { ...(baseResolvers?.Mutation || {}), ...(selectiveDemo.Mutation || {}) },
    };
  }

  return new ApolloServer<Context>({
    typeDefs,
    resolvers: composedResolvers,
    introspection: !isProduction,
    // Production-grade error handling
    formatError: (error: any) => {
      if (!isProduction) {
        console.error('GraphQL Error:', {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        });
      }

      // Don't expose internal errors in production
      if (isProduction) {
        // Only expose safe errors
        if (error.extensions?.code === 'UNAUTHENTICATED' || 
            error.extensions?.code === 'FORBIDDEN' ||
            error.extensions?.code === 'BAD_USER_INPUT') {
          return error;
        }

        // Generic error for production
        return {
          message: 'Internal server error',
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        };
      }

      return error;
    },
    
    // Enable detailed error logging for development
    includeStacktraceInErrorResponses: !isProduction,
  });
}

async function getApolloServer() {
  if (!globalForApollo.apolloServer) {
    if (!isProduction) console.log('🚀 Creating new Apollo Server instance');
    globalForApollo.apolloServer = createApolloServer();
  }

  // Ensure server is started only once
  if (!globalForApollo.serverStartPromise) {
    if (!isProduction) console.log('⏳ Starting Apollo Server...');
    globalForApollo.serverStartPromise = globalForApollo.apolloServer.start().then(() => {
      if (!isProduction) console.log('✅ Apollo Server started successfully');
    }).catch((error) => {
      console.error('❌ Apollo Server startup failed:', error);
      // Reset the promise so we can try again
      globalForApollo.serverStartPromise = undefined;
      throw error;
    });
  }

  await globalForApollo.serverStartPromise;
  return globalForApollo.apolloServer;
}

/**
 * Create authentication context for GraphQL
 */
async function createContext(request: NextRequest): Promise<Context> {
  let user: JWTPayload | null = null;
  let isAuthenticated = false;

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      // Verify token
      const decoded = verifyToken(token);
      if (isDemoMode()) {
        // In demo mode, accept verified token without DB lookup
        user = decoded;
        isAuthenticated = true;
      } else {
        // Verify user still exists and is active
        const dbUser = await User.findById(decoded.userId);
        if (dbUser && dbUser.isActive) {
          user = decoded;
          isAuthenticated = true;
        }
      }
    }
  } catch (error) {
    // Silent fail for development - don't log token verification failures
    // Continue with unauthenticated context
  }

  return {
    user,
    req: request,
    isAuthenticated,
    hasPermission: (permission: string) => {
      if (!user) return false;
      return user.permissions.includes(permission) || 
             user.permissions.includes('admin') || 
             user.role === 'Super Admin';
    },
    hasRole: (roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role) || user.role === 'Super Admin';
    },
  };
}

async function handler(request: NextRequest) {
  try {
    // Ensure database is connected (skip in demo mode)
    if (!isDemoMode()) {
      await connectDB();
    }

    // Get Apollo Server instance
    const apolloServer = await getApolloServer();
    
    const url = new URL(request.url);
    
    // Handle GET requests (introspection/playground)
    if (request.method === 'GET') {
      // For production, disable introspection for security
      if (isProduction) {
        return NextResponse.json(
          {
            message: 'GraphQL endpoint is ready',
            endpoint: '/api/graphql',
            methods: ['POST'],
          },
          { status: 200 }
        );
      }

      // Development: Allow introspection queries
      if (url.searchParams.has('query')) {
        const query = url.searchParams.get('query');
        const variables = url.searchParams.get('variables');
        const operationName = url.searchParams.get('operationName');

        const context = await createContext(request);

        const result = await apolloServer.executeOperation(
          {
            query: query!,
            variables: variables ? JSON.parse(variables) : {},
            operationName: operationName || undefined,
          },
          {
            contextValue: context,
          }
        );

        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        // Return GraphQL endpoint info
        return NextResponse.json(
          {
            message: 'GraphQL endpoint is ready',
            endpoint: '/api/graphql',
            methods: ['POST'],
            introspection: !isProduction,
          },
          { status: 200 }
        );
      }
    }

    // Handle POST requests
    if (request.method === 'POST') {
      const rawBody = await request.text();
      
      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json(
          { 
            errors: [{ 
              message: 'POST body is required for GraphQL queries',
              extensions: { code: 'BAD_USER_INPUT' }
            }] 
          },
          { status: 400 }
        );
      }

      let parsedBody;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (jsonError) {
        console.error('❌ Invalid JSON in POST body:', jsonError);
        return NextResponse.json(
          { 
            errors: [{ 
              message: 'POST body must be valid JSON',
              extensions: { code: 'BAD_USER_INPUT' }
            }] 
          },
          { status: 400 }
        );
      }

      if (!parsedBody.query) {
        return NextResponse.json(
          { 
            errors: [{ 
              message: 'GraphQL query is required',
              extensions: { code: 'BAD_USER_INPUT' }
            }] 
          },
          { status: 400 }
        );
      }

      // Create authentication context
      const context = await createContext(request);

      // Execute GraphQL operation with authentication context
      const result = await apolloServer.executeOperation(
        {
          query: parsedBody.query,
          variables: parsedBody.variables || {},
          operationName: parsedBody.operationName,
        },
        {
          contextValue: context,
        }
      );
      
      // Log the result for debugging
      if (!isProduction) {
        console.log('🔍 GraphQL operation result:', {
          operation: parsedBody.operationName,
          resultKind: result.body.kind
        });
      }
      
      // Handle different result types from Apollo Server 4+
      let responseBody;
      if (result.body.kind === 'single') {
        responseBody = result.body.singleResult;
      } else {
        // For incremental results, just return the initial result
        responseBody = result.body.initialResult;
      }
      
      return NextResponse.json(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          // CORS headers
          'Access-Control-Allow-Origin': isProduction 
            ? process.env.ALLOWED_ORIGINS || 'https://your-domain.com'
            : '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // Method not allowed
    return NextResponse.json(
      { 
        errors: [{ 
          message: 'Method not allowed',
          extensions: { code: 'METHOD_NOT_ALLOWED' }
        }] 
      },
      { status: 405 }
    );

  } catch (error) {
    console.error('❌ GraphQL handler error:', error);
    return NextResponse.json(
      { 
        errors: [{ 
          message: isProduction 
            ? 'Internal server error' 
            : `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          }
        }] 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isProduction 
        ? process.env.ALLOWED_ORIGINS || 'https://your-domain.com'
        : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

export { handler as GET, handler as POST }; 