export type ToolId = string;
export type ToolCategory =
  | "web"
  | "search"
  | "data"
  | "code"
  | "file"
  | "image"
  | "audio"
  | "video"
  | "communication"
  | "analytics"
  | "ai"
  | "utility"
  | "finance"
  | "geography"
  | "science"
  | "health"
  | "education"
  | "social"
  | "news"
  | "weather"
  | "translation"
  | "ecommerce"
  | "blockchain"
  | "business"
  | "automation";

export type ToolAuthType = "none" | "api-key" | "oauth" | "byok" | "gateway-key";

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  authType: ToolAuthType;
  requiresApiKey: boolean;
  freeTier: boolean;
  paidTier: boolean;
  provider?: string;
  url?: string;
  docsUrl?: string;
  rateLimited?: boolean;
  parameters: ToolParameter[];
  returns: ToolReturns;
  example?: string;
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  enum?: string[];
  default?: unknown;
}

export interface ToolReturns {
  type: string;
  description: string;
  contentType?: string;
}

export interface ToolCallRequest {
  toolId: ToolId;
  parameters: Record<string, unknown>;
  apiKey?: string;
  userId?: string;
}

export interface ToolCallResponse {
  success: boolean;
  data: unknown;
  error?: string;
  latency: number;
  source: string;
}

export interface FreeApiRegistry {
  id: string;
  name: string;
  url: string;
  category: ToolCategory;
  description: string;
  authType: ToolAuthType;
  docsUrl: string;
  rateLimit: string;
  provides: string[];
  requiresKey: boolean;
}

