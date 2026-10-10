// Using Node's native fetch (available in Node 18+)

const LANGUAGE_MAPPING = {
  'c': 103,
  'cpp': 105,
  'java': 91,
  'python': 92,
  'javascript': 93
};

/**
 * Execute code using Judge0 CE, preferring RapidAPI when credentials are set.
 */
const executeCodeOnSandbox = async (language, sourceCode, stdin = '') => {
  const apiKey = process.env.RAPIDAPI_KEY;
  const useRapidApi = Boolean(apiKey && apiKey !== 'your_rapidapi_key_here');
  const apiBaseUrl = useRapidApi ? 'https://judge0-ce.p.rapidapi.com' : 'https://ce.judge0.com';

  const langId = LANGUAGE_MAPPING[language.toLowerCase()];
  if (!langId) {
    throw new Error(`Unsupported programming language for compile sandbox: ${language}`);
  }

  // Base64 encode inputs to secure transmission and prevent syntax issues
  const sourceBase64 = Buffer.from(sourceCode).toString('base64');
  const stdinBase64 = Buffer.from(stdin).toString('base64');

  const url = `${apiBaseUrl}/submissions?base64_encoded=true&wait=${useRapidApi ? 'false' : 'true'}`;
  const headers = {
    'content-type': 'application/json'
  };
  if (useRapidApi) {
    headers['x-rapidapi-host'] = 'judge0-ce.p.rapidapi.com';
    headers['x-rapidapi-key'] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: sourceBase64,
        language_id: langId,
        stdin: stdinBase64
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Judge0 API create submission failed: ${errText}`);
    }

    let result = await response.json();

    if (useRapidApi) {
      const { token } = result;
      if (!token) throw new Error("Did not receive a token from Judge0.");

      let statusId = 1;
      let attempts = 0;

      while ((statusId === 1 || statusId === 2) && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

        const statusRes = await fetch(`${apiBaseUrl}/submissions/${token}?base64_encoded=true`, {
          headers
        });

        if (!statusRes.ok) {
          throw new Error(`Judge0 status query failed: ${statusRes.statusText}`);
        }

        result = await statusRes.json();
        statusId = result.status_id;
      }

      if (statusId === 1 || statusId === 2) {
        throw new Error("Timed out waiting for sandbox execution.");
      }
    } else if (result.status_id === 1 || result.status_id === 2) {
      throw new Error("Judge0 CE returned before execution completed.");
    }

    if (!result) throw new Error("Timed out waiting for sandbox execution.");

    // Base64 decode results
    const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf8') : '';
    const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf8') : '';
    const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf8') : '';
    const message = result.message ? Buffer.from(result.message, 'base64').toString('utf8') : '';

    return {
      status: result.status.description, // e.g. "Accepted", "Wrong Answer", "Runtime Error"
      stdout,
      stderr,
      compile_output: compileOutput || message,
      time: result.time ? `${Math.round(parseFloat(result.time) * 1000)}ms` : '0ms',
      memory: result.memory ? `${Math.round(result.memory / 1024)}MB` : '0MB'
    };
  } catch (err) {
    console.error("❌ Sandbox compilation error:", err.message);
    throw err;
  }
};

module.exports = { executeCodeOnSandbox };
