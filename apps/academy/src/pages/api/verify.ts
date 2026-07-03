import type { APIRoute } from 'astro';

// Placeholder certificate database
const placeholderCertificates: Record<string, {
  id: string;
  holder: string;
  trackTitle: string;
  trackId: number;
  issuedDate: string;
  status: string;
}> = {
  'NAI-Academy-0001-0001': {
    id: 'NAI-Academy-0001-0001',
    holder: 'Nguyen AI Subscriber',
    trackTitle: 'AI Computer Fundamentals',
    trackId: 1,
    issuedDate: '2024-09-01',
    status: 'valid',
  },
  'NAI-Academy-0002-0001': {
    id: 'NAI-Academy-0002-0001',
    holder: 'Demo User',
    trackTitle: 'Agent Operation',
    trackId: 2,
    issuedDate: '2024-09-15',
    status: 'valid',
  },
};

export const GET: APIRoute = ({ url }) => {
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

  const certificate = placeholderCertificates[id.toUpperCase()] ?? null;

  return new Response(
    JSON.stringify({
      valid: certificate !== null,
      certificate,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
