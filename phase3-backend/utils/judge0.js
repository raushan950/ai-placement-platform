// Using Node's native fetch (available in Node 18+)

const LANGUAGE_MAPPING = {
  'c': 103,
  'cpp': 105,
  'java': 91,
  'python': 92,
  'javascript': 93
};

const buildCppSolutionHarness = (sourceCode, stdin) => {
  if (!/\bclass\s+Solution\b/.test(sourceCode) || /\bmain\s*\(/.test(sourceCode)) return null;

  const signature = sourceCode.match(/\b(bool|int|long\s+long|double|string|std::string|vector\s*<\s*int\s*>)\s+(\w+)\s*\(([^)]*)\)\s*\{/);
  if (!signature) return null;

  const [, returnType, methodName, rawParameters] = signature;
  const lines = stdin.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  let inputIndex = 0;
  const argumentsList = [];
  const declarations = [];

  for (const rawParameter of rawParameters.split(',').filter(parameter => parameter.trim())) {
    const parameter = rawParameter.trim().match(/^(.*?)\s+([A-Za-z_]\w*)$/);
    if (!parameter) return null;

    const type = parameter[1].replace(/\bconst\b/g, '').replace(/\bstd::/g, '').replace(/[&*]/g, '').replace(/\s+/g, '').trim();
    const line = lines[inputIndex++];
    if (!line) return null;

    if (type === 'vector<int>') {
      const arrayLiteral = line.match(/\[[^\]]*\]/)?.[0];
      if (!arrayLiteral) return null;
      const values = arrayLiteral.match(/-?\d+/g) || [];
      const variableName = parameter[2];
      declarations.push(`vector<int> ${variableName}{${values.join(',')}};`);
      argumentsList.push(variableName);
    } else if (['int', 'longlong', 'double', 'bool'].includes(type)) {
      const scalar = line.includes('=') ? line.slice(line.lastIndexOf('=') + 1).trim() : line;
      const value = scalar.match(/-?(?:\d+\.?\d*|\.\d+)/)?.[0];
      if (!value) return null;
      argumentsList.push(value);
    } else if (type === 'string') {
      const rawValue = line.includes('=') ? line.slice(line.indexOf('=') + 1).trim() : line;
      const value = rawValue.replace(/^(["'])(.*)\1$/, '$2');
      argumentsList.push(JSON.stringify(value));
    } else {
      return null;
    }
  }

  return `#include <bits/stdc++.h>\nusing namespace std;\n${sourceCode}\ntemplate <typename T> void printResult(const T& value) { cout << boolalpha << value; }\ntemplate <typename T> void printResult(const vector<T>& values) { cout << '['; for (size_t i = 0; i < values.size(); ++i) { if (i) cout << ','; printResult(values[i]); } cout << ']'; }\nint main() { ${declarations.join(' ')} Solution solution; auto result = solution.${methodName}(${argumentsList.join(', ')}); printResult(result); return 0; }`;
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

module.exports = { executeCodeOnSandbox, buildCppSolutionHarness };
