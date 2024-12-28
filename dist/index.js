/**
 * Encodes a Uint8Array into a Base64 string.
 *
 * @param data - The Uint8Array to encode.
 * @returns The Base64-encoded string.
 * @throws If no suitable Base64 encoding method is available.
 */
export function encodeBase64(data) {
    if (typeof btoa !== 'undefined') {
        // Convert Uint8Array to binary string
        let binary = '';
        const len = data.length;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(data[i] ?? 0);
        }
        return btoa(binary);
    }
    else {
        throw new Error('No suitable Base64 encoding method available.');
    }
}
/**
 * Decodes a Base64 string into a Uint8Array.
 *
 * Edge Runtime Compatible Implementation:
 * - Utilizes the `atob` function, which is available in Edge environments.
 *
 * @param base64 - The Base64 string to decode.
 * @returns The decoded Uint8Array.
 * @throws If the Base64 string is invalid or decoding fails.
 */
export function decodeBase64(base64) {
    try {
        // Decode the Base64 string to a binary string
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        // Convert each character to its byte value
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
    catch (error) {
        // Handle errors (e.g., invalid Base64 string)
        throw new Error('Invalid Base64 string provided for decoding.');
    }
}
// Define and export the default serializer function
export const defaultDataSerializer = (data) => {
    if (typeof data === 'string') {
        return new TextEncoder().encode(data);
    }
    else if (typeof data === 'object' && data !== null && !(data instanceof Uint8Array)) {
        return new TextEncoder().encode(JSON.stringify(data));
    }
    else if (data instanceof Uint8Array) {
        return data;
    }
    else {
        // Fallback: Convert to string
        return new TextEncoder().encode(String(data));
    }
};
export const defaultDataDecoder = (data) => {
    const decodedString = new TextDecoder().decode(data);
    try {
        const parsedData = JSON.parse(decodedString);
        return parsedData;
    }
    catch (e) {
        // If it's not JSON, return the decoded string
        return decodedString;
    }
};
const defaultOptions = {
    secret: '',
    algorithm: 'SHA-256',
    tokenByteLength: 32,
    seperator: '.',
    dataSerializer: defaultDataSerializer,
    dataDecoder: defaultDataDecoder,
};
/**
 * Merge user provided CsrfOptions with the default options.
 */
export function mergeExtendedOptions(userOptions) {
    return {
        ...defaultOptions,
        ...userOptions,
    };
}
/**
 * Derive a CryptoKey from a secret and an HMAC algorithm using the Web Crypto API.
 */
export async function getHmacKey(secret, algorithm) {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: algorithm }, false, ['sign', 'verify']);
}
/**
 * Generates cryptographically secure random bytes.
 *
 * @param byteLength - The number of random bytes to generate.
 * @returns A Uint8Array containing random bytes.
 */
function generateRandomBytes(byteLength) {
    const randomBytes = new Uint8Array(byteLength);
    crypto.getRandomValues(randomBytes);
    return randomBytes;
}
/**
 * Combines multiple Uint8Arrays into a single Uint8Array.
 *
 * @param arrays - An array of Uint8Arrays to combine.
 * @returns A new Uint8Array containing all combined bytes.
 */
function combineUint8Arrays(...arrays) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        combined.set(arr, offset);
        offset += arr.length;
    }
    return combined;
}
/**
 * Appends a part to the token parts array if the condition is met.
 *
 * @param parts - The array of token parts.
 * @param condition - The condition to check.
 * @param part - The part to append if the condition is true.
 */
function appendPartIf(parts, condition, part) {
    if (condition) {
        parts.push(part);
    }
}
/**
 * Creates a timestamp byte array if the token is timed.
 *
 * @param timed - Whether the token is timed.
 * @param serializer - Function to serialize the timestamp.
 * @returns A Uint8Array containing the timestamp or an empty array.
 */
