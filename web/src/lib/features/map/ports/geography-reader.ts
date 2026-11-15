import type { MapAssets, MapLayerOptions } from '../domain/types';

/** Map assets and optional third-party imagery supplied by the infrastructure. */
export interface GeographyReader {
  assets(): MapAssets;
  layerOptions(): MapLayerOptions;
}
