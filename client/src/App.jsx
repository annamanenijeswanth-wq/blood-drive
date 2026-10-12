import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { api, getAuth, GROUPS } from './api.js';
import Availability from './Availability.jsx';
import Requests from './Requests.jsx';

const fmt = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function Login({ mode, onAuth }) {
  const [f, setF] = useState({}), [err, setErr] = useState(''), nav = useNavigate();
  const set = e => setF({ ...f, [e.target.name]: e.target.value });
  const submit = async e => {
    e.preventDefault();
    try { const d = await api(`/auth/${mode}`, 'POST', f); localStorage.setItem('auth', JSON.stringify(d)); onAuth(d); nav('/'); }
    catch (x) { setErr(x.message); }
  };
  return (<><h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
    <form onSubmit={submit}>
      {mode === 'register' && <input name="name" placeholder="Full name" onChange={set} required />}
      <input name="email" type="email" placeholder="Email" onChange={set} required />
      <input name="password" type="password" placeholder="Password (6+ characters)" onChange={set} required />
      {mode === 'register' && <input name="adminCode" placeholder="Organizer code (optional)" onChange={set} />}
      {err && <div className="err">{err}</div>}
      <button className="btn">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
    </form></>);
}

function Campaigns({ auth }) {
  const [list, setList] = useState([]), [loc, setLoc] = useState(''), [msg, setMsg] = useState(''), [join, setJoin] = useState(null);
  const [form, setForm] = useState({ title: '', location: '', date: '', capacity: 50, bloodGroupsNeeded: [] }), [editId, setEditId] = useState(null);
  const [prio, setPrio] = useState({}), [donor, setDonor] = useState({ name: auth?.user.name || '', phone: '', bloodGroup: 'O+' });
  const admin = auth?.user.role === 'admin';
  const load = () => api('/campaigns?location=' + loc).then(setList);
  useEffect(() => { load(); }, [loc]);
  const run = async fn => { try { await fn(); setMsg(''); load(); } catch (e) { setMsg(e.message); } };
  const save = e => { e.preventDefault(); run(async () => {
    await api(editId ? `/campaigns/${editId}` : '/campaigns', editId ? 'PUT' : 'POST', form);
    setEditId(null); setForm({ title: '', location: '', date: '', capacity: 50, bloodGroupsNeeded: [] }); }); };
  const register = e => { e.preventDefault(); run(async () => { await api('/donors', 'POST', { ...donor, campaign: join }); setJoin(null); setMsg('You are registered. Thank you!'); }); };
  const toggle = g => setForm(f => ({ ...f, bloodGroupsNeeded: f.bloodGroupsNeeded.includes(g) ? f.bloodGroupsNeeded.filter(x => x !== g) : [...f.bloodGroupsNeeded, g] }));
  return (<><h2>Upcoming blood drives</h2>
    <input placeholder="Search by location" value={loc} onChange={e => setLoc(e.target.value)} />
    {msg && <p className={msg.startsWith('You') ? 'msg' : 'err'}>{msg}</p>}
    {admin && <form onSubmit={save}><strong>{editId ? 'Edit campaign' : 'New campaign'}</strong>
      <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
      <input type="date" value={form.date?.slice(0, 10)} onChange={e => setForm({ ...form, date: e.target.value })} required />
      <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} />
      {editId && <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Upcoming', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select>}
      <div>{GROUPS.map(g => <label key={g} style={{ marginRight: 8 }}><input type="checkbox" checked={form.bloodGroupsNeeded.includes(g)} onChange={() => toggle(g)} /> {g}</label>)}</div>
      <button className="btn">{editId ? 'Save changes' : 'Create campaign'}</button></form>}
    <div className="grid">{list.map(c => (<div className="card" key={c._id}>
      <h3>{c.title}</h3><div>{fmt(c.date)} · {c.location}</div>
      <div>{c.registered}/{c.capacity} donors · {c.status}</div>
      <div>{c.bloodGroupsNeeded.map(g => <span className="tag" key={g}>{g}</span>)}</div>
      <div className="row">
        {auth && !admin && c.status === 'Upcoming' && <button className="btn" onClick={() => setJoin(c._id)}>Register to donate</button>}
        {admin && <><button className="btn alt" onClick={() => { setEditId(c._id); setForm(c); window.scrollTo(0, 0); }}>Edit</button>
          <button className="btn alt" onClick={() => api(`/campaigns/${c._id}/priority?slots=10`).then(l => setPrio({ ...prio, [c._id]: l })).catch(e => setMsg(e.message))}>Priority donors</button>
          <button className="btn alt" onClick={() => confirm('Delete this campaign and its registrations?') && run(() => api('/campaigns/' + c._id, 'DELETE'))}>Delete</button></>}
      </div>
      {prio[c._id] && <ol>{prio[c._id].map(d => <li key={d._id}>{d.name} ({d.bloodGroup})</li>)}{!prio[c._id].length && <li>No registered donors yet.</li>}</ol>}
      {join === c._id && <form onSubmit={register} style={{ marginTop: 8 }}>
        <input value={donor.name} onChange={e => setDonor({ ...donor, name: e.target.value })} placeholder="Name" required />
        <input value={donor.phone} onChange={e => setDonor({ ...donor, phone: e.target.value })} placeholder="Phone" />
        <select value={donor.bloodGroup} onChange={e => setDonor({ ...donor, bloodGroup: e.target.value })}>{GROUPS.map(g => <option key={g}>{g}</option>)}</select>
        <button className="btn">Confirm registration</button></form>}
    </div>))}
    {!list.length && <p>No campaigns yet.{admin ? ' Create the first one above.' : ' Check back soon.'}</p>}</div></>);
}

