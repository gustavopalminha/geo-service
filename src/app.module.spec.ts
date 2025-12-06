import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should create dynamic module', async () => {
    const module = await AppModule.createDynamicModule();

    expect(module).toBeDefined();
    expect(module.module).toBe(AppModule);
    expect(module.imports).toBeDefined();
    expect(module.imports!.length).toBeGreaterThan(0);
  });
});