export const getAuth = () => JSON.parse(localStorage.getItem('auth') || 'null');
export async function api(path, method = 'GET', body) {
  const a = getAuth();
  const res = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(a && { Authorization: 'Bearer ' + a.token }) }, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}
export const GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
