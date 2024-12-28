# Edge Token

A simple and secure token utility for generating and verifying tokens with optional data and timing. **Edge Runtime compatible**, making it ideal for use in serverless environments like Vercel Edge Functions, Cloudflare Workers, and other edge computing platforms. Suitable for CSRF protection, URL validation, file integrity checks, and more.

## Features

- **Edge Runtime Compatible**: Designed to work seamlessly in edge environments with limited APIs.
- **Generate and Verify Tokens**: Create tokens with or without embedded data and timestamps.
- **Flexible Use Cases**: Ideal for CSRF protection, secure URLs, file validation, and other token-based verification systems.
- **Customizable Options**: Configure HMAC algorithms, token length, separators, and data serializers.
- **TypeScript Support**: Fully typed for seamless integration in TypeScript projects.

## Installation

Install the package via npm:

```bash
npm install @nartix/edge-token
```

## Usage

### Importing

```typescript
import { edgeToken } from '@nartix/edge-token';
```

### Creating a Token Utility

Initialize the utility with your secret and optional configurations:

```typescript
const tokenUtility = await edgeToken({
  secret: 'your-secure-secret', // Replace with a secure, random string
  // Optional configurations:
  algorithm: 'SHA-256',          // Defaults to 'SHA-256'
  tokenByteLength: 32,           // Defaults to 32 bytes
  separator: '.',                // Defaults to '.'
  dataSerializer: (data) => {    // Optional custom serializer
    // Your serialization logic
  },
  dataDecoder: (data) => {       // Optional custom decoder
    // Your decoding logic
  },
});
```

### Generating Tokens

#### Simple Token

Generate a basic token without additional data or timing:

```typescript
const token = await tokenUtility.generate();
console.log(token);
// 92umqMyOJBxM74zOYMKC0nt+8OVRyZJhuXopMf5/DSc=.EanL8EFWynis1ZKJBYrIE+hEcBsTuHRHjWhnIsNYQCQ=
```

#### Token with Data

Generate a token that includes embedded data (e.g., user ID, file identifier):

```typescript
const tokenWithData = await tokenUtility.generateWithData({ userId: 123, fileId: 'abc123' });
console.log(tokenWithData);
// eyJ1c2VySWQiOjEyMywiZmlsZUlkIjoiYWJjMTIzIn0=.cXUNvZWlcSSC4Z6qTNbO1Hw/oJPmLi1eu7yA1EGSoJQ=.zd1Hy/uLTU...
```

#### Timed Token

Generate a token that includes a timestamp for expiration:

```typescript
const timedToken = await tokenUtility.generateTimed();
console.log(timedToken);
// MTczNTM4NTIwNjMyMw==.qh7XRpxSaX8NpGFqfP/qsuXdUqLsI3fzoy21/FsYtRA=.5laEEEjWQrbcE6GiIa0
```

#### Timed Token with Data

Generate a token that includes both data and a timestamp:

```typescript
const timedTokenWithData = await tokenUtility.generateWithDataTimed({ userId: 123, action: 'upload' });
console.log(timedTokenWithData);
```

### Verifying Tokens

#### Simple Token

Verify a basic token:

```typescript
const isValid = await tokenUtility.verify(submittedToken);
console.log(isValid); // true or false
```

#### Token with Data

Verify a token that includes embedded data:

```typescript
const isValidWithData = await tokenUtility.verifyWithData(submittedToken, { userId: 123, fileId: 'abc123' });
console.log(isValidWithData); // true or false
```

#### Timed Token

Verify a timed token with a maximum age (e.g., 5 minutes):

```typescript
const isValidTimed = await tokenUtility.verifyTimed(submittedToken, '', 5 * 60 * 1000);
console.log(isValidTimed); // true or false
```

#### Timed Token with Data

Verify a timed token that includes embedded data:

```typescript
const isValidTimedWithData = await tokenUtility.verifyWithDataTimed(submittedToken, { userId: 123, action: 'upload' }, 5 * 60 * 1000);
console.log(isValidTimedWithData); // true or false
```

## Example Use Cases

### CSRF Protection

Generate and verify CSRF tokens to protect against Cross-Site Request Forgery attacks.

```typescript
// Generate CSRF token
const csrfToken = await tokenUtility.generate();

// Embed `csrfToken` in your forms or requests

// Verify CSRF token upon form submission
const isCsrfValid = await tokenUtility.verify(submittedCsrfToken);
```

### Secure URLs

Create tokens that embed user or action data to generate secure, tamper-proof URLs.

```typescript
// Generate a secure URL token with user ID and action
const urlToken = await tokenUtility.generateWithData({ userId: 456, action: 'reset-password' });
const secureUrl = `https://yourdomain.com/action?token=${urlToken}`;

// Verify the token when the URL is accessed
const isUrlValid = await tokenUtility.verifyWithData(submittedUrlToken, { userId: 456, action: 'reset-password' });
```

### File Integrity Checks

Generate tokens for files to ensure they haven't been tampered with.

```typescript
// Generate a token for a file
const fileToken = await tokenUtility.generateWithData({ fileId: 'file123', checksum: 'abcde12345' });

