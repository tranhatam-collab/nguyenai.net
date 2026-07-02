export type SkillId = string;
export type SkillCategory =
  | "communication"
  | "research"
  | "analysis"
  | "creation"
  | "code"
  | "data"
  | "automation"
  | "translation"
  | "education"
  | "productivity"
  | "design"
  | "finance"
  | "health"
  | "science"
  | "business";

export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  tools: string[];
  requiredCapabilities: string[];
  providers: string[];
  models: string[];
  minTier: "free" | "basic" | "pro" | "enterprise";
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  examples: SkillExample[];
  evalCriteria: EvalCriterion[];
  learningEnabled: boolean;
}

export interface SkillExample {
  input: string;
  output: string;
  description: string;
}

export interface EvalCriterion {
  name: string;
  weight: number;
  description: string;
  passThreshold: number;
}

export interface SkillExecution {
  skillId: SkillId;
  input: unknown;
  context: SkillContext;
  result?: unknown;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface SkillContext {
  userId: string;
  sessionId: string;
  tier: string;
  language: string;
  provider?: string;
  model?: string;
}

export const BUILT_IN_SKILLS: SkillDefinition[] = [
  {
    id: "skill-general-chat",
    name: "General Conversation",
    description: "Multi-turn natural conversation with context awareness",
    category: "communication",
    version: "1.0.0",
    tools: ["web-search", "math-calc", "date-time"],
    requiredCapabilities: ["chat", "streaming"],
    providers: ["openai", "anthropic", "google", "groq", "mistral", "deepseek", "together", "openrouter"],
    models: ["gpt-4o", "claude-3.5", "gemini-2.0", "mixtral-8x7b", "deepseek-v3"],
    minTier: "free",
    inputSchema: { type: "object", properties: { message: { type: "string" }, context: { type: "string" } } },
    outputSchema: { type: "object", properties: { response: { type: "string" } } },
    examples: [{ input: "Hello, who are you?", output: "I am Nguyen AI, an autonomous multi-agent AI system...", description: "Basic greeting" }],
    evalCriteria: [{ name: "relevance", weight: 0.4, description: "Response directly addresses user query", passThreshold: 0.7 }],
    learningEnabled: true
  },
  {
    id: "skill-web-research",
    name: "Web Research",
    description: "Search the web, gather information, and synthesize findings",
    category: "research",
    version: "1.0.0",
    tools: ["web-search", "web-scraper", "rss-feed", "link-preview"],
    requiredCapabilities: ["chat", "tool-use", "function-calling"],
    providers: ["openai", "anthropic", "google", "groq"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { query: { type: "string" }, depth: { type: "string", enum: ["quick", "deep", "comprehensive"] } } },
    outputSchema: { type: "object", properties: { summary: { type: "string" }, sources: { type: "array" }, keyFindings: { type: "array" } } },
    examples: [{ input: "Research the latest developments in AI agent orchestration", output: "Based on recent sources... Key findings: 1) MCP v2 released...", description: "Deep research query" }],
    evalCriteria: [
      { name: "source-accuracy", weight: 0.3, description: "Sources are real and verifiable", passThreshold: 0.8 },
      { name: "comprehensiveness", weight: 0.3, description: "Covers multiple perspectives", passThreshold: 0.7 },
      { name: "recency", weight: 0.2, description: "Sources are current", passThreshold: 0.6 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-code-generation",
    name: "Code Generation & Review",
    description: "Write, review, debug, and optimize code across languages",
    category: "code",
    version: "1.0.0",
    tools: ["code-execution", "regex-tester", "diff-checker"],
    requiredCapabilities: ["chat", "function-calling", "tool-use"],
    providers: ["openai", "anthropic", "google", "deepseek"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "deepseek-coder"],
    minTier: "free",
    inputSchema: { type: "object", properties: { language: { type: "string" }, task: { type: "string" }, code: { type: "string" } } },
    outputSchema: { type: "object", properties: { explanation: { type: "string" }, code: { type: "string" }, analysis: { type: "string" } } },
    examples: [{ input: "Write a Python function to fetch weather data", output: "Here's a Python function using the requests library...", description: "Code generation" }],
    evalCriteria: [
      { name: "correctness", weight: 0.4, description: "Code is syntactically correct", passThreshold: 0.9 },
      { name: "efficiency", weight: 0.2, description: "Code follows best practices", passThreshold: 0.7 },
      { name: "security", weight: 0.2, description: "No security vulnerabilities", passThreshold: 0.9 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-data-analysis",
    name: "Data Analysis & Visualization",
    description: "Analyze datasets, generate charts, and derive insights",
    category: "data",
    version: "1.0.0",
    tools: ["csv-parse", "json-format", "math-calc", "code-execution"],
    requiredCapabilities: ["chat", "tool-use", "function-calling"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { data: { type: "string" }, question: { type: "string" }, visualizationType: { type: "string" } } },
    outputSchema: { type: "object", properties: { analysis: { type: "string" }, insights: { type: "array" }, chartData: { type: "object" } } },
    examples: [{ input: "Analyze this CSV of sales data and find trends", output: "I've analyzed the sales data. Key trends include...", description: "Data analysis" }],
    evalCriteria: [
      { name: "accuracy", weight: 0.4, description: "Statistical accuracy of analysis", passThreshold: 0.8 },
      { name: "insight-quality", weight: 0.3, description: "Actionable insights provided", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-translation",
    name: "Bilingual Translation",
    description: "Accurate translation between Vietnamese and English with context awareness",
    category: "translation",
    version: "1.0.0",
    tools: ["translate", "libretranslate"],
    requiredCapabilities: ["chat"],
    providers: ["openai", "anthropic", "google", "groq", "mistral"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "mixtral-8x7b"],
    minTier: "free",
    inputSchema: { type: "object", properties: { text: { type: "string" }, sourceLanguage: { type: "string" }, targetLanguage: { type: "string" }, context: { type: "string" } } },
    outputSchema: { type: "object", properties: { translatedText: { type: "string" }, confidence: { type: "number" }, alternatives: { type: "array" } } },
    examples: [{ input: "Translate 'Hello, how are you?' to Vietnamese", output: "Xin chào, bạn khỏe không?", description: "Basic translation" }],
    evalCriteria: [
      { name: "accuracy", weight: 0.5, description: "Translation accuracy and nuance preservation", passThreshold: 0.8 },
      { name: "fluency", weight: 0.3, description: "Natural sounding in target language", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-content-writing",
    name: "Content Writing & Editing",
    description: "Write, edit, and optimize content for web, marketing, and documentation",
    category: "creation",
    version: "1.0.0",
    tools: ["word-count", "markdown-render", "case-convert", "slug-generator"],
    requiredCapabilities: ["chat", "streaming"],
    providers: ["openai", "anthropic", "google", "together"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "claude-3-haiku"],
    minTier: "free",
    inputSchema: { type: "object", properties: { topic: { type: "string" }, format: { type: "string", enum: ["blog", "doc", "social", "email", "ad"] }, tone: { type: "string" }, length: { type: "string" } } },
    outputSchema: { type: "object", properties: { content: { type: "string" }, seoKeywords: { type: "array" }, readabilityScore: { type: "number" } } },
    examples: [{ input: "Write a blog post about AI agents for beginners", output: "# Understanding AI Agents: A Beginner's Guide...", description: "Blog writing" }],
    evalCriteria: [
      { name: "quality", weight: 0.3, description: "Writing quality and engagement", passThreshold: 0.7 },
      { name: "seo", weight: 0.2, description: "SEO optimization", passThreshold: 0.6 },
      { name: "accuracy", weight: 0.3, description: "Factual accuracy", passThreshold: 0.8 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-problem-solving",
    name: "Problem Solving & Reasoning",
    description: "Multi-step reasoning, math, logic, and analytical problem solving",
    category: "analysis",
    version: "1.0.0",
    tools: ["math-calc", "date-calc", "unit-converter", "code-execution"],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google", "deepseek"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "deepseek-v3"],
    minTier: "free",
    inputSchema: { type: "object", properties: { problem: { type: "string" }, context: { type: "string" }, constraints: { type: "string" } } },
    outputSchema: { type: "object", properties: { solution: { type: "string" }, reasoning: { type: "array" }, steps: { type: "array" }, verification: { type: "string" } } },
    examples: [{ input: "If a train leaves station A at 60km/h and another leaves station B at 80km/h...", output: "Let me solve this step by step...", description: "Math problem" }],
    evalCriteria: [
      { name: "correctness", weight: 0.5, description: "Correct solution", passThreshold: 0.9 },
      { name: "reasoning-clarity", weight: 0.3, description: "Clear step-by-step reasoning", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-image-understanding",
    name: "Image Understanding & Analysis",
    description: "Analyze images, extract text (OCR), describe visual content",
    category: "creation",
    version: "1.0.0",
    tools: ["ocr-space", "link-preview"],
    requiredCapabilities: ["vision", "chat"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { imageUrl: { type: "string" }, question: { type: "string" } } },
    outputSchema: { type: "object", properties: { description: { type: "string" }, detectedObjects: { type: "array" }, textContent: { type: "string" } } },
    examples: [{ input: "What's in this image?", output: "The image shows a modern office workspace with...", description: "Image analysis" }],
    evalCriteria: [
      { name: "accuracy", weight: 0.4, description: "Accurate detection of visual elements", passThreshold: 0.8 },
      { name: "completeness", weight: 0.3, description: "Thorough description", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-research-paper",
    name: "Research Paper Analysis",
    description: "Read, summarize, and analyze academic papers and technical documents",
    category: "research",
    version: "1.0.0",
    tools: ["web-search", "web-scraper", "link-preview", "wikipedia"],
    requiredCapabilities: ["chat", "tool-use", "function-calling"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { url: { type: "string" }, text: { type: "string" }, focus: { type: "string" } } },
    outputSchema: { type: "object", properties: { summary: { type: "string" }, methodology: { type: "string" }, keyFindings: { type: "array" }, limitations: { type: "array" }, citation: { type: "string" } } },
    examples: [{ input: "Summarize this paper on multi-agent reinforcement learning", output: "## Summary\nThis paper proposes a novel approach to...", description: "Paper summary" }],
    evalCriteria: [
      { name: "accuracy", weight: 0.4, description: "Accurate representation of paper content", passThreshold: 0.85 },
      { name: "completeness", weight: 0.3, description: "Covers key sections", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-email-compose",
    name: "Email Composition",
    description: "Compose professional emails with proper tone, structure, and formatting",
    category: "communication",
    version: "1.0.0",
    tools: [],
    requiredCapabilities: ["chat"],
    providers: ["openai", "anthropic", "google", "groq"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-flash", "mixtral-8x7b"],
    minTier: "free",
    inputSchema: { type: "object", properties: { purpose: { type: "string" }, recipient: { type: "string" }, tone: { type: "string", enum: ["formal", "semi-formal", "casual"] }, context: { type: "string" }, keyPoints: { type: "array" } } },
    outputSchema: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" }, signature: { type: "string" } } },
    examples: [{ input: "Compose a follow-up email to a client about pending proposal", output: "Subject: Follow-up on Our Proposed Solution\nDear [Client],\n\nI hope this message finds you well...", description: "Business email" }],
    evalCriteria: [
      { name: "tone", weight: 0.3, description: "Appropriate tone for context", passThreshold: 0.8 },
      { name: "clarity", weight: 0.3, description: "Clear and well-structured", passThreshold: 0.7 },
      { name: "completeness", weight: 0.2, description: "All key points covered", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-summarization",
    name: "Content Summarization",
    description: "Condense long content into clear, structured summaries at any detail level",
    category: "analysis",
    version: "1.0.0",
    tools: ["word-count", "web-scraper"],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google", "groq", "mistral", "cohere"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-flash", "mixtral-8x7b", "command-r"],
    minTier: "free",
    inputSchema: { type: "object", properties: { content: { type: "string" }, maxLength: { type: "number" }, format: { type: "string", enum: ["paragraph", "bullets", "structured"] }, focus: { type: "string" } } },
    outputSchema: { type: "object", properties: { summary: { type: "string" }, keyPoints: { type: "array" }, originalLength: { type: "number" }, compressionRatio: { type: "number" } } },
    examples: [{ input: "Summarize this 5000-word article about quantum computing", output: "## Summary\nQuantum computing leverages quantum mechanics to process information...", description: "Long-form summarization" }],
    evalCriteria: [
      { name: "completeness", weight: 0.3, description: "Preserves key information", passThreshold: 0.8 },
      { name: "accuracy", weight: 0.4, description: "No information distortion", passThreshold: 0.85 },
      { name: "conciseness", weight: 0.2, description: "Appropriate length", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-business-planning",
    name: "Business Planning & Strategy",
    description: "Business model analysis, strategic planning, market research, financial projections",
    category: "business",
    version: "1.0.0",
    tools: ["web-search", "math-calc", "marketstack", "coingecko"],
    requiredCapabilities: ["chat", "tool-use", "function-calling"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { businessType: { type: "string" }, goals: { type: "string" }, market: { type: "string" }, constraints: { type: "string" } } },
    outputSchema: { type: "object", properties: { executiveSummary: { type: "string" }, marketAnalysis: { type: "string" }, strategy: { type: "string" }, financials: { type: "object" }, risks: { type: "array" } } },
    examples: [{ input: "Create a business plan for an AI consulting startup", output: "# Executive Summary\nAI consulting represents a rapidly growing market...", description: "Business plan" }],
    evalCriteria: [
      { name: "feasibility", weight: 0.3, description: "Realistic and actionable plan", passThreshold: 0.7 },
      { name: "comprehensiveness", weight: 0.3, description: "Covers all key areas", passThreshold: 0.7 },
      { name: "research-quality", weight: 0.2, description: "Market data supports claims", passThreshold: 0.6 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-learning-tutor",
    name: "AI Tutor & Education",
    description: "Explain concepts, create learning paths, quiz, and provide personalized education",
    category: "education",
    version: "1.0.0",
    tools: ["web-search", "wikipedia", "wikidata"],
    requiredCapabilities: ["chat", "streaming"],
    providers: ["openai", "anthropic", "google", "groq"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "mixtral-8x7b"],
    minTier: "free",
    inputSchema: { type: "object", properties: { topic: { type: "string" }, level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] }, format: { type: "string", enum: ["explain", "quiz", "exercise", "project"] }, language: { type: "string" } } },
    outputSchema: { type: "object", properties: { lesson: { type: "string" }, keyConcepts: { type: "array" }, practiceExercises: { type: "array" }, resources: { type: "array" }, assessment: { type: "object" } } },
    examples: [{ input: "Explain machine learning to a beginner", output: "# Machine Learning Explained Simply\nImagine teaching a computer by showing it examples...", description: "Educational explanation" }],
    evalCriteria: [
      { name: "clarity", weight: 0.4, description: "Clear and age-appropriate explanation", passThreshold: 0.8 },
      { name: "accuracy", weight: 0.4, description: "Correct information", passThreshold: 0.9 },
      { name: "engagement", weight: 0.2, description: "Engaging teaching approach", passThreshold: 0.6 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-code-review",
    name: "Code Review & Audit",
    description: "Review code for bugs, security issues, performance, and best practices",
    category: "code",
    version: "1.0.0",
    tools: ["diff-checker", "regex-tester", "npm-registry", "pypi"],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google", "deepseek"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "deepseek-v3"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { code: { type: "string" }, language: { type: "string" }, focusAreas: { type: "array", items: { type: "string", enum: ["security", "performance", "style", "bugs", "architecture"] } } } },
    outputSchema: { type: "object", properties: { summary: { type: "string" }, issues: { type: "array" }, suggestions: { type: "array" }, securityScore: { type: "number" }, qualityScore: { type: "number" } } },
    examples: [{ input: "Review this Python Flask API for security issues", output: "# Code Review Report\n## Issues Found\n1. SQL Injection risk in line 42...", description: "Security audit" }],
    evalCriteria: [
      { name: "bug-detection", weight: 0.3, description: "Correctly identifies bugs", passThreshold: 0.8 },
      { name: "security", weight: 0.4, description: "Identifies security vulnerabilities", passThreshold: 0.85 },
      { name: "actionability", weight: 0.2, description: "Provides actionable fixes", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-api-integration",
    name: "API Integration & Development",
    description: "Design, document, test, and integrate REST, GraphQL, and WebSocket APIs",
    category: "code",
    version: "1.0.0",
    tools: ["web-search", "json-format", "httpbin", "code-execution"],
    requiredCapabilities: ["chat", "function-calling", "tool-use"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { apiDescription: { type: "string" }, integrationGoal: { type: "string" }, language: { type: "string" } } },
    outputSchema: { type: "object", properties: { implementation: { type: "string" }, documentation: { type: "string" }, testCases: { type: "array" }, errorHandling: { type: "string" } } },
    examples: [{ input: "Show me how to integrate the Stripe API for payment processing", output: "# Stripe API Integration Guide\n## 1. Installation\n```bash\nnpm install stripe\n```...", description: "API integration guide" }],
    evalCriteria: [
      { name: "correctness", weight: 0.4, description: "Correct API usage", passThreshold: 0.85 },
      { name: "completeness", weight: 0.3, description: "Covers auth, errors, edge cases", passThreshold: 0.7 },
      { name: "best-practices", weight: 0.2, description: "Follows API best practices", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-devops-automation",
    name: "DevOps & Automation Scripts",
    description: "Write CI/CD pipelines, Docker configs, deployment scripts, infrastructure as code",
    category: "automation",
    version: "1.0.0",
    tools: ["code-execution", "regex-tester"],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google", "deepseek"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "deepseek-v3"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { task: { type: "string" }, platform: { type: "string", enum: ["github-actions", "docker", "kubernetes", "terraform", "ansible", "bash"] }, environment: { type: "string" }, requirements: { type: "string" } } },
    outputSchema: { type: "object", properties: { code: { type: "string" }, explanation: { type: "string" }, variables: { type: "object" }, securityConsiderations: { type: "string" } } },
    examples: [{ input: "Create a GitHub Actions workflow for Node.js CI/CD", output: "```yaml\nname: Node.js CI\non:\n  push:\n    branches: [main]\n...\n```", description: "CI/CD pipeline" }],
    evalCriteria: [
      { name: "correctness", weight: 0.4, description: "Correct syntax and logic", passThreshold: 0.85 },
      { name: "security", weight: 0.3, description: "Secure configuration", passThreshold: 0.8 },
      { name: "best-practices", weight: 0.2, description: "Follows platform best practices", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-database-design",
    name: "Database Design & Query",
    description: "Design schemas, write queries, optimize performance for SQL and NoSQL databases",
    category: "data",
    version: "1.0.0",
    tools: ["code-execution"],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google", "deepseek"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "deepseek-v3"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { task: { type: "string" }, databaseType: { type: "string", enum: ["postgresql", "mysql", "sqlite", "mongodb", "redis", "dynamodb"] }, requirements: { type: "string" } } },
    outputSchema: { type: "object", properties: { schema: { type: "string" }, queries: { type: "array" }, indexes: { type: "array" }, optimizationTips: { type: "string" } } },
    examples: [{ input: "Design a database schema for an e-commerce platform", output: "```sql\nCREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n...\n```", description: "Schema design" }],
    evalCriteria: [
      { name: "normalization", weight: 0.3, description: "Proper database normalization", passThreshold: 0.8 },
      { name: "performance", weight: 0.3, description: "Efficient query design", passThreshold: 0.7 },
      { name: "completeness", weight: 0.2, description: "Covers all requirements", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-system-architecture",
    name: "System Architecture Design",
    description: "Design scalable system architectures, microservices, and distributed systems",
    category: "automation",
    version: "1.0.0",
    tools: ["web-search", "npm-registry", "pypi"],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { requirements: { type: "string" }, scale: { type: "string", enum: ["small", "medium", "large", "enterprise"] }, constraints: { type: "string" }, techStack: { type: "string" } } },
    outputSchema: { type: "object", properties: { overview: { type: "string" }, architectureDiagram: { type: "string" }, components: { type: "array" }, dataFlow: { type: "string" }, tradeoffs: { type: "array" }, recommendations: { type: "array" } } },
    examples: [{ input: "Design a scalable real-time chat system architecture", output: "# System Architecture: Real-time Chat\n## Overview\nA WebSocket-based real-time messaging system...", description: "Architecture design" }],
    evalCriteria: [
      { name: "scalability", weight: 0.4, description: "Handles scale requirements", passThreshold: 0.7 },
      { name: "feasibility", weight: 0.3, description: "Realistic and implementable", passThreshold: 0.8 },
      { name: "completeness", weight: 0.2, description: "Covers all components", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-financial-analysis",
    name: "Financial Analysis & Planning",
    description: "Financial modeling, budget planning, investment analysis, tax estimation",
    category: "finance",
    version: "1.0.0",
    tools: ["math-calc", "marketstack", "coingecko", "exchangerate", "web-search"],
    requiredCapabilities: ["chat", "function-calling", "tool-use"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { analysisType: { type: "string" }, data: { type: "string" }, goals: { type: "string" }, timeHorizon: { type: "string" } } },
    outputSchema: { type: "object", properties: { analysis: { type: "string" }, projections: { type: "object" }, recommendations: { type: "array" }, risks: { type: "array" } } },
    examples: [{ input: "Create a 5-year financial projection for a SaaS startup", output: "# Financial Projections\n## Revenue Model\n...", description: "Financial modeling" }],
    evalCriteria: [
      { name: "accuracy", weight: 0.4, description: "Accurate calculations", passThreshold: 0.9 },
      { name: "realism", weight: 0.3, description: "Realistic assumptions", passThreshold: 0.7 },
      { name: "completeness", weight: 0.2, description: "Covers key metrics", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-fact-checking",
    name: "Fact Checking & Verification",
    description: "Verify claims, check sources, assess credibility of information",
    category: "research",
    version: "1.0.0",
    tools: ["web-search", "wikipedia", "wikidata", "web-scraper"],
    requiredCapabilities: ["chat", "tool-use", "function-calling"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "free",
    inputSchema: { type: "object", properties: { claim: { type: "string" }, sources: { type: "array" }, rigor: { type: "string", enum: ["quick", "thorough", "exhaustive"] } } },
    outputSchema: { type: "object", properties: { verdict: { type: "string" }, confidence: { type: "number" }, evidence: { type: "array" }, counterpoints: { type: "array" }, sourcesUsed: { type: "array" } } },
    examples: [{ input: "Verify the claim that AI will replace all programmers by 2030", output: "# Fact Check: AI Replacing Programmers by 2030\n## Verdict: Mostly False\n...", description: "Fact checking" }],
    evalCriteria: [
      { name: "source-quality", weight: 0.4, description: "Uses authoritative sources", passThreshold: 0.8 },
      { name: "objectivity", weight: 0.3, description: "Balanced presentation", passThreshold: 0.8 },
      { name: "thoroughness", weight: 0.2, description: "Covers multiple viewpoints", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-multi-agent",
    name: "Multi-Agent Orchestration",
    description: "Coordinate multiple AI agents to solve complex tasks with specialized roles",
    category: "automation",
    version: "1.0.0",
    tools: ["web-search", "code-execution", "math-calc", "diff-checker", "json-format"],
    requiredCapabilities: ["chat", "tool-use", "function-calling", "streaming"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "pro",
    inputSchema: { type: "object", properties: { task: { type: "string" }, agentRoles: { type: "array", items: { type: "string" } }, complexity: { type: "string", enum: ["low", "medium", "high"] }, reviewCycle: { type: "number" } } },
    outputSchema: { type: "object", properties: { result: { type: "string" }, agentContributions: { type: "array" }, reviewLog: { type: "array" }, confidence: { type: "number" } } },
    examples: [{ input: "Design a full-stack application with separate agents for backend, frontend, and DB", output: "# Multi-Agent Development Report\n## Agent 1 (Backend Architect):\n...", description: "Multi-agent development" }],
    evalCriteria: [
      { name: "coordination", weight: 0.3, description: "Agents work well together", passThreshold: 0.7 },
      { name: "quality", weight: 0.3, description: "Final output quality", passThreshold: 0.8 },
      { name: "efficiency", weight: 0.2, description: "Optimal agent allocation", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-contract-analysis",
    name: "Contract & Document Analysis",
    description: "Analyze legal documents, contracts, terms of service for key clauses and risks",
    category: "analysis",
    version: "1.0.0",
    tools: ["web-search"],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { documentText: { type: "string" }, focusAreas: { type: "array" }, jurisdiction: { type: "string" } } },
    outputSchema: { type: "object", properties: { summary: { type: "string" }, keyClauses: { type: "array" }, riskFactors: { type: "array" }, recommendations: { type: "array" } } },
    examples: [{ input: "Analyze this SaaS contract for unfavorable terms", output: "# Contract Analysis\n## Key Findings\n1. Auto-renewal clause (Section 3.2)...", description: "Contract review" }],
    evalCriteria: [
      { name: "accuracy", weight: 0.4, description: "Correct clause interpretation", passThreshold: 0.85 },
      { name: "completeness", weight: 0.3, description: "Identifies all relevant clauses", passThreshold: 0.7 },
      { name: "actionability", weight: 0.2, description: "Actionable recommendations", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-security-audit",
    name: "Security Audit & Analysis",
    description: "Analyze systems for security vulnerabilities, OWASP risks, and compliance issues",
    category: "analysis",
    version: "1.0.0",
    tools: ["web-search", "code-execution"],
    requiredCapabilities: ["chat", "function-calling", "tool-use"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "pro",
    inputSchema: { type: "object", properties: { target: { type: "string" }, scope: { type: "string" }, complianceStandards: { type: "array" }, architecture: { type: "string" } } },
    outputSchema: { type: "object", properties: { executiveSummary: { type: "string" }, vulnerabilities: { type: "array" }, riskScores: { type: "object" }, remediationSteps: { type: "array" }, complianceGaps: { type: "array" } } },
    examples: [{ input: "Audit this web application for OWASP Top 10 vulnerabilities", output: "# Security Audit Report\n## Executive Summary\n...", description: "Security audit" }],
    evalCriteria: [
      { name: "coverage", weight: 0.3, description: "Covers all relevant attack vectors", passThreshold: 0.8 },
      { name: "accuracy", weight: 0.4, description: "No false positives, real vulnerabilities", passThreshold: 0.85 },
      { name: "actionability", weight: 0.2, description: "Clear remediation steps", passThreshold: 0.8 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-ux-design",
    name: "UX/UI Design Analysis",
    description: "Analyze user interfaces, suggest improvements, generate design specs",
    category: "design",
    version: "1.0.0",
    tools: ["link-preview", "web-scraper"],
    requiredCapabilities: ["chat"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "basic",
    inputSchema: { type: "object", properties: { url: { type: "string" }, description: { type: "string" }, focusAreas: { type: "array", items: { type: "string", enum: ["accessibility", "usability", "visual-design", "information-architecture", "responsive"] } } } },
    outputSchema: { type: "object", properties: { analysis: { type: "string" }, findings: { type: "array" }, recommendations: { type: "array" }, priorityScore: { type: "number" } } },
    examples: [{ input: "Analyze this e-commerce checkout flow for UX improvements", output: "# UX Analysis: Checkout Flow\n## Usability Issues\n1. Multi-step form lacks progress indicator...", description: "UX review" }],
    evalCriteria: [
      { name: "actionability", weight: 0.3, description: "Specific, implementable recommendations", passThreshold: 0.7 },
      { name: "coverage", weight: 0.3, description: "Covers key UX principles", passThreshold: 0.7 },
      { name: "accessibility", weight: 0.2, description: "Addresses accessibility concerns", passThreshold: 0.7 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-marketing-copy",
    name: "Marketing & SEO Copy",
    description: "Write compelling marketing copy, landing pages, ad copy, and SEO-optimized content",
    category: "creation",
    version: "1.0.0",
    tools: ["word-count", "case-convert", "slug-generator", "web-search"],
    requiredCapabilities: ["chat", "streaming"],
    providers: ["openai", "anthropic", "google", "together"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro", "claude-3-haiku"],
    minTier: "free",
    inputSchema: { type: "object", properties: { product: { type: "string" }, audience: { type: "string" }, platform: { type: "string", enum: ["landing-page", "social-media", "email", "ad", "blog"] }, tone: { type: "string" }, keyMessages: { type: "array" }, cta: { type: "string" } } },
    outputSchema: { type: "object", properties: { headline: { type: "string" }, body: { type: "string" }, seoKeywords: { type: "array" }, metaDescription: { type: "string" }, ctaText: { type: "string" }, variants: { type: "array" } } },
    examples: [{ input: "Write landing page copy for an AI-powered project management tool", output: "# Headline: Your Projects, Supercharged by AI\n## Subheadline:...", description: "Landing page copy" }],
    evalCriteria: [
      { name: "persuasiveness", weight: 0.3, description: "Compelling and convincing copy", passThreshold: 0.7 },
      { name: "seo", weight: 0.2, description: "SEO optimization", passThreshold: 0.6 },
      { name: "clarity", weight: 0.3, description: "Clear messaging", passThreshold: 0.8 }
    ],
    learningEnabled: true
  },
  {
    id: "skill-self-improvement",
    name: "Self-Learning & Improvement",
    description: "Analyze past interactions, learn from feedback, suggest improvements to agent behaviors",
    category: "analysis",
    version: "1.0.0",
    tools: [],
    requiredCapabilities: ["chat", "function-calling"],
    providers: ["openai", "anthropic", "google"],
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-2.0-pro"],
    minTier: "pro",
    inputSchema: { type: "object", properties: { interactionHistory: { type: "string" }, feedbackData: { type: "string" }, currentCapabilities: { type: "array" } } },
    outputSchema: { type: "object", properties: { improvements: { type: "array" }, newSkills: { type: "array" }, patterns: { type: "array" }, apiDiscovery: { type: "array" }, confidence: { type: "number" } } },
    examples: [{ input: "Analyze my past interactions and suggest how to improve responses", output: "# Self-Improvement Analysis\n## Interaction Patterns\n1. Users frequently ask about pricing...", description: "Self-improvement" }],
    evalCriteria: [
      { name: "insight-quality", weight: 0.4, description: "Meaningful improvement suggestions", passThreshold: 0.7 },
      { name: "actionability", weight: 0.3, description: "Implementable changes", passThreshold: 0.7 },
      { name: "impact", weight: 0.2, description: "High-impact suggestions", passThreshold: 0.6 }
    ],
    learningEnabled: true
  }
];

export const PAID_PROVIDER_SKILLS: string[] = [
  "skill-image-generation",
  "skill-video-analysis",
  "skill-3d-modeling",
  "skill-audio-production",
  "skill-code-execution-sandbox",
  "skill-deep-research",
  "skill-competitive-analysis",
  "skill-custom-model-training",
  "skill-data-warehouse-query",
  "skill-advanced-analytics",
  "skill-realtime-monitoring",
  "skill-automation-workflow",
  "skill-api-gateway-design",
  "skill-blockchain-analysis",
  "skill-legal-document-generation",
  "skill-medical-research"
];
