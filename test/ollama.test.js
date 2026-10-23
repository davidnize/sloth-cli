import test from "node:test";
import assert from "node:assert/strict";
import { ask } from "../src/ollama.js";

const originalFetch = global.fetch;

test("ask sends request and returns response text", async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { response: "hello from ollama" };
      },
    };
  };

  const response = await ask("hello");

  assert.equal(response, "hello from ollama");
  assert.equal(calls[0].url, "http://localhost:11434/api/generate");
  assert.equal(calls[0].options.method, "POST");
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.model, "gemma3:1b");
  assert.equal(body.prompt, "hello");
  assert.equal(body.stream, false);
  assert.equal(body.temperature, 0);
  assert.equal(body.seed, 42);
});

test("ask throws friendly error when ollama is unavailable", async () => {
  global.fetch = async () => {
    throw new TypeError("fetch failed");
  };

  await assert.rejects(
    () => ask("hello"),
    /Could not connect to Ollama at http:\/\/localhost:11434/,
  );
});

test.after(() => {
  global.fetch = originalFetch;
});