// Store `fileToken` alongside the file

// Verify the token when accessing the file
const isFileValid = await tokenUtility.verifyWithData(submittedFileToken, { fileId: 'file123', checksum: 'abcde12345' });
```

## Configuration Options

When initializing `edgeToken`, you can provide the following options:

- **secret** (`string`, *required*): The secret used to derive the HMAC key. Must be a secure, random string.
- **algorithm** (`string`, *optional*): Hash algorithm for HMAC. Supported values: `SHA-1`, `SHA-256`, `SHA-384`, `SHA-512`. Defaults to `SHA-256`.
- **tokenByteLength** (`number`, *optional*): Byte length of the random token portion. Defaults to `32`.
- **separator** (`string`, *optional*): Character to separate token parts. Defaults to `.`.
- **dataSerializer** (`function`, *optional*): Function to serialize data into `Uint8Array`. Defaults handle strings, objects, and `Uint8Array` instances.
- **dataDecoder** (`function`, *optional*): Function to decode data from `Uint8Array`. Defaults handle JSON parsing and string decoding.

## API Reference

### `edgeToken(userOptions: Partial<Options>)`

Creates a token utility with the specified options.

- **Parameters:**
  - `userOptions` (`Partial<Options>`): User-provided configuration options.

- **Returns:**
  - A promise that resolves to the token utility object.

### Token Utility Methods

#### `generate(data?: unknown): Promise<string>`

Generate a simple token without data and without timing.

- **Parameters:**
  - `data` (`unknown`, *optional*): Data to include in the token. Defaults to an empty string if the data is an edge case.

- **Returns:**
  - A promise that resolves to the generated token string.

#### `verify(submitted: string, data?: unknown): Promise<boolean>`

Verify a simple token without data and without timing.

- **Parameters:**
  - `submitted` (`string`): The token to verify.
  - `data` (`unknown`, *optional*): The expected data to verify against. Defaults to an empty string if the data is an edge case.

- **Returns:**
  - A promise that resolves to `true` if the token is valid, `false` otherwise.

#### `generateWithData(data: unknown): Promise<string>`

Generate a token with embedded data.

- **Parameters:**
  - `data` (`unknown`): Data to include in the token.

- **Returns:**
  - A promise that resolves to the generated token string.

#### `verifyWithData(submitted: string, data: unknown): Promise<boolean>`

Verify a token with embedded data.

- **Parameters:**
  - `submitted` (`string`): The token to verify.
  - `data` (`unknown`): The expected data to verify against.

- **Returns:**
  - A promise that resolves to `true` if the token is valid, `false` otherwise.

#### `generateTimed(data?: unknown): Promise<string>`

Generate a timed token without embedded data.

- **Parameters:**
  - `data` (`unknown`, *optional*): Data to include in the token. Defaults to an empty string if the data is an edge case.

- **Returns:**
  - A promise that resolves to the generated token string.

#### `verifyTimed(submitted: string, data?: unknown, maxAgeMs: number): Promise<boolean>`

Verify a timed token without embedded data.

- **Parameters:**
  - `submitted` (`string`): The token to verify.
  - `data` (`unknown`, *optional*): The expected data to verify against. Defaults to an empty string if the data is an edge case.
  - `maxAgeMs` (`number`): Maximum age in milliseconds for the token to be considered valid.

- **Returns:**
  - A promise that resolves to `true` if the token is valid and not expired, `false` otherwise.

#### `generateWithDataTimed(data: unknown): Promise<string>`

Generate a timed token with embedded data.

- **Parameters:**
  - `data` (`unknown`): Data to include in the token.

- **Returns:**
  - A promise that resolves to the generated token string.

#### `verifyWithDataTimed(submitted: string, data: unknown, maxAgeMs: number): Promise<boolean>`

Verify a timed token with embedded data.

- **Parameters:**
  - `submitted` (`string`): The token to verify.
  - `data` (`unknown`): The expected data to verify against.
  - `maxAgeMs` (`number`): Maximum age in milliseconds for the token to be considered valid.

- **Returns:**
  - A promise that resolves to `true` if the token is valid and not expired, `false` otherwise.

## Security Considerations

- **Use a Strong Secret**: Ensure the `secret` option is a strong, random string to maintain token security.
- **Token Expiration**: When using timed tokens, set an appropriate `maxAgeMs` to balance security and usability.
- **Data Integrity**: Only include non-sensitive data within tokens and ensure proper serialization and decoding.
- **Protect Secrets**: Never expose your secret in client-side code or insecure environments.

## Edge Runtime Compatibility

**Edge Token** is fully compatible with Edge Runtime environments, such as:

- **Vercel Edge Functions**
- **Cloudflare Workers**
- **Netlify Edge Functions**
- **AWS Lambda@Edge**

This compatibility ensures that you can leverage **Edge Token** for high-performance, low-latency applications deployed at the edge, taking advantage of secure token generation and verification without sacrificing speed or scalability.

## License

MIT

---

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/nartix/edge-token/issues) on GitHub.

---

Happy tokenizing! 🚀