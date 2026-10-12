const API_URL = import.meta.env.VITE_API_URL || '/api';
const NO_BACKEND = 'Backend API is not connected — this site runs on static hosting. Data features need the Express/MongoDB backend deployed.';
export const getAuth = () => JSON.parse(localStorage.getItem('auth') || 'null');
export async function api(path, method = 'GET', body) {
  const a = getAuth();
  let res;
  try {
    res = await fetch(API_URL + path, { method, headers: { 'Content-Type': 'application/json', ...(a && { Authorization: 'Bearer ' + a.token }) }, body: body && JSON.stringify(body) });
  } catch (e) { throw new Error(NO_BACKEND); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data && data.message ? data.message : NO_BACKEND);
  return data;
}
export const GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