export const BUILT_IN_FREE_APIS: FreeApiRegistry[] = [
  {
    id: "web-search-public",
    name: "Web Search (public)",
    url: "https://api.duckduckgo.com",
    category: "search",
    description: "Anonymous web search via DuckDuckGo",
    authType: "none",
    docsUrl: "https://duckduckgo.com/api",
    rateLimit: "60/min",
    provides: ["web-search", "instant-answers"],
    requiresKey: false
  },
  {
    id: "wikipedia",
    name: "Wikipedia API",
    url: "https://en.wikipedia.org/w/api.php",
    category: "search",
    description: "Wikipedia article search and retrieval",
    authType: "none",
    docsUrl: "https://www.mediawiki.org/wiki/API:Main_page",
    rateLimit: "200/min",
    provides: ["encyclopedia", "references"],
    requiresKey: false
  },
  {
    id: "open-meteo",
    name: "Open-Meteo Weather",
    url: "https://api.open-meteo.com/v1",
    category: "weather",
    description: "Free weather forecasts and historical data",
    authType: "none",
    docsUrl: "https://open-meteo.com/en/docs",
    rateLimit: "10000/day",
    provides: ["weather", "forecast", "historical-weather"],
    requiresKey: false
  },
  {
    id: "newsapi",
    name: "News API",
    url: "https://newsapi.org/v2",
    category: "news",
    description: "Worldwide news headlines and articles",
    authType: "api-key",
    docsUrl: "https://newsapi.org/docs",
    rateLimit: "100/day (free tier)",
    provides: ["news-headlines", "article-search"],
    requiresKey: true
  },
  {
    id: "open-library",
    name: "Open Library API",
    url: "https://openlibrary.org",
    category: "education",
    description: "Free book metadata, covers, and availability",
    authType: "none",
    docsUrl: "https://openlibrary.org/developers/api",
    rateLimit: "unlimited (respectful use)",
    provides: ["book-search", "book-metadata"],
    requiresKey: false
  },
  {
    id: "public-apis",
    name: "Public APIs Explorer",
    url: "https://api.publicapis.org/entries",
    category: "utility",
    description: "Directory of free public APIs across all categories",
    authType: "none",
    docsUrl: "https://api.publicapis.org/",
    rateLimit: "60/min",
    provides: ["api-discovery", "api-registry"],
    requiresKey: false
  },
  {
    id: "rest-countries",
    name: "REST Countries",
    url: "https://restcountries.com/v3.1",
    category: "geography",
    description: "Country data, flags, capitals, currencies, languages",
    authType: "none",
    docsUrl: "https://restcountries.com/",
    rateLimit: "30/min",
    provides: ["country-info", "geography-data"],
    requiresKey: false
  },
  {
    id: "jokeapi",
    name: "JokeAPI",
    url: "https://v2.jokeapi.dev/joke",
    category: "utility",
    description: "Curated jokes across multiple categories",
    authType: "none",
    docsUrl: "https://jokeapi.dev/",
    rateLimit: "120/min",
    provides: ["humor", "entertainment"],
    requiresKey: false
  },
  {
    id: "coingecko",
    name: "CoinGecko API",
    url: "https://api.coingecko.com/api/v3",
    category: "finance",
    description: "Cryptocurrency prices, market data, exchange rates",
    authType: "none",
    docsUrl: "https://www.coingecko.com/en/api",
    rateLimit: "30/min (free tier)",
    provides: ["crypto-prices", "market-data"],
    requiresKey: false
  },
  {
    id: "exchangerate",
    name: "ExchangeRate-API",
    url: "https://open.er-api.com/v6/latest",
    category: "finance",
    description: "Free currency exchange rates",
    authType: "none",
    docsUrl: "https://open.er-api.com/",
    rateLimit: "1500/month (free)",
    provides: ["forex-rates", "currency-conversion"],
    requiresKey: false
  },
  {
    id: "ip-api",
    name: "IP-API.com",
    url: "http://ip-api.com/json",
    category: "utility",
    description: "IP geolocation and network info",
    authType: "none",
    docsUrl: "http://ip-api.com/docs",
    rateLimit: "45/min (free tier)",
    provides: ["geolocation", "ip-lookup"],
    requiresKey: false
  },
  {
    id: "nasa-open",
    name: "NASA Open APIs",
    url: "https://api.nasa.gov",
    category: "science",
    description: "NASA data including astronomy, Mars rover, earth imagery",
    authType: "api-key",
    docsUrl: "https://api.nasa.gov/",
    rateLimit: "1000/hour (free tier)",
    provides: ["astronomy", "space-data", "earth-imagery"],
    requiresKey: true
  },
  {
    id: "thecatapi",
    name: "TheCatAPI",
    url: "https://api.thecatapi.com/v1",
    category: "utility",
    description: "Cat images and breed information",
    authType: "api-key",
    docsUrl: "https://thecatapi.com/",
    rateLimit: "unlimited (free tier)",
    provides: ["animal-images", "breed-info"],
    requiresKey: true
  },
  {
    id: "dogapi",
    name: "DogAPI",
    url: "https://api.thedogapi.com/v1",
    category: "utility",
    description: "Dog images and breed information",
    authType: "api-key",
    docsUrl: "https://thedogapi.com/",
    rateLimit: "unlimited (free tier)",
    provides: ["animal-images", "breed-info"],
    requiresKey: true
  },
  {
    id: "open-notify",
    name: "Open Notify",
    url: "http://api.open-notify.org",
    category: "science",
    description: "ISS location, astronaut in space data",
    authType: "none",
    docsUrl: "http://open-notify.org/",
    rateLimit: "60/min",
    provides: ["iss-location", "space-people"],
    requiresKey: false
  },
  {
    id: "numbersapi",
    name: "Numbers API",
    url: "http://numbersapi.com",
    category: "utility",
    description: "Interesting facts about numbers, dates, years",
    authType: "none",
    docsUrl: "http://numbersapi.com/",
    rateLimit: "120/min",
    provides: ["number-facts", "date-facts"],
    requiresKey: false
  },
  {
    id: "boredapi",
    name: "Bored API",
    url: "https://www.boredapi.com/api/activity",
    category: "utility",
    description: "Find random activities when bored",
    authType: "none",
    docsUrl: "https://www.boredapi.com/",
    rateLimit: "unlimited",
    provides: ["activity-suggestions"],
    requiresKey: false
  },
  {
    id: "agify",
    name: "Agify.io",
    url: "https://api.agify.io",
    category: "utility",
    description: "Predict age from name",
    authType: "none",
    docsUrl: "https://agify.io/",
    rateLimit: "1000/day (free)",
    provides: ["age-prediction"],
    requiresKey: false
  },
  {
    id: "genderize",
    name: "Genderize.io",
    url: "https://api.genderize.io",
    category: "utility",
    description: "Predict gender from name",
    authType: "none",
    docsUrl: "https://genderize.io/",
    rateLimit: "1000/day (free)",
    provides: ["gender-prediction"],
    requiresKey: false
  },
  {
    id: "nationalize",
    name: "Nationalize.io",
    url: "https://api.nationalize.io",
    category: "utility",
    description: "Predict nationality from name",
    authType: "none",
    docsUrl: "https://nationalize.io/",
    rateLimit: "1000/day (free)",
    provides: ["nationality-prediction"],
    requiresKey: false
  },
  {
    id: "zipcode",
    name: "Zippopotamus",
    url: "https://api.zippopotam.us",
    category: "geography",
    description: "Zip code and postal code lookup worldwide",
    authType: "none",
    docsUrl: "https://zippopotam.us/",
    rateLimit: "30/min",
    provides: ["zip-code-lookup", "location-data"],
    requiresKey: false
  },
  {
    id: "rss-parser",
    name: "RSS Feed Parser",
    url: "built-in",
    category: "news",
    description: "Parse and read RSS/Atom feeds from any URL",
    authType: "none",
    docsUrl: "",
    rateLimit: "30/min",
    provides: ["feed-parsing", "content-aggregation"],
    requiresKey: false
  },
  {
    id: "web-scraper",
    name: "Web Scraper (basic)",
    url: "built-in",
    category: "web",
    description: "Extract content from public web pages",
    authType: "none",
    docsUrl: "",
    rateLimit: "20/min",
    provides: ["content-extraction", "web-reading"],
    requiresKey: false
  },
  {
    id: "mathjs",
    name: "Math.js Evaluator",
    url: "built-in",
    category: "data",
    description: "Evaluate mathematical expressions and formulas",
    authType: "none",
    docsUrl: "",
    rateLimit: "120/min",
    provides: ["computation", "math", "statistics"],
    requiresKey: false
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    url: "built-in",
    category: "utility",
    description: "Generate UUID v4 identifiers",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["id-generation"],
    requiresKey: false
  },
  {
    id: "password-generator",
    name: "Password Generator",
    url: "built-in",
    category: "utility",
    description: "Generate secure random passwords",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["security", "password-creation"],
    requiresKey: false
  },
  {
    id: "qr-generator",
    name: "QR Code Generator",
    url: "https://api.qrserver.com/v1/create-qr-code",
    category: "utility",
    description: "Generate QR codes from text or URLs",
    authType: "none",
    docsUrl: "https://goqr.me/api/",
    rateLimit: "60/min",
    provides: ["qr-code", "encoding"],
    requiresKey: false
  },
  {
    id: "timezone",
    name: "Timezone API",
    url: "https://worldtimeapi.org/api/timezone",
    category: "utility",
    description: "Current time, timezone, and DST info worldwide",
    authType: "none",
    docsUrl: "https://worldtimeapi.org/",
    rateLimit: "60/min",
    provides: ["timezone-info", "current-time"],
    requiresKey: false
  },
  {
    id: "programming-quotes",
    name: "Programming Quotes",
    url: "https://programming-quotes-api.vercel.app",
    category: "education",
    description: "Random programming quotes and wisdom",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["quotes", "motivation"],
    requiresKey: false
  },
  {
    id: "metaphorpsum",
    name: "Metaphorpsum",
    url: "http://metaphorpsum.com",
    category: "utility",
    description: "Generate placeholder/filler text (lorem ipsum style)",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["text-generation", "placeholder"],
    requiresKey: false
  },
  {
    id: "tracking-api",
    name: "TrackingAPI",
    url: "https://api.trackingapi.org",
    category: "utility",
    description: "Package and shipment tracking from multiple carriers",
    authType: "api-key",
    docsUrl: "https://trackingapi.org/docs",
    rateLimit: "50/day (free tier)",
    provides: ["package-tracking", "shipping"],
    requiresKey: true
  },
  {
    id: "huggingface-inference",
    name: "Hugging Face Inference",
    url: "https://api-inference.huggingface.co/models",
    category: "ai",
    description: "Free AI model inference via Hugging Face",
    authType: "api-key",
    docsUrl: "https://huggingface.co/docs/api-inference/index",
    rateLimit: "30k input tokens/hour (free)",
    provides: ["text-generation", "image-classification", "translation", "summarization", "feature-extraction"],
    requiresKey: true
  },
  {
    id: "serp-api",
    name: "SERP API (free tier)",
    url: "https://serpapi.com",
    category: "search",
    description: "Google search results via API",
    authType: "api-key",
    docsUrl: "https://serpapi.com/manage-api-key",
    rateLimit: "100/month (free tier)",
    provides: ["google-search", "web-scraping"],
    requiresKey: true
  },
  {
    id: "marketstack",
    name: "Marketstack",
    url: "https://api.marketstack.com/v1",
    category: "finance",
    description: "Stock market data, end-of-day and intraday",
    authType: "api-key",
    docsUrl: "https://marketstack.com/documentation",
    rateLimit: "1000/month (free tier)",
    provides: ["stock-data", "market-prices"],
    requiresKey: true
  },
  {
    id: "twilio-sms",
    name: "Twilio SMS (trial)",
    url: "https://api.twilio.com/2010-04-01",
    category: "communication",
    description: "SMS sending and receiving via Twilio",
    authType: "api-key",
    docsUrl: "https://www.twilio.com/docs/sms",
    rateLimit: "varies by account",
    provides: ["sms", "messaging"],
    requiresKey: true
  },
  {
    id: "sendgrid-email",
    name: "SendGrid Email",
    url: "https://api.sendgrid.com/v3",
    category: "communication",
    description: "Transactional and marketing email sending",
    authType: "api-key",
    docsUrl: "https://docs.sendgrid.com/",
    rateLimit: "100/day (free tier)",
    provides: ["email", "notifications"],
    requiresKey: true
  },
  {
    id: "ipinfo",
    name: "IPinfo",
    url: "https://ipinfo.io",
    category: "utility",
    description: "IP address geolocation and network data",
    authType: "api-key",
    docsUrl: "https://ipinfo.io/developers",
    rateLimit: "50000/month (free tier)",
    provides: ["ip-geolocation", "network-data"],
    requiresKey: true
  },
  {
    id: "abstract-phone",
    name: "Abstract Phone Validation",
    url: "https://phonevalidation.abstractapi.com/v1",
    category: "utility",
    description: "International phone number validation",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/phone-validation-api",
    rateLimit: "1000/month (free tier)",
    provides: ["phone-validation", "carrier-lookup"],
    requiresKey: true
  },
  {
    id: "abstract-email",
    name: "Abstract Email Validation",
    url: "https://emailvalidation.abstractapi.com/v1",
    category: "utility",
    description: "Email address validation and quality check",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/email-validation-api",
    rateLimit: "1000/month (free tier)",
    provides: ["email-validation", "email-quality"],
    requiresKey: true
  },
  {
    id: "abstract-holidays",
    name: "Abstract Holidays",
    url: "https://holidays.abstractapi.com/v1",
    category: "utility",
    description: "Public and bank holidays by country and year",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/holidays-api",
    rateLimit: "1000/month (free tier)",
    provides: ["holiday-data", "calendar"],
    requiresKey: true
  },
  {
    id: "abstract-vat",
    name: "Abstract VAT",
    url: "https://vat.abstractapi.com/v1",
    category: "finance",
    description: "European VAT number validation and rates",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/vat-validation-rates-api",
    rateLimit: "1000/month (free tier)",
    provides: ["vat-validation", "tax-rates"],
    requiresKey: true
  },
  {
    id: "abstract-exchange",
    name: "Abstract Exchange Rates",
    url: "https://exchange-rates.abstractapi.com/v1",
    category: "finance",
    description: "Currency exchange rates and conversion",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/exchange-rate-api",
    rateLimit: "1000/month (free tier)",
    provides: ["exchange-rates", "currency-conversion"],
    requiresKey: true
  },
  {
    id: "abstract-company",
    name: "Abstract Company Enrichment",
    url: "https://companyenrichment.abstractapi.com/v1",
    category: "data",
    description: "Company data enrichment from domain or name",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/company-enrichment-api",
    rateLimit: "1000/month (free tier)",
    provides: ["company-data", "enrichment"],
    requiresKey: true
  },
  {
    id: "abstract-screenshot",
    name: "Abstract Website Screenshot",
    url: "https://screenshot.abstractapi.com/v1",
    category: "web",
    description: "Take screenshots of websites",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/website-screenshot-api",
    rateLimit: "100/month (free tier)",
    provides: ["screenshots", "website-capture"],
    requiresKey: true
  },
  {
    id: "abstract-timezone",
    name: "Abstract Timezone",
    url: "https://timezone.abstractapi.com/v1",
    category: "utility",
    description: "Timezone conversion and data by location",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/time-date-api",
    rateLimit: "1000/month (free tier)",
    provides: ["timezone-conversion", "date-info"],
    requiresKey: true
  },
  {
    id: "abstract-geolocation",
    name: "Abstract Geolocation",
    url: "https://geolocation.abstractapi.com/v1",
    category: "geography",
    description: "IP geolocation with city, region, country data",
    authType: "api-key",
    docsUrl: "https://www.abstractapi.com/ip-geolocation-api",
    rateLimit: "20000/month (free tier)",
    provides: ["ip-geolocation", "location-data"],
    requiresKey: true
  },
  {
    id: "pypi",
    name: "PyPI API",
    url: "https://pypi.org/pypi",
    category: "data",
    description: "Python package metadata and version info",
    authType: "none",
    docsUrl: "https://warehouse.pypa.io/api-reference/",
    rateLimit: "unlimited (respectful use)",
    provides: ["package-info", "version-check"],
    requiresKey: false
  },
  {
    id: "npm-registry",
    name: "npm Registry API",
    url: "https://registry.npmjs.org",
    category: "data",
    description: "npm package metadata and version lookup",
    authType: "none",
    docsUrl: "https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md",
    rateLimit: "unlimited (respectful use)",
    provides: ["package-info", "version-check"],
    requiresKey: false
  },
  {
    id: "rubygems",
    name: "RubyGems API",
    url: "https://rubygems.org/api/v1",
    category: "data",
    description: "Ruby gem metadata and download stats",
    authType: "none",
    docsUrl: "https://guides.rubygems.org/rubygems-org-api/",
    rateLimit: "unlimited (respectful use)",
    provides: ["gem-info", "download-stats"],
    requiresKey: false
  },
  {
    id: "crates-io",
    name: "crates.io API",
    url: "https://crates.io/api/v1",
    category: "data",
    description: "Rust crate metadata and version info",
    authType: "none",
    docsUrl: "https://crates.io/data-api",
    rateLimit: "unlimited (respectful use)",
    provides: ["crate-info", "dependency-check"],
    requiresKey: false
  },
  {
    id: "wikidata",
    name: "Wikidata Query",
    url: "https://www.wikidata.org/wiki/Special:EntityData",
    category: "search",
    description: "Structured knowledge graph from Wikidata",
    authType: "none",
    docsUrl: "https://www.wikidata.org/wiki/Wikidata:API",
    rateLimit: "unlimited (respectful use)",
    provides: ["knowledge-graph", "structured-data"],
    requiresKey: false
  },
  {
    id: "themoviedb",
    name: "The Movie Database (TMDB)",
    url: "https://api.themoviedb.org/3",
    category: "utility",
    description: "Movie, TV show, and actor metadata",
    authType: "api-key",
    docsUrl: "https://developers.themoviedb.org/3",
    rateLimit: "40 requests/10 seconds (free tier)",
    provides: ["movie-data", "tv-data", "cast-info", "recommendations"],
    requiresKey: true
  },
  {
    id: "gateway-image",
    name: "AI Provider Gateway — Image Gen",
    url: "https://aiagent.iai.one/v1/images/generations",
    category: "image",
    description: "Image generation via AI Provider Gateway (aiagent.iai.one). Per AI_PROVIDER_SINGLE_SOURCE_DECISION, all image generation goes through the gateway.",
    authType: "gateway-key",
    docsUrl: "https://aiagent.iai.one/docs",
    rateLimit: "by gateway tier",
    provides: ["image-generation", "image-editing"],
    requiresKey: true
  },
  {
    id: "github-trending",
    name: "GitHub Trending",
    url: "https://api.github.com",
    category: "data",
    description: "GitHub repository search, trending, and metadata",
    authType: "api-key",
    docsUrl: "https://docs.github.com/en/rest",
    rateLimit: "60/hour (unauthenticated), 5000/hour (authed)",
    provides: ["repo-search", "code-search", "trending"],
    requiresKey: true
  },
  {
    id: "stackoverflow",
    name: "Stack Exchange API",
    url: "https://api.stackexchange.com/2.3",
    category: "education",
    description: "Stack Overflow Q&A search and metadata",
    authType: "api-key",
    docsUrl: "https://api.stackexchange.com/docs",
    rateLimit: "300 requests/day (free tier)",
    provides: ["q-and-a", "code-help", "community-answers"],
    requiresKey: true
  },
  {
    id: "google-books",
    name: "Google Books API",
    url: "https://www.googleapis.com/books/v1",
    category: "education",
    description: "Search and retrieve book metadata",
    authType: "api-key",
    docsUrl: "https://developers.google.com/books",
    rateLimit: "1000/day (free tier)",
    provides: ["book-search", "book-info", "isbn-lookup"],
    requiresKey: true
  },
  {
    id: "open-trivia",
    name: "Open Trivia DB",
    url: "https://opentdb.com/api.php",
    category: "education",
    description: "Free trivia questions across categories",
    authType: "none",
    docsUrl: "https://opentdb.com/api_config.php",
    rateLimit: "unlimited",
    provides: ["trivia", "quiz-questions"],
    requiresKey: false
  },
  {
    id: "adviceslip",
    name: "Advice Slip",
    url: "https://api.adviceslip.com/advice",
    category: "utility",
    description: "Random advice for any situation",
    authType: "none",
    docsUrl: "https://api.adviceslip.com/",
    rateLimit: "unlimited",
    provides: ["advice", "wisdom"],
    requiresKey: false
  },
  {
    id: "kanye-rest",
    name: "Kanye Rest API",
    url: "https://api.kanye.rest",
    category: "utility",
    description: "Random Kanye West quotes",
    authType: "none",
    docsUrl: "https://kanye.rest/",
    rateLimit: "unlimited",
    provides: ["quotes", "entertainment"],
    requiresKey: false
  },
  {
    id: "geodb-cities",
    name: "GeoDB Cities",
    url: "https://wft-geo-db.p.rapidapi.com/v1/geo",
    category: "geography",
    description: "Worldwide city database search and population data",
    authType: "api-key",
    docsUrl: "https://rapidapi.com/wirefreethought/api/geodb-cities/",
    rateLimit: "1000/day (free tier via RapidAPI)",
    provides: ["city-search", "population-data", "geography"],
    requiresKey: true
  },
  {
    id: "spotify",
    name: "Spotify API",
    url: "https://api.spotify.com/v1",
    category: "audio",
    description: "Music search, artist/album metadata, playlist management",
    authType: "oauth",
    docsUrl: "https://developer.spotify.com/documentation/web-api/",
    rateLimit: "by auth tier",
    provides: ["music-search", "artist-info", "playlist-data"],
    requiresKey: true
  },
  {
    id: "youtube-data",
    name: "YouTube Data API",
    url: "https://www.googleapis.com/youtube/v3",
    category: "video",
    description: "YouTube video search, channel data, and metadata",
    authType: "api-key",
    docsUrl: "https://developers.google.com/youtube/v3",
    rateLimit: "10000 units/day (free tier)",
    provides: ["video-search", "channel-info", "video-stats"],
    requiresKey: true
  },
  {
    id: "wolfram-alpha",
    name: "Wolfram Alpha (BYOK)",
    url: "https://api.wolframalpha.com/v2",
    category: "science",
    description: "Knowledge computation, step-by-step solutions, expert data",
    authType: "api-key",
    docsUrl: "https://products.wolframalpha.com/api",
    rateLimit: "2000/month (free tier)",
    provides: ["computation", "knowledge", "step-by-step", "science"],
    requiresKey: true
  },
  {
    id: "ocr-space",
    name: "OCR.Space",
    url: "https://api.ocr.space/parse/image",
    category: "ai",
    description: "Free OCR — extract text from images and PDFs",
    authType: "api-key",
    docsUrl: "https://ocr.space/ocrapi",
    rateLimit: "25000/month (free tier)",
    provides: ["ocr", "text-extraction", "image-to-text"],
    requiresKey: true
  },
  {
    id: "deep-ai",
    name: "Deep AI (BYOK)",
    url: "https://api.deepai.org",
    category: "ai",
    description: "AI models for image colorization, super-resolution, NSFW detection",
    authType: "api-key",
    docsUrl: "https://deepai.org/api-docs/",
    rateLimit: "varies by key tier",
    provides: ["image-colorization", "super-resolution", "nsfw-detection", "text-generation"],
    requiresKey: true
  },
  {
    id: "imsea",
    name: "Imsea API",
    url: "https://imsea.herokuapp.com/api/1",
    category: "search",
    description: "Free image search across multiple engines",
    authType: "none",
    docsUrl: "https://github.com/DiwasAtim/Imsea",
    rateLimit: "unlimited",
    provides: ["image-search", "visual-search"],
    requiresKey: false
  },
  {
    id: "unsplash",
    name: "Unsplash API",
    url: "https://api.unsplash.com",
    category: "image",
    description: "High-quality free stock photos and photographer data",
    authType: "api-key",
    docsUrl: "https://unsplash.com/developers",
    rateLimit: "50/hour (free tier)",
    provides: ["stock-photos", "photography"],
    requiresKey: true
  },
  {
    id: "pixabay",
    name: "Pixabay API",
    url: "https://pixabay.com/api",
    category: "image",
    description: "Free images, vectors, illustrations, and videos",
    authType: "api-key",
    docsUrl: "https://pixabay.com/api/docs/",
    rateLimit: "5000/day (free tier)",
    provides: ["stock-images", "vectors", "videos"],
    requiresKey: true
  },
  {
    id: "giphy",
    name: "GIPHY API",
    url: "https://api.giphy.com/v1/gifs",
    category: "image",
    description: "Search and retrieve GIFs and stickers",
    authType: "api-key",
    docsUrl: "https://developers.giphy.com/docs/api/",
    rateLimit: "1000/day (free tier)",
    provides: ["gifs", "animated-images"],
    requiresKey: true
  },
  {
    id: "color-names",
    name: "CSS Color Names",
    url: "https://csscolorsapi.com/api",
    category: "utility",
    description: "CSS color names, hex values, and color data",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["color-data", "design-assets"],
    requiresKey: false
  },
  {
    id: "emoji-api",
    name: "Emoji API",
    url: "https://emojihub.yurace.pro/api",
    category: "utility",
    description: "Emoji data, categories, and random emoji",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["emoji-data", "emoji-search"],
    requiresKey: false
  },
  {
    id: "what-browser",
    name: "What Browser Am I",
    url: "https://www.whatbrowserami.com/api/v1",
    category: "utility",
    description: "Browser and device detection info",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["browser-info", "device-detection"],
    requiresKey: false
  },
  {
    id: "user-agent",
    name: "User Agent Parser",
    url: "built-in",
    category: "utility",
    description: "Parse and analyze user agent strings",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["ua-parsing", "browser-detection"],
    requiresKey: false
  },
  {
    id: "diff-checker",
    name: "Text Diff Checker",
    url: "built-in",
    category: "utility",
    description: "Compare two texts and show differences",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["diff", "comparison"],
    requiresKey: false
  },
  {
    id: "base64-encode",
    name: "Base64 Encoder/Decoder",
    url: "built-in",
    category: "utility",
    description: "Encode and decode Base64 data",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["encoding", "decoding"],
    requiresKey: false
  },
  {
    id: "url-encode",
    name: "URL Encoder/Decoder",
    url: "built-in",
    category: "utility",
    description: "Encode and decode URL components",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["url-encoding", "url-decoding"],
    requiresKey: false
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    url: "built-in",
    category: "utility",
    description: "Generate MD5, SHA-1, SHA-256, SHA-512 hashes",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["hashing", "checksum", "crypto"],
    requiresKey: false
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    url: "built-in",
    category: "utility",
    description: "Decode and inspect JWT tokens without verification",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["jwt", "token-decode", "auth"],
    requiresKey: false
  },
  {
    id: "markdown-render",
    name: "Markdown Renderer",
    url: "built-in",
    category: "utility",
    description: "Convert Markdown text to HTML",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["markdown", "html-conversion"],
    requiresKey: false
  },
  {
    id: "csv-parse",
    name: "CSV Parser",
    url: "built-in",
    category: "data",
    description: "Parse CSV data into structured format",
    authType: "none",
    docsUrl: "",
    rateLimit: "30/min",
    provides: ["csv-parsing", "data-conversion"],
    requiresKey: false
  },
  {
    id: "json-format",
    name: "JSON Formatter",
    url: "built-in",
    category: "data",
    description: "Format, validate, and prettify JSON data",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["json-formatting", "json-validation"],
    requiresKey: false
  },
  {
    id: "yaml-convert",
    name: "YAML Converter",
    url: "built-in",
    category: "data",
    description: "Convert between YAML, JSON, and other formats",
    authType: "none",
    docsUrl: "",
    rateLimit: "30/min",
    provides: ["yaml-parsing", "format-conversion"],
    requiresKey: false
  },
  {
    id: "xml-parse",
    name: "XML Parser",
    url: "built-in",
    category: "data",
    description: "Parse and query XML data",
    authType: "none",
    docsUrl: "",
    rateLimit: "30/min",
    provides: ["xml-parsing", "data-extraction"],
    requiresKey: false
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    url: "built-in",
    category: "utility",
    description: "Test regular expressions against sample text",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["regex", "pattern-matching"],
    requiresKey: false
  },
  {
    id: "color-converter",
    name: "Color Converter",
    url: "built-in",
    category: "utility",
    description: "Convert between hex, rgb, hsl, and color name formats",
    authType: "none",
    docsUrl: "",
    rateLimit: "60/min",
    provides: ["color-conversion", "design"],
    requiresKey: false
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    url: "built-in",
    category: "utility",
    description: "Convert between length, weight, temp, volume, and more",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["conversion", "measurement"],
    requiresKey: false
  },
  {
    id: "date-calc",
    name: "Date Calculator",
    url: "built-in",
    category: "utility",
    description: "Calculate date differences, add/subtract days, workdays",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["date-math", "calendar-calc"],
    requiresKey: false
  },
  {
    id: "case-convert",
    name: "Case Converter",
    url: "built-in",
    category: "utility",
    description: "Convert text between uppercase, lowercase, title, camel, snake, kebab",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["text-conversion", "case-transform"],
    requiresKey: false
  },
  {
    id: "slug-generator",
    name: "Slug Generator",
    url: "built-in",
    category: "utility",
    description: "Generate URL-friendly slugs from text",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["slug", "url-format"],
    requiresKey: false
  },
  {
    id: "word-count",
    name: "Word Counter",
    url: "built-in",
    category: "utility",
    description: "Count words, chars, sentences, and reading time",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["word-count", "text-stats"],
    requiresKey: false
  },
  {
    id: "livy",
    name: "Livy (free tier)",
    url: "https://api.livy.ai",
    category: "ai",
    description: "Free AI model access via Livy API",
    authType: "api-key",
    docsUrl: "https://livy.ai/docs",
    rateLimit: "varies",
    provides: ["text-generation", "chat"],
    requiresKey: true
  },
  {
    id: "ethplorer",
    name: "Ethplorer",
    url: "https://api.ethplorer.io",
    category: "blockchain",
    description: "Ethereum token and address data",
    authType: "api-key",
    docsUrl: "https://github.com/EverexIO/Ethplorer/wiki/Ethplorer-API",
    rateLimit: "1 key = free tier",
    provides: ["eth-address-info", "token-data"],
    requiresKey: true
  },
  {
    id: "blockchain-info",
    name: "Blockchain.info",
    url: "https://blockchain.info",
    category: "blockchain",
    description: "Bitcoin blockchain data, addresses, transactions",
    authType: "none",
    docsUrl: "https://www.blockchain.com/explorer/api",
    rateLimit: "unlimited (respectful use)",
    provides: ["bitcoin-data", "blockchain-stats"],
    requiresKey: false
  },
  {
    id: "mempool",
    name: "Mempool.space",
    url: "https://mempool.space/api",
    category: "blockchain",
    description: "Bitcoin mempool and transaction tracking",
    authType: "none",
    docsUrl: "https://mempool.space/docs/api",
    rateLimit: "unlimited (respectful use)",
    provides: ["bitcoin-mempool", "fee-estimates"],
    requiresKey: false
  },
  {
    id: "etherscan",
    name: "Etherscan API",
    url: "https://api.etherscan.io/api",
    category: "blockchain",
    description: "Ethereum blockchain explorer data",
    authType: "api-key",
    docsUrl: "https://docs.etherscan.io/",
    rateLimit: "5 calls/sec (free tier)",
    provides: ["eth-transactions", "contract-abi", "token-info"],
    requiresKey: true
  },
  {
    id: "cloudflare-trace",
    name: "Cloudflare Trace",
    url: "https://1.1.1.1/cdn-cgi/trace",
    category: "utility",
    description: "Get request metadata including IP, location, protocol",
    authType: "none",
    docsUrl: "",
    rateLimit: "unlimited",
    provides: ["request-info", "ip-location"],
    requiresKey: false
  },
  {
    id: "httpbin",
    name: "HTTPBin",
    url: "https://httpbin.org",
    category: "utility",
    description: "HTTP request and response testing service",
    authType: "none",
    docsUrl: "https://httpbin.org/",
    rateLimit: "60/min",
    provides: ["http-testing", "debugging"],
    requiresKey: false
  },
  {
    id: "translate",
    name: "Translation API",
    url: "https://api.mymemory.translated.net/get",
    category: "translation",
    description: "Free translation using MyMemory",
    authType: "none",
    docsUrl: "https://mymemory.translated.net/doc/spec.php",
    rateLimit: "1000/day (free tier)",
    provides: ["translation", "language"],
    requiresKey: false
  },
  {
    id: "libretranslate",
    name: "LibreTranslate",
    url: "https://libretranslate.com/translate",
    category: "translation",
    description: "Open-source machine translation, self-hostable",
    authType: "api-key",
    docsUrl: "https://libretranslate.com/docs",
    rateLimit: "free tier available",
    provides: ["translation", "language-detection"],
    requiresKey: true
  },
  {
    id: "fun-translations",
    name: "Fun Translations API",
    url: "https://api.funtranslations.com",
    category: "translation",
    description: "Fun language translations (pirate, yoda, minion, etc.)",
    authType: "api-key",
    docsUrl: "https://funtranslations.com/api",
    rateLimit: "60/hour (free tier)",
    provides: ["fun-translation", "entertainment"],
    requiresKey: true
  },
  {
    id: "lyrics",
    name: "Lyrics.ovh",
    url: "https://api.lyrics.ovh/v1",
    category: "audio",
    description: "Song lyrics by artist and title",
    authType: "none",
    docsUrl: "https://lyricsovh.docs.apiary.io/",
    rateLimit: "unlimited",
    provides: ["lyrics", "song-info"],
    requiresKey: false
  },
  {
    id: "audiodb",
    name: "The AudioDB",
    url: "https://www.theaudiodb.com/api/v1/json",
    category: "audio",
    description: "Music database — artists, albums, tracks",
    authType: "api-key",
    docsUrl: "https://www.theaudiodb.com/api_guide.php",
    rateLimit: "free key available",
    provides: ["artist-info", "album-data", "track-info"],
    requiresKey: true
  },
  {
    id: "opentopodata",
    name: "Open Topo Data",
    url: "https://api.opentopodata.io/v1",
    category: "geography",
    description: "Elevation data from latitude/longitude coordinates",
    authType: "none",
    docsUrl: "https://www.opentopodata.org/",
    rateLimit: "1000/day (free tier)",
    provides: ["elevation-data", "topography"],
    requiresKey: false
  },
  {
    id: "usgs-earthquake",
    name: "USGS Earthquake API",
    url: "https://earthquake.usgs.gov/fdsnws/event/1",
    category: "science",
    description: "Real-time earthquake data worldwide",
    authType: "none",
    docsUrl: "https://earthquake.usgs.gov/fdsnws/event/1/",
    rateLimit: "unlimited",
    provides: ["earthquake-data", "seismic-info"],
    requiresKey: false
  },
  {
    id: "air-quality",
    name: "Air Quality Open Data",
    url: "https://api.openaq.org/v2",
    category: "science",
    description: "Worldwide air quality measurements from OpenAQ",
    authType: "none",
    docsUrl: "https://docs.openaq.org/",
    rateLimit: "1000/hour (free tier)",
    provides: ["air-quality", "environmental-data"],
    requiresKey: false
  },
  {
    id: "covid19",
    name: "Disease.sh API",
    url: "https://disease.sh/v3/covid-19",
    category: "health",
    description: "COVID-19 statistics and historical data worldwide",
    authType: "none",
    docsUrl: "https://disease.sh/docs/",
    rateLimit: "unlimited",
    provides: ["covid-stats", "health-data"],
    requiresKey: false
  },
  {
    id: "nutritionix",
    name: "Nutritionix API",
    url: "https://trackapi.nutritionix.com/v2",
    category: "health",
    description: "Food nutrition data and calorie tracking",
    authType: "api-key",
    docsUrl: "https://developer.nutritionix.com/",
    rateLimit: "varies (free tier available)",
    provides: ["nutrition-data", "calorie-info", "food-search"],
    requiresKey: true
  },
  {
    id: "aladhan",
    name: "Aladhan Prayer Times",
    url: "https://api.aladhan.com/v1",
    category: "utility",
    description: "Islamic prayer times based on location",
    authType: "none",
    docsUrl: "https://aladhan.com/prayer-times-api",
    rateLimit: "unlimited",
    provides: ["prayer-times", "islamic-calendar"],
    requiresKey: false
  },
  {
    id: "bible-api",
    name: "Bible API",
    url: "https://bible-api.com",
    category: "education",
    description: "Free Bible verses and passages in multiple translations",
    authType: "none",
    docsUrl: "https://bible-api.com/",
    rateLimit: "unlimited",
    provides: ["bible-verses", "scripture"],
    requiresKey: false
  },
  {
    id: "quran-api",
    name: "Quran API",
    url: "https://api.alquran.cloud/v1",
    category: "education",
    description: "Quran verses, translations, and audio in many languages",
    authType: "none",
    docsUrl: "https://alquran.cloud/api",
    rateLimit: "unlimited",
    provides: ["quran-verses", "islamic-study"],
    requiresKey: false
  },
  {
    id: "deckofcards",
    name: "Deck of Cards API",
    url: "https://deckofcardsapi.com",
    category: "utility",
    description: "Deck of cards shuffling, drawing, and game mechanics",
    authType: "none",
    docsUrl: "https://deckofcardsapi.com/",
    rateLimit: "unlimited",
    provides: ["card-games", "random-generation"],
    requiresKey: false
  },
  {
    id: "randomuser",
    name: "Random User Generator",
    url: "https://randomuser.me/api",
    category: "utility",
    description: "Generate random user profiles with realistic data",
    authType: "none",
    docsUrl: "https://randomuser.me/documentation",
    rateLimit: "unlimited",
    provides: ["user-generation", "test-data"],
    requiresKey: false
  },
  {
    id: "faker",
    name: "Faker API",
    url: "https://fakerapi.it/api/v1",
    category: "utility",
    description: "Generate fake data (addresses, companies, products, etc.)",
    authType: "none",
    docsUrl: "https://fakerapi.it/en",
    rateLimit: "unlimited",
    provides: ["fake-data", "test-data", "random-data"],
    requiresKey: false
  },
  {
    id: "whatsapp-business",
    name: "WhatsApp Business API",
    url: "https://graph.facebook.com/v18.0",
    category: "communication",
    description: "WhatsApp messaging and notification sending",
    authType: "api-key",
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
    rateLimit: "by tier",
    provides: ["whatsapp", "messaging", "notifications"],
    requiresKey: true
  },
  {
    id: "telegram",
    name: "Telegram Bot API",
    url: "https://api.telegram.org/bot",
    category: "communication",
    description: "Send and receive Telegram messages via bot",
    authType: "api-key",
    docsUrl: "https://core.telegram.org/bots/api",
    rateLimit: "30/sec (per bot)",
    provides: ["telegram", "messaging", "bot"],
    requiresKey: true
  },
  {
    id: "discord",
    name: "Discord Webhook",
    url: "built-in",
    category: "communication",
    description: "Send messages to Discord channels via webhook",
    authType: "api-key",
    docsUrl: "https://discord.com/developers/docs/resources/webhook",
    rateLimit: "30/sec",
    provides: ["discord", "notifications", "messaging"],
    requiresKey: true
  },
  {
    id: "slack",
    name: "Slack Webhook",
    url: "built-in",
    category: "communication",
    description: "Send messages to Slack channels via webhook URL",
    authType: "api-key",
    docsUrl: "https://api.slack.com/messaging/webhooks",
    rateLimit: "1/sec",
    provides: ["slack", "notifications", "messaging"],
    requiresKey: true
  },
  {
    id: "stripe",
    name: "Stripe API",
    url: "https://api.stripe.com/v1",
    category: "finance",
    description: "Payment processing, subscriptions, and invoice management",
    authType: "api-key",
    docsUrl: "https://stripe.com/docs/api",
    rateLimit: "by tier",
    provides: ["payments", "subscriptions", "invoicing"],
    requiresKey: true
  },
  {
    id: "paypal",
    name: "PayPal API",
    url: "https://api-m.paypal.com/v2",
    category: "finance",
    description: "Payment processing and order management",
    authType: "api-key",
    docsUrl: "https://developer.paypal.com/docs/api/",
    rateLimit: "by tier",
    provides: ["payments", "orders", "checkout"],
    requiresKey: true
  },
  {
    id: "gateway-whisper",
    name: "AI Provider Gateway — Speech-to-Text",
    url: "https://aiagent.iai.one/v1/audio/transcriptions",
    category: "audio",
    description: "Speech-to-text transcription via AI Provider Gateway. Per AI_PROVIDER_SINGLE_SOURCE_DECISION, all audio transcription goes through the gateway.",
    authType: "gateway-key",
    docsUrl: "https://aiagent.iai.one/docs",
    rateLimit: "by gateway tier",
    provides: ["transcription", "speech-to-text"],
    requiresKey: true
  },
  {
    id: "gateway-tts",
    name: "AI Provider Gateway — Text-to-Speech",
    url: "https://aiagent.iai.one/v1/audio/speech",
    category: "audio",
    description: "Text-to-speech synthesis via AI Provider Gateway. Per AI_PROVIDER_SINGLE_SOURCE_DECISION, all TTS goes through the gateway.",
    authType: "gateway-key",
    docsUrl: "https://aiagent.iai.one/docs",
    rateLimit: "by gateway tier",
    provides: ["tts", "speech-synthesis", "audio"],
    requiresKey: true
  },
  {
    id: "elevenlabs-tts",
    name: "ElevenLabs TTS (BYOK)",
    url: "https://api.elevenlabs.io/v1",
    category: "audio",
    description: "High-quality text-to-speech with voice cloning",
    authType: "api-key",
    docsUrl: "https://docs.elevenlabs.io/api-reference",
    rateLimit: "10000 chars/month (free tier)",
    provides: ["tts", "voice-synthesis", "voice-cloning"],
    requiresKey: true
  },
  {
    id: "link-preview",
    name: "Link Preview",
    url: "built-in",
    category: "web",
    description: "Extract OG metadata, title, description from any URL",
    authType: "none",
    docsUrl: "",
    rateLimit: "30/min",
    provides: ["link-preview", "metadata-extraction"],
    requiresKey: false
  },
  {
    id: "whois",
    name: "WHOIS Lookup",
    url: "https://whois.freeaiapi.xyz",
    category: "web",
    description: "Domain WHOIS data lookup",
    authType: "api-key",
    docsUrl: "",
    rateLimit: "60/min (free tier)",
    provides: ["whois", "domain-info"],
    requiresKey: true
  },
  {
    id: "hastebin",
    name: "Hastebin",
    url: "built-in",
    category: "utility",
    description: "Share code or text via hastebin-like service",
    authType: "none",
    docsUrl: "",
    rateLimit: "30/min",
    provides: ["pastebin", "code-sharing"],
    requiresKey: false
  },
  {
    id: "hastebin-fetch",
    name: "Hastebin Fetch",
    url: "built-in",
    category: "utility",
    description: "Fetch content from hastebin-like paste services",
    authType: "none",
    docsUrl: "",
    rateLimit: "30/min",
    provides: ["paste-fetch", "content-retrieval"],
    requiresKey: false
  },
  {
    id: "url-shortener",
    name: "URL Shortener",
    url: "https://api.tinyurl.com/create",
    category: "utility",
    description: "Shorten long URLs via TinyURL",
    authType: "api-key",
    docsUrl: "https://tinyurl.com/app/dev",
    rateLimit: "1000/month (free tier)",
    provides: ["url-shortening", "link-management"],
    requiresKey: true
  },
  {
    id: "isgd",
    name: "is.gd URL Shortener",
    url: "https://is.gd/create.php",
    category: "utility",
    description: "Free URL shortening without API key",
    authType: "none",
    docsUrl: "https://is.gd/APIDocumentation.php",
    rateLimit: "unlimited (respectful use)",
    provides: ["url-shortening"],
    requiresKey: false
  },
  {
    id: "vgd",
    name: "v.gd URL Shortener",
    url: "https://v.gd/create.php",
    category: "utility",
    description: "Free URL shortening with preview option",
    authType: "none",
    docsUrl: "https://v.gd/APIDocumentation.php",
    rateLimit: "unlimited (respectful use)",
    provides: ["url-shortening"],
    requiresKey: false
  }
];
