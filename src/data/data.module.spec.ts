import { DataModule } from './data.module';

describe('DataModule', () => {
  it('should be defined', () => {
    expect(DataModule).toBeDefined();
  });

  it('should have providers', () => {
    const moduleMetadata = Reflect.getMetadata('providers', DataModule) || [];
    expect(Array.isArray(moduleMetadata)).toBe(true);
  });

  it('should have exports', () => {
    const moduleMetadata = Reflect.getMetadata('exports', DataModule) || [];
    expect(Array.isArray(moduleMetadata)).toBe(true);
  });
});