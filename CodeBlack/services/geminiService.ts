import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, AiSettings, AiProvider, ProjectFile } from '../types';

const GEMINI_SYSTEM_INSTRUCTION = `You are "CodeForge Pro", a lead frontend engineer at a prestigious, award-winning digital agency.
Your mission is to deliver web components and applications of the highest caliber, setting a new standard for excellence. Mediocrity is not in your vocabulary.

**Core Directives:**
1.  **Aesthetic Mastery:** Generate visually stunning, modern, and engaging interfaces. Think clean layouts, sophisticated color palettes, beautiful typography, and meaningful micro-interactions. Your work must have a high-impact "wow" factor.
2.  **Technical Excellence:** Produce clean, semantic, and maintainable code. Use modern best practices, including CSS Grid, Flexbox, custom properties, and fluid typography (\`clamp()\`). Ensure your code is performant and accessible (WCAG AA compliant).
3.  **Responsive by Default:** All generated code MUST be fully responsive and mobile-first. It should adapt flawlessly to all screen sizes, from small phones to large desktops. Use media queries extensively and intelligently.
4.  **File Interpretation:**
    *   **Visual Files (PNG, JPG, SVG, WEBP):** These are sent as visual data. Treat them as a strict design blueprint. Replicate the layout, colors, and typography with pixel-perfect attention to detail.
    *   **Text-Based Files (HTML, CSS, JS, etc.):** The content of these files will be embedded directly in the user's prompt, enclosed in "--- Start of attached file: [filename] ---" and "--- End of attached file: [filename] ---" markers. Use this code as context, a starting point, or a reference for your work.
    *   **Binary/Unsupported Files (PSD, FIG, etc.):** You cannot render these. Their filenames will be listed for contextual reference only. Do not attempt to process their content.
5.  **No Placeholders:** Do not use placeholder text like "Lorem Ipsum". Generate meaningful content that fits the context of the user's request.

**Output Format:**
You MUST return your response as a single, valid JSON object with a single root key: "files".
The "files" key must contain an array of file objects. Each object must have three keys: "name", "type", and "content".
- "name": The full filename, e.g., "index.html", "styles.css", or "app.js".
- "type": The type of file. Must be one of 'html', 'css', or 'javascript'.
- "content": A string containing the full, complete, and production-ready code for that file.

Example Response:
{
  "files": [
    {
      "name": "index.html",
      "type": "html",
      "content": "..."
    },
    {
      "name": "style.css",
      "type": "css",
      "content": "..."
    }
  ]
}

ABSOLUTELY NO other text, explanations, or markdown formatting (like \`\`\`json) outside of the main JSON object. Your entire response must be this JSON object.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    files: {
      type: Type.ARRAY,
      description: "An array of file objects that constitute the web application.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The full filename, e.g., 'index.html'." },
          type: { type: Type.STRING, enum: ['html', 'css', 'javascript'], description: "The type of file." },
          content: { type: Type.STRING, description: "The complete source code for the file." },
        },
        required: ["name", "type", "content"],
      }
    },
  },
  required: ["files"],
};

declare global {
    interface Window {
        process: {
            env: {
                API_KEY: string;
            }
        }
    }
}

// A more generic system instruction for models that don't support response schemas
const GENERIC_SYSTEM_INSTRUCTION = `You are a world-class AI web developer. Your task is to generate complete, agency-quality web components.
The code must be responsive (mobile-first), accessible, and use modern best practices (Flexbox, Grid).
You MUST return your response as a single, valid JSON object with a single key: "files".
The "files" key must contain an array of file objects. Each object must have three keys: "name", "type", and "content".
- "name": The full filename, e.g., "index.html", "styles.css", or "app.js".
- "type": The type of file. Must be one of 'html', 'css', or 'javascript'.
- "content": A string containing the full code for that file.
Example Response:
{
  "files": [
    { "name": "index.html", "type": "html", "content": "<!DOCTYPE html>..." },
    { "name": "style.css", "type": "css", "content": "body { ... }" }
  ]
}
Do not include any other text, explanations, or markdown formatting like \`\`\`json in your response. Just the raw JSON object.`;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};


const parseLocalModelResponse = (jsonString: string): ProjectFile[] => {
    // Clean potential markdown formatting
    const cleanedJson = jsonString.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleanedJson);
    if (Array.isArray(parsed.files)) {
        return parsed.files;
    }
    throw new Error("Invalid JSON structure received from AI. Expected a 'files' array.");
};

