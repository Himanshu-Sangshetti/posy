import { authed, json } from '@/lib/api';
import { publishPage } from '@/lib/page-ops';

export const POST = authed(async userId => json(await publishPage(userId)));
