import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// 환경 변수의 문자열을 Buffer로 변환
function getEncryptionKey(): Buffer {
  if (!process.env.ENCRYPTION_KEY) {
    return randomBytes(32);
  }
  
  // 문자열이 32바이트(64자의 hex)인지 확인
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes) hex string');
  }
  
  try {
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  } catch (error) {
    console.error('Invalid ENCRYPTION_KEY format:', error);
    throw new Error('ENCRYPTION_KEY must be a valid hex string');
  }
}

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')])
    .toString('base64');
}

export function decrypt(encryptedData: string): string {
  const buf = Buffer.from(encryptedData, 'base64');
  
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
} 