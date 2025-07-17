// In file: Frontend/src/environments/environment.ts

export const environment = {
  production: false,
  // --- THIS IS THE FIX ---
  // When running locally, the backend Docker container exposes port 5000
  // to your machine. We connect to it via http://127.0.0.1:5000, not localhost.
  // Using 127.0.0.1 is often more reliable than 'localhost' in Docker-based setups.
  apiUrl: 'http://127.0.0.1:5000',
  wsUrl: 'ws://127.0.0.1:5000/ws_api'
};