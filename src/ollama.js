const OLLAMA_URL = "http://localhost:11434/api/generate";

export async function ask(prompt) {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:1b",
        prompt,
        stream: false,
        temperature: 0,
        seed: 42,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}.`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    const details = `${error?.message ?? ""} ${error?.cause?.message ?? ""}`;
    if (/fetch failed|ECONNREFUSED|ENOTFOUND/i.test(details)) {
      throw new Error(
        "Could not connect to Ollama at http://localhost:11434. Please start Ollama and try again.",
        { cause: error },
      );
    }
    throw error;
  }
}
