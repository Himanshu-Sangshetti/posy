'use client';

import { createAuthClient } from 'better-auth/react';
import { apiKeyClient } from '@better-auth/api-key/client';

export const authClient = createAuthClient({ plugins: [apiKeyClient()] });
export const { signIn, signUp, signOut, useSession } = authClient;
