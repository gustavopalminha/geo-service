import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { SpatialService, SpatialQueryDto } from '../data/spatial.service';
import { ConfigService } from '../config/config.service';
import { SchemaValidationPipe } from '../pipes/schema-validation.pipe';

export function createDataController(configService: ConfigService) {
  const subpath = configService.get('apiSubpath').replace('/', '');
  
  @Controller(subpath)
  class DynamicDataController {
    public readonly allowedCrud: string;
    public readonly allowSpatialQueries: boolean;

    constructor(
      public readonly dataService: DataService,
      public readonly spatialService: SpatialService,
      public readonly configService: ConfigService,
    ) {
      this.allowedCrud = configService.get('allowedCrud');
      this.allowSpatialQueries = configService.get('allowSpatialQueries');
    }

    @Get()
    async findAll(
      @Query('skip') skip?: string,
      @Query('take') take?: string,
      @Query('orderBy') orderBy?: string,
      @Query('order') order?: 'ASC' | 'DESC',
    ) {
      if (!this.allowedCrud.includes('R')) {
        throw new NotFoundException();
      }

      const skipNum = skip ? parseInt(skip, 10) : undefined;
      const takeNum = take ? parseInt(take, 10) : undefined;
      const orderObj = orderBy ? { [orderBy]: order || 'ASC' } : undefined;

      return this.dataService.findAll(undefined, skipNum, takeNum, orderObj);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
      if (!this.allowedCrud.includes('R')) {
        throw new NotFoundException();
      }

      const result = await this.dataService.findOne(id);
      if (!result) {
        throw new NotFoundException('Entity not found');
      }
      return result;
    }

    @Post()
    async create(@Body(new SchemaValidationPipe()) body: any) {
      if (!this.allowedCrud.includes('C')) {
        throw new NotFoundException();
      }

      return this.dataService.create(body);
    }

    @Put(':id')
    async updatePut(@Param('id') id: string, @Body(new SchemaValidationPipe()) body: any) {
      if (!this.allowedCrud.includes('U')) {
        throw new NotFoundException();
      }

      return this.dataService.update(id, body);
    }

    @Patch(':id')
    async updatePatch(@Param('id') id: string, @Body(new SchemaValidationPipe()) body: any) {
      if (!this.allowedCrud.includes('U')) {
        throw new NotFoundException();
      }

      return this.dataService.update(id, body);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
      if (!this.allowedCrud.includes('D')) {
        throw new NotFoundException();
      }

      await this.dataService.delete(id);
      return { message: 'Entity deleted successfully' };
    }

    @Post('spatial')
    async spatialQuery(@Body() dto: SpatialQueryDto) {
      if (!this.allowSpatialQueries) {
        throw new NotFoundException('Spatial queries are not enabled');
      }

      if (!this.allowedCrud.includes('R')) {
        throw new NotFoundException();
      }

      const validOperations = ['intersects', 'touches', 'contains', 'within', 'distance'];
      if (!validOperations.includes(dto.operation)) {
        throw new BadRequestException(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
      }

      if (!dto.geometry) {
        throw new BadRequestException('Geometry (WKT format) is required');
      }

      if (dto.operation === 'distance' && !dto.distance) {
        throw new BadRequestException('Distance parameter is required for distance operation');
      }

      return this.spatialService.spatialQuery(dto);
    }

    @Get('spatial/metadata')
    async getSpatialMetadata() {
      if (!this.allowSpatialQueries) {
        throw new NotFoundException('Spatial queries are not enabled');
      }

      return this.spatialService.getGeometryMetadata();
    }
  }

  return DynamicDataController;
}