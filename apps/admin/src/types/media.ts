export interface MediaAsset {
  id: string;
  objectKey: string;
  url: string;
  mimeType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  referencesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadResponse {
  asset: MediaAsset;
  uploadUrl?: string;
}
