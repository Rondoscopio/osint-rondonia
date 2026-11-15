<script lang="ts">
  import { Button } from 'bits-ui';
  import { onMount } from 'svelte';
  import { sources } from '$lib/links';
  import SelectField from '$lib/components/ui/SelectField.svelte';
  import type { CoverageMap } from '$lib/features/catalog/domain/types';
  import type { Item } from '$lib/shared/types';
  import { registerPmtiles } from './pmtiles-runtime';
  import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
  import type {
    Map as MapLibreMap,
    MapLayerMouseEvent,
    StyleSpecification,
  } from 'maplibre-gl';
  import type {
    Basemap,
    BorderSourceId,
    MapTerritorySelection,
    Projection,
    ReliefSourceId,
    SatelliteSourceId,
    SatelliteLayer,
    MapAssets,
    MapLayerOptions,
  } from '$lib/features/map/domain/types';
  import 'maplibre-gl/dist/maplibre-gl.css';

  let {
    onSelectTerritory,
    territory,
    stateOptions,
    cityOptions,
    assets,
    layers,
    satelliteLayers,
    satelliteLayersLoading,
    satelliteLayersFailed,
    retrySatelliteLayers,
    coverage,
    coverageFailed,
    retryCoverage,
  }: {
    onSelectTerritory: (place: MapTerritorySelection | null) => void;
    territory: MapTerritorySelection | null;
    stateOptions: Item[];
    cityOptions: Item[];
    assets: MapAssets;
    layers: MapLayerOptions;
    satelliteLayers: SatelliteLayer[];
    satelliteLayersLoading: boolean;
    satelliteLayersFailed: boolean;
    retrySatelliteLayers: () => void;
    coverage?: CoverageMap;
    coverageFailed: boolean;
    retryCoverage: () => void;
  } = $props();

  type SelectedPlace = {
    name: string;
    country: string;
    countryId: string | null;
    ufSigla?: string;
    municipalityId?: string;
  };

  let mapElement = $state<HTMLDivElement>();
  let mapLoaded = $state(false);
  let worldReady = $state(false);
  let mapFailed = $state(false);
  let basemap = $state<Basemap>('borders');
  let borderSource = $state<BorderSourceId>('natural-earth');
  let reliefSource = $state<ReliefSourceId>('natural-earth');
  let satelliteSource = $state<SatelliteSourceId>('');
  let projection = $state<Projection>('mercator');
  let brazilReady = $state(false);
  let map: MapLibreMap | undefined;
  let worldArchiveUrl = '';
  let municipalityArchiveUrl = '';
  let brazilRequested = true;
  let initialCameraApplied = false;
  const featureStateCounts = new Map<string, number>();
  const selectedBorderSource = $derived(
    layers.borders.find((item) => item.id === borderSource)!,
  );
  const selectedReliefSource = $derived(
    layers.relief.find((item) => item.id === reliefSource)!,
  );
  const selectedSatelliteSource = $derived(
    satelliteLayers.find((item) => item.id === satelliteSource),
  );
  const states = $derived(coverage?.states ?? []);
  const municipalities = $derived(coverage?.municipalities ?? []);

  $effect(() => {
    if (
      satelliteLayers.length > 0 &&
      !satelliteLayers.some((item) => item.id === satelliteSource)
    ) {
      satelliteSource = satelliteLayers[0].id;
    }
  });

  $effect(() => {
    if (basemap === 'satellite' && selectedSatelliteSource) applyBasemap();
  });
  const number = new Intl.NumberFormat('pt-BR');
  const naturalEarthUrl =
    'https://www.naturalearthdata.com/about/terms-of-use/';
  const globeOcean = '#4b91b8';
  const globeSky = {
    'sky-color': '#030712',
    'sky-horizon-blend': 0.12,
    'horizon-color': '#071426',
    'horizon-fog-blend': 0.2,
    'fog-color': '#071426',
    'fog-ground-blend': 0.2,
    'atmosphere-blend': 0.28,
  };
  const defaultBounds: [[number, number], [number, number]] = [
    [-67.2, -14.2],
    [-59.5, -7.3],
  ];

  function applySelectionOutline() {
    if (!map || !mapLoaded) return;
    const state = states.find((item) => item.id === territory?.uf);
    const city = territory?.municipio;
    if (map.getLayer('map-country-selection'))
      map.setFilter('map-country-selection', [
        '==',
        ['to-string', ['get', 'map_id']],
        territory?.countryId && !territory.uf && !city
          ? territory.countryId
          : '',
      ]);
    if (map.getLayer('map-state-selection'))
      map.setFilter('map-state-selection', [
        'in',
        ['get', 'uf_sigla'],
        ['literal', state && !city ? [state.sigla] : []],
      ]);
    if (map.getLayer('map-city-selection'))
      map.setFilter('map-city-selection', [
        'in',
        ['to-string', ['get', 'codigo_ibge']],
        ['literal', city ? [city] : []],
      ]);
  }

  function selectionOutline(id: string, source: string, layer: string) {
    map?.addLayer({
      id: 'map-' + id + '-selection',
      source,
      'source-layer': layer,
      type: 'line',
      filter: ['==', ['get', 'map_id'], ''],
      paint: { 'line-color': '#d7ff70', 'line-width': 3, 'line-opacity': 0.94 },
    });
  }

  // The two strokes stay legible at both ends of the coverage palette.
  const boundaryLight = '#f0f7ef';
  const boundaryDark = '#244136';

  function applyCoverage() {
    if (!map || !mapLoaded || !coverage) return;

    if (map.getSource('world-regions') && map.isSourceLoaded('world-regions')) {
      const stateCoverage = new Map(
        states.map((item) => [item.sigla, item.total]),
      );
      const visibleRegions = new Set<string>();
      for (const feature of map.querySourceFeatures('world-regions', {
        sourceLayer: 'regions',
      })) {
        const uf = String(feature.properties?.uf_sigla ?? '');
        const id = String(feature.id ?? feature.properties?.map_id ?? '');
        if (!uf || !id || visibleRegions.has(id)) continue;
        visibleRegions.add(id);
        const count = stateCoverage.get(uf) ?? 0;
        const cacheKey = `admin1:${id}`;
        if (featureStateCounts.get(cacheKey) === count) continue;
        map.setFeatureState(
          { source: 'world-regions', sourceLayer: 'regions', id },
          { count },
        );
        featureStateCounts.set(cacheKey, count);
      }
    }

    if (
      !brazilReady ||
      !map.getSource('brazil-municipalities') ||
      !map.isSourceLoaded('brazil-municipalities')
    )
      return;
    const coverageById = new Map(
      municipalities.map((item) => [item.id, item.total]),
    );
    const visibleIds = new Set<string>();
    for (const feature of map.querySourceFeatures('brazil-municipalities', {
      sourceLayer: 'municipios',
    })) {
      const id = String(feature.id ?? feature.properties?.codigo_ibge ?? '');
      if (!id || visibleIds.has(id)) continue;
      visibleIds.add(id);
      const count = coverageById.get(id) ?? 0;
      const cacheKey = `municipality:${id}`;
      if (featureStateCounts.get(cacheKey) === count) continue;
      map.setFeatureState(
        {
          source: 'brazil-municipalities',
          sourceLayer: 'municipios',
          id,
        },
        { count },
      );
      featureStateCounts.set(cacheKey, count);
    }
  }

  function boundsOf(coordinates: unknown) {
    const bounds: [[number, number], [number, number]] = [
      [Infinity, Infinity],
      [-Infinity, -Infinity],
    ];
    const visit = (value: unknown) => {
      if (!Array.isArray(value)) return;
      if (
        value.length >= 2 &&
        typeof value[0] === 'number' &&
        typeof value[1] === 'number'
      ) {
        bounds[0][0] = Math.min(bounds[0][0], value[0]);
        bounds[0][1] = Math.min(bounds[0][1], value[1]);
        bounds[1][0] = Math.max(bounds[1][0], value[0]);
        bounds[1][1] = Math.max(bounds[1][1], value[1]);
        return;
      }
      for (const child of value) visit(child);
    };
    visit(coordinates);
    return bounds;
  }

  function loadBrazilMunicipalities() {
    brazilRequested = true;
    if (!map || !mapLoaded || map.getSource('brazil-municipalities')) return;
    map.addSource('brazil-municipalities', {
      type: 'vector',
      url: municipalityArchiveUrl,
      promoteId: { municipios: 'codigo_ibge' },
    });
    map.addLayer(
      {
        id: 'brazil-municipality-fill',
        type: 'fill',
        source: 'brazil-municipalities',
        'source-layer': 'municipios',
        minzoom: 5.7,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['feature-state', 'count'], 0],
            0,
            '#edf1e7',
            1,
            '#c4dfc2',
            10,
            '#82bc85',
            100,
            '#287246',
          ],
          'fill-opacity': basemap === 'borders' ? 0.92 : 0,
        },
      },
      'brazil-admin1-boundary-casing',
    );
    map.addLayer(
      {
        id: 'brazil-municipality-hit',
        type: 'line',
        source: 'brazil-municipalities',
        'source-layer': 'municipios',
        minzoom: 5.7,
        paint: { 'line-color': '#526557', 'line-width': 0.35 },
      },
      'brazil-admin1-boundary-casing',
    );
    map.addLayer(
      {
        id: 'brazil-municipality-boundaries',
        type: 'line',
        source: 'brazil-municipalities',
        'source-layer': 'municipios',
        minzoom: 5.7,
        layout: { visibility: basemap === 'borders' ? 'visible' : 'none' },
        paint: {
          'line-color': boundaryLight,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5.7, 0.65, 9, 1],
          'line-opacity': 0.95,
        },
      },
      'brazil-admin1-boundary-casing',
    );
    styleMunicipalityBoundaries();
    selectionOutline('city', 'brazil-municipalities', 'municipios');
    applySelectionOutline();
    map.on('click', 'brazil-municipality-fill', selectMunicipality);
    map.on('mouseenter', 'brazil-municipality-hit', () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'brazil-municipality-hit', () => {
      if (map) map.getCanvas().style.cursor = '';
    });
  }

  function selectCountry(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    if (!feature) return;
    const hitLayers = ['brazil-municipality-fill', 'world-admin1-hit'].filter(
      (id) => map?.getLayer(id),
    );
    const detailedTerritories = hitLayers.length
      ? map?.queryRenderedFeatures(event.point, { layers: hitLayers })
      : [];
    if (detailedTerritories?.length) return;
    const properties = feature.properties ?? {};
    const countryId = String(properties.map_id ?? feature.id ?? '');
    const name = String(properties.name ?? 'País');
    emitTerritorySelection({ name, country: name, countryId });
    if (feature.geometry && 'coordinates' in feature.geometry) {
      const bounds = boundsOf(feature.geometry.coordinates);
      if (Number.isFinite(bounds[0][0])) {
        map?.fitBounds(bounds, { padding: 56, maxZoom: 5, duration: 750 });
      }
    }
    if (countryId === 'BRA') loadBrazilMunicipalities();
  }

  function selectRegion(event: MapLayerMouseEvent) {
    if (
      map?.getLayer('brazil-municipality-fill') &&
      map.queryRenderedFeatures(event.point, {
        layers: ['brazil-municipality-fill'],
      }).length
    )
      return;
    const feature = event.features?.[0];
    if (!feature) return;
    const properties = feature.properties ?? {};
    const name = String(properties.name ?? 'Região administrativa');
    const country = String(properties.country_name ?? '');
    const countryId = properties.country_id
      ? String(properties.country_id)
      : null;
    const iso3166_2 = String(properties.iso_3166_2 ?? '');
    const ufSigla = String(
      properties.uf_sigla ??
        (iso3166_2.startsWith('BR-') ? iso3166_2.slice(3) : ''),
    );
    emitTerritorySelection({
      name,
      country,
      countryId,
      ufSigla: ufSigla || undefined,
    });
    if (feature.geometry && 'coordinates' in feature.geometry) {
      const bounds = boundsOf(feature.geometry.coordinates);
      if (Number.isFinite(bounds[0][0])) {
        map?.fitBounds(bounds, {
          padding: map.getCanvas().clientWidth < 520 ? 24 : 48,
          maxZoom: 6.5,
          duration: 750,
        });
      }
    }
  }

  function selectMunicipality(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    if (!feature) return;
    const id = String(feature.properties?.codigo_ibge ?? feature.id ?? '');
    const item = municipalities.find((municipality) => municipality.id === id);
    if (!item) return;
    emitTerritorySelection({
      name: item.nome,
      country: item.uf_sigla,
      countryId: 'BRA',
      municipalityId: item.id,
    });
  }

  function emitTerritorySelection(place: SelectedPlace) {
    const municipality = municipalities.find(
      (item) => item.id === place.municipalityId,
    );
    const state = states.find((item) => item.sigla === place.ufSigla);
    const uf = municipality?.uf ?? state?.id ?? '';
    const municipio = municipality?.id ?? '';
    onSelectTerritory({
      name: place.name,
      country: place.country,
      countryId: place.countryId,
      uf,
      municipio,
      supported: Boolean(uf || municipio),
    });
  }

  function goToBrazil() {
    emitTerritorySelection({
      name: 'Brasil',
      country: 'Brasil',
      countryId: 'BRA',
    });
    loadBrazilMunicipalities();
    map?.fitBounds(
      [
        [-74, -34],
        [-34, 6],
      ],
      { padding: 52, maxZoom: 4.5, duration: 750 },
    );
  }

  function localBaseStyle(): StyleSpecification {
    return {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': projection === 'globe' ? globeOcean : '#e8ece5',
          },
        },
      ],
    };
  }

  function addWorldLayers() {
    if (!map || !map.isStyleLoaded()) return;
    if (map.getSource('world-countries')) {
      mapLoaded = true;
      applySelectionOutline();
      mapFailed = false;
      applyBasemap();
      applyProjectionAppearance();
      if (brazilRequested) loadBrazilMunicipalities();
      return;
    }
    worldReady = false;
    brazilReady = false;
    featureStateCounts.clear();
    map.addSource('world-countries', {
      type: 'vector',
      url: worldArchiveUrl,
      promoteId: { countries: 'map_id', regions: 'map_id' },
    });
    map.addLayer({
      id: 'world-countries-fill',
      type: 'fill',
      source: 'world-countries',
      'source-layer': 'countries',
      paint: {
        'fill-color': borderSource === 'natural-earth' ? '#dfe8dc' : '#fff',
        'fill-opacity': borderSource === 'natural-earth' ? 1 : 0.005,
      },
    });
    map.addLayer({
      id: 'world-country-boundaries',
      type: 'line',
      source: 'world-countries',
      'source-layer': 'countries',
      paint: { 'line-color': '#607265', 'line-width': 0.75 },
    });
    map.addSource('world-regions', {
      type: 'vector',
      url: worldArchiveUrl,
      promoteId: { countries: 'map_id', regions: 'map_id' },
    });
    map.addLayer(
      {
        id: 'brazil-admin1-coverage',
        type: 'fill',
        source: 'world-regions',
        'source-layer': 'regions',
        minzoom: 1.7,
        filter: ['==', ['get', 'country_id'], 'BRA'],
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['feature-state', 'count'], 0],
            0,
            '#edf1e7',
            1,
            '#c4dfc2',
            10,
            '#82bc85',
            100,
            '#287246',
          ],
          'fill-opacity': basemap === 'borders' ? 0.86 : 0,
        },
      },
      'world-country-boundaries',
    );
    map.addLayer({
      id: 'world-admin1-hit',
      type: 'fill',
      source: 'world-regions',
      'source-layer': 'regions',
      minzoom: 1.7,
      paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.005 },
    });
    map.addLayer({
      id: 'brazil-admin1-boundary-casing',
      type: 'line',
      source: 'world-regions',
      'source-layer': 'regions',
      minzoom: 1.7,
      filter: ['==', ['get', 'country_id'], 'BRA'],
      paint: {
        'line-color': boundaryDark,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.7, 6, 2.7],
        'line-opacity': 0.95,
      },
    });
    map.addLayer({
      id: 'brazil-admin1-boundaries',
      type: 'line',
      source: 'world-regions',
      'source-layer': 'regions',
      minzoom: 1.7,
      filter: ['==', ['get', 'country_id'], 'BRA'],
      paint: {
        'line-color': boundaryLight,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1, 6, 1.4],
        'line-opacity': 0.98,
      },
    });
    map.addLayer({
      id: 'world-admin1-boundaries',
      type: 'line',
      source: 'world-regions',
      'source-layer': 'regions',
      minzoom: 1.7,
      paint: {
        'line-color': '#738276',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.15, 6, 0.8],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.4, 6, 0.85],
      },
    });
    selectionOutline('country', 'world-countries', 'countries');
    selectionOutline('state', 'world-regions', 'regions');
    map.on('click', 'world-countries-fill', selectCountry);
    map.on('click', 'world-admin1-hit', selectRegion);
    for (const layer of ['world-countries-fill', 'world-admin1-hit']) {
      map.on('mouseenter', layer, () => {
        if (map) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layer, () => {
        if (map) map.getCanvas().style.cursor = '';
      });
    }
    mapLoaded = true;
    map.setProjection({ type: projection });
    applyProjectionAppearance();
    applyBasemap();
    if (!initialCameraApplied) {
      const initialCamera = map.cameraForBounds(defaultBounds, {
        padding: map.getCanvas().clientWidth < 520 ? 18 : 32,
      });
      if (initialCamera) map.jumpTo(initialCamera);
      initialCameraApplied = true;
    }
    if (brazilRequested) loadBrazilMunicipalities();
  }

  function ensureReliefLayer() {
    if (!map || !map.getLayer('world-countries-fill')) return;
    if (map.getSource('world-relief')) return;
    if (selectedReliefSource.id === 'natural-earth') {
      map.addSource('world-relief', {
        type: 'image',
        url: assets.reliefImageUrl,
        coordinates: [
          [-180, 85.05112878],
          [180, 85.05112878],
          [180, -85.05112878],
          [-180, -85.05112878],
        ],
      });
    } else {
      map.addSource('world-relief', {
        type: 'raster',
        tiles: selectedReliefSource.tiles,
        tileSize: selectedReliefSource.tileSize,
        maxzoom: selectedReliefSource.maxzoom,
        attribution: selectedReliefSource.attribution,
      });
    }
    map.addLayer(
      {
        id: 'world-relief-layer',
        type: 'raster',
        source: 'world-relief',
        layout: { visibility: 'visible' },
        paint: { 'raster-opacity': 0.95 },
      },
      'world-countries-fill',
    );
  }

  function ensureSatelliteLayer() {
    if (
      !map ||
      !selectedSatelliteSource ||
      !map.getLayer('world-countries-fill')
    )
      return;
    if (map.getSource('satellite-imagery')) return;
    map.addSource('satellite-imagery', {
      type: 'raster',
      tiles: selectedSatelliteSource.tiles,
      tileSize: selectedSatelliteSource.tileSize,
      maxzoom: selectedSatelliteSource.maxzoom,
      attribution: selectedSatelliteSource.attribution,
    });
    map.addLayer(
      {
        id: 'satellite-imagery-layer',
        type: 'raster',
        source: 'satellite-imagery',
        layout: { visibility: 'visible' },
        paint: { 'raster-opacity': 1 },
      },
      'world-countries-fill',
    );
  }

  function applyBasemap() {
    if (!map || !mapLoaded || !map.getLayer('world-countries-fill')) return;
    if (basemap === 'relief') ensureReliefLayer();
    if (basemap === 'satellite') ensureSatelliteLayer();
    if (map.getLayer('world-relief-layer')) {
      map.setLayoutProperty(
        'world-relief-layer',
        'visibility',
        basemap === 'relief' ? 'visible' : 'none',
      );
    }
    if (map.getLayer('satellite-imagery-layer')) {
      map.setLayoutProperty(
        'satellite-imagery-layer',
        'visibility',
        basemap === 'satellite' ? 'visible' : 'none',
      );
    }
    map.setPaintProperty(
      'world-countries-fill',
      'fill-color',
      basemap === 'borders' ? '#dfe8dc' : '#f5f5ed',
    );
    map.setPaintProperty(
      'world-countries-fill',
      'fill-opacity',
      borderSource === 'openfreemap' ? 0.005 : basemap === 'borders' ? 1 : 0,
    );
    if (map.getLayer('brazil-admin1-coverage')) {
      map.setPaintProperty(
        'brazil-admin1-coverage',
        'fill-opacity',
        basemap === 'borders' ? 0.86 : 0,
      );
    }
    if (map.getLayer('brazil-municipality-fill')) {
      map.setPaintProperty(
        'brazil-municipality-fill',
        'fill-opacity',
        basemap === 'borders' ? 0.92 : 0,
      );
    }
    const showCoverageBoundaries = basemap === 'borders';
    for (const layer of [
      'brazil-admin1-boundary-casing',
      'brazil-admin1-boundaries',
    ]) {
      map.setLayoutProperty(
        layer,
        'visibility',
        showCoverageBoundaries ? 'visible' : 'none',
      );
    }
    map.setFilter(
      'world-admin1-boundaries',
      showCoverageBoundaries ? ['!=', ['get', 'country_id'], 'BRA'] : null,
    );
    styleMunicipalityBoundaries();
    map.setPaintProperty(
      'world-country-boundaries',
      'line-color',
      basemap === 'satellite' ? '#ffffff' : '#607265',
    );
    map.setPaintProperty(
      'world-admin1-boundaries',
      'line-color',
      basemap === 'satellite' ? '#ffffff' : '#738276',
    );
  }

  function styleMunicipalityBoundaries() {
    if (!map?.getLayer('brazil-municipality-boundaries')) return;
    const showCoverageBoundaries = basemap === 'borders';
    map.setLayoutProperty(
      'brazil-municipality-boundaries',
      'visibility',
      showCoverageBoundaries ? 'visible' : 'none',
    );
    map.setPaintProperty(
      'brazil-municipality-hit',
      'line-color',
      showCoverageBoundaries ? boundaryDark : '#526557',
    );
    map.setPaintProperty(
      'brazil-municipality-hit',
      'line-width',
      showCoverageBoundaries ? 1.55 : 0.35,
    );
  }

  function useBasemap(next: Basemap) {
    mapFailed = false;
    basemap = next;
    applyBasemap();
  }

  function changeBorderSource() {
    if (!map) return;
    mapFailed = false;
    worldReady = false;
    brazilReady = false;
    featureStateCounts.clear();
    if (borderSource === 'openfreemap') {
      mapLoaded = false;
      map.setStyle(selectedBorderSource.styleUrl!, { diff: false });
    } else {
      mapLoaded = false;
      map.setStyle(localBaseStyle(), { diff: false });
    }
  }

  function changeReliefSource() {
    mapFailed = false;
    if (map?.getLayer('world-relief-layer'))
      map.removeLayer('world-relief-layer');
    if (map?.getSource('world-relief')) map.removeSource('world-relief');
    applyBasemap();
  }

  function changeSatelliteSource() {
    mapFailed = false;
    if (map?.getLayer('satellite-imagery-layer')) {
      map.removeLayer('satellite-imagery-layer');
    }
    if (map?.getSource('satellite-imagery'))
      map.removeSource('satellite-imagery');
    applyBasemap();
  }

  function setProjection(next: Projection) {
    projection = next;
    map?.setProjection({ type: next });
    applyProjectionAppearance();
  }

  function applyProjectionAppearance() {
    if (!map?.isStyleLoaded()) return;
    map.setSky(projection === 'globe' ? globeSky : {});
    if (borderSource !== 'openfreemap' && map.getLayer('background')) {
      map.setPaintProperty(
        'background',
        'background-color',
        projection === 'globe' ? globeOcean : '#e8ece5',
      );
    }
  }

  $effect(() => {
    void coverage;
    applyCoverage();
  });

  $effect(() => {
    if (mapLoaded) {
      applyCoverage();
    }
  });

  $effect(applySelectionOutline);

  onMount(() => {
    let observer: ResizeObserver | undefined;
    let frame = 0;
    let cancelled = false;
    void (async () => {
      try {
        const maplibre = await import('maplibre-gl');
        if (cancelled || !mapElement) return;
        maplibre.setWorkerUrl(maplibreWorkerUrl);
        [worldArchiveUrl, municipalityArchiveUrl] = registerPmtiles(maplibre, [
          assets.worldTilesUrl,
          assets.brazilMunicipalityTilesUrl,
        ]);
        map = new maplibre.Map({
          container: mapElement,
          style:
            borderSource === 'openfreemap'
              ? selectedBorderSource.styleUrl!
              : localBaseStyle(),
          center: [0, 0],
          zoom: 0,
          minZoom: -2,
          maxZoom: 10,
          attributionControl: false,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          renderWorldCopies: true,
          maxTileCacheZoomLevels: 3,
          cooperativeGestures: false,
        });
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => map?.resize());
          });
          observer.observe(mapElement);
        }
        map.on('error', (event) => {
          const message = event.error.message.toLowerCase();
          if (
            message.includes('worker failed to load') ||
            message.includes('failed to fetch worker script') ||
            message.includes('webgl')
          ) {
            mapFailed = true;
          }
        });
        map.on('style.load', () => {
          mapFailed = false;
          addWorldLayers();
        });
        map.on('load', addWorldLayers);
        map.on('sourcedata', (event) => {
          if (event.sourceId === 'world-countries' && event.isSourceLoaded) {
            worldReady = true;
            mapFailed = false;
          }
          if (event.sourceId === 'world-regions' && event.isSourceLoaded) {
            applyCoverage();
          }
          if (
            event.sourceId === 'brazil-municipalities' &&
            event.isSourceLoaded
          ) {
            brazilReady = true;
            applyCoverage();
          }
        });
        map.on('idle', () => {
          if (
            map?.getSource('world-countries') &&
            map.isSourceLoaded('world-countries')
          )
            worldReady = true;
        });
      } catch {
        mapFailed = true;
      }
    })();
    return () => {
      cancelled = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      map?.remove();
      map = undefined;
    };
  });