function createTimestampBytes(timed, serializer) {
    if (timed) {
        const now = Date.now();
        return serializer(now);
    }
    return new Uint8Array();
}
/**
 * Signs the combined data using the provided HMAC key.
 *
 * @param key - The CryptoKey used for signing.
 * @param data - The data to sign.
 * @returns A Promise that resolves to the signature as a Uint8Array.
 */
async function signData(key, data) {
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    return new Uint8Array(signatureBuffer);
}
/**
 * Generates a secure token by combining random bytes, optional data, and a signature.
 *
 * @param key - The CryptoKey used for HMAC signing.
 * @param data - Optional data to include in the token.
 * @param showData - Whether to include the serialized data in the token.
 * @param timed - Whether the token should include a timestamp.
 * @param tokenByteLength - The length of the random byte segment.
 * @param separator - The character used to separate token parts.
 * @param serializer - Function to serialize data into Uint8Array.
 * @returns A Promise that resolves to the generated token string.
 */
export async function generateToken(key, data, showData, timed, tokenByteLength, separator, serializer) {
    const parts = [];
    // Generate random bytes
    const randomBytes = generateRandomBytes(tokenByteLength);
    // Serialize data if provided
    const dataBytes = data !== undefined && data !== null ? serializer(data) : new Uint8Array();
    // Append serialized data if showData is true and data exists
    appendPartIf(parts, showData && dataBytes.length > 0, encodeBase64(dataBytes));
    // appendPartIf(parts, showData, encodeBase64(dataBytes));
    // Create timestamp bytes if timed
    const timestampBytes = createTimestampBytes(timed, serializer);
    // Combine random bytes, data bytes, and timestamp bytes
    const combined = combineUint8Arrays(randomBytes, dataBytes, timestampBytes);
    // Append timestamp to parts if timed
    appendPartIf(parts, timed, encodeBase64(timestampBytes));
    // Sign the combined data
    const signature = await signData(key, combined);
    // Append random bytes and signature to parts
    parts.push(encodeBase64(randomBytes));
    parts.push(encodeBase64(signature));
    // Join all parts using the specified separator
    return parts.join(separator);
}
/**
 * Splits and trims the token into its constituent parts.
 *
 * @param token - The token string to split.
 * @param separator - The separator used in the token.
 * @returns An array of trimmed token parts.
 */
function splitAndTrimToken(token, separator) {
    return token.split(separator).map((part) => part.trim());
}
/**
 * Extracts token parts based on the presence of data and timestamp.
 *
 * @param parts - The array of token parts.
 * @param showData - Whether the token includes data.
 * @param timed - Whether the token includes a timestamp.
 * @returns An object containing the extracted Base64 parts.
 */
function extractTokenParts(parts, showData, timed) {
    let idx = 0;
    let dataBase64;
    let timeBase64;
    let randomBase64;
    let signatureBase64;
    // If showData is true, the first part is the base64-encoded data.
    if (showData) {
        if (idx >= parts.length)
            return null;
        dataBase64 = parts[idx++] || '';
    }
    // If timed is true, the next part is the base64-encoded timestamp.
    if (timed) {
        if (idx >= parts.length)
            return null;
        timeBase64 = parts[idx++] || '';
    }
    // Next is always the base64-encoded random bytes.
    if (idx >= parts.length)
        return null;
    randomBase64 = parts[idx++] || '';
    // Finally, the last part is the signature.
    if (idx >= parts.length)
        return null;
    signatureBase64 = parts[idx++] || '';
    // If there are any leftover parts, format is invalid.
    if (idx !== parts.length)
        return null;
    return {
        dataBase64,
        timeBase64,
        randomBase64,
        signatureBase64,
    };
}
/**
 * Compares two Uint8Arrays for equality.
 *
 * @param a - The first Uint8Array.
 * @param b - The second Uint8Array.
 * @returns True if both arrays are equal, false otherwise.
 */
function arraysEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
/**
 * Extracts and verifies the timestamp from the token.
 *
 * @param timeBase64 - The Base64-encoded timestamp.
 * @param serializer - Function to serialize the timestamp.
 * @returns The timestamp as a number or null if invalid.
 */
function extractTimestamp(timeBase64) {
    try {
        const timeBytes = decodeBase64(timeBase64);
        const timeStr = defaultDataDecoder(timeBytes);
        const tokenTime = parseInt(timeStr, 10);
        if (isNaN(tokenTime))
            return null;
        return tokenTime;
    }
    catch {
        return null;
    }
}
/**
 * Handles data bytes by decoding, serializing, and comparing with expected data.
 *
 * @param data - The expected data.
 * @param dataBase64 - The Base64 encoded data from the token.
 * @param serializer - Function to serialize data.
 * @returns The decoded data bytes or null if comparison fails.
 */
async function handleAndCompareData(data, dataBase64, serializer) {
    try {
        const extractedDataBytes = decodeBase64(dataBase64);
        if (!extractedDataBytes)
            return null;
        const expectedDataBytes = data !== undefined && data !== null ? serializer(data) : new Uint8Array();
        if (!arraysEqual(extractedDataBytes, expectedDataBytes)) {
            return null; // Data mismatch
        }
        return extractedDataBytes;
    }
    catch {
        return null; // Invalid Base64 encoding or other errors
    }
}
/**
 * Verifies the integrity and validity of a submitted token.
 *
 * @param key - The CryptoKey used for HMAC verification.
 * @param submitted - The submitted token string.
 * @param data - The expected data to verify against.
 * @param showData - Whether the token includes data.
 * @param timed - Whether the token includes a timestamp.
 * @param separator - The separator used in the token.
 * @param serializer - Function to serialize data into Uint8Array.
 * @param maxAgeMs - Optional maximum age in milliseconds for token validity.
 * @returns A Promise that resolves to true if the token is valid, false otherwise.
 */
export async function verifyToken(key, submitted, data, // The 'expected' data you want to verify against
showData, // Matches generateToken’s 'showData'
timed, // Matches generateToken’s 'timed'
separator, serializer, maxAgeMs // Optional expiration check in milliseconds
) {
    // Split and trim the submitted token string into parts.
    const parts = splitAndTrimToken(submitted, separator);
    // Extract token parts based on showData and timed flags.
    const extractedParts = extractTokenParts(parts, showData, timed);
    if (!extractedParts)
        return false;
    const { dataBase64, timeBase64, randomBase64, signatureBase64 } = extractedParts;
    // Decode the random bytes.
    let randomBytes;
    try {
        randomBytes = decodeBase64(randomBase64);
    }
    catch {
        return false; // Invalid Base64 encoding for random bytes
    }
    // Handle data bytes.
    const dataBytes = showData && dataBase64 ? await handleAndCompareData(data, dataBase64, serializer) : serializer(data);
    if (showData && dataBase64 && dataBytes === null) {
        return false;
    }
    // Combine random bytes and data bytes.
    let finalCombined = combineUint8Arrays(randomBytes, dataBytes);
    let tokenTime = null;
    // Handle timestamp bytes if the token is timed.
    if (timed && timeBase64) {
        tokenTime = extractTimestamp(timeBase64);
        if (tokenTime === null)
            return false; // Corrupted or invalid timestamp
        // Serialize the timestamp as it was during token generation.
        const timeBytes = serializer(tokenTime);
        // Append the timestamp bytes to the combined data.
        finalCombined = combineUint8Arrays(finalCombined, timeBytes);
    }
    // Decode the signature from Base64.
    let signatureBytes;
    try {
        signatureBytes = decodeBase64(signatureBase64);
    }
    catch {
        return false; // Invalid Base64 encoding for signature
    }
    // Verify the signature using the CryptoKey.
    let isVerified;
    try {
        isVerified = await crypto.subtle.verify('HMAC', key, signatureBytes, finalCombined);
    }
    catch {
        return false; // Verification process failed
    }
    if (!isVerified) {
        return false;
    }
    // Verify the token's age if maxAgeMs is provided.
    if (maxAgeMs && tokenTime) {
        const currentTime = Date.now();
        if (currentTime - tokenTime > maxAgeMs) {
            return false; // Token expired
        }
    }
    return true;
}
/**
 * Determines if the provided data is considered an edge case.
 *
 * @param data - The data to check.
 * @returns True if data is an edge case, false otherwise.
 */
