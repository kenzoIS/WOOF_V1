import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-providers';

const BUCKET_NAME = 'woof-data-lake-lucena-prod-1786959360';
const REGION = 'ap-southeast-2';

/**
 * AwsService handles all S3 Data Lake archiving operations.
 *
 * Three archive layers:
 *   s3://BUCKET/raw/         — Original CSV buffers & raw JSON payloads
 *   s3://BUCKET/processed/   — Cleaned ETL fact rows (post-Supabase)
 *   s3://BUCKET/analytics/   — Forecast results, cross-sell caches, reports
 *
 * Authentication uses the local AWS CLI profile "woof-prod" which was set up
 * via `aws login --profile woof-prod`. Credentials rotate every 12 hours
 * and can be silently renewed for 90 days.
 */
@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: REGION,
      credentials: fromIni({ profile: 'woof-prod' }),
    });
  }

  // ----------------------------------------------------------------
  // Health check
  // ----------------------------------------------------------------

  async verifyConnection(): Promise<boolean> {
    try {
      await this.s3.send(new ListBucketsCommand({}));
      this.logger.log('AWS S3 connection verified.');
      return true;
    } catch (error) {
      this.logger.warn(
        `AWS S3 connection failed: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }

  // ----------------------------------------------------------------
  // Raw Layer — original file buffers before any processing
  // ----------------------------------------------------------------

  async uploadRawArchive(
    filename: string,
    buffer: Buffer,
    channel: string,
    uploadId: string,
  ): Promise<string | null> {
    const date = new Date();
    const datePrefix = this.datePath(date);
    const safeFilename = this.sanitizeFilename(filename);
    const key = `raw/${datePrefix}/${channel}/${uploadId}_${safeFilename}`;
    return this.putObject(key, buffer, this.mimeForFilename(filename));
  }

  // ----------------------------------------------------------------
  // Processed Layer — cleaned ETL data that was inserted into Supabase
  // ----------------------------------------------------------------

  async uploadProcessedArchive(
    uploadId: string,
    factRows: Record<string, unknown>[],
    channel: string,
  ): Promise<string | null> {
    const date = new Date();
    const datePrefix = this.datePath(date);
    const key = `processed/${datePrefix}/${channel}/${uploadId}_fact_rows.json`;
    const body = JSON.stringify(factRows, null, 2);
    return this.putObject(key, Buffer.from(body, 'utf-8'), 'application/json');
  }

  // ----------------------------------------------------------------
  // Analytics Layer — forecast outputs, cross-sell caches, reports
  // ----------------------------------------------------------------

  async uploadAnalyticsArchive(
    type: 'forecast' | 'cross-sell' | 'smart-report' | 'dynamic-promo',
    module: string,
    payload: Record<string, unknown>,
  ): Promise<string | null> {
    const date = new Date();
    const datePrefix = this.datePath(date);
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const key = `analytics/${datePrefix}/${type}/${module}_${timestamp}.json`;
    const body = JSON.stringify(payload, null, 2);
    return this.putObject(key, Buffer.from(body, 'utf-8'), 'application/json');
  }

  // ----------------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------------

  private async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string | null> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      const uri = `s3://${BUCKET_NAME}/${key}`;
      this.logger.log(`Archived to ${uri} (${this.humanSize(body.length)})`);
      return uri;
    } catch (error) {
      this.logger.warn(
        `S3 archive failed for ${key}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private datePath(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private mimeForFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return 'text/csv';
    if (ext === 'xlsx' || ext === 'xls') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/octet-stream';
  }

  private humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
