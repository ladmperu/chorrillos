// Carga directa sin imports gracias al CDN

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [-76.995, -12.185], 
  zoom: 14,
  pitch: 0, 
  antialias: true
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

map.on('load', () => {

  map.addSource('valores', {
    type: 'geojson',
    data: './valores.geojson',
    promoteId: 'OBJECTID'
  });

  const minPrice = -33.78;
  const maxPrice = 218.83;
  const numClasses = 20;
  const intervalOffset = (maxPrice - minPrice) / numClasses;

  const breaks = [];
  for (let i = 1; i < numClasses; i++) {
    breaks.push(minPrice + (i * intervalOffset));
  }
  
  const colors = [
    '#313695', '#3953a4', '#4270b2', '#4b8ebf', '#58abcb',
    '#6dc4d6', '#87dadb', '#a4eadd', '#c2f4df', '#dffbdf',
    '#fdf9c8', '#fee395', '#fdc768', '#fca543', '#f88126',
    '#f05d15', '#e33d11', '#d12115', '#b90d22', '#a50026'
  ];
  
  const colorStep = ['step', ['get', 'precio_modelado'], colors[0]];
  for (let i = 0; i < breaks.length; i++) {
    colorStep.push(breaks[i], colors[i+1]);
  }

  map.addLayer({
    id: 'valores-fill',
    type: 'fill',
    source: 'valores',
    paint: {
      'fill-color': colorStep,
      'fill-opacity': 0.95
    }
  });

  map.addLayer({
    id: 'valores-borders',
    type: 'line',
    source: 'valores',
    paint: {
      'line-color': '#ffffff',
      'line-width': 0.8,
      'line-opacity': 0.6
    }
  });

  map.addLayer({
    id: 'valores-hover',
    type: 'line',
    source: 'valores',
    paint: {
      'line-color': '#1c1c1e', 
      'line-width': 3,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.9,
        0
      ]
    }
  });

  let hoveredStateId = null;
  const tooltip = document.getElementById('tooltip');
  
  // Nodos HTML ajustados
  const ttId = document.getElementById('tt-id'); // Ahora es el precio principal
  const ttVia = document.getElementById('tt-via');
  const ttEstrato = document.getElementById('tt-estrato');
  const ttZonificacion = document.getElementById('tt-zonificacion');
  const ttMetro = document.getElementById('tt-metro');
  const ttMetropolitano = document.getElementById('tt-metropolitano');
  const ttVerde = document.getElementById('tt-verde');

  const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  });

  function val(value, decimals = 3) {
    if (value === undefined || value === null) return '--';
    const parsed = parseFloat(value);
    return isNaN(parsed) ? '--' : parsed.toFixed(decimals);
  }

  map.on('mousemove', 'valores-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    if (e.features.length > 0) {
      if (hoveredStateId !== null) {
        map.setFeatureState(
          { source: 'valores', id: hoveredStateId },
          { hover: false }
        );
      }
      
      const feature = e.features[0];
      hoveredStateId = feature.id; 

      if (hoveredStateId !== undefined && hoveredStateId !== null) {
        map.setFeatureState(
          { source: 'valores', id: hoveredStateId },
          { hover: true }
        );
      }

      const p = feature.properties;
      const price = parseFloat(p.precio_modelado);
      
      // Mostrar el Precio en la Cabecera Grande! 
      ttId.textContent = !isNaN(price) ? formatter.format(price) : 'Sin Precio';
      
      ttVia.textContent = val(p.ancho_via, 3);
      ttEstrato.textContent = val(p.estrato, 2);
      ttZonificacion.textContent = val(p.zonificacion, 2);
      
      ttMetro.textContent = val(p.norm_dist_metro, 3);
      ttMetropolitano.textContent = val(p.norm_dist_metropolitano, 3);
      ttVerde.textContent = val(p.norm_dist_area_verde, 3);

      tooltip.style.left = `${e.point.x}px`;
      tooltip.style.top = `${e.point.y}px`;
      tooltip.classList.remove('hidden');
    }
  });

  map.on('mouseleave', 'valores-fill', () => {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId !== null) {
      map.setFeatureState(
        { source: 'valores', id: hoveredStateId },
        { hover: false }
      );
    }
    hoveredStateId = null;
    tooltip.classList.add('hidden');
  });
});
