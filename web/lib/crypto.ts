// AES-GCM helpers. We derive a per-agent symmetric key from a passphrase
// (currently the agent object id; production should use Seal). The key
// is exported once and cached locally so we don't re-derive on every
// memory.

const ALG = "AES-GCM";
const IV_LEN = 12;

function toArrayBufferBacked(view: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy;
}

const enc = new TextEncoder();

/**
 * Deterministically derive a 256-bit AES key from a string seed (e.g.
 * the agent's object id). PBKDF2 with a fixed salt — fine for the MVP
 * where the seed is itself a high-entropy on-chain id.
 */
export async function deriveAgentKey(seed: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    toArrayBufferBacked(enc.encode(seed)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBufferBacked(enc.encode("agent-vault-v1")),
      iterations: 120_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: ALG, length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(
  key: CryptoKey,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const cipher = await crypto.subtle.encrypt(
    { name: ALG, iv },
    key,
    toArrayBufferBacked(plaintext),
  );
  const out = new Uint8Array(IV_LEN + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), IV_LEN);
  return out;
}

export async function decrypt(
  key: CryptoKey,
  payload: Uint8Array,
): Promise<Uint8Array> {
  const iv = toArrayBufferBacked(payload.subarray(0, IV_LEN));
  const cipher = toArrayBufferBacked(payload.subarray(IV_LEN));
  const plain = await crypto.subtle.decrypt({ name: ALG, iv }, key, cipher);
  return new Uint8Array(plain);
}

export async function encryptJson(
  key: CryptoKey,
  obj: unknown,
): Promise<Uint8Array> {
  return encrypt(key, enc.encode(JSON.stringify(obj)));
}

const dec = new TextDecoder();
export async function decryptJson<T>(
  key: CryptoKey,
  payload: Uint8Array,
): Promise<T> {
  const plain = await decrypt(key, payload);
  return JSON.parse(dec.decode(plain)) as T;
}
