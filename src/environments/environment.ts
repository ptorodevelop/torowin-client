// Este archivo es sobreescrito por el workflow de GitHub Actions en el build de producción.
// Los valores reales vienen de los secrets: API_URL, WS_URL, REVERB_KEY, REVERB_HOST
export const environment = {
  production: true,
  apiUrl: '',
  wsUrl: '',
  reverb: {
    key: '',
    wsHost: '',
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,
  },
};
