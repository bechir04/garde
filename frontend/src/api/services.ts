import client from './client';

// Auth
export const login = (username: string, password: string) =>
  client.post('/auth/login', { username, password }).then((r) => r.data);

export const getMe = () => client.get('/auth/me').then((r) => r.data);

// Lookups
export const getGovernorates = () => client.get('/locations/governorates').then((r) => r.data);
export const getCauses = () => client.get('/causes').then((r) => r.data);
export const createCause = (nameAr: string) => client.post('/causes', { nameAr }).then((r) => r.data);

export const getBrands = () => client.get('/vehicle-brands').then((r) => r.data);
export const createBrand = (nameAr: string) => client.post('/vehicle-brands', { nameAr }).then((r) => r.data);

// Accidents — normalize: backend returns { data, meta: { total } }, pages use { data, total }
export const getAccidents = (params: Record<string, unknown>) =>
  client.get('/accidents', { params }).then((r) => {
    const d = r.data;
    if (d.meta) return { data: d.data, total: d.meta.total, page: d.meta.page, totalPages: d.meta.totalPages };
    return d;
  });

export const getAccident = (id: string) =>
  client.get(`/accidents/${id}`).then((r) => r.data);

export const createAccident = (data: Record<string, unknown>) =>
  client.post('/accidents', data).then((r) => r.data);

export const updateAccident = (id: string, data: Record<string, unknown>) =>
  client.put(`/accidents/${id}`, data).then((r) => r.data);

export const deleteAccident = (id: string) =>
  client.delete(`/accidents/${id}`).then((r) => r.data);

// Analytics — shapes transformed to match chart expectations: { name, count, deaths, injuries }
export const getAnalyticsSummary = () =>
  client.get('/analytics/summary').then((r) => r.data);

export const getAnalyticsByGovernorate = () =>
  client.get('/analytics/by-governorate').then((r) =>
    r.data.map((d: any) => ({
      name: d.governorateName,
      count: d.accidentCount,
      deaths: d.deathsCount,
      injuries: d.injuriesCount,
    }))
  );

export const getAnalyticsByCause = () =>
  client.get('/analytics/by-cause').then((r) =>
    r.data.map((d: any) => ({
      name: d.causeName,
      count: d.accidentCount,
      deaths: d.deathsCount,
      injuries: d.injuriesCount,
    }))
  );

export const getAnalyticsByBrand = () =>
  client.get('/analytics/by-brand').then((r) =>
    r.data.map((d: any) => ({
      name: d.brandName,
      count: d.accidentCount,
      deaths: d.deathsCount,
      injuries: d.injuriesCount,
    }))
  );

// Returns [{ period: "HH:00", accidents }] — mapped from /analytics/by-hour
export const getAnalyticsByHour = () =>
  client.get('/analytics/by-hour').then((r) =>
    r.data.map((d: any) => ({
      period: `${String(d.hour).padStart(2, '0')}:00`,
      accidents: d.count,
    }))
  );

// Returns [{ period: "YYYY-MM", accidents, deaths, injuries }] — mapped from /analytics/by-month
export const getAnalyticsByMonth = () =>
  client.get('/analytics/by-month').then((r) =>
    r.data.map((d: any) => ({
      period: d.month,
      accidents: d.accidentCount,
      deaths: d.deathsCount,
      injuries: d.injuriesCount,
    }))
  );

export const getTopRoutes = (limit = 10) =>
  client.get('/analytics/top-routes', { params: { limit } }).then((r) => r.data);

export const getAnalyticsInsights = () =>
  client.get('/analytics/insights').then((r) => r.data);

export const getIntelligence = (params?: Record<string, unknown>) =>
  client.get('/analytics/intelligence', { params }).then((r) => r.data);

// Users (admin only)
export const getUsers = () =>
  client.get('/users').then((r) => r.data);

export const createUser = (data: { username: string; password: string; fullName: string; role: string }) =>
  client.post('/users', data).then((r) => r.data);

export const updateUser = (id: string, data: { fullName?: string; role?: string; isActive?: boolean; password?: string }) =>
  client.put(`/users/${id}`, data).then((r) => r.data);

// Audit logs (admin only)
export const getAuditLogs = (params?: Record<string, unknown>) =>
  client.get('/audit', { params }).then((r) => r.data);

// Import
export const uploadExcel = (file: File, defaultGovernorateId?: number) => {
  const fd = new FormData();
  fd.append('file', file);
  const params = defaultGovernorateId ? { defaultGovernorateId } : {};
  return client.post('/import/upload', fd, { params }).then((r) => r.data);
};

export const commitImport = (jobId: string) =>
  client.post(`/import/${jobId}/commit`).then((r) => r.data);

export const getImportTemplate = () =>
  client.get('/import/template', { responseType: 'blob' }).then((r) => r.data);
