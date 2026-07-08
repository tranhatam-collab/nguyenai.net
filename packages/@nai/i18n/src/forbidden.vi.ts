/**
 * TỪ CẤM TRONG BẢN TIẾNG VIỆT
 * 
 * Các từ tiếng Anh sau không được xuất hiện trong HTML build tiếng Việt.
 * Ngoại lệ: domain, code không render, tên pháp lý bắt buộc, tên thương hiệu đã khóa.
 */

export const FORBIDDEN_VI = [
  // Navigation & Menu
  'AI Computer',
  'AI COMPUTER',
  'Agent',
  'Agents',
  'Super App',
  'Super Apps',
  'Instance',
  'Identity',
  'Command Center',
  'Model Mesh',
  'Agent Team',
  'Tool Kernel',
  'Data Vault',
  'Long-term Memory',
  'Workflow Engine',
  'Verification',
  'Approval Gates',
  'Security Boundary',
  'Cost Governor',
  'Audit & Replay',
  'Sync Layer',
  'Self-Upgrade Registry',
  
  // Component Labels
  'Core',
  'CORE',
  'App',
  'APP',
  'Tool',
  'TOOL',
  'Data',
  'DATA',
  'Memory',
  'MEMORY',
  'Engine',
  'ENGINE',
  'Trust',
  'TRUST',
  'Security',
  'SECURITY',
  'Governor',
  'GOVERNOR',
  'Audit',
  'AUDIT',
  'Sync',
  'SYNC',
  'Upgrade',
  'UPGRADE',
  'FAQ',
  
  // UI Elements
  'English',
  'Login',
  'Sign in',
  'Free AI learning',
  'AI Computer Console',
  
  // Technical Terms in User Content
  'shared',
  'export',
  'boundary',
  'model',
  'workflow',
  'proof record',
  'evidence pack',
  'quota',
  'offline-first',
  'tool family',
  'integration',
  'webhook',
  
  // Footer & Brand
  'Nguyen AI Academy',
  'Academy',
  'Console',
  'Docs',
  
  // Routes & Navigation
  '/ai-computer/',
  '/agents/',
  '/super-apps/',
  '/plans/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/security/',
  '/trust/',
  '/docs/',
  '/research/',
  '/models/',
  '/command-packs/',
];

// Regex pattern for forbidden terms
export const FORBIDDEN_VI_PATTERN = new RegExp(
  FORBIDDEN_VI.join('|'),
  'gi'
);
