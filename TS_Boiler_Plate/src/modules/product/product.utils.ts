import crypto from 'crypto';

/**
 * Generates a unique product code based on alphabetical patterns and hashing.
 */
export const generateProductCode = (name: string): string => {
  // Normalize: lowercase and remove spaces for substring analysis
  const sanitized = name.toLowerCase().replace(/\s+/g, '');
  
  // 1. Generate Hashed Prefix (MD5 - 7 chars)
  const hashPrefix = crypto.createHash('md5').update(name).digest('hex').substring(0, 7);

  let currentSub = sanitized.charAt(0);
  const allSubs: { str: string; start: number; end: number }[] = [];
  let tempStart = 0;

  // 2. Extract all strictly increasing substrings
  for (let i = 1; i <= sanitized.length; i++) {
    if (i < sanitized.length && sanitized.charAt(i) > sanitized.charAt(i - 1)) {
      currentSub += sanitized.charAt(i);
    } else {
      // End of an increasing sequence
      if (currentSub.length > 0) {
        allSubs.push({
          str: currentSub,
          start: tempStart,
          end: i - 1,
        });
      }
      
      if (i < sanitized.length) {
        currentSub = sanitized.charAt(i);
        tempStart = i;
      }
    }
  }

  // 3. Find the longest substrings
  const maxLength = Math.max(...allSubs.map((s) => s.str.length), 0);
  const longestOnes = allSubs.filter((s) => s.str.length === maxLength);

  // 4. Concatenate strings and get global indices
  const concatenatedStr = longestOnes.map((s) => s.str).join('');
  const firstIndex = longestOnes.length > 0 ? longestOnes[0]?.start ?? 0 : 0;
  const lastIndex = longestOnes.length > 0 ? longestOnes[longestOnes.length - 1]?.end ?? 0 : 0;

  // 5. Format: <hash>-<start><substring><end>
  return `${hashPrefix}-${firstIndex}${concatenatedStr}${lastIndex}`;
};