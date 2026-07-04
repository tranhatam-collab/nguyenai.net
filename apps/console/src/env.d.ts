/// <reference path="../.astro/types.d.ts" />

interface SessionResponse {
  user_id: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  expires_at: string;
  email?: string;
  name?: string;
}

declare namespace App {
  interface Locals {
    session?: SessionResponse;
  }
}
