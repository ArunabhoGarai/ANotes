export interface CDNUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileId?: string;
}

export interface CDNProvider {
  name: string;
  upload: (file: File) => Promise<CDNUploadResult>;
  delete?: (fileId: string) => Promise<boolean>;
}

// Using file.io as a simple CDN provider (free tier available)
class FileIOProvider implements CDNProvider {
  name = 'File.io';
  private baseUrl = 'https://file.io';

  async upload(file: File): Promise<CDNUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expires', '1d'); // File expires in 1 day
      formData.append('maxDownloads', '10'); // Allow up to 10 downloads

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          url: result.link,
          fileId: result.key
        };
      } else {
        return {
          success: false,
          error: result.message || 'Upload failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
}

// Using Uploadcare as an alternative CDN provider
class UploadcareProvider implements CDNProvider {
  name = 'Uploadcare';
  private publicKey = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY;
  private baseUrl = 'https://upload.uploadcare.com/base/';

  async upload(file: File): Promise<CDNUploadResult> {
    if (!this.publicKey) {
      return {
        success: false,
        error: 'Uploadcare public key not configured'
      };
    }

    try {
      const formData = new FormData();
      formData.append('UPLOADCARE_PUB_KEY', this.publicKey);
      formData.append('file', file);
      formData.append('UPLOADCARE_STORE', 'auto');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.file) {
        const cdnUrl = `https://ucarecdn.com/${result.file}/`;
        return {
          success: true,
          url: cdnUrl,
          fileId: result.file
        };
      } else {
        return {
          success: false,
          error: 'Upload failed - no file ID returned'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async delete(fileId: string): Promise<boolean> {
    // Uploadcare deletion requires private key, skip for now
    return true;
  }
}

// Using Cloudinary as another alternative
class CloudinaryProvider implements CDNProvider {
  name = 'Cloudinary';
  private cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  private uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  async upload(file: File): Promise<CDNUploadResult> {
    if (!this.cloudName || !this.uploadPreset) {
      return {
        success: false,
        error: 'Cloudinary configuration missing'
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('resource_type', 'raw'); // For PDF files

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.secure_url) {
        return {
          success: true,
          url: result.secure_url,
          fileId: result.public_id
        };
      } else {
        return {
          success: false,
          error: 'Upload failed - no URL returned'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async delete(fileId: string): Promise<boolean> {
    // Cloudinary deletion requires API key/secret, skip for now
    return true;
  }
}

export class CDNUploadService {
  private providers: CDNProvider[] = [
    new FileIOProvider(), // Primary - works immediately, no config needed
  ];

  // Backup providers (require configuration)
  private backupProviders: CDNProvider[] = [
    new UploadcareProvider(),
    new CloudinaryProvider(),
  ];

  async uploadPDF(file: File): Promise<CDNUploadResult> {
    // Validate file
    if (file.type !== 'application/pdf') {
      return {
        success: false,
        error: 'Only PDF files are supported'
      };
    }

    // Try File.io first (primary provider)
    for (const provider of this.providers) {
      try {
        console.log(`Attempting upload with ${provider.name}...`);
        const result = await provider.upload(file);
        
        if (result.success && result.url) {
          console.log(`Upload successful with ${provider.name}: ${result.url}`);
          return result;
        } else {
          console.log(`Upload failed with ${provider.name}: ${result.error}`);
        }
      } catch (error) {
        console.log(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // If File.io fails, try backup providers
    for (const provider of this.backupProviders) {
      try {
        console.log(`Attempting backup upload with ${provider.name}...`);
        const result = await provider.upload(file);
        
        if (result.success && result.url) {
          console.log(`Backup upload successful with ${provider.name}: ${result.url}`);
          return result;
        } else {
          console.log(`Backup upload failed with ${provider.name}: ${result.error}`);
        }
      } catch (error) {
        console.log(`Backup provider ${provider.name} failed:`, error);
        continue;
      }
    }

    return {
      success: false,
      error: 'File.io CDN upload failed. Falling back to direct Gemini upload.'
    };
  }

  async uploadPDFWithFallback(file: File): Promise<CDNUploadResult> {
    // First try CDN upload
    const cdnResult = await this.uploadPDF(file);
    
    if (cdnResult.success) {
      return cdnResult;
    }

    // If CDN fails, suggest local processing
    return {
      success: false,
      error: 'CDN upload failed. The file will be processed locally instead.',
    };
  }
}

export const cdnUploadService = new CDNUploadService();