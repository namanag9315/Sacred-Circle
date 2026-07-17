export interface UploadInput {
  bucket: string;
  path: string;
  file: Blob | ArrayBuffer | Uint8Array;
  contentType?: string;
}

export interface SignedUrlInput {
  provider: "r2" | "supabase";
  path: string;
  expiresInSeconds?: number;
}

export interface StorageProvider {
  upload(input: UploadInput): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  createSignedUrl?(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
}

export class SupabaseStorageProvider implements StorageProvider {
  constructor(private client: any) {}

  async upload(input: UploadInput) {
    const result = await this.client.storage
      .from(input.bucket)
      .upload(input.path, input.file, {
        contentType: input.contentType,
        upsert: true
      });

    if (result.error) throw result.error;
    return this.getPublicUrl(input.bucket, input.path);
  }

  getPublicUrl(bucket: string, path: string) {
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async createSignedUrl(bucket: string, path: string, expiresInSeconds: number) {
    const result = await this.client.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (result.error) throw result.error;
    return result.data.signedUrl;
  }
}

export function r2PathForSundaySession(dateIso: string, filename = "healing-recording.mp3") {
  const day = dateIso.slice(0, 10);
  return `protected/sunday-sessions/${day}/${filename}`;
}
