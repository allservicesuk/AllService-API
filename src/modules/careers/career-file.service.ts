/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Handles file storage for application documents — saving, reading, hashing, and cleanup.
 */
import { createHash } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import type { Readable } from 'stream';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { ErrorCode } from '@common/constants/error-codes';
import careersConfig from '@config/careers.config';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface StoredFile {
  readonly storagePath: string;
  readonly sha256Hash: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly filename: string;
}

@Injectable()
export class CareerFileService {
  private readonly logger = new Logger(CareerFileService.name);
  private readonly basePath: string;

  constructor(
    @Inject(careersConfig.KEY) private readonly config: ConfigType<typeof careersConfig>,
  ) {
    this.basePath = this.config.uploadBasePath;
  }

  isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.has(mimeType);
  }

  getMaxFileSizeBytes(): number {
    return MAX_FILE_SIZE_BYTES;
  }

  async saveFile(file: Express.Multer.File): Promise<StoredFile> {
    await mkdir(this.basePath, { recursive: true });

    const ext = extname(file.originalname).toLowerCase();
    const storageName = `${randomUUID()}${ext}`;
    const storagePath = join(this.basePath, storageName);

    await writeFile(storagePath, file.buffer);

    const sha256Hash = createHash('sha256').update(file.buffer).digest('hex');

    this.logger.log(
      `career.file.saved path=${storagePath} size=${file.size} mime=${file.mimetype}`,
    );

    return {
      storagePath,
      sha256Hash,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      filename: file.originalname,
    };
  }

  createReadStream(storagePath: string): Readable {
    if (!existsSync(storagePath)) {
      throw new NotFoundException({
        code: ErrorCode.DOCUMENT_NOT_FOUND,
        message: 'Document file not found on disk',
      });
    }
    return createReadStream(storagePath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      await unlink(storagePath);
      this.logger.log(`career.file.deleted path=${storagePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`career.file.delete.failed path=${storagePath} reason=${message}`);
    }
  }
}
