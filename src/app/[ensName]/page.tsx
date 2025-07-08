import { Metadata } from 'next';
import ENSRootContextDemo from '../components/ENSRootContextDemo';

interface PageProps {
  params: Promise<{
    ensName: string;
  }>;
}

export default async function ENSPage({ params }: PageProps) {
  // Await params in Next.js 15+
  const resolvedParams = await params;
  
  // Decode the ENS name in case it has special characters
  const decodedEnsName = decodeURIComponent(resolvedParams.ensName);
  
  // Basic validation - ensure it looks like an ENS name
  if (!decodedEnsName.includes('.')) {
    // If it doesn't look like an ENS name, redirect to home
    return (
      <script dangerouslySetInnerHTML={{
        __html: `window.location.href = '/';`
      }} />
    );
  }
  
  return <ENSRootContextDemo initialEnsName={decodedEnsName} autoResolve={true} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedEnsName = decodeURIComponent(resolvedParams.ensName);
  
  return {
    title: `ENS Agent: ${decodedEnsName}`,
    description: `Chat with the AI agent for ${decodedEnsName}`,
  };
}
