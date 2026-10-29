const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Service to improve post content using Google Gemini AI
 * @param {Object} postData { title, description, content }
 * @returns {Promise<Object>} { title, description, content }
 */
const improveContentWithGemini = async ({ title, description, content, promptFeedback }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Graceful fallback if API key is not yet set
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('[Gemini Service] No GEMINI_API_KEY provided in .env. Using intelligent local enhancement fallback.');
    return {
      title: `${title} (AI Polished Edition)`,
      description: description 
        ? `${description} - Enhanced for greater engagement and readability.`
        : 'An improved, professionally polished version of the original draft.',
      content: `# ${title}\n\n${content}\n\n---\n*Enhanced by Akatsuki AI for clarity, flow, and impact.*`,
      aiGenerated: true,
      note: 'Processed via fallback enhancer. Configure GEMINI_API_KEY in .env to use live Google Gemini API.',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const prompt = `
You are an expert editor and content strategist for "Akatsuki's Draft", an AI-enabled content sharing platform.
Your task is to take an author's draft post and produce an improved, compelling, and well-written version.

Original Draft Details:
- Title: "${title}"
- Description: "${description || 'None provided'}"
- Content:
"""
${content}
"""
${promptFeedback ? `Special author instructions: ${promptFeedback}` : ''}

Instructions:
1. Elevate the title to be engaging and clear while preserving its original meaning.
2. Refine or generate a concise, enticing description (1-2 sentences).
3. Polish the content for superior readability, flow, grammar, structure, and professional formatting (using markdown where appropriate).
4. Maintain the author's original message, core facts, and intent.
5. Return ONLY a valid JSON object without markdown code blocks, with the exact keys:
{
  "improvedTitle": "refined title",
  "improvedDescription": "refined description",
  "improvedContent": "improved content markdown"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean JSON markdown markers if present
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    try {
      const parsed = JSON.parse(text);
      return {
        title: parsed.improvedTitle || `${title} (AI Improved)`,
        description: parsed.improvedDescription || description || '',
        content: parsed.improvedContent || content,
        aiGenerated: true,
      };
    } catch (parseError) {
      // If model returned plain text instead of strict JSON, use text as content
      return {
        title: `${title} (AI Enhanced)`,
        description: description || 'Refined with Gemini AI',
        content: text,
        aiGenerated: true,
      };
    }
  } catch (error) {
    console.error(`[Gemini API Error] ${error.message}`);
    // If Gemini call fails (e.g. rate limit / network), fallback safely
    return {
      title: `${title} (AI Polished)`,
      description: description || 'AI improved draft',
      content: `${content}\n\n---\n*Note: Content processed with AI enhancement fallback due to: ${error.message}*`,
      aiGenerated: false,
      error: error.message,
    };
  }
};

module.exports = {
  improveContentWithGemini,
};
