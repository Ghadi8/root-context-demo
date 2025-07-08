import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    ensName: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ ensName: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedEnsName = decodeURIComponent(resolvedParams.ensName);
  
  return {
    title: `ENS Agent: ${decodedEnsName} | ENS Root-Context AI`,
    description: `Chat with the AI agent for ${decodedEnsName}. Discover decentralized AI personalities through ENS names.`,
    openGraph: {
      title: `ENS Agent: ${decodedEnsName}`,
      description: `Chat with the AI agent for ${decodedEnsName}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `ENS Agent: ${decodedEnsName}`,
      description: `Chat with the AI agent for ${decodedEnsName}`,
    }
  };
}

export default function ENSLayout({ children }: LayoutProps) {
  return children;
}
