/// <reference path="../.astro/types.d.ts" />

interface SessionResponse {
  user_id: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  expires_at: string;
  audience?: string;
  investor_grant?: {
    grant_id: string;
    room_scope: string[];
    expires_at: string;
    suspended: boolean;
  };
}

declare namespace App {
  interface Locals {
    session?: SessionResponse;
  }
}
