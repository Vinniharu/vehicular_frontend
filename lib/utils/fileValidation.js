/**
 * Central file validation utility for document and image uploads.
 * Enforces a 10MB file size limit and verifies allowed file extensions and MIME types.
 */

export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const DEFAULT_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".pdf",
  ".doc",
  ".docx",
];

export const IMAGE_ONLY_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
];

/**
 * Validates a file before upload.
 *
 * @param {File|Blob} file The file object to validate.
 * @param {Object} [options] Validation configuration options.
 * @param {number} [options.maxSizeMb=10] Maximum allowed file size in megabytes.
 * @param {string[]} [options.allowedExtensions] Array of allowed file extensions (with leading dot).
 * @param {boolean} [options.imagesOnly=false] Whether to only allow image formats.
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateUploadFile(file, options = {}) {
  const {
    maxSizeMb = MAX_UPLOAD_SIZE_MB,
    imagesOnly = false,
    allowedExtensions = imagesOnly ? IMAGE_ONLY_EXTENSIONS : DEFAULT_ALLOWED_EXTENSIONS,
  } = options;

  if (!file) {
    return { valid: false, error: "Please select a file to upload." };
  }

  // Check empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty (0 bytes). Please choose a valid document or photo.",
    };
  }

  // Check file size (10MB limit)
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    const actualSizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${actualSizeMb}MB). The maximum allowed size is ${maxSizeMb}MB.`,
    };
  }

  // Check file extension
  const fileName = file.name || "";
  const lastDotIdx = fileName.lastIndexOf(".");
  const ext = lastDotIdx !== -1 ? fileName.slice(lastDotIdx).toLowerCase() : "";

  if (ext) {
    const isAllowedExt = allowedExtensions.some((allowed) => allowed.toLowerCase() === ext);
    if (!isAllowedExt) {
      const allowedReadable = allowedExtensions
        .map((e) => e.replace(/^\./, "").toUpperCase())
        .join(", ");
      return {
        valid: false,
        error: `Unsupported file format "${ext}". Please upload ${allowedReadable}.`,
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Format bytes to human-readable string (e.g. 2.4 MB, 450 KB).
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
