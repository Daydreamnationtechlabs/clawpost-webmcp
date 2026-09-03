/**
 * Claw Post WebMCP Demo
 * Registers WebMCP tools for AI agents to post to social media
 * via the Claw Post Chrome extension.
 * 
 * MIT License - https://github.com/Daydreamnationtechlabs/clawpost-webmcp
 */

const CLAWPOST_API_BASE = 'https://api.clawpost.net';
const STORAGE_KEY = 'clawpost_api_key';

const registeredTools = [];

function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function setApiKey(key) {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function clawpostFetch(endpoint, options = {}) {
  const apiKey = getApiKey();
  const skipAuth = options.skipAuth;
  delete options.skipAuth;
  
  if (!apiKey && !skipAuth) {
    return {
      success: false,
      error: 'NO_API_KEY',
      message: 'No Claw Post API key configured. Paste your API key at this page to enable posting. Get a key at clawpost.net after installing the Chrome extension.'
    };
  }

  const url = `${CLAWPOST_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (apiKey && !skipAuth) {
    headers['clawpost-api-key'] = apiKey;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    
    if (contentType.includes('html') || responseText.trimStart().startsWith('<')) {
      const snippet = responseText.substring(0, 100).replace(/\s+/g, ' ').trim();
      return {
        success: false,
        error: 'HTML_RESPONSE',
        statusCode: response.status,
        message: `Server returned HTML instead of JSON (status ${response.status}): ${snippet}${responseText.length > 100 ? '...' : ''}`
      };
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return {
        success: false,
        error: 'INVALID_JSON',
        statusCode: response.status,
        message: `Server returned invalid JSON (status ${response.status}): ${responseText.substring(0, 100)}`
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'API_ERROR',
        message: data.message || `API returned status ${response.status}`,
        statusCode: response.status
      };
    }

    return {
      success: true,
      ...data
    };
  } catch (error) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: `Failed to connect to Claw Post API: ${error.message}`
    };
  }
}

const toolDefinitions = [
  {
    name: 'clawpost_status',
    description: 'Check the status of your Claw Post account and Chrome extension pairing. Returns information about whether the extension is connected and ready to post. If not configured, explains how to set up Claw Post.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async () => {
      const apiKey = getApiKey();
      
      if (!apiKey) {
        return JSON.stringify({
          success: false,
          status: 'not_configured',
          message: 'Claw Post API key not configured. To use Claw Post: (1) Install the Chrome extension from the Chrome Web Store (ID: gebmgifdmnflfcehpbepkdnndkhgkchh), (2) Open the extension and complete pairing at clawpost.net, (3) Copy your API key and paste it on this demo page.',
          extensionUrl: 'https://chromewebstore.google.com/detail/claw-post/gebmgifdmnflfcehpbepkdnndkhgkchh',
          websiteUrl: 'https://clawpost.net'
        });
      }

      const healthResult = await clawpostFetch('/health', { skipAuth: true });
      if (!healthResult.success) {
        return JSON.stringify({
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Claw Post API is not reachable. Please try again later.',
          details: healthResult
        });
      }

      const usageResult = await clawpostFetch('/v1/usage');
      
      if (usageResult.statusCode === 401) {
        return JSON.stringify({
          success: false,
          status: 'invalid_key',
          error: 'INVALID_API_KEY',
          message: 'The API key is invalid or expired. Please check your API key at clawpost.net and update it on this page.',
          websiteUrl: 'https://clawpost.net'
        });
      }
      
      if (!usageResult.success) {
        return JSON.stringify(usageResult);
      }

      return JSON.stringify({
        success: true,
        status: 'ready',
        message: 'Claw Post is configured and ready to post.',
        ...usageResult
      });
    }
  },
  {
    name: 'clawpost_create_post',
    description: 'Create a post on a social media platform using Claw Post. Posts are made from the user\'s desktop Chrome browser where they are already logged in. Supported platforms: x (Twitter), linkedin, facebook, instagram, tiktok. Note: This posts as the user, not as a reply to someone else.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text content of the post'
        },
        platform: {
          type: 'string',
          enum: ['x', 'linkedin', 'facebook', 'instagram', 'tiktok'],
          description: 'The social media platform to post to'
        },
        groupId: {
          type: 'string',
          description: 'Optional Facebook group ID for posting to a specific group the user belongs to'
        }
      },
      required: ['text', 'platform']
    },
    execute: async (input) => {
      if (!input.text || !input.platform) {
        return JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Both text and platform are required'
        });
      }

      const validPlatforms = ['x', 'linkedin', 'facebook', 'instagram', 'tiktok'];
      if (!validPlatforms.includes(input.platform)) {
        return JSON.stringify({
          success: false,
          error: 'INVALID_PLATFORM',
          message: `Platform must be one of: ${validPlatforms.join(', ')}`
        });
      }

      const body = {
        text: input.text,
        platform: input.platform
      };

      if (input.groupId) {
        body.groupId = input.groupId;
      }

      const result = await clawpostFetch('/v1/jobs/tweet', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      return JSON.stringify(result);
    }
  },
  {
    name: 'clawpost_reddit_comment',
    description: 'Post a comment on a Reddit thread using Claw Post. The target URL must be a Reddit post URL containing /comments/. Comments are posted from the user\'s desktop Chrome browser where they are logged into Reddit.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text content of the Reddit comment'
        },
        targetUrl: {
          type: 'string',
          description: 'The Reddit post URL to comment on (must contain /comments/)'
        }
      },
      required: ['text', 'targetUrl']
    },
    execute: async (input) => {
      if (!input.text || !input.targetUrl) {
        return JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Both text and targetUrl are required'
        });
      }

      if (!input.targetUrl.includes('/comments/')) {
        return JSON.stringify({
          success: false,
          error: 'INVALID_TARGET_URL',
          message: 'Target URL must be a Reddit post URL containing /comments/'
        });
      }

      const result = await clawpostFetch('/v1/reddit/comment', {
        method: 'POST',
        body: JSON.stringify({
          text: input.text,
          targetUrl: input.targetUrl
        })
      });

      return JSON.stringify(result);
    }
  },
  {
    name: 'clawpost_job_status',
    description: 'Check the status of a Claw Post job. Returns the current state of a post job including whether it succeeded, failed, or is still pending. If successful, includes the URL of the published post.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'The job ID returned from clawpost_create_post or clawpost_reddit_comment'
        }
      },
      required: ['jobId']
    },
    execute: async (input) => {
      if (!input.jobId) {
        return JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'jobId is required'
        });
      }

      const result = await clawpostFetch(`/v1/jobs/${encodeURIComponent(input.jobId)}`);
      return JSON.stringify(result);
    }
  }
];

async function registerWebMCPTools() {
  const statusBox = document.getElementById('webmcp-status');
  const statusIndicator = statusBox.querySelector('.status-indicator');
  const statusText = statusBox.querySelector('.status-text');
  const toolsList = document.getElementById('tools-list');
  const registeredToolsUl = document.getElementById('registered-tools');

  if (!document.modelContext) {
    statusIndicator.className = 'status-indicator error';
    statusText.innerHTML = `
      WebMCP not available. To enable it:<br>
      <br>
      <strong>Option 1: Chrome Flag</strong><br>
      Go to <code>chrome://flags/#enable-webmcp-testing</code>, enable the flag, and restart Chrome.<br>
      <br>
      <strong>Option 2: ChatGPT In-App Browser</strong><br>
      Open this page in ChatGPT's in-app browser which has WebMCP built in.
    `;
    return;
  }

  if (typeof document.modelContext.registerTool !== 'function') {
    statusIndicator.className = 'status-indicator error';
    statusText.textContent = 'WebMCP detected but registerTool is not available. Make sure you have the latest Chrome with WebMCP support.';
    return;
  }

  let successCount = 0;
  let errors = [];

  for (const tool of toolDefinitions) {
    try {
      await document.modelContext.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: tool.execute
      });
      registeredTools.push(tool.name);
      successCount++;
    } catch (error) {
      errors.push(`${tool.name}: ${error.message}`);
    }
  }

  if (successCount === toolDefinitions.length) {
    statusIndicator.className = 'status-indicator success';
    statusText.textContent = `WebMCP ready. ${successCount} tools registered successfully.`;
  } else if (successCount > 0) {
    statusIndicator.className = 'status-indicator warning';
    statusText.textContent = `Partial success: ${successCount}/${toolDefinitions.length} tools registered.`;
  } else {
    statusIndicator.className = 'status-indicator error';
    statusText.textContent = 'Failed to register tools: ' + errors.join('; ');
    return;
  }

  toolsList.classList.remove('hidden');
  registeredToolsUl.innerHTML = '';
  for (const toolName of registeredTools) {
    const li = document.createElement('li');
    li.textContent = toolName;
    registeredToolsUl.appendChild(li);
  }
}

function initApiKeyUI() {
  const input = document.getElementById('api-key-input');
  const saveBtn = document.getElementById('save-key-btn');
  const clearBtn = document.getElementById('clear-key-btn');
  const keyStatus = document.getElementById('key-status');

  const existingKey = getApiKey();
  if (existingKey) {
    input.value = '••••••••••••••••';
    keyStatus.textContent = 'API key is saved in localStorage.';
    keyStatus.className = 'key-status saved';
  }

  saveBtn.addEventListener('click', () => {
    const key = input.value.trim();
    if (!key || key === '••••••••••••••••') {
      keyStatus.textContent = 'Please enter an API key.';
      keyStatus.className = 'key-status';
      return;
    }
    setApiKey(key);
    input.value = '••••••••••••••••';
    keyStatus.textContent = 'API key saved to localStorage.';
    keyStatus.className = 'key-status saved';
  });

  clearBtn.addEventListener('click', () => {
    setApiKey('');
    input.value = '';
    keyStatus.textContent = 'API key cleared.';
    keyStatus.className = 'key-status cleared';
  });

  input.addEventListener('focus', () => {
    if (input.value === '••••••••••••••••') {
      input.value = '';
    }
  });
}

function initTestUI() {
  const testStatusBtn = document.getElementById('test-status-btn');
  const testPostBtn = document.getElementById('test-post-btn');
  const testOutput = document.getElementById('test-output');

  async function runTest(toolName, input = {}) {
    testOutput.classList.remove('hidden');
    testOutput.textContent = `Running ${toolName}...`;

    const tool = toolDefinitions.find(t => t.name === toolName);
    if (!tool) {
      testOutput.textContent = `Error: Tool ${toolName} not found`;
      return;
    }

    try {
      const result = await tool.execute(input);
      testOutput.textContent = `${toolName} result:\n\n${JSON.stringify(JSON.parse(result), null, 2)}`;
    } catch (error) {
      testOutput.textContent = `${toolName} error:\n\n${error.message}`;
    }
  }

  testStatusBtn.addEventListener('click', () => runTest('clawpost_status'));
  
  testPostBtn.addEventListener('click', () => {
    const text = prompt('Enter post text (this will actually post if your extension is paired):');
    if (text) {
      const platform = prompt('Enter platform (x, linkedin, facebook, instagram, tiktok):');
      if (platform) {
        runTest('clawpost_create_post', { text, platform });
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initApiKeyUI();
  initTestUI();
  registerWebMCPTools();
});
