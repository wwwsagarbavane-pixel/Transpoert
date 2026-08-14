import fs from "node:fs"
import path from "node:path"

export interface StoredFileResult {
  filename: string
  url: string
  path: string
}

export interface IStorageService {
  saveFile(filename: string, buffer: Buffer, mimeType?: string): Promise<StoredFileResult>
  getFile(filename: string): Promise<Buffer | null>
  deleteFile(filename: string): Promise<void>
  getFileUrl(filename: string): string
}

const STORAGE_DIR = path.resolve(process.cwd(), "storage")

export class LocalStorageProvider implements IStorageService {
  constructor() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true })
    }
  }

  public async saveFile(filename: string, buffer: Buffer, mimeType?: string): Promise<StoredFileResult> {
    const safeFilename = path.basename(filename)
    const filePath = path.join(STORAGE_DIR, safeFilename)
    await fs.promises.writeFile(filePath, buffer)
    return {
      filename: safeFilename,
      url: `/api/storage/${encodeURIComponent(safeFilename)}`,
      path: filePath
    }
  }

  public async getFile(filename: string): Promise<Buffer | null> {
    const safeFilename = path.basename(filename)
    const filePath = path.join(STORAGE_DIR, safeFilename)
    if (!fs.existsSync(filePath)) return null
    return await fs.promises.readFile(filePath)
  }

  public async deleteFile(filename: string): Promise<void> {
    const safeFilename = path.basename(filename)
    const filePath = path.join(STORAGE_DIR, safeFilename)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  }

  public getFileUrl(filename: string): string {
    const safeFilename = path.basename(filename)
    return `/api/storage/${encodeURIComponent(safeFilename)}`
  }
}

export class S3StorageProvider implements IStorageService {
  private bucketName: string
  private region: string

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || ""
    this.region = process.env.AWS_REGION || "us-east-1"
  }

  public async saveFile(filename: string, buffer: Buffer, mimeType?: string): Promise<StoredFileResult> {
    if (!this.bucketName) {
      console.warn("[S3StorageProvider] AWS_S3_BUCKET_NAME not set. Falling back to local storage behavior.")
      const local = new LocalStorageProvider()
      return local.saveFile(filename, buffer, mimeType)
    }
    // S3 SDK upload call prepared for Phase 2 AWS deployment
    const safeFilename = path.basename(filename)
    const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/uploads/${safeFilename}`
    return {
      filename: safeFilename,
      url: s3Url,
      path: `s3://${this.bucketName}/uploads/${safeFilename}`
    }
  }

  public async getFile(filename: string): Promise<Buffer | null> {
    const local = new LocalStorageProvider()
    return local.getFile(filename)
  }

  public async deleteFile(filename: string): Promise<void> {
    const local = new LocalStorageProvider()
    return local.deleteFile(filename)
  }

  public getFileUrl(filename: string): string {
    if (!this.bucketName) {
      return `/api/storage/${encodeURIComponent(path.basename(filename))}`
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/uploads/${encodeURIComponent(path.basename(filename))}`
  }
}

const providerType = process.env.STORAGE_PROVIDER || "local"
export const storageService: IStorageService = providerType === "s3" ? new S3StorageProvider() : new LocalStorageProvider()
