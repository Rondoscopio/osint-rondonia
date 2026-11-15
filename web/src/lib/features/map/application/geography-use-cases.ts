import type { GeographyReader } from '../ports/geography-reader';

export function createGeographyUseCases(reader: GeographyReader) {
  return {
    assets: () => reader.assets(),
    layerOptions: () => reader.layerOptions(),
  };
}

export type GeographyUseCases = ReturnType<typeof createGeographyUseCases>;
