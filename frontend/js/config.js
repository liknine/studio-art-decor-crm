/*
  HTTP mode is the backend-core default. Override this object before config.js
  with {dataMode:'local'} when isolated frontend development is needed.
*/
const CRM_PRODUCTION_API_BASE='https://studioartdecor.by/crm-api/api/v1';
const CRM_DEFAULT_API_BASE=window.location?.hostname==='liknine.github.io'
  ? CRM_PRODUCTION_API_BASE
  : '/api/v1';

window.__STUDIO_ART_DECOR_CRM_CONFIG__ = {
  dataMode: 'http',
  apiBase: CRM_DEFAULT_API_BASE,
  ...(window.__STUDIO_ART_DECOR_CRM_CONFIG__ || {})
};

const CRM_STORAGE_KEY='studioArtDecor.crm.core.v4';
const CRM_LEGACY_STORAGE_KEYS=['studioArtDecor.crm.core.v3','studioArtDecor.crm.core.v2','studioArtDecor.crm.core.v1'];
const CRM_SCHEMA_VERSION=4;
const CRM_RUNTIME_FIX='v59-frontend-core-api-ready';
let estimate=[];

/*
  v59 data boundary
  -----------------
  UI/business logic below no longer knows where CRM data is stored.
  Today: LocalCRMAdapter (temporary development storage).
  Later: HttpCRMAdapter (server API + database) without rewriting the UI.
*/
const CRM_DATA_CONFIG={
  mode:String(window.__STUDIO_ART_DECOR_CRM_CONFIG__?.dataMode||'local'),
  apiBase:String(window.__STUDIO_ART_DECOR_CRM_CONFIG__?.apiBase||CRM_DEFAULT_API_BASE).replace(/\/+$/,''),
  requestTimeoutMs:Number(window.__STUDIO_ART_DECOR_CRM_CONFIG__?.requestTimeoutMs)||12000,
  telegramInitData:''
};
