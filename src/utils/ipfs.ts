/**
 * IPFS utility functions for fetching content from IPFS links
 */

export interface IPFSContent {
  content: string;
  isFromIPFS: boolean;
  hash?: string;
  gateway?: string;
}

/**
 * Default IPFS gateways to try in order
 */
const DEFAULT_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.filebase.io/ipfs/',
];

/**
 * Detects if a string is an IPFS link or hash
 */
export function isIPFSLink(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  
  // Check for IPFS URLs (ipfs://, https://ipfs.io/ipfs/, etc.)
  if (
    trimmed.startsWith('ipfs://') ||
    trimmed.includes('/ipfs/') ||
    trimmed.includes('ipfs.io') ||
    trimmed.includes('gateway.pinata.cloud') ||
    trimmed.includes('cloudflare-ipfs.com') ||
    trimmed.includes('dweb.link')
  ) {
    return true;
  }
  
  // Check for bare IPFS hash (Qm... or baf... format)
  const hashPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{55,})$/;
  return hashPattern.test(trimmed);
}

/**
 * Extracts IPFS hash from various IPFS URL formats
 */
export function extractIPFSHash(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  
  // Handle ipfs:// protocol
  if (trimmed.startsWith('ipfs://')) {
    return trimmed.replace('ipfs://', '');
  }
  
  // Handle HTTP/HTTPS IPFS gateway URLs
  const gatewayMatch = trimmed.match(/\/ipfs\/([^\/\?]+)/);
  if (gatewayMatch) {
    return gatewayMatch[1];
  }
  
  // Check if it's already a bare hash
  const hashPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{55,})$/;
  if (hashPattern.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

/**
 * Fetches content from IPFS using multiple gateways with fallback
 */
export async function fetchFromIPFS(
  hashOrUrl: string, 
  customGateways: string[] = [],
  timeoutMs: number = 10000
): Promise<IPFSContent> {
  const hash = extractIPFSHash(hashOrUrl);
  
  if (!hash) {
    throw new Error(`Invalid IPFS hash or URL: ${hashOrUrl}`);
  }
  
  // Combine custom gateways with defaults
  const gateways = [...customGateways, ...DEFAULT_GATEWAYS];
  
  let lastError: Error | null = null;
  
  for (const gateway of gateways) {
    try {
      const url = `${gateway}${hash}`;
      console.log(`Attempting to fetch from IPFS gateway: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/plain, text/*, application/json, */*',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty content received');
      }
      
      console.log(`Successfully fetched content from IPFS via ${gateway}`);
      
      return {
        content: content.trim(),
        isFromIPFS: true,
        hash,
        gateway: gateway,
      };
      
    } catch (error) {
      console.warn(`Failed to fetch from gateway ${gateway}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  throw new Error(
    `Failed to fetch IPFS content from all gateways. Hash: ${hash}. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Main function to process root context that might be an IPFS link
 */
export async function processRootContext(rootContext: string): Promise<IPFSContent> {
  if (!rootContext || typeof rootContext !== 'string') {
    throw new Error('Invalid root context provided');
  }
  
  const trimmed = rootContext.trim();
  
  // If it's not an IPFS link, return as-is
  if (!isIPFSLink(trimmed)) {
    return {
      content: trimmed,
      isFromIPFS: false,
    };
  }
  
  // If it's an IPFS link, fetch the content
  console.log('Detected IPFS link in root context, fetching content...');
  return await fetchFromIPFS(trimmed);
}

/**
 * Validates that IPFS content looks like valid AI context
 */
export function validateAIContext(content: string): { isValid: boolean; reason?: string } {
  if (!content || typeof content !== 'string') {
    return { isValid: false, reason: 'Content is empty or not a string' };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length < 10) {
    return { isValid: false, reason: 'Content is too short to be meaningful AI context' };
  }
  
  if (trimmed.length > 50000) {
    return { isValid: false, reason: 'Content is too long (max 50,000 characters)' };
  }
  
  // Check for common AI context patterns
  const hasAIKeywords = /\b(you are|assistant|ai|help|respond|answer|chat|conversation)\b/i.test(trimmed);
  
  return { 
    isValid: true, 
    reason: hasAIKeywords ? 'Content appears to be AI context' : 'Content accepted (generic text)' 
  };
}
