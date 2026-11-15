export type Basemap = 'borders' | 'relief' | 'satellite';
export type Projection = 'mercator' | 'globe';
export type MapTerritorySelection = {
  name: string;
  country: string;
  countryId: string | null;
  uf: string;
  municipio: string;
  supported: boolean;
};
export type BorderSourceId = 'natural-earth' | 'openfreemap';
export type ReliefSourceId = 'natural-earth' | 'opentopomap';
export type SatelliteSourceId = string;

export type MapAssets = {
  worldTilesUrl: string;
  brazilMunicipalityTilesUrl: string;
  reliefImageUrl: string;
};

export type SatelliteLayer = {
  id: SatelliteSourceId;
  label: string;
  tiles: string[];
  sourceId: string;
  sourceName: string;
  attribution: string;
  attributionUrl: string;
  acknowledgement: string | null;
  maxzoom: number;
  tileSize: number;
  continuous: boolean;
  dataMode: 'fixa' | 'diaria';
  dataReference: string | null;
};

export type ReliefLayer = {
  id: ReliefSourceId;
  label: string;
  tiles?: string[];
  attribution: string;
  attributionUrl: string;
  maxzoom: number;
  tileSize: number;
};

export type BorderSource = {
  id: BorderSourceId;
  label: string;
  styleUrl?: string;
  attribution: string;
};

export type MapLayerOptions = {
  borders: BorderSource[];
  relief: ReliefLayer[];
};
