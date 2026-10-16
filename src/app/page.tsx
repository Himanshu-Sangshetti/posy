import { Home, homeMetadata } from '@/edition/home';

export const dynamic = 'force-dynamic';

// What "/" shows depends on the edition (see src/edition/home.tsx).
export const generateMetadata = homeMetadata;
export default Home;
