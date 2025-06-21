import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the API route
  redirect('/api');
  
  // This won't be rendered, but is needed to satisfy TypeScript
  return null;
}

// Force this page to be static
export const dynamic = 'force-static';
