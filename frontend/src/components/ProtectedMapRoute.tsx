import { Navigate } from 'react-router-dom';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext';
import MapPage from '../pages/MapPage';

export default function ProtectedMapRoute() {
  const { settings } = useDisplaySettings();
  if (!settings.stats.map) {
    return <Navigate to="/statistics" replace />;
  }
  return <MapPage />;
}
