export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  try {
    const { messages = [] } = req.body || {};
    const contents = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
      .slice(-20)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    const systemInstruction = {
      parts: [{
        text:
          "You are a friendly Class 9 school doubt solver. " +
          "Explain Maths, Science, English, Social Science and general school questions " +
          "in simple age-appropriate language. Teach step by step instead of only giving final answers. " +
          "Use examples when helpful. If a question is ambiguous, ask a short clarifying question. " +
          "Do not encourage cheating or unsafe behavior."
      }]
    };

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: systemInstruction,
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini request failed."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") ||
      "I couldn't generate an answer. Please try again.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ error: "Something went wrong while contacting Gemini." });
  }
}
