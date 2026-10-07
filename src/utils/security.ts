import * as Crypto from 'expo-crypto';

/**
 * สุ่ม Salt สำหรับการแฮช PIN
 */
export function generateSalt(): string {
  return Crypto.randomUUID().replace(/-/g, '');
}

/**
 * แฮช PIN ด้วย SHA-512 พร้อม Salt
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const salted = `${salt}:${pin}:${salt}`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, salted);
}

/**
 * ตรวจสอบความถูกต้องของ PIN
 */
export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  const computed = await hashPin(pin, salt);
  return computed === expectedHash;
}
