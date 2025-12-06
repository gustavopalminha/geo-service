import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { ConfigService } from '../config/config.service';
import { GeometryMetadata } from '../generated/geometry.metadata';
@Injectable()
export class DataService<T = any> {
  private repository: Repository<any>;

  constructor(
    @Inject(DataSource) private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.initializeRepository();
  }

  private initializeRepository() {
    const tableName = this.configService.get('dbTable');
    if (tableName) {
      this.repository = this.dataSource.getRepository(tableName);
    }
  }

  private getPrimaryColumnName(): string {
    if (!this.repository) return 'id';
    const primaryColumns = this.repository.metadata.primaryColumns;
    return primaryColumns.length > 0 ? primaryColumns[0].propertyName : 'id';
  }

  private getSelectColumns(): (keyof T)[] {
    if (!this.repository) return [];

    // Get all column names
    const allColumns = this.repository.metadata.columns.map(col => col.propertyName);

    // Filter out geometry columns
    const geometryColumns = GeometryMetadata.geometryColumns.map(g => g.name);

    const selected = allColumns.filter(col => !geometryColumns.includes(col)) as (keyof T)[];
    return selected;
  }

  async findAll(
    filter?: Partial<T>,
    skip?: number,
    take?: number,
    order?: { [key: string]: 'ASC' | 'DESC' },
  ): Promise<T[]> {
    if (!this.repository) return [];
    return this.repository.find({
      select: this.getSelectColumns(),
      where: filter as FindOptionsWhere<any>,
      skip,
      take,
      order,
    });
  }

  async findOne(id: number | string): Promise<T | null> {
    if (!this.repository) return null;
    const primaryKey = this.getPrimaryColumnName();
    return this.repository.findOne({
      select: this.getSelectColumns(),
      where: { [primaryKey]: id },
    });
  }

  async create(data: Partial<T>): Promise<T> {
    if (!this.repository) throw new Error('Repository not initialized');
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: number | string, data: Partial<T>): Promise<T> {
    if (!this.repository) throw new Error('Repository not initialized');
    const primaryKey = this.getPrimaryColumnName();
    await this.repository.update({ [primaryKey]: id }, data);
    const updated = await this.findOne(id);
    if (!updated) throw new Error('Entity not found');
    return updated;
  }

  async delete(id: number | string): Promise<void> {
    if (!this.repository) throw new Error('Repository not initialized');
    const primaryKey = this.getPrimaryColumnName();
    await this.repository.delete({ [primaryKey]: id });
  }
}
