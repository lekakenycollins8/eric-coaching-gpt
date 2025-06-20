// Define the AppRouter type for the web application
// This is a client-side type definition that matches the server's router structure

// Using a proper router type definition that's compatible with tRPC client
export interface AppRouter {
  _def: {
    queries: {
      healthCheck: {
        _type: 'query';
        _input: undefined;
        _output: string;
      };
    };
    mutations: {};
    subscriptions: {};
  };
  createCaller: Function;
}
