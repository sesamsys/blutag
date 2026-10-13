export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  altText?: string | undefined;
  exifData?: ExifInfo | undefined;
  analyzing?: boolean | undefined;
}

export interface ExifInfo {
  dateTime?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  make?: string | undefined;
  model?: string | undefined;
}
