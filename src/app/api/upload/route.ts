import { authed, json } from '@/lib/api';
import { storeUpload } from '@/lib/uploads';
import { enforce } from '@/lib/rate-limit';

export const POST = authed(async (userId, req) => {
  await enforce(`upload:${userId}`, 30, 600);
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return json({ error: 'No file' }, 400);
  return json({ src: await storeUpload(userId, file) });
});