</script>

<section class="map-card card" aria-labelledby="map-heading">
  <div class="map-heading">
    <h2 id="map-heading">Mapa de cobertura</h2>
    <p class="muted">
      Selecione uma UF ou município para filtrar os resultados.
    </p>
  </div>

  {#snippet mapToolbar()}
    <div class="map-toolbar" aria-label="Opções do mapa">
      <fieldset class="map-modes">
        <legend>Camada de base</legend>
        <Button.Root
          type="button"
          class="button"
          aria-pressed={basemap === 'borders'}
          onclick={() => useBasemap('borders')}
        >
          Bordas
        </Button.Root>
        <Button.Root
          type="button"
          class="button"
          aria-pressed={basemap === 'relief'}
          onclick={() => useBasemap('relief')}
        >
          Relevo
        </Button.Root>
        <Button.Root
          type="button"
          class="button"
          aria-pressed={basemap === 'satellite'}
          onclick={() => useBasemap('satellite')}
        >
          Satélite
        </Button.Root>
      </fieldset>
      {#if basemap === 'borders'}
        <div class="map-source-control">
          <SelectField
            id="map-border-source"
            className="map-source-select"
            label="Fonte das bordas"
            options={layers.borders.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            bind:value={borderSource}
            onValueChange={changeBorderSource}
          />
        </div>
      {:else if basemap === 'relief'}
        <div class="map-source-control">
          <SelectField
            id="map-relief-source"
            className="map-source-select"
            label="Fonte do relevo"
            options={layers.relief.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            bind:value={reliefSource}
            onValueChange={changeReliefSource}
          />
        </div>
      {:else}
        <div class="map-source-control">
          {#if satelliteLayersLoading}
            <p class="map-source-status" role="status">
              Carregando camadas do catálogo SQLite…
            </p>
          {:else if satelliteLayersFailed}
            <div class="map-source-status" role="alert">
              <span>Não foi possível carregar as camadas do catálogo.</span>
              <Button.Root
                class="button"
                type="button"
                onclick={retrySatelliteLayers}
              >
                Tentar novamente
              </Button.Root>
            </div>
          {:else if satelliteLayers.length > 0}
            <SelectField
              id="map-satellite-source"
              className="map-source-select"
              label="Imagem de satélite"
              options={satelliteLayers.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
              bind:value={satelliteSource}
              onValueChange={changeSatelliteSource}
            />
          {:else}
            <p class="map-source-status" role="status">
              Nenhuma camada de satélite está cadastrada no SQLite.
            </p>
          {/if}
        </div>
      {/if}
      <div class="map-camera-controls">
        <Button.Root
          class="button"
          type="button"
          onclick={() =>
            setProjection(projection === 'mercator' ? 'globe' : 'mercator')}
        >
          {projection === 'mercator' ? 'Ver globo' : 'Ver mapa 2D'}
        </Button.Root>
        <Button.Root class="button" type="button" onclick={goToBrazil}>
          Ir ao Brasil
        </Button.Root>
        <span class="map-zoom-controls">
          <Button.Root
            class="button"
            type="button"
            aria-label="Aumentar zoom"
            onclick={() => map?.zoomIn()}
          >
            +
          </Button.Root>
          <Button.Root
            class="button"
            type="button"
            aria-label="Diminuir zoom"
            onclick={() => map?.zoomOut()}
          >
            −
          </Button.Root>
        </span>
      </div>
    </div>
  {/snippet}

  <div class="map-stage">
    <div
      bind:this={mapElement}
      class="world-map"
      class:globe-projection={projection === 'globe'}
      aria-label="Mapa interativo mundial de países e regiões administrativas"
      aria-busy={!mapLoaded || !worldReady}
    >
      <!-- MapLibre initializes the map in this element. -->
    </div>
    {@render mapToolbar()}
  </div>

  {#if stateOptions.length}
    <div class="map-territory-controls">
      <SelectField
        id="map-state-filter"
        label="Estado"
        value={territory?.uf ?? ''}
        options={[
          { value: '', label: 'Todos os estados' },
          ...stateOptions.map((item) => ({ value: item.id, label: item.nome })),
        ]}
        onValueChange={(id) => {
          const state = stateOptions.find((item) => item.id === id);
          onSelectTerritory(
            state
              ? {
                  name: state.nome,
                  country: 'Brasil',
                  countryId: 'BRA',
                  uf: state.id,
                  municipio: '',
                  supported: true,
                }
              : null,
          );
        }}
      />
      {#if territory?.uf && cityOptions.length}
        <SelectField
          id="map-city-filter"
          label="Município"
          value={territory.municipio}
          options={[
            { value: '', label: 'Todos os municípios' },
            ...cityOptions.map((item) => ({
              value: item.id,
              label: item.nome,
            })),
          ]}
          onValueChange={(id) => {
            const state = stateOptions.find(
              (item) => item.id === territory?.uf,
            );
            const city = cityOptions.find((item) => item.id === id);
            if (state)
              onSelectTerritory({
                name: city?.nome ?? state.nome,
                country: 'Brasil',
                countryId: 'BRA',
                uf: state.id,
                municipio: city?.id ?? '',
                supported: true,
              });
          }}
        />
      {/if}
    </div>
  {/if}

  {#if coverageFailed}
    <div class="map-source-status" role="alert">
      <span>
        Não foi possível carregar os quantitativos de cobertura do catálogo.
      </span>
      <Button.Root class="button" type="button" onclick={retryCoverage}>
        Tentar novamente
      </Button.Root>
    </div>
  {/if}

  {#if basemap === 'satellite' && selectedSatelliteSource && !selectedSatelliteSource.continuous}
    <p class="map-layer-note" role="note">
      Esta imagem diária cobre as faixas observadas pelo satélite; lacunas ou
      nuvens podem aparecer escuras. Para um mosaico global contínuo, escolha
      Blue Marble ou Sentinel-2 cloudless (2016).
    </p>
  {/if}

  {#if mapFailed}
    <div class="map-fallback" role="alert">
      <p>
        Não foi possível carregar a visualização interativa. Tente outra fonte
        de bordas nas opções do mapa. A tabela de resultados continua
        disponível.
      </p>
      <Button.Root
        class="button"
        type="button"
        onclick={() => location.reload()}
      >
        Tentar novamente
      </Button.Root>
    </div>
  {:else if !mapLoaded}
    <p class="muted map-status" role="status" aria-live="polite">
      Carregando mapa e dados territoriais…
    </p>
  {/if}

  <div class="map-caption">
    <span>
      {coverage
        ? `${number.format(municipalities.length)} municípios brasileiros com dados consultáveis`
        : 'Cobertura do catálogo'}
    </span>
    <!-- prettier-ignore -->
    <span class="map-legend">
      <i>
      </i>
      Sem cobertura
      <i>
      </i>
      Mais fontes
    </span>
  </div>
  <p class="map-attribution">
    {#if borderSource === 'natural-earth'}
      Limites globais: <a
        href={naturalEarthUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Natural Earth, domínio público
      </a>
      .
    {:else}
      Mapa e limites: <a
        href="https://openfreemap.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenFreeMap
      </a>
      ·
      <a
        href="https://openmaptiles.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenMapTiles
      </a>
      ·
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenStreetMap contributors
      </a>
      .
    {/if}
    {#if basemap === 'relief' && reliefSource === 'natural-earth'}
      <a href={naturalEarthUrl} target="_blank" rel="noopener noreferrer">
        Relevo Natural Earth, domínio público
      </a>
      .
    {:else if basemap === 'relief' && reliefSource === 'opentopomap'}
      Relevo: <a
        href={selectedReliefSource.attributionUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenTopoMap, CC BY-SA
      </a>
      · dados © OpenStreetMap contributors e SRTM.
    {/if}
    Municípios do Brasil:
    <a
      href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/"
      target="_blank"
      rel="noopener noreferrer"
    >
      IBGE, DTB 2025
    </a>
    .
    {#if basemap === 'satellite' && selectedSatelliteSource}
      Imagem: <a
        href={selectedSatelliteSource.attributionUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {selectedSatelliteSource.attribution}
      </a>
      · Fonte no catálogo:
      <a href={sources({ id: selectedSatelliteSource.sourceId })}>
        {selectedSatelliteSource.sourceName}
      </a>
      .
      {#if selectedSatelliteSource.acknowledgement}
        {selectedSatelliteSource.acknowledgement}
      {/if}
      {#if selectedSatelliteSource.dataMode === 'fixa' && selectedSatelliteSource.dataReference}
        Mosaico estático de {selectedSatelliteSource.dataReference}.
      {:else}
        Imagem orbital diária; data solicitada:
        {selectedSatelliteSource.dataReference ?? 'não informada'}.
      {/if}
    {/if}
  </p>
</section>

<style>
  .map-card {
    padding: clamp(0.7rem, 1.2vw, 1rem);
  }
  .map-heading h2 {
    margin-bottom: 0.22rem;
    font-size: 1.35rem;
  }
  .map-heading p {
    margin-bottom: 0.45rem;
  }
  .map-stage {
    position: relative;
    min-width: 0;
  }
  .map-toolbar {
    display: flex;
    position: absolute;
    z-index: 4;
    inset: auto 0.65rem 0.65rem;
    gap: 0.35rem;
    align-items: end;
    flex-wrap: wrap;
    margin: 0;
    padding: 0.4rem;
    border: 1px solid var(--border);
    border-radius: 0.65rem;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    box-shadow: 0 0.25rem 1rem #0002;
    backdrop-filter: blur(0.55rem);
  }
  .map-modes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
    flex: 0 1 auto;
    width: min(22rem, 100%);
    border: 0;
    padding: 0;
    margin: 0;
    min-width: 0;
  }
  .map-modes legend {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .map-toolbar :global(.button) {
    padding-inline: 0.55rem;
    white-space: nowrap;
  }
  .map-modes :global(.button[aria-pressed='true']) {
    color: var(--brand);
    border-color: var(--brand);
    background: var(--surface-alt);
  }
  .map-zoom-controls {
    display: inline-flex;
    gap: 0.25rem;
  }
  .map-camera-controls {
    display: flex;
    gap: 0.3rem;
    align-items: center;
  }
  .map-source-control {
    display: grid;
    width: 14rem;
    min-width: min(12rem, 100%);
    gap: 0.25rem;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .map-territory-controls {
    display: flex;
    align-items: end;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.45rem;
  }
  .map-territory-controls :global(.ui-select-field) {
    flex: 0 1 18rem;
    max-width: 22rem;
  }
  .map-source-status {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .map-source-control :global(.ui-select-label) {
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 400;
  }
  .map-source-control :global(.ui-select-trigger) {
    width: 100%;
    min-height: 2.45rem;
    border-radius: 0.55rem;
    padding: 0.4rem 2rem 0.4rem 0.65rem;
  }
  .map-layer-note {
    margin: 0.55rem 0;
    color: var(--muted);
    font-size: 0.82rem;
  }
  .world-map {
    width: 100%;
    height: clamp(12rem, 28dvh, 19rem);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 0.9rem;
    background: #e8ece5;
  }
  .world-map.globe-projection {
    background: #030712;
  }
  .world-map :global(.maplibregl-canvas) {
    outline: none;
  }
  .world-map :global(.maplibregl-ctrl-attrib) {
    font-size: 0.7rem;
  }
  .map-caption,
  .map-attribution,
  .map-status {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .map-caption {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem 0.8rem;
    margin-top: 0.4rem;
  }
  .map-legend {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .map-legend i {
    width: 0.8rem;
    height: 0.8rem;
    border: 1px solid #718475;
    background: #edf1e7;
  }
  .map-legend i + i {
    background: #287246;
  }
  .map-attribution {
    margin: 0.4rem 0 0;
    font-size: 0.78rem;
  }
  .map-fallback {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  @media (max-width: 700px) {
    .map-source-control {
      width: 100%;
    }
  }
  @media (max-width: 760px) {
    .world-map {
      height: clamp(12rem, 30dvh, 19rem);
    }
    .map-toolbar {
      position: static;
      margin-top: -0.45rem;
      border-radius: 0 0 0.65rem 0.65rem;
      box-shadow: none;
      backdrop-filter: none;
    }
    .map-modes {
      width: 100%;
    }
    .map-camera-controls {
      flex: 1 1 auto;
      justify-content: flex-end;
    }
  }
</style>
