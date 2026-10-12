import { useEffect, useState } from 'react';
import { api, GROUPS } from './api.js';
const blank = { name: '', city: '', state: '', address: '', phone: '', stock: Object.fromEntries(GROUPS.map(g => [g, 0])) };
export default function Availability({ auth }) {
  const [totals, setTotals] = useState({}), [centers, setCenters] = useState([]), [city, setCity] = useState(''), [bg, setBg] = useState('');
  const [form, setForm] = useState(blank), [editId, setEditId] = useState(null), [err, setErr] = useState('');
  const admin = auth?.user.role === 'admin';
  const load = () => {
    api('/centers/availability').then(d => setTotals(d.totals)).catch(e => setErr(e.message));
    api(`/centers?city=${encodeURIComponent(city)}&bloodGroup=${encodeURIComponent(bg)}`).then(setCenters).catch(e => setErr(e.message));
  };
  useEffect(() => { load(); }, [city, bg]);
  const save = e => { e.preventDefault(); api(editId ? `/centers/${editId}` : '/centers', editId ? 'PUT' : 'POST', form)
    .then(() => { setForm(blank); setEditId(null); setErr(''); load(); }).catch(x => setErr(x.message)); };
  return (<><h2>Blood availability</h2>
    <p>Tap a blood group to find centers that have it in stock.</p>
    <div className="tiles">{GROUPS.map(g => <button key={g} className={'tile' + (bg === g ? ' on' : '') + ((totals[g] || 0) < 20 ? ' low' : '')} onClick={() => setBg(bg === g ? '' : g)}>
      <b>{g}</b><span>{totals[g] ?? 0} units</span></button>)}</div>
    <input placeholder="Search by city" value={city} onChange={e => setCity(e.target.value)} style={{ margin: '1rem 0' }} />
    {err && <p className="err">{err}</p>}
    {admin && <form onSubmit={save}><strong>{editId ? 'Edit blood center' : 'Add blood center'}</strong>
      {['name', 'city', 'state', 'address', 'phone'].map(k => <input key={k} placeholder={k[0].toUpperCase() + k.slice(1)} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} required={k === 'name' || k === 'city'} />)}
      <div className="stockin">{GROUPS.map(g => <label key={g}>{g}<input type="number" min="0" value={form.stock?.[g] ?? 0} onChange={e => setForm({ ...form, stock: { ...form.stock, [g]: +e.target.value } })} /></label>)}</div>
      <button className="btn">{editId ? 'Save changes' : 'Add center'}</button></form>}
    <div className="grid">{centers.map(c => (<div className="card" key={c._id}><h3>{c.name}</h3>
      <div>{c.city}{c.state ? ', ' + c.state : ''}</div><div>{c.address}</div><div>{c.phone}</div>
      <div style={{ marginTop: 6 }}>{GROUPS.map(g => <span key={g} className={'tag' + (c.stock?.[g] ? '' : ' none')}>{g}: {c.stock?.[g] || 0}</span>)}</div>
      {admin && <div className="row"><button className="btn alt" onClick={() => { setEditId(c._id); setForm(c); window.scrollTo(0, 0); }}>Edit stock</button>
        <button className="btn alt" onClick={() => confirm('Delete this center?') && api('/centers/' + c._id, 'DELETE').then(load)}>Delete</button></div>}
    </div>))}{!centers.length && <p>No blood centers match your search.</p>}</div></>);
}
