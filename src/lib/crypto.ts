/**
 * localStorage 暗号化ユーティリティ（AES-GCM）
 *
 * 個人情報（園児名・保護者情報など）を localStorage に保存する際に
 * Web Crypto API を使用して暗号化する。
 *
 * - 鍵はブラウザセッションごとに PBKDF2 で導出（ドメイン + salt）
 * - AES-GCM (256bit) で暗号化 / 復号
 */

const SALT = 'kidsnote-pii-protection-v1';
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];

/** パスフレーズから暗号鍵を導出 */
async function deriveKey(): Promise<CryptoKey> {
    // ドメインベースの固定パスフレーズ（ブラウザ・ドメインに束縛）
    const passphrase = `${location.origin}-${SALT}`;
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SALT),
            iterations: 100_000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        KEY_USAGE
    );
}

/** 鍵キャッシュ（同一セッション内で再利用） */
let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
    if (!cachedKey) {
        cachedKey = await deriveKey();
    }
    return cachedKey;
}

/**
 * データを AES-GCM で暗号化し、Base64 文字列として返す
 */
export async function encryptData(plainText: string): Promise<string> {
    const key = await getKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(plainText)
    );

    // IV + 暗号文を結合して Base64 エンコード
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Base64 暗号文を復号し、元の文字列を返す
 */
export async function decryptData(cipherBase64: string): Promise<string> {
    const key = await getKey();
    const combined = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const cipherText = combined.slice(12);

    const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherText
    );

    return new TextDecoder().decode(plainBuffer);
}

/**
 * Web Crypto API が利用可能かチェック
 */
export function isCryptoAvailable(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof crypto !== 'undefined' &&
        typeof crypto.subtle !== 'undefined'
    );
}
