# Claw Post WebMCP Demo

**Live Demo: https://daydreamnationtechlabs.github.io/clawpost-webmcp/**

> **Note:** If the live demo is not yet available, the repo owner needs to enable GitHub Pages: Go to Settings > Pages > Source: "GitHub Actions", then push any change or re-run the workflow.

A public demonstration of WebMCP integration for [clawpost.net](https://clawpost.net). This is a thin demo for the OpenAI WebMCP Challenge, not the full Claw Post product.

## What Is This?

This demo shows how Claw Post integrates with the [WebMCP API](https://developer.chrome.com/docs/ai/webmcp/imperative-api). When you open this page in a WebMCP-enabled browser, it registers tools that AI assistants (like ChatGPT) can call to post to social media on your behalf.

Claw Post lets AI agents post from your already logged in desktop Chrome via a paired browser extension. Unlike headless VPS solutions, posts come from your real browser session.

## What Is WebMCP?

WebMCP is a browser API that allows web pages to register tools that AI assistants can discover and call. This creates a bridge between websites and AI agents, enabling new types of interactions.

Learn more:
- [Chrome WebMCP Documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP Specification](https://github.com/webmachinelearning/webmcp)

## Registered Tools

This demo registers four WebMCP tools:

| Tool | Description |
|------|-------------|
| `clawpost_status` | Check account and extension pairing status |
| `clawpost_create_post` | Create a post on X, LinkedIn, Facebook, Instagram, or TikTok |
| `clawpost_reddit_comment` | Post a comment on a Reddit thread |
| `clawpost_job_status` | Check the status of a post job |

## How to Use

### 1. Enable WebMCP in Chrome

**Option A: Chrome Flag**
1. Go to `chrome://flags/#enable-webmcp-testing`
2. Enable the flag
3. Restart Chrome

**Option B: ChatGPT In-App Browser**
Open the demo URL in ChatGPT's in-app browser, which has WebMCP built in.

### 2. Install the Claw Post Extension

Get it from the [Chrome Web Store](https://chromewebstore.google.com/detail/claw-post/gebmgifdmnflfcehpbepkdnndkhgkchh).

### 3. Pair Your Extension

1. Click the extension icon
2. Complete the pairing flow at clawpost.net
3. Copy your API key

### 4. Open the Demo and Paste Your Key

1. Open https://daydreamnationtechlabs.github.io/clawpost-webmcp/
2. Paste your API key in the input field
3. Click Save Key

Your API key is stored only in your browser's localStorage. It is never sent anywhere except to the Claw Post API when making requests.

### 5. Use with an AI Agent

Ask ChatGPT (or another WebMCP-enabled assistant) to post something. The assistant will see the registered tools and can call them.

## What Makes Claw Post Different

- **Desktop Chrome, not a headless VPS.** Posts come from your real browser where you are already logged in.
- **Facebook member groups.** Post to private Facebook groups you belong to.
- **Reddit comments.** A dedicated API for replying to Reddit threads.
- **No X reply tool.** There is no tool to reply to someone else's tweet. You can only post your own content.

## Important Notes

- The MCP skill slug is always `@daydreamnationtechlabs/clawpost` (not a short name like "clawpost").
- There is a different product at clawpost.dev. This is not that product.
- If you do not have the Chrome extension installed and paired, tool calls will return an `EXTENSION_NOT_PAIRED` error. This is expected and valid for judges testing without the extension.

## Running Locally

This is a static site with no build step.

```bash
# Clone the repo
git clone https://github.com/Daydreamnationtechlabs/clawpost-webmcp.git
cd clawpost-webmcp

# Serve with any static server
npx serve .
# or
python3 -m http.server 8000
```

Then open http://localhost:8000 (or your server's port) in Chrome with WebMCP enabled.

## Deployment

### GitHub Pages (Recommended)

This repo includes a GitHub Actions workflow that automatically deploys to GitHub Pages. To enable it:

1. Go to repo Settings > Pages
2. Under "Build and deployment", set Source to "GitHub Actions"
3. The workflow will run on the next push, or you can manually trigger it from Actions > Deploy to GitHub Pages > Run workflow

The site will be available at: https://daydreamnationtechlabs.github.io/clawpost-webmcp/

### Alternative Deployment

Since this is a static site, you can deploy it anywhere:

- **Netlify**: Drag and drop the repo folder at netlify.com/drop
- **Vercel**: Import the GitHub repo at vercel.com/new
- **Cloudflare Pages**: Connect the repo at pages.cloudflare.com
- **Any web server**: Just serve the files from any HTTPS-enabled host

## 90-Second Demo Script

For judges or anyone filming a demo walkthrough:

### Setup (30 seconds)
1. Open Chrome and go to `chrome://flags/#enable-webmcp-testing`
2. Enable the flag and restart Chrome
3. If you have the Claw Post extension installed, make sure it is paired

### Demo (60 seconds)
1. Open https://daydreamnationtechlabs.github.io/clawpost-webmcp/
2. Point out the "WebMCP ready" status showing 4 tools registered
3. Scroll to show the list of registered tools
4. If you have an API key, paste it and click Save
5. Click "Test clawpost_status" to show the API responding
6. Open ChatGPT in the same browser
7. Ask: "Use clawpost_create_post to post 'Hello from WebMCP!' on X"
8. If paired, show the live post URL in the response
9. If not paired, show the `EXTENSION_NOT_PAIRED` error (this is valid, proves tools work)

### Wrap-up (10 seconds)
- Mention this is a thin public demo, not the full product
- Note the MIT license for the demo code

## API Endpoints

The tools call these Claw Post API endpoints:

- `GET /v1/account/status` - Check account status
- `POST /v1/jobs/tweet` - Create a social media post
- `POST /v1/reddit/comment` - Post a Reddit comment
- `GET /v1/jobs/:id` - Check job status

All requests require the `clawpost-api-key` header.

Full API documentation is available at clawpost.net after creating an account.

## License

MIT License. See [LICENSE](./LICENSE).

This demo code is open source. The Claw Post product and extension are separate.

## Links

- [Claw Post Website](https://clawpost.net)
- [Chrome Extension](https://chromewebstore.google.com/detail/claw-post/gebmgifdmnflfcehpbepkdnndkhgkchh)
- [WebMCP Chrome Docs](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP Spec](https://github.com/webmachinelearning/webmcp)
