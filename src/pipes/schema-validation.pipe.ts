import { PipeTransform, Injectable, ArgumentMetadata, Inject, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SchemaValidationPipe implements PipeTransform {
  private allowedFields: string[] = [];

  constructor(
    @Optional() @Inject(DataSource) private dataSource?: DataSource,
    @Optional() private configService?: ConfigService,
  ) {
    if (this.dataSource && this.configService) {
      this.initializeAllowedFields();
    }
  }

  private async initializeAllowedFields() {
    if (!this.configService || !this.dataSource) return;
    
    const tableName = this.configService.get('dbTable');
    if (!tableName) return;
    
    try {
      const metadata = this.dataSource.getMetadata(tableName);
      this.allowedFields = metadata.columns.map(col => col.propertyName);
    } catch {
      // Fallback: get columns from database directly
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        const columns = await queryRunner.getTable(tableName);
        this.allowedFields = columns?.columns.map(col => col.name) || [];
      } finally {
        await queryRunner.release();
      }
    }
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || !value || typeof value !== 'object') {
      return value;
    }

    // If no fields initialized, allow all (fallback)
    if (this.allowedFields.length === 0) {
      return value;
    }

    // Strip fields not in entity schema
    const sanitized: any = {};
    for (const key of Object.keys(value)) {
      if (this.allowedFields.includes(key)) {
        sanitized[key] = value[key];
      }
    }

    return sanitized;
  }
}