export function isEdgeCase(data) {
    // const edgeCases = [undefined, null, '', 0, false, {}, []];
    if (data === undefined || data === null)
        return true;
    if (data === '' || data === 0 || data === false)
        return true;
    if (typeof data === 'object') {
        if (Array.isArray(data))
            return data.length === 0;
        return Object.keys(data).length === 0;
    }
    return false;
}
/**
 * Create a CSRF utility object from user options merged with defaults.
 * Users can generate and verify tokens that are tied to optional additional data.
 * Custom data serializers can be provided to handle different data types.
 */
export async function edgeToken(userOptions) {
    const options = mergeExtendedOptions(userOptions);
    const key = await getHmacKey(options.secret, options.algorithm);
    return {
        options,
        /**
         * Generate a simple token without data and without timing.
         */
        async generate(data = '') {
            data = isEdgeCase(data) ? '' : data;
            return generateToken(key, data, false, false, options.tokenByteLength, options.seperator, options.dataSerializer);
        },
        /**
         * Verify a simple token without data and without timing.
         */
        async verify(submitted, data = '') {
            data = isEdgeCase(data) ? '' : data;
            return verifyToken(key, submitted, data, false, false, options.seperator, options.dataSerializer, undefined // maxAgeMs not applicable
            );
        },
        /**
         * Generate a token with embedded data but without timing.
         */
        async generateWithData(data) {
            data = isEdgeCase(data) ? '' : data;
            return generateToken(key, data, data ? true : false, // showData
            false, // timed
            options.tokenByteLength, options.seperator, options.dataSerializer);
        },
        /**
         * Verify a token with embedded data but without timing.
         */
        async verifyWithData(submitted, data) {
            data = isEdgeCase(data) ? '' : data;
            return verifyToken(key, submitted, data, data ? true : false, // showData
            false, // timed
            options.seperator, options.dataSerializer, undefined // maxAgeMs not applicable
            );
        },
        /**
         * Generate a timed token without embedded data.
         */
        async generateTimed(data = '') {
            data = isEdgeCase(data) ? '' : data;
            return generateToken(key, data, false, // showData
            true, // timed
            options.tokenByteLength, options.seperator, options.dataSerializer);
        },
        /**
         * Verify a timed token without embedded data.
         * @param maxAgeMs The maximum age in milliseconds the token is valid for.
         */
        async verifyTimed(submitted, data = '', maxAgeMs) {
            data = isEdgeCase(data) ? '' : data;
            return verifyToken(key, submitted, data, false, // showData
            true, // timed
            options.seperator, options.dataSerializer, maxAgeMs);
        },
        /**
         * Generate a timed token with embedded data.
         */
        async generateWithDataTimed(data) {
            data = isEdgeCase(data) ? '' : data;
            return generateToken(key, data, data ? true : false, // showData
            true, // timed
            options.tokenByteLength, options.seperator, options.dataSerializer);
        },
        /**
         * Verify a timed token with embedded data.
         * @param maxAgeMs The maximum age in milliseconds the token is valid for.
         */
        async verifyWithDataTimed(submitted, data, maxAgeMs) {
            data = isEdgeCase(data) ? '' : data;
            return verifyToken(key, submitted, data, data ? true : false, // showData
            true, // timed
            options.seperator, options.dataSerializer, maxAgeMs);
        },
    };
}
