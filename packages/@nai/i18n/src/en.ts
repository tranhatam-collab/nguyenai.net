// English i18n keys — English is the international language
export const en = {
  // Brand
  brand: {
    name: 'Nguyen AI',
    product: 'Nguyen AI Computer',
    domain: 'nguyenai.net',
  },
  // Navigation
  nav: {
    home: 'Home',
    aiComputer: 'AI Computer',
    howItWorks: 'How it works',
    agents: 'Agents',
    superApps: 'Super Apps',
    models: 'Models',
    commandPacks: 'Command Packs',
    plans: 'Plans',
    about: 'About',
    contact: 'Contact',
    docs: 'Docs',
    research: 'Research',
    invest: 'Invest',
    academy: 'Academy',
    terms: 'Terms',
    privacy: 'Privacy',
    security: 'Security',
    trust: 'Trust',
  },
  // Language switcher
  language: {
    switchTo: 'Tiếng Việt',
    current: 'English',
  },
  // Common UI
  common: {
    skipToContent: 'Skip to content',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    back: 'Back',
  },
  // Forms
  form: {
    name: 'Name',
    namePlaceholder: 'Enter your name',
    email: 'Email',
    emailPlaceholder: 'name@example.com',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    message: 'Message',
    messagePlaceholder: 'Enter your message',
    required: 'Required field',
    invalidEmail: 'Invalid email address',
    invalidPassword: 'Invalid password',
    submitSuccess: 'Submitted successfully',
    submitError: 'An error occurred, please try again',
  },
  // Footer
  footer: {
    legal: 'VIET CAN NEW CORP (US) — primary legal entity, formation in progress. Kasan JSC (Tax ID 0315521422) — commercial representative in Vietnam.',
    rights: 'All rights reserved.',
    links: 'Links',
    legalLinks: 'Legal',
  },
  // Hero
  hero: {
    title: 'AI Computer for the global Nguyen community',
    subtitle: 'Nguyen AI Computer is a specialized cloud AI Computer line for individuals, families, founders, businesses, and the global Nguyen community.',
    ctaPrimary: 'Explore AI Computer',
    ctaSecondary: 'How it works',
  },
  // Plans
  plans: {
    start: 'Nguyen Start',
    personal: 'Nguyen Personal',
    family: 'Nguyen Family',
    creator: 'Nguyen Creator',
    founder: 'Nguyen Founder',
    business: 'Nguyen Business',
    chapter: 'Nguyen Chapter',
    enterprise: 'Nguyen Enterprise',
  },
  // Errors
  error: {
    notFound: 'Page not found',
    notFoundDescription: 'The page you are looking for does not exist or has been moved.',
    serverError: 'Server error',
    serverErrorDescription: 'An error occurred on the server. Please try again later.',
    backHome: 'Back to home',
  },
} as const;

export type EnKeys = typeof en;
