// Using Node's native fetch (available in Node 18+)

const LANGUAGE_MAPPING = {
  'c': 74,          // C (GCC 13)
  'cpp': 75,        // C++ (GCC 13)
  'java': 91,       // Java (OpenJDK 17)
  'python': 92,     // Python (3.11.2)
  'javascript': 93  // JavaScript (Node.js 18)
};

/**
 * Execute code securely using Judge0 API (via RapidAPI).
 * Falls back to null if RapidAPI credentials are not present.
 */
const executeCodeOnSandbox = async (language, sourceCode, stdin = '') => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey || apiKey === 'your_rapidapi_key_here') {
    console.log("ℹ️ No RAPIDAPI_KEY found, bypassing Judge0 compile sandbox.");
    return null;
  }

  const langId = LANGUAGE_MAPPING[language.toLowerCase()];
  if (!langId) {
    throw new Error(`Unsupported programming language for compile sandbox: ${language}`);
  }

  // Base64 encode inputs to secure transmission and prevent syntax issues
  const sourceBase64 = Buffer.from(sourceCode).toString('base64');
  const stdinBase64 = Buffer.from(stdin).toString('base64');

  const url = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false';
  const headers = {
    'content-type': 'application/json',
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'x-rapidapi-key': apiKey
  };

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

    const { token } = await response.json();
    if (!token) throw new Error("Did not receive a token from Judge0.");

    // Poll Judge0 until execution is done
    let statusId = 1; // 1: In Queue, 2: Processing, 3: Accepted, etc.
    let attempts = 0;
    let result = null;

    while ((statusId === 1 || statusId === 2) && attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      const statusRes = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`, {
        headers
      });

      if (!statusRes.ok) {
        throw new Error(`Judge0 status query failed: ${statusRes.statusText}`);
      }

      result = await statusRes.json();
      statusId = result.status_id;
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
