import { oauthProviderOpenIdConfigMetadata } from '@better-auth/oauth-provider';
import { metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const GET = oauthProviderOpenIdConfigMetadata(auth, { headers: { 'Access-Control-Allow-Origin': '*' } });
export const OPTIONS = metadataCorsOptionsRequestHandler();
