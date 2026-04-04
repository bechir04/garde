import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Tooltip, useMap, CircleMarker, Popup } from 'react-leaflet';
import { getAnalyticsByGovernorate, getGovernorates } from '../api/services';
import type { AnalyticsFilters } from '../api/services';
import { ArrowRight, Filter, Calendar, MapPin, Building2, RotateCcw, Layers } from 'lucide-react';
import { SIDI_BOUZID_MUNICIPALITIES } from '../constants/municipalities';
import tunisiaGeoJSON from '../data/tunisia-governorates.json';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function getColor(count: number, max: number): string {
  if (max === 0) return '#e8e8e8';
  const ratio = count / max;
  if (ratio === 0) return '#f0f4f8';
  if (ratio < 0.15) return '#d4e6f1';
  if (ratio < 0.30) return '#a9cce3';
  if (ratio < 0.45) return '#7fb3d8';
  if (ratio < 0.60) return '#5499c7';
  if (ratio < 0.75) return '#2e86c1';
  if (ratio < 0.90) return '#1a5276';
  return '#0b2545';
}

function getMunColor(count: number, max: number): string {
  if (max === 0) return '#f39c12';
  const ratio = count / max;
  if (ratio < 0.25) return '#f39c12';
  if (ratio < 0.50) return '#e67e22';
  if (ratio < 0.75) return '#d35400';
  return '#c0392b';
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<number, { count: number; deaths: number; injuries: number }>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredGov, setHoveredGov] = useState<number | null>(null);
  const [showMunicipalities, setShowMunicipalities] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [selectedMunicipality, setSelectedMunicipality] = useState('');

  const showMunicipalityDropdown = filters.governorateId === '18';
  const maxCount = Math.max(...Object.values(stats).map((s) => s.count), 1);
  const sidiBouzidStats = stats[18] || { count: 0, deaths: 0, injuries: 0 };
  const munAvgCount = Math.round(sidiBouzidStats.count / SIDI_BOUZID_MUNICIPALITIES.length);
  const munMaxCount = Math.max(munAvgCount, 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnalyticsByGovernorate(filters);
      const map: Record<number, { count: number; deaths: number; injuries: number }> = {};
      data.forEach((d: any) => {
        const gov = governorates.find((g) => g.nameAr === d.name);
        if (gov) map[gov.id] = { count: d.count, deaths: d.deaths, injuries: d.injuries };
      });
      setStats(map);
    } finally {
      setLoading(false);
    }
  }, [filters, governorates]);

  useEffect(() => {
    getGovernorates().then(setGovernorates);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGovernorateChange = (govId: string) => {
    setFilters((prev) => ({ ...prev, governorateId: govId || undefined, cityId: undefined }));
    setSelectedMunicipality('');
  };

  const handleMunicipalityChange = (cityId: string) => {
    setSelectedMunicipality(cityId);
    setFilters((prev) => ({ ...prev, cityId: cityId || undefined }));
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedMunicipality('');
  };

  const hasActiveFilters = !!(filters.dateFrom || filters.dateTo || filters.governorateId || filters.cityId);

  const style = (feature: any) => {
    const govId = feature.properties.govId;
    const s = stats[govId] || { count: 0, deaths: 0, injuries: 0 };
    const isHovered = hoveredGov === govId;
    return {
      fillColor: getColor(s.count, maxCount),
      weight: isHovered ? 3 : 1.5,
      opacity: 1,
      color: isHovered ? '#e67e22' : '#fff',
      fillOpacity: isHovered ? 0.9 : 0.78,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const govId = feature.properties.govId;
    const name = feature.properties.nameAr;
    const s = stats[govId] || { count: 0, deaths: 0, injuries: 0 };

    layer.on({
      mouseover: (e: any) => {
        setHoveredGov(govId);
        const l = e.target;
        l.setStyle({ weight: 3, color: '#e67e22', fillOpacity: 0.9 });
        l.bringToFront();
      },
      mouseout: (e: any) => {
        setHoveredGov(null);
        geojsonRef.current?.resetStyle(e.target);
      },
      click: () => {
        navigate(`/accidents?governorateId=${govId}&page=1`);
      },
    });

    layer.bindTooltip(
      `<div style="text-align:center;font-family:inherit;direction:rtl;padding:4px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${name}</div>
        <div style="font-size:12px;color:#666">${s.count} حادث · ${s.deaths} وفاة · ${s.injuries} جريح</div>
      </div>`,
      { sticky: true, direction: 'top', offset: [0, -10] }
    );
  };

  const geojsonRef = useRef<L.GeoJSON>(null);

  const totalAccidents = Object.values(stats).reduce((s, v) => s + v.count, 0);
  const totalDeaths = Object.values(stats).reduce((s, v) => s + v.deaths, 0);
  const totalInjuries = Object.values(stats).reduce((s, v) => s + v.injuries, 0);

  const legendSteps = [0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.0];

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#fff', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/statistics')}>
            <ArrowRight size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>الخريطة التفاعلية</h1>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              {totalAccidents.toLocaleString('ar-TN')} حادث · {totalDeaths.toLocaleString('ar-TN')} وفاة · {totalInjuries.toLocaleString('ar-TN')} جريح
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${showMunicipalities ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setShowMunicipalities(!showMunicipalities)}
          >
            <Layers size={14} /> البلديات
          </button>
          <button className={`btn ${hasActiveFilters ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> فلترة
            {hasActiveFilters && <span style={{
              marginRight: 4, background: '#fff', color: 'var(--primary)',
              borderRadius: '50%', width: 18, height: 18, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
            }}>
              {[filters.dateFrom, filters.dateTo, filters.governorateId, filters.cityId].filter(Boolean).length}
            </span>}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div style={{ padding: '12px 20px', background: '#f8f9fb', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>فلترة البيانات</span>
            {hasActiveFilters && (
              <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ fontSize: 11, padding: '4px 10px' }}>
                <RotateCcw size={12} /> مسح
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: 11, marginBottom: 2, display: 'block', color: 'var(--text-secondary)' }}>
                <Calendar size={10} style={{ display: 'inline', marginLeft: 2 }} /> من تاريخ
              </label>
              <input type="date" className="form-input" value={filters.dateFrom || ''} onChange={(e) => handleDateChange('dateFrom', e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: 11, marginBottom: 2, display: 'block', color: 'var(--text-secondary)' }}>
                <Calendar size={10} style={{ display: 'inline', marginLeft: 2 }} /> إلى تاريخ
              </label>
              <input type="date" className="form-input" value={filters.dateTo || ''} onChange={(e) => handleDateChange('dateTo', e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: 11, marginBottom: 2, display: 'block', color: 'var(--text-secondary)' }}>
                <MapPin size={10} style={{ display: 'inline', marginLeft: 2 }} /> الولاية
              </label>
              <select className="form-input" value={filters.governorateId || ''} onChange={(e) => handleGovernorateChange(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }}>
                <option value="">جميع الولايات</option>
                {governorates.map((g) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
              </select>
            </div>
            {showMunicipalityDropdown && (
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: 11, marginBottom: 2, display: 'block', color: 'var(--text-secondary)' }}>
                  <Building2 size={10} style={{ display: 'inline', marginLeft: 2 }} /> المعتمدية
                </label>
                <select className="form-input" value={selectedMunicipality} onChange={(e) => handleMunicipalityChange(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }}>
                  <option value="">جميع البلديات</option>
                  {SIDI_BOUZID_MUNICIPALITIES.map((m) => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}

        <MapContainer center={[34.0, 9.5]} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <GeoJSON
            key={JSON.stringify(filters)}
            data={tunisiaGeoJSON as any}
            style={style}
            onEachFeature={onEachFeature}
            ref={geojsonRef}
          />
          <MapController center={[34.0, 9.5]} zoom={7} />

          {showMunicipalities && SIDI_BOUZID_MUNICIPALITIES.map((mun) => {
            const radius = Math.max(14, Math.min(28, 12 + munAvgCount * 0.3));
            return (
              <CircleMarker
                key={mun.id}
                center={[mun.lat, mun.lng]}
                radius={radius}
                fillColor={getMunColor(munAvgCount, munMaxCount)}
                fillOpacity={0.85}
                color="#fff"
                weight={2.5}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div style={{ textAlign: 'center', fontFamily: 'inherit', direction: 'rtl' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{mun.nameAr}</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>~{munAvgCount} حادث</div>
                  </div>
                </Tooltip>
                <Popup>
                  <div style={{ textAlign: 'center', fontFamily: 'inherit', direction: 'rtl', minWidth: 150 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{mun.nameAr}</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>~{munAvgCount} حادث</div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, width: '100%' }}
                      onClick={() => navigate(`/accidents?governorateId=18&cityId=${mun.id}&page=1`)}
                    >
                      عرض الحوادث
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 30, left: 20, zIndex: 999,
          background: '#fff', borderRadius: 12, padding: '14px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 170,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>حوادث الولايات</div>
          {legendSteps.map((step, i) => {
            const next = legendSteps[i + 1];
            if (next === undefined) return null;
            const val = Math.round(step * maxCount);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 3 }}>
                <div style={{ width: 16, height: 12, borderRadius: 2, background: getColor(val, maxCount), flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
              </div>
            );
          })}

          {showMunicipalities && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0 8px' }} />
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#e67e22' }}>بلديات سيدي بوزيد</div>
              {[
                { color: '#f39c12', label: 'منخفض' },
                { color: '#e67e22', label: 'متوسط' },
                { color: '#d35400', label: 'مرتفع' },
                { color: '#c0392b', label: 'حرج' },
              ].map((item) => (
                <div key={item.color} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 3 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: item.color, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Hovered Gov Info */}
        {hoveredGov && stats[hoveredGov] && (
          <div style={{
            position: 'absolute', top: 16, right: 16, zIndex: 999,
            background: '#fff', borderRadius: 14, padding: '16px 20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)', minWidth: 220,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
              {governorates.find((g) => g.id === hoveredGov)?.nameAr}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{stats[hoveredGov].count}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>حوادث</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>{stats[hoveredGov].deaths}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>وفيات</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--warning)' }}>{stats[hoveredGov].injuries}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>جرحى</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
