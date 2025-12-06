import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const serviceHeader = this.configService.get('serviceHeader');
    
    if (serviceHeader) {
      const requestHeader = req.headers['x-geo-call'];
      
      if (requestHeader !== serviceHeader) {
        throw new UnauthorizedException('Invalid or missing x-geo-call header');
      }
    }
    
    next();
  }
}
