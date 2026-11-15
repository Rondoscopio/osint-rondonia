import { asset } from '$app/paths';
import type { MapAssets, MapLayerOptions } from '../domain/types';
import type { GeographyReader } from '../ports/geography-reader';

export class StaticGeographyReader implements GeographyReader {
  assets(): MapAssets {
    return {
      worldTilesUrl: asset('/maps/world.pmtiles'),
      brazilMunicipalityTilesUrl: asset('/maps/municipios-brasil.pmtiles'),
      reliefImageUrl: asset('/maps/world-relief.webp'),
    };
  }

  layerOptions(): MapLayerOptions {
    return {
      borders: [
        {
          id: 'natural-earth',
          label: 'Natural Earth · dados locais',
          attribution: 'Limites políticos: Natural Earth, domínio público.',
        },
        {
          id: 'openfreemap',
          label: 'OpenStreetMap · OpenFreeMap',
          styleUrl: 'https://tiles.openfreemap.org/styles/positron',
          attribution:
            'OpenFreeMap · OpenMapTiles · OpenStreetMap contributors',
        },
      ],
      relief: [
        {
          id: 'natural-earth',
          label: 'Natural Earth · sombreado global',
          attribution: 'Relevo: Natural Earth, domínio público.',
          attributionUrl:
            'https://www.naturalearthdata.com/about/terms-of-use/',
          maxzoom: 0,
          tileSize: 256,
        },
        {
          id: 'opentopomap',
          label: 'OpenTopoMap · SRTM + OpenStreetMap',
          tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
          attribution:
            'Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)',
          attributionUrl: 'https://opentopomap.org/about#verwendung',
          maxzoom: 17,
          tileSize: 256,
        },
      ],
    };
  }
}
