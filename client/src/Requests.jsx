import { useEffect, useState } from 'react';
import { api, GROUPS } from './api.js';
const blank = { patientName: '', bloodGroup: 'O+', units: 1, hospital: '', city: '', contact: '', urgency: 'Urgent' };
export default function Requests({ auth }) {
  const [list, setList] = useState([]), [bg, setBg] = useState(''), [city, setCity] = useState(''), [form, setForm] = useState(blank), [err, setErr] = useState('');
  const load = () => api(`/requests?bloodGroup=${encodeURIComponent(bg)}&city=${encodeURIComponent(city)}`).then(setList).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [bg, city]);
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });
  const submit = e => { e.preventDefault(); api('/requests', 'POST', form).then(() => { setForm(blank); setErr(''); load(); }).catch(x => setErr(x.message)); };
  const set = (id, status) => api('/requests/' + id, 'PUT', { status }).then(load).catch(x => setErr(x.message));
  return (<><h2>Emergency blood requests</h2>
    <div className="row"><select value={bg} onChange={e => setBg(e.target.value)}><option value="">All blood groups</option>{GROUPS.map(g => <option key={g}>{g}</option>)}</select>
      <input placeholder="Search by city" value={city} onChange={e => setCity(e.target.value)} /></div>
    {err && <p className="err">{err}</p>}
    {auth ? <form onSubmit={submit} style={{ marginTop: '1rem' }}><strong>Request blood</strong>
      <input placeholder="Patient name" {...f('patientName')} required />
      <select {...f('bloodGroup')}>{GROUPS.map(g => <option key={g}>{g}</option>)}</select>
      <input type="number" min="1" placeholder="Units needed" {...f('units')} />
      <input placeholder="Hospital" {...f('hospital')} required /><input placeholder="City" {...f('city')} required />
      <input placeholder="Contact phone" {...f('contact')} required />
      <select {...f('urgency')}>{['Critical', 'Urgent', 'Normal'].map(u => <option key={u}>{u}</option>)}</select>
      <button className="btn">Post request</button></form> : <p>Log in to post a request.</p>}
    <div className="grid">{list.map(r => (<div className="card" key={r._id}><h3>{r.bloodGroup} · {r.units} unit(s)</h3>
      <span className={'tag' + (r.urgency === 'Normal' ? ' none' : '')}>{r.urgency}</span>
      <div>{r.patientName} — {r.hospital}, {r.city}</div><div>Contact: {r.contact}</div>
      {auth && (auth.user.role === 'admin') && <div className="row">
        <button className="btn alt" onClick={() => set(r._id, 'Fulfilled')}>Mark fulfilled</button>
        <button className="btn alt" onClick={() => set(r._id, 'Closed')}>Close</button></div>}
    </div>))}{!list.length && <p>No open requests.</p>}</div></>);
}
