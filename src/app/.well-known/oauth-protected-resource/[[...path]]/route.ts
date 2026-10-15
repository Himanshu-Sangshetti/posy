// RFC 9728: tells MCP clients which authorization server protects /api/mcp.
import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { auth } from '@/lib/auth';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { baseURL } = await auth.$context;
  return protectedResourceHandler({ authServerUrls: [baseURL], resourceUrl: `${siteUrl()}/api/mcp` })(req);
}
export const OPTIONS = metadataCorsOptionsRequestHandler();
