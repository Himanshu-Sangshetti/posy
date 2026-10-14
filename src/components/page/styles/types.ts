import type { ReactNode } from 'react';

/** The pieces of a profile header. The public page passes plain content, the editor passes inputs. */
export type HeaderSlots = {
  avatar: ReactNode;
  name: ReactNode;
  bio: ReactNode;
  caption: ReactNode;
  socials: ReactNode;
};
