/**
 * SPLD SAFETY - Vercel Blob Private Storage Service
 * Encapsulates client presigned upload issuance, blob verification, streaming, and deletion
 */

import * as vercelBlob from '@vercel/blob';
import * as vercelBlobClient from '@vercel/blob/client';

export const ALLOWED_EVIDENCE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Detect image MIME type from binary buffer / byte signature (magic bytes)
 * Supports JPEG (FF D8 FF), PNG (89 50 4E 47 0D 0A 1A 0A), and WebP (RIFF ... WEBP)
 * @param {Uint8Array|Buffer} bytes
 * @returns {string|null} Detected MIME type or null if invalid
 */
export function detectImageSignature(bytes) {
  if (!bytes || bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export const blobService = {
  // Underlying SDK functions, customizable/mockable for automated testing
  sdk: {
    handleUploadPresigned: vercelBlobClient.handleUploadPresigned,
    issueSignedToken: vercelBlob.issueSignedToken,
    head: vercelBlob.head,
    get: vercelBlob.get,
    del: vercelBlob.del,
  },

  /**
   * Handle presigned upload token request from client
   * @param {import('express').Request} req
   * @param {string} findingId
   * @returns {Promise<any>}
   */
  async handlePresignRequest(req, findingId) {
    const expectedPrefix = `findings/${findingId}/`;

    return await this.sdk.handleUploadPresigned({
      body: req.body,
      request: req,
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY || undefined,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname || !pathname.startsWith(expectedPrefix)) {
          throw new Error('Prefix pathname tidak valid untuk temuan ini.');
        }
        return {
          allowedContentTypes: ALLOWED_EVIDENCE_MIME_TYPES,
          maximumSizeInBytes: MAX_EVIDENCE_SIZE_BYTES,
          addRandomSuffix: false,
        };
      },
      getSignedToken: async (pathname) => {
        if (!pathname || !pathname.startsWith(expectedPrefix)) {
          throw new Error('Prefix pathname tidak valid untuk temuan ini.');
        }
        const token = await this.sdk.issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes: ALLOWED_EVIDENCE_MIME_TYPES,
          maximumSizeInBytes: MAX_EVIDENCE_SIZE_BYTES,
        });
        return {
          token,
          urlOptions: {
            addRandomSuffix: false,
            allowOverwrite: false,
          },
        };
      },
    });
  },

  /**
   * Verify blob metadata in Vercel Blob private storage
   * @param {string} pathname
   * @returns {Promise<{ size: number, contentType: string, pathname: string }>}
   */
  async verifyBlob(pathname) {
    return await this.sdk.head(pathname, { access: 'private' });
  },

  /**
   * Verify blob magic byte signature by reading the initial bytes of the private stream
   * @param {string} pathname
   * @returns {Promise<string|null>}
   */
  async verifyBlobSignature(pathname) {
    const blobResult = await this.getBlobStream(pathname);
    if (!blobResult) return null;

    if (blobResult.stream) {
      const reader = blobResult.stream.getReader();
      const { value } = await reader.read();
      reader.releaseLock();
      return detectImageSignature(value);
    } else if (blobResult.body) {
      if (Buffer.isBuffer(blobResult.body) || blobResult.body instanceof Uint8Array) {
        return detectImageSignature(blobResult.body);
      }
      if (typeof blobResult.body.once === 'function') {
        return new Promise((resolve) => {
          blobResult.body.once('data', (chunk) => {
            resolve(detectImageSignature(chunk));
          });
          blobResult.body.once('error', () => resolve(null));
        });
      }
    }

    return null;
  },

  /**
   * Fetch private blob content stream
   * @param {string} pathname
   * @returns {Promise<{ stream?: ReadableStream, body?: any, blob?: any }>}
   */
  async getBlobStream(pathname) {
    return await this.sdk.get(pathname, { access: 'private' });
  },

  /**
   * Delete blob from private store
   * @param {string} pathname
   * @returns {Promise<void>}
   */
  async deleteBlob(pathname) {
    return await this.sdk.del(pathname, { access: 'private' });
  },
};

export default blobService;
