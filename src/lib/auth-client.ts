'use client';

import { createAuthClient } from 'better-auth/react';
import { apiKeyClient } from '@better-auth/api-key/client';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';

export const authClient = createAuthClient({ plugins: [apiKeyClient(), oauthProviderClient()] });
export const { signIn, signUp, signOut, useSession } = authClient;
