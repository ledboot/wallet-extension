// Test to validate that our implementation of decodeCompressedWalletImportFormat 
// matches the behavior of the omgutil.js implementation

import { base58_to_binary } from 'base58-js';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

// Our implementation
function decodeCompressedWalletImportFormat(privateKey) {
  const bytes = base58_to_binary(privateKey);
  const hash = bytes.slice(0, 34);
  const checksum = nobleSha256(nobleSha256(new Uint8Array(hash)));
  
  // Verify checksum (4 bytes at the end)
  if (checksum[0] != bytes[34] ||
        checksum[1] != bytes[35] ||
        checksum[2] != bytes[36] ||
        checksum[3] != bytes[37]) {
    throw "Checksum validation failed!";
  }
  
  // Check version byte (first byte should be 0x80 for mainnet)
  const version = hash[0];
  if (version != 0x80) {
    throw 'Version ' + version + ' not supported!';
  }
  
  // Remove version byte (first byte) and compression flag byte (last byte of hash)
  // Return the 32-byte private key
  const privateKeyBytes = hash.slice(1, 33);
  return privateKeyBytes;
}


// Test with a known WIF
const wif = "KxUWZJcnbjkT41sQA2VDKA9wCCZyXZdTETomr33B4xknshossVyT";
console.log('Testing WIF:', wif);

try {
  const privateKeyBytes = decodeCompressedWalletImportFormat(wif);
  const privateKeyHex = Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Decoded private key (hex):', privateKeyHex);
  console.log('Expected private key (hex): 25736a3828e50ebca0ac02b92121d2d41dbcfb79ad7ee766677a8d70fb0e9b2f');
  
  // Verify the result
  const expected = '25736a3828e50ebca0ac02b92121d2d41dbcfb79ad7ee766677a8d70fb0e9b2f';
  if (privateKeyHex === expected) {
    console.log('✓ Implementation matches expected result');
  } else {
    console.log('✗ Implementation does not match expected result');
  }
} catch (error) {
  console.error('Error:', error);
}