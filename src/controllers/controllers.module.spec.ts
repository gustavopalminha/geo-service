import { ControllersModule } from './controllers.module';
import { ConfigService } from '../config/config.service';

describe('ControllersModule', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'apiSubpath': return '/test';
          default: return null;
        }
      }),
    } as any;
  });

  it('should create dynamic module', () => {
    const module = ControllersModule.forRoot(configService);

    expect(module).toBeDefined();
    expect(module.module).toBe(ControllersModule);
    expect(module.controllers).toBeDefined();
    expect(module.controllers!.length).toBeGreaterThan(0);
  });

  it('should include DataModule in imports', () => {
    const module = ControllersModule.forRoot(configService);

    expect(module.imports).toBeDefined();
    expect(module.imports!.length).toBeGreaterThan(0);
  });
});