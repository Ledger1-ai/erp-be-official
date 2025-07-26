import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Create HTTP link
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql',
});

// Auth link to add authentication headers
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const token = userData ? JSON.parse(userData).token : null;
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// Create Apollo Client
export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          teamMembers: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          inventoryItems: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          shifts: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          invoices: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
}); 