function Donors({ auth }) {
  const [list, setList] = useState([]), [bg, setBg] = useState(''), [err, setErr] = useState('');
  const admin = auth.user.role === 'admin';
  const load = () => api('/donors?bloodGroup=' + bg).then(setList).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [bg]);
  const upd = (id, status) => api('/donors/' + id, 'PUT', { status }).then(load).catch(e => setErr(e.message));
  return (<><h2>{admin ? 'All donors' : 'My registrations'}</h2>
    <select value={bg} onChange={e => setBg(e.target.value)}><option value="">All blood groups</option>{GROUPS.map(g => <option key={g}>{g}</option>)}</select>
    {err && <p className="err">{err}</p>}
    <div className="scroll"><table><thead><tr><th>Donor</th><th>Group</th><th>Campaign</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>{list.map(d => (<tr key={d._id}><td>{d.name}<br /><small>{d.phone}</small></td><td>{d.bloodGroup}</td>
        <td>{d.campaign?.title}<br /><small>{d.campaign?.location}</small></td><td>{d.campaign && fmt(d.campaign.date)}</td><td>{d.status}</td>
        <td className="row">{admin && d.status === 'Registered' && <button className="btn alt" onClick={() => upd(d._id, 'Donated')}>Mark donated</button>}
          {d.status === 'Registered' && <button className="btn alt" onClick={() => upd(d._id, 'Cancelled')}>Cancel</button>}
          {admin && <button className="btn alt" onClick={() => api('/donors/' + d._id, 'DELETE').then(load)}>Delete</button>}</td></tr>))}</tbody></table></div>
    {!list.length && <p>No registrations to show.</p>}</>);
}

export default function App() {
  const [auth, setAuth] = useState(getAuth()), nav = useNavigate();
  const out = () => { localStorage.removeItem('auth'); setAuth(null); nav('/'); };
  return (<><header><h1>Community Blood Drive</h1><Link to="/">Availability</Link><Link to="/requests">Emergency</Link><Link to="/campaigns">Campaigns</Link>
    {auth ? <><Link to="/donors">{auth.user.role === 'admin' ? 'Donors' : 'My registrations'}</Link><span>{auth.user.name} ({auth.user.role})</span><button onClick={out}>Log out</button></>
      : <><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></>}</header>
    <main><Routes>
      <Route path="/" element={<Availability auth={auth} />} />
      <Route path="/requests" element={<Requests auth={auth} />} />
      <Route path="/campaigns" element={<Campaigns auth={auth} />} />
      <Route path="/login" element={<Login mode="login" onAuth={setAuth} />} />
      <Route path="/register" element={<Login mode="register" onAuth={setAuth} />} />
      <Route path="/donors" element={auth ? <Donors auth={auth} /> : <Navigate to="/login" />} />
    </Routes></main></>);
}
