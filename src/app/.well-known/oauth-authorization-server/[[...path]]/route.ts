// RFC 8414 metadata for the OAuth server that lives under /api/auth.
import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider';
import { metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const GET = oauthProviderAuthServerMetadata(auth, { headers: { 'Access-Control-Allow-Origin': '*' } });
export const OPTIONS = metadataCorsOptionsRequestHandler();
