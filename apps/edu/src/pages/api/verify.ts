import type { APIRoute } from 'astro';

// P0-EDU: Real certificate verification — proxies to API worker D1-backed endpoint.
// Replaces placeholder certificate database.
const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'https://api.nguyenai.net';

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({
        valid: false,
        certificate: null,
        error: 'Missing certificate ID. Provide ?id=XXX',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const resp = await fetch(`${API_BASE}/v1/edu/certificate/verify/${encodeURIComponent(id)}`);
    const data = await resp.json() as {
      valid: boolean;
      certificate_id?: string;
      type?: string;
      level?: string;
      branch?: string | null;
      title_vi?: string;
      title_en?: string;
      status?: string;
      issued_at?: string;
      revoked_at?: string | null;
      rubric_version?: string;
      verification_code?: string;
    };

    // Map API response to the shape the frontend expects
    const certificate = data.valid ? {
      id: data.certificate_id ?? id,
      holder: '', // Public verify does not expose holder name for privacy
      trackTitle: data.title_vi ?? data.title_en ?? '',
      trackId: 0,
      issuedDate: data.issued_at ?? '',
      status: data.status ?? 'unknown',
    } : null;

    return new Response(
      JSON.stringify({
        valid: data.valid,
        certificate,
      }),
      {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        valid: false,
        certificate: null,
        error: 'Verification service unavailable',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
