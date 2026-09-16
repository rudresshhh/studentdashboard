export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  // Get the API key from Vercel environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API key is not configured on the server.",
    });
  }

  try {
    const { messages = [] } = req.body || {};

    // Keep only valid user/assistant messages
    const contents = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.text === "string" &&
          m.text.trim().length > 0
      )
      .slice(-20)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: m.text,
          },
        ],
      }));

    // Instructions for the Class 9 AI tutor
    const systemInstruction = {
      parts: [
        {
          text:
            "You are a friendly Class 9 school doubt solver. " +
            "Explain Maths, Science, English, Social Science and general school questions " +
            "in simple, age-appropriate language. " +
            "Teach step by step instead of only giving final answers. " +
            "Use examples when helpful. " +
            "For Maths and Science, show the reasoning and important formulas. " +
            "If a question is ambiguous, ask a short clarifying question. " +
            "Do not encourage cheating or unsafe behavior.",
        },
      ],
    };

    // Current Gemini model
    const model = "gemini-3.6-flash";

    // Gemini Generate Content REST endpoint
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },

      body: JSON.stringify({
        systemInstruction,

        contents,

        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200,
        },
      }),
    });

    // Safely read the response
    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Gemini returned non-JSON response:", responseText);

      return res.status(502).json({
        error: "Gemini returned an invalid response.",
      });
    }

    // Handle Gemini API errors
    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed.",
      });
    }

    // Extract Gemini's response text
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() ||
      "I couldn't generate an answer. Please try asking the question again.";

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("Gemini server error:", error);

    return res.status(500).json({
      error:
        "Something went wrong while contacting Gemini. Please try again.",
    });
  }
}