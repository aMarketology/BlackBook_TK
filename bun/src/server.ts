// BlackBook Bun Development Server
const server = Bun.serve({
  port: 8082,
  async fetch(request) {
    const url = new URL(request.url);
    let filePath = url.pathname;
    
    // Serve index.html for root
    if (filePath === '/') {
      return new Response(Bun.file('./public/index.html'));
    }
    
    // Serve main.js (TypeScript compiled on-the-fly)
    if (filePath === '/main.js') {
      const result = await Bun.build({
        entrypoints: ['./src/main.ts'],
        target: 'browser',
      });
      
      if (result.outputs.length > 0) {
        return new Response(result.outputs[0], {
          headers: { 'Content-Type': 'application/javascript' }
        });
      }
      return new Response('Build failed', { status: 500 });
    }
    
    // Serve CSS files
    if (filePath.endsWith('.css')) {
      const cssPath = `./public${filePath}`;
      return new Response(Bun.file(cssPath), {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    // Serve static files from public directory
    try {
      const staticPath = `./public${filePath}`;
      const file = Bun.file(staticPath);
      
      if (await file.exists()) {
        return new Response(file);
      }
    } catch (e) {
      // File doesn't exist, continue to 404
    }
    
    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  }
});

console.log(`
╔══════════════════════════════════════════════╗
║  🏴‍☠️ BlackBook Prediction Market Frontend  ║
║                                              ║
║  🚀 Server: http://localhost:${server.port}         ║
║  🦀 Backend: http://localhost:3000           ║
║  ⚡ Built with Bun                           ║
╚══════════════════════════════════════════════╝
`);