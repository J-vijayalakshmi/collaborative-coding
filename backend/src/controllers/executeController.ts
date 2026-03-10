import { Request, Response } from 'express';
import axios from 'axios';

// Language mapping for JDoodle
const LANGUAGE_MAP: Record<string, { language: string; versionIndex: string }> = {
  javascript: { language: 'nodejs', versionIndex: '4' },
  typescript: { language: 'typescript', versionIndex: '0' },
  python: { language: 'python3', versionIndex: '4' },
  java: { language: 'java', versionIndex: '4' },
  cpp: { language: 'cpp17', versionIndex: '0' },
  c: { language: 'c', versionIndex: '5' },
  csharp: { language: 'csharp', versionIndex: '4' },
  go: { language: 'go', versionIndex: '4' },
  rust: { language: 'rust', versionIndex: '4' },
  php: { language: 'php', versionIndex: '4' },
  ruby: { language: 'ruby', versionIndex: '4' },
  swift: { language: 'swift', versionIndex: '4' },
  kotlin: { language: 'kotlin', versionIndex: '3' },
};

export const executeCode = async (req: Request, res: Response) => {
  try {
    const { code, language, stdin = '' } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required',
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required',
      });
    }

    const langConfig = LANGUAGE_MAP[language];
    if (!langConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`,
        supportedLanguages: Object.keys(LANGUAGE_MAP),
      });
    }

    // JDoodle API request
    const jdoodlePayload = {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      language: langConfig.language,
      versionIndex: langConfig.versionIndex,
      stdin: stdin,
    };

    const response = await axios.post(
      process.env.JDOODLE_API_URL || 'https://api.jdoodle.com/v1/execute',
      jdoodlePayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const { output, statusCode, memory, cpuTime, error } = response.data;

    // Check for JDoodle errors
    if (statusCode !== 200 && error) {
      return res.status(200).json({
        success: false,
        error: error || 'Execution failed',
        output: output || '',
      });
    }

    return res.status(200).json({
      success: true,
      output: output || '',
      executionTime: cpuTime ? `${cpuTime}s` : undefined,
      memory: memory ? `${memory}KB` : undefined,
    });

  } catch (error: any) {
    console.error('Code execution error:', error.message);

    // Handle specific errors
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: 'Execution timed out. Your code took too long to run.',
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to execute code. Please try again.',
    });
  }
};

// Get credit usage (for monitoring JDoodle quota)
export const getCreditUsage = async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      'https://api.jdoodle.com/v1/credit-spent',
      {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      }
    );

    return res.status(200).json({
      success: true,
      creditsUsed: response.data.used,
      // Free tier: 200 credits/day
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch credit usage',
    });
  }
};
