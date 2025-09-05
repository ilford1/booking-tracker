// Fetch polyfill for Node.js environments
// This fixes issues with undici fetch in Vercel Edge/Node runtime

export function setupFetchPolyfill() {
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // We're in a Node.js environment
    try {
      // Try to use node-fetch if available
      const nodeFetch = require('node-fetch');
      if (!global.fetch) {
        global.fetch = nodeFetch;
        global.Headers = nodeFetch.Headers;
        global.Request = nodeFetch.Request;
        global.Response = nodeFetch.Response;
      }
    } catch (e) {
      // node-fetch not available, use built-in fetch but with error handling
      const originalFetch = global.fetch || fetch;
      
      global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          return await originalFetch(input, init);
        } catch (error: any) {
          // Retry once on network errors
          if (error.message?.includes('fetch failed') || error.message?.includes('ECONNRESET')) {
            console.warn('Fetch failed, retrying...', error.message);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await originalFetch(input, init);
          }
          throw error;
        }
      };
    }
  }
}

// Auto-initialize in server environments
if (typeof window === 'undefined') {
  setupFetchPolyfill();
}
