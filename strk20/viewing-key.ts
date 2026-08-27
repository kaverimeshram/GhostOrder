import { hash, ec } from 'starknet';

export interface ViewingKeyDerivationResult {
  messageString: string;
  messageHash: string;
  foldedHash: bigint;
  privateViewingKey: bigint;
  privateViewingKeyHex: string;
}

/**
 * Derives a private viewing key from an on-chain signature according to the official STRK20 specification:
 * 1. Derives messageHash = starknetKeccak(`${chainId}:${poolAddress}`)
 * 2. Takes wallet signature (r, s) over messageHash
 * 3. Folds signature with Poseidon: computePoseidonHashOnElements([r, s])
 * 4. Reduces modulo Stark curve order n
 */
export function deriveViewingKeyFromSignature(
  chainId: string,
  poolAddress: string,
  signature: { r: string | bigint; s: string | bigint }
): ViewingKeyDerivationResult {
  const messageString = `${chainId}:${poolAddress}`;
  const keccakBig = hash.starknetKeccak(messageString);
  const messageHash = '0x' + keccakBig.toString(16);

  const rBig = BigInt(signature.r);
  const sBig = BigInt(signature.s);

  // Fold signature elements using Poseidon hash
  const folded = BigInt(hash.computePoseidonHashOnElements([rBig, sBig]));
  
  // Reduce modulo Stark curve order n
  const curveOrder = ec.starkCurve.CURVE.n;
  const privateViewingKey = folded % curveOrder;
  const privateViewingKeyHex = '0x' + privateViewingKey.toString(16);

  return {
    messageString,
    messageHash,
    foldedHash: folded,
    privateViewingKey,
    privateViewingKeyHex,
  };
}

/**
 * Helper to compute the registration message hash that the user wallet signs.
 */
export function getViewingKeyMessageHash(chainId: string, poolAddress: string): string {
  const messageString = `${chainId}:${poolAddress}`;
  const keccakBig = hash.starknetKeccak(messageString);
  return '0x' + keccakBig.toString(16);
}
