export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  altText?: string;
  exifData?: ExifInfo;
  analyzing?: boolean;
}

export interface ExifInfo {
  dateTime?: string;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
}
