import { authed, json } from '@/lib/api';
import { storeUpload } from '@/lib/uploads';

export const POST = authed(async (userId, req) => {
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return json({ error: 'No file' }, 400);
  return json({ src: await storeUpload(userId, file) });
});
