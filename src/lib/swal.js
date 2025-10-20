// Lightweight SweetAlert2 loader that works without npm install
// It dynamically injects the CDN bundle and returns window.Swal

let loadingPromise = null;

export async function getSwal() {
  if (typeof window !== 'undefined' && window.Swal) {
    return window.Swal;
  }
  if (!loadingPromise) {
    loadingPromise = new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js';
        script.async = true;
        script.onload = () => resolve(window.Swal);
        script.onerror = (e) => reject(new Error('Failed to load SweetAlert2'));
        document.head.appendChild(script);
      } catch (e) {
        reject(e);
      }
    });
  }
  return loadingPromise;
}













