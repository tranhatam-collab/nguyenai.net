-- D1 scholarship core (SQLite) — minimum for D1ScholarshipStore applications flow
CREATE TABLE IF NOT EXISTS scholarship_applications (
  application_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_year INTEGER,
  country TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  identity_verified INTEGER NOT NULL DEFAULT 0,
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  has_nguyen_surname INTEGER NOT NULL DEFAULT 0,
  surname_type TEXT,
  wants_community INTEGER NOT NULL DEFAULT 0,
  consents_story_sharing INTEGER NOT NULL DEFAULT 0,
  program_id TEXT NOT NULL,
  wish_text TEXT NOT NULL DEFAULT '',
  wish_visibility TEXT NOT NULL DEFAULT 'private',
  circumstances_text TEXT NOT NULL DEFAULT '',
  financial_need_level TEXT,
  capability_text TEXT NOT NULL DEFAULT '',
  portfolio_url TEXT,
  commits_to_attendance INTEGER NOT NULL DEFAULT 0,
  commits_to_graduation INTEGER NOT NULL DEFAULT 0,
  commits_to_community INTEGER NOT NULL DEFAULT 0,
  consents_to_data_processing INTEGER NOT NULL DEFAULT 0,
  consents_to_audit INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scholarship_apps_user ON scholarship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_status ON scholarship_applications(status);
