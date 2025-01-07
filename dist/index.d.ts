export interface Options {
    /**
     * The secret used to derive the HMAC key.
     * Must be a secure, random string.
     */
    secret: string;
    /**
     * The name of the hash algorithm to use for HMAC.
     * Supported values include "SHA-1", "SHA-256", "SHA-384", "SHA-512".
     * Defaults to "SHA-256".
     */
    algorithm?: AlgorithmIdentifier;
    /**
     * The byte length of the random token portion.
     * Defaults to 32 bytes.
     */
    tokenByteLength?: number;
    /**
     * The character used to separate the token and signature in the serialized token.
     * Defaults to ".".
     */
    seperator?: string;
    /**
     * A function to serialize data into a Uint8Array before signing.
     * Defaults to:
     * - string: UTF-8 encoding of the string
     * - object: JSON.stringify + UTF-8
     * - Uint8Array: used directly
     * - others: `String(data)` and then UTF-8 encode
     */
    dataSerializer?: (data: any) => any;
    dataDecoder?: (data: any) => any;
}
/**
 * Encodes a Uint8Array into a Base64URL string using edge runtime compatible methods.
 *
 * @param {Uint8Array} data - The Uint8Array to encode.
 * @returns {string} - The Base64URL-encoded string.
 * @throws {Error} - If Base64 encoding is not supported.
 */
export declare function encodeBase64(data: Uint8Array): string;
/**
 * Decodes a Base64URL string into a Uint8Array using edge runtime compatible methods.
 *
 * @param {string} base64url - The Base64URL-encoded string to decode.
 * @returns {Uint8Array} - The decoded Uint8Array.
 * @throws {Error} - If the Base64URL string is invalid or decoding fails.
 */
export declare function decodeBase64(base64url: string): Uint8Array;
export declare const defaultDataSerializer: (data: unknown) => Uint8Array;
export declare const defaultDataDecoder: (data: Uint8Array) => unknown;
/**
 * Merge user provided CsrfOptions with the default options.
 */
export declare function mergeExtendedOptions(userOptions: Partial<Options>): Required<Options>;
/**
 * Derive a CryptoKey from a secret and an HMAC algorithm using the Web Crypto API.
 */
export declare function getHmacKey(secret: string, algorithm: AlgorithmIdentifier): Promise<CryptoKey>;
/**
 * Generates a secure token by combining random bytes, optional data, and a signature.
 *
 * @param key - The CryptoKey used for HMAC signing.
 * @param data - Optional data to include in the token.
 * @param showData - Whether to include the serialized data in the token.
 * @param timed - Whether the token should include a timestamp.
 * @param tokenByteLength - The length of the random byte segment.
 * @param seperator - The character used to separate token parts.
 * @param serializer - Function to serialize data into Uint8Array.
 * @returns A Promise that resolves to the generated token string.
 */
export declare function generateToken(key: CryptoKey, data: unknown, showData: boolean, timed: boolean, tokenByteLength: number, seperator: string, serializer: (data: unknown) => Uint8Array): Promise<string>;
/**
 * Verifies the integrity and validity of a submitted token.
 *
 * @param key - The CryptoKey used for HMAC verification.
 * @param submitted - The submitted token string.
 * @param data - The expected data to verify against.
 * @param showData - Whether the token includes data.
 * @param timed - Whether the token includes a timestamp.
 * @param seperator - The seperator used in the token.
 * @param serializer - Function to serialize data into Uint8Array.
 * @param maxAgeMs - Optional maximum age in milliseconds for token validity.
 * @returns A Promise that resolves to true if the token is valid, false otherwise.
 */
export declare function verifyToken(key: CryptoKey, submitted: string, data: unknown, // The 'expected' data you want to verify against
showData: boolean, timed: boolean, seperator: string, serializer: (data: unknown) => Uint8Array, maxAgeMs?: number): Promise<boolean>;
/**
 * Determines if the provided data is considered an edge case.
 *
 * @param data - The data to check.
 * @returns True if data is an edge case, false otherwise.
 */
export declare function isEdgeCase(data: any): boolean;
interface edgeTokenType {
    options: Options;
    generate: (data?: unknown) => Promise<string>;
    verify: (submitted: string, data?: unknown) => Promise<boolean>;
    generateWithData: (data: unknown) => Promise<string>;
    verifyWithData: (submitted: string, data: unknown) => Promise<boolean>;
    generateTimed: (data?: unknown) => Promise<string>;
    verifyTimed: (submitted: string, data: unknown, maxAgeMs: number) => Promise<boolean>;
    generateWithDataTimed: (data: unknown) => Promise<string>;
    verifyWithDataTimed: (submitted: string, data: unknown, maxAgeMs: number) => Promise<boolean>;
}
/**
 * Create a CSRF utility object from user options merged with defaults.
 * Users can generate and verify tokens that are tied to optional additional data.
 * Custom data serializers can be provided to handle different data types.
 */
export declare function edgeToken(userOptions: Partial<Options>): Promise<edgeTokenType>;
export {};
//# sourceMappingURL=index.d.ts.map