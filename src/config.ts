/**
 * The app always calls its own origin (`/api`, `/media`): the Vite dev proxy in
 * development, the nginx reverse proxy (API_ORIGIN) in the container. The base
 * stays empty so the browser never needs CORS on the API.
 */
export const config = {
  apiBaseUrl: '',
}