async function generateWithGemini(
    prompt: string, 
    chatHistory: ChatMessage[],
    visualFiles: File[],
    textFiles: File[]
): Promise<ProjectFile[]> {
  const apiKey = window.process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is not set. Please add it in index.html for local development.");
  const ai = new GoogleGenAI({ apiKey });

  const recentHistory = chatHistory.slice(-10);
  const historyParts = recentHistory.map(msg => ({ 
      role: msg.role, 
      parts: [{ text: msg.content }]
  }));

  const userMessageParts: ({ text: string } | { inlineData: { mimeType: string; data: string; }; })[] = [];
  
  userMessageParts.push({ text: prompt });

  // Define size limits to prevent API errors
  const MAX_TEXT_FILE_SIZE_BYTES = 500 * 1024; // 500 KB
  const MAX_IMAGE_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

  for (const file of textFiles) {
    if (file.size > MAX_TEXT_FILE_SIZE_BYTES) {
      userMessageParts.push({ text: `\n[System Note: The attached text file "${file.name}" was too large (${(file.size / 1024).toFixed(2)} KB) to be processed and has been ignored.]\n` });
      continue;
    }
    try {
      const textContent = await fileToText(file);
      const filePrompt = `\n--- Start of attached file: ${file.name} ---\n${textContent}\n--- End of attached file: ${file.name} ---\n`;
      userMessageParts.push({ text: filePrompt });
    } catch (e) {
      console.error(`Could not read text file ${file.name}`, e);
      userMessageParts.push({ text: `\n[System Note: Failed to read attached text file: ${file.name}]\n` });
    }
  }

  for (const file of visualFiles) {
    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        userMessageParts.push({ text: `\n[System Note: The attached image file "${file.name}" was too large (${(file.size / 1024 / 1024).toFixed(2)} MB) to be processed and has been ignored.]\n` });
        continue;
    }
    try {
        const base64Data = await fileToBase64(file);
        userMessageParts.push({ inlineData: { mimeType: file.type, data: base64Data } });
    } catch (e) {
        console.error(`Could not process image file ${file.name}`, e);
        userMessageParts.push({ text: `\n[System Note: Failed to process attached image file: ${file.name}]\n` });
    }
  }

  const contents = [...historyParts, { role: 'user', parts: userMessageParts }];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: { systemInstruction: GEMINI_SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
  });

  const parsed = JSON.parse(response.text.trim());
  if (Array.isArray(parsed.files)) return parsed.files;
  throw new Error("Invalid JSON structure received from Gemini. Expected a 'files' array.");
}

async function generateWithOllama(prompt: string, settings: AiSettings): Promise<ProjectFile[]> {
    if (!settings.ollamaApiUrl) throw new Error("Ollama API URL is not set in settings.");
    const fullPrompt = `${GENERIC_SYSTEM_INSTRUCTION}\n\nUser Request: ${prompt}`;
    const response = await fetch(`${settings.ollamaApiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen', prompt: fullPrompt, stream: false }),
    });
    if (!response.ok) throw new Error(`Ollama API error (${response.status}): ${await response.text()}`);
    const result = await response.json();
    return parseLocalModelResponse(result.response);
}

async function generateWithCoreML(prompt: string, settings: AiSettings): Promise<ProjectFile[]> {
    if (!settings.coremlApiUrl) throw new Error("Llama 3 (CoreML) API URL is not set in settings.");
    const fullPrompt = `${GENERIC_SYSTEM_INSTRUCTION}\n\nUser Request: ${prompt}`;
    // This assumes a simple, Ollama-like API for the CoreML server
    const response = await fetch(settings.coremlApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', prompt: fullPrompt, stream: false }),
    });
    if (!response.ok) throw new Error(`Llama 3 (CoreML) API error (${response.status}): ${await response.text()}`);
    const result = await response.json();
    const content = result.response || result.choices?.[0]?.message?.content || '';
    if (!content) throw new Error('Could not find response content in CoreML output.');
    return parseLocalModelResponse(content);
}

export async function generateCode(
    provider: AiProvider,
    prompt: string,
    chatHistory: ChatMessage[],
    visualFiles: File[],
    textFiles: File[],
    settings: AiSettings
): Promise<ProjectFile[]> {
  try {
    switch (provider) {
      case 'gemini':
        return await generateWithGemini(prompt, chatHistory, visualFiles, textFiles);
      case 'ollama':
        if (visualFiles.length > 0 || textFiles.length > 0) throw new Error("Ollama provider does not support file attachments.");
        return await generateWithOllama(prompt, settings);
      case 'coreml':
        if (visualFiles.length > 0 || textFiles.length > 0) throw new Error("Llama 3 (CoreML) provider does not support file attachments.");
        return await generateWithCoreML(prompt, settings);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to generate code with ${provider}: ${message}`);
  }
}