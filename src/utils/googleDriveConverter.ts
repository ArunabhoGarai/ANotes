export class GoogleDriveConverter {
  /**
   * Convert Google Drive sharing link to direct download link
   */
  static convertToDirectLink(url: string): string {
    try {
      // Remove any trailing whitespace
      url = url.trim();
      
      // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      const viewPattern = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/;
      const viewMatch = url.match(viewPattern);
      
      if (viewMatch) {
        const fileId = viewMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      
      // Pattern 2: https://drive.google.com/open?id=FILE_ID
      const openPattern = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
      const openMatch = url.match(openPattern);
      
      if (openMatch) {
        const fileId = openMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      
      // Pattern 3: https://docs.google.com/document/d/FILE_ID/edit
      const docsPattern = /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;
      const docsMatch = url.match(docsPattern);
      
      if (docsMatch) {
        const fileId = docsMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      
      // Pattern 4: Already a direct link
      if (url.includes('drive.google.com/uc?export=download')) {
        return url;
      }
      
      // If no pattern matches, return original URL
      return url;
    } catch (error) {
      console.error('Error converting Google Drive URL:', error);
      return url;
    }
  }
  
  /**
   * Check if URL is a Google Drive link
   */
  static isGoogleDriveLink(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }
  
  /**
   * Extract file ID from Google Drive URL
   */
  static extractFileId(url: string): string | null {
    try {
      // Pattern 1: /file/d/FILE_ID/
      const filePattern = /\/file\/d\/([a-zA-Z0-9_-]+)/;
      const fileMatch = url.match(filePattern);
      
      if (fileMatch) {
        return fileMatch[1];
      }
      
      // Pattern 2: ?id=FILE_ID
      const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
      const idMatch = url.match(idPattern);
      
      if (idMatch) {
        return idMatch[1];
      }
      
      // Pattern 3: /document/d/FILE_ID/
      const docPattern = /\/document\/d\/([a-zA-Z0-9_-]+)/;
      const docMatch = url.match(docPattern);
      
      if (docMatch) {
        return docMatch[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting file ID:', error);
      return null;
    }
  }
  
  /**
   * Validate if the converted link is accessible
   */
  static async validateDirectLink(url: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // For Google Drive links, we can't reliably validate due to CORS
      // Just return a warning about potential issues
      if (this.isGoogleDriveLink(url)) {
        return { 
          isValid: false, 
          error: 'Google Drive links may not work due to CORS restrictions. Consider using a different hosting service or the file upload method.' 
        };
      }
      
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: 'Unable to access the PDF from this URL. Try using a direct CDN link or file upload instead.' 
      };
    }
  }
  
  /**
   * Get alternative hosting suggestions
   */
  static getAlternativeHostingOptions(): string[] {
    return [
      '1. Upload to GitHub: Create a repository, upload PDF, use raw file URL',
      '2. Use Dropbox: Share file and replace "dl=0" with "dl=1" in URL',
      '3. Use file hosting services: WeTransfer, SendSpace, or similar',
      '4. Use a CDN service: Upload to a CDN that provides direct links',
      '5. Alternative: Use the file upload option instead of URL'
    ];
  }
  
  /**
   * Get Google Drive sharing instructions
   */
  static getSharingInstructions(): string[] {
    return [
      '1. Upload your PDF to Google Drive',
      '2. Right-click → Share → "Anyone with the link"',
      '3. Copy the sharing link',
      '4. Note: May not work due to CORS restrictions',
      '5. Consider using file upload or alternative hosting'
    ];
  }
  
  /**
   * Check if file permissions are correct
   */
  static getPermissionError(url: string): string | null {
    if (this.isGoogleDriveLink(url)) {
      return 'Google Drive links often don\'t work due to CORS restrictions. Consider using file upload or alternative hosting services like GitHub, Dropbox, or direct CDN links.';
    }
    return null;
  }
}