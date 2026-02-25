import { CircuitBreaker, ConsecutiveBreaker, SamplingBreaker } from "cockatiel";
import { ILLMService, LLMRequest, LLMResponse } from "../shared/types";
import { getRedisClient, CacheKeys } from "../cache/RedisCacheService";

// Circuit breaker configurations
const CIRCUIT_BREAKER_CONFIG = {
  deepseek: {
    // Open after 30% failure rate in 60 seconds
    breaker: new SamplingBreaker({
      threshold: 0.3,
      duration: 60 * 1000,
      minimumRps: 5,
    }),
    timeout: 10000, // 10 seconds
    retryAttempts: 1,
  },
  gemini: {
    // Open after 50% failure rate in 60 seconds
    breaker: new SamplingBreaker({
      threshold: 0.5,
      duration: 60 * 1000,
      minimumRps: 3,
    }),
    timeout: 15000, // 15 seconds
    retryAttempts: 0,
  },
};

// LLM Provider implementations
class DeepSeekProvider implements ILLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || "";
    this.baseUrl = "https://api.deepseek.com/v1";
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: request.prompt }],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      model: "deepseek-chat",
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: request.prompt }],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

class GeminiProvider implements ILLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(
      `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.prompt }] }],
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      model: "gemini-pro",
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const response = await fetch(
      `${this.baseUrl}/models/gemini-pro:streamGenerateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.prompt }] }],
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) yield content;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

// AI Gateway with circuit breakers
export class AIGateway implements ILLMService {
  private deepseek: DeepSeekProvider;
  private gemini: GeminiProvider;
  private deepseekBreaker: CircuitBreaker;
  private geminiBreaker: CircuitBreaker;
  private redis: ReturnType<typeof getRedisClient>;

  constructor() {
    this.deepseek = new DeepSeekProvider();
    this.gemini = new GeminiProvider();
    this.deepseekBreaker = new CircuitBreaker({
      breaker: CIRCUIT_BREAKER_CONFIG.deepseek.breaker,
    });
    this.geminiBreaker = new CircuitBreaker({
      breaker: CIRCUIT_BREAKER_CONFIG.gemini.breaker,
    });
    this.redis = getRedisClient();
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Try DeepSeek first (primary)
    if (this.deepseekBreaker.currentState === "closed") {
      try {
        const result = await this.deepseekBreaker.execute(() =>
          this.withTimeout(
            this.deepseek.complete(request),
            CIRCUIT_BREAKER_CONFIG.deepseek.timeout
          )
        );
        return result;
      } catch (error) {
        console.warn("DeepSeek failed, falling back to Gemini:", error);
      }
    }

    // Fallback to Gemini
    if (this.geminiBreaker.currentState === "closed") {
      try {
        const result = await this.geminiBreaker.execute(() =>
          this.withTimeout(
            this.gemini.complete(request),
            CIRCUIT_BREAKER_CONFIG.gemini.timeout
          )
        );
        return result;
      } catch (error) {
        console.warn("Gemini also failed:", error);
        throw new Error("All AI providers temporarily unavailable");
      }
    }

    // Both circuits open - try stale cache or fail
    throw new Error("All AI providers temporarily unavailable. Please try again later.");
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    // Try DeepSeek first
    if (this.deepseekBreaker.currentState === "closed") {
      try {
        yield* this.deepseekBreaker.execute(() => this.deepseek.stream(request)
        );
        return;
      } catch (error) {
        console.warn("DeepSeek streaming failed, falling back to Gemini:", error);
      }
    }

    // Fallback to Gemini
    if (this.geminiBreaker.currentState === "closed") {
      try {
        yield* this.geminiBreaker.execute(() => this.gemini.stream(request)
        );
        return;
      } catch (error) {
        console.warn("Gemini streaming also failed:", error);
      }
    }

    throw new Error("All AI providers temporarily unavailable");
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), ms)
      ),
    ]);
  }

  // Get current circuit breaker status
  getStatus(): {
    deepseek: "closed" | "open" | "half-open";
    gemini: "closed" | "open" | "half-open";
  } {
    return {
      deepseek: this.deepseekBreaker.currentState,
      gemini: this.geminiBreaker.currentState,
    };
  }
}

// Singleton instance
let aiGateway: AIGateway | null = null;

export function getAIGateway(): AIGateway {
  if (!aiGateway) {
    aiGateway = new AIGateway();
  }
  return aiGateway;
}

export default AIGateway;
