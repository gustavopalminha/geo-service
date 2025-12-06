import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('types')
export class TypesController {
  constructor(private readonly configService: ConfigService) {
    // ConfigService available for future use
    void this.configService;
  }

  @Get()
  getTypes() {
    let interfacePath = path.join(__dirname, '../generated/data.interface.ts');

    // In development/local, the file might be in src
    if (!fs.existsSync(interfacePath)) {
      interfacePath = path.join(__dirname, '../../src/generated/data.interface.ts');
    }

    if (fs.existsSync(interfacePath)) {
      const content = fs.readFileSync(interfacePath, 'utf-8');
      return { schema: content };
    }

    // Fallback for production build if source is missing
    const jsPath = path.join(__dirname, '../generated/data.interface.js');
    return { schema: 'Interface available in source code', path: jsPath };
  }
}
