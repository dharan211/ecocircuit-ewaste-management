import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';

const STATUSES = ['Pending', 'Approved', 'Scheduled', 'Collected', 'Recycled', 'Disposed', 'Rejected'];
const lab = s => s === 'Pending' ? 'Submitted' : s;
const DEVICES = ['Mobile phone', 'Laptop', 'Desktop / CPU', 'Monitor / TV', 'Battery / Charger', 'Printer', 'Other'];
const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const day = d => d ? new Date(d).toISOString().slice(0, 10) : '';
const Badge = ({ s }) => <span className={'badge ' + s}>{lab(s)}</span>;
const Err = ({ e }) => e ? <p className="err">{e}</p> : null;
const device = r => [r.brand, r.model || r.deviceType].filter(Boolean).join(' ');

export function Home({ user, home }) {
  const cta = user ? home : '/register';
  const slugs = ['tell-us', 'pickup', 'recycle'], dslugs = ['mobiles', 'laptops', 'monitors', 'batteries', 'printers', 'cables'];
  const things = ['Mobiles & tablets', 'Laptops & desktops', 'Monitors & TVs', 'Batteries & chargers', 'Printers & scanners', 'Cables & accessories'];
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">E-waste collection &amp; disposal</span>
          <h1>From clutter to <em>circular.</em></h1>
          <p>Request a doorstep pickup for your old electronics and follow every step, from approval to recycling, in one place.</p>
          <div className="actions"><Link className="btn lime" to={cta}>{user ? 'Go to dashboard' : 'Get started'}</Link>
            {!user && <Link className="btn ghost" to="/login">I have an account</Link>}</div>
        </div>
        <div className="mock">
          <p className="muted">Request #EC-2041</p><h3>Dell Inspiron laptop</h3>
          <Progress status="Scheduled" />
          <p className="note">Pickup scheduled for Saturday, 10 AM</p>
        </div>
      </section>
      <section className="band">
        <span className="eyebrow dark">Three simple steps</span>
        <h2>Recycling made straightforward.</h2>
        <div className="three">
          {[['01', 'Tell us what you have', 'Share the device, its condition and your address, and choose a pickup date.'],
            ['02', 'We coordinate pickup', 'Our team reviews your request, approves it and schedules the collection.'],
            ['03', 'Recycle responsibly', 'Track the status through collection until the recycling record is added.']].map(([n, t, d], i) =>
            <Link className="step" to={'/learn/' + slugs[i]} key={n}><b>{n}</b><h3>{t}</h3><p className="muted">{d}</p><span className="more">Learn more →</span></Link>)}
        </div>
      </section>
      <section className="band">
        <span className="eyebrow dark">What we accept</span>
        <div className="chips">{things.map((t, i) => <Link key={t} to={'/learn/' + dslugs[i]}>{t}</Link>)}</div>
      </section>
      <section className="cta"><h2>Ready to clear the clutter the right way?</h2>
        <Link className="btn lime" to={cta}>{user ? 'Open dashboard' : 'Start a request'}</Link></section>
    </>
  );
}

const FLOW = ['Pending', 'Approved', 'Scheduled', 'Collected', 'Recycled'];
function Progress({ status }) {
  if (status === 'Rejected') return <p className="note rej">This request was rejected.</p>;
  const at = status === 'Disposed' ? 4 : FLOW.indexOf(status);
  return <ol className="flow">{FLOW.map((s, i) => <li key={s} className={i <= at ? 'done' : ''}><i />{i === 4 && status === 'Disposed' ? 'Disposed' : lab(s)}</li>)}</ol>;
}

export function Auth({ register, onAuth }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' }), [e, setE] = useState('');
  const set = k => ev => setF({ ...f, [k]: ev.target.value });
  const submit = async ev => {
    ev.preventDefault(); setE('');
    try { onAuth(await api(register ? '/auth/register' : '/auth/login', 'POST', f)); } catch (x) { setE(x.message); }
  };
  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{register ? 'Create your account' : 'Welcome back'}</h2>
      {register && <><label>Full name<input required value={f.name} onChange={set('name')} /></label>
        <label>Phone<input value={f.phone} onChange={set('phone')} /></label></>}
      <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
      <label>Password<input type="password" required minLength={6} value={f.password} onChange={set('password')} /></label>
      <Err e={e} />
      <button className="btn">{register ? 'Sign up' : 'Log in'}</button>
      <p className="muted">{register ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Sign up</Link></>}</p>
    </form>
  );
}

export function Dashboard({ user }) {
  const [list, setList] = useState(null), [e, setE] = useState('');
  const load = () => api('/requests').then(setList).catch(x => setE(x.message));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  const cancel = async id => { if (confirm('Cancel this request?')) { try { await api('/requests/' + id, 'DELETE'); load(); } catch (x) { setE(x.message); } } };
  return (
    <>
      <div className="row"><h2>Hello, {user.name}</h2><Link className="btn" to="/new">New request</Link></div>
      <Err e={e} />
      {list && !list.length && <p className="card muted">You haven't submitted anything yet. Start with your first e-waste request.</p>}
      <div className="grid">
        {list?.map(r => (
          <article className="card" key={r._id}>
            <div className="row"><h3>{device(r)}</h3><Badge s={r.status} /></div>
            <p className="muted">{r.quantity} × {r.deviceType} · {r.condition}</p>
            <p>{r.address}</p>
            <Progress status={r.status} />
            <dl><dt>Requested</dt><dd>{fmt(r.createdAt)}</dd><dt>Preferred slot</dt><dd>{fmt(r.preferredDate)} · {r.preferredTime || 'Morning'}</dd>
              <dt>Scheduled pickup</dt><dd>{fmt(r.scheduledDate)}</dd></dl>
            {r.adminNote && <p className="note">Note from admin: {r.adminNote}</p>}
            {r.status === 'Pending' && <button className="link danger" onClick={() => cancel(r._id)}>Cancel request</button>}
          </article>
        ))}
      </div>
    </>
  );
}

export function NewRequest({ user }) {
  const nav = useNavigate(), [e, setE] = useState('');
  const [f, setF] = useState({ deviceType: DEVICES[0], brand: '', model: '', quantity: 1, condition: 'Dead', description: '', address: '', preferredDate: '', preferredTime: 'Morning' });
  const set = k => ev => setF({ ...f, [k]: ev.target.value });
  const submit = async ev => {
    ev.preventDefault();
        try { await api('/requests', 'POST', f); nav(user.role === 'admin' ? '/admin' : '/dashboard'); } catch (x) { setE(x.message); }
  };
  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>New disposal request</h2>
      <label>Device type<select value={f.deviceType} onChange={set('deviceType')}>{DEVICES.map(d => <option key={d}>{d}</option>)}</select></label>
      <div className="two"><label>Brand<input value={f.brand} onChange={set('brand')} /></label><label>Model<input value={f.model} onChange={set('model')} /></label></div>
      <div className="two"><label>Quantity<input type="number" min="1" value={f.quantity} onChange={set('quantity')} /></label>
        <label>Condition<select value={f.condition} onChange={set('condition')}><option>Working</option><option>Damaged</option><option>Dead</option></select></label></div>
      <label>Collection address<textarea required rows="2" value={f.address} onChange={set('address')} /></label>
      <label>Preferred pickup date<input type="date" min={day(new Date())} value={f.preferredDate} onChange={set('preferredDate')} /></label>
      <label>Preferred time<select value={f.preferredTime} onChange={set('preferredTime')}><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
      <label>Extra details<textarea rows="2" value={f.description} onChange={set('description')} /></label>
      <Err e={e} /><button className="btn">Submit request</button>
    </form>
  );
}

export function Admin() {
  const [tab, setTab] = useState('requests'), [reqs, setReqs] = useState([]), [users, setUsers] = useState([]);
  const [recs, setRecs] = useState([]), [stats, setStats] = useState({ byStatus: {} }), [e, setE] = useState(''), [q, setQ] = useState(''), [fs, setFs] = useState('All');
  const load = () => Promise.all([api('/requests'), api('/admin/users'), api('/admin/records'), api('/admin/stats')])
    .then(([a, b, c, d]) => { setReqs(a); setUsers(b); setRecs(c); setStats(d); }).catch(x => setE(x.message));
    useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);
  const shown = reqs.filter(r => (fs === 'All' || r.status === fs) && JSON.stringify([r.user?.name, r.user?.email, r.brand, r.model, r.deviceType]).toLowerCase().includes(q.toLowerCase()));
  const sched = reqs.filter(r => r.scheduledDate && ['Approved', 'Scheduled'].includes(r.status)).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  const run = async fn => { try { setE(''); await fn(); load(); } catch (x) { setE(x.message); } };
  return (
    <>
      <h2>Admin panel</h2>
      <div className="stats">
        <div><b>{stats.users}</b>users</div><div><b>{stats.total}</b>requests</div>
        <div><b>{stats.byStatus.Pending || 0}</b>pending</div><div><b>{stats.recycledKg}</b>kg recycled</div>
      </div>
      <div className="card bars"><h3>Requests by status</h3>{STATUSES.map(s => <div key={s}><span>{lab(s)}</span><i style={{ width: ((stats.byStatus[s] || 0) / (stats.total || 1)) * 100 + '%' }} className={s} /><b>{stats.byStatus[s] || 0}</b></div>)}</div>
      <div className="tabs">{['requests', 'schedule', 'users', 'records'].map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
      <Err e={e} />
      {tab === 'requests' && <div className="filters"><input placeholder="Search name, email or device…" value={q} onChange={e => setQ(e.target.value)} /><select value={fs} onChange={e => setFs(e.target.value)}><option>All</option>{STATUSES.map(s => <option key={s} value={s}>{lab(s)}</option>)}</select></div>}
      {tab === 'requests' && shown.map(r => <ReqRow key={r._id} r={r} save={b => run(() => api('/requests/' + r._id, 'PATCH', b))} del={() => confirm('Delete this request?') && run(() => api('/requests/' + r._id, 'DELETE'))} />)}
      {tab === 'requests' && !shown.length && <p className="card muted">No requests yet.</p>}
      {tab === 'schedule' && <div className="card"><h3>Upcoming collections</h3><table><thead><tr><th>Date</th><th>Slot</th><th>Device</th><th>User</th><th>Address</th><th>Status</th></tr></thead><tbody>
        {sched.map(r => <tr key={r._id}><td>{fmt(r.scheduledDate)}</td><td>{r.preferredTime}</td><td>{device(r)} × {r.quantity}</td><td>{r.user?.name}</td><td>{r.address}</td><td><Badge s={r.status} /></td></tr>)}</tbody></table>
        {!sched.length && <p className="muted">No collections scheduled. Set a pickup date on a request to see it here.</p>}</div>}
      {tab === 'users' && <div className="card"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th /></tr></thead><tbody>
        {users.map(u => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{fmt(u.createdAt)}</td>
          <td><button className="link danger" onClick={() => confirm('Remove user and their requests?') && run(() => api('/admin/users/' + u._id, 'DELETE'))}>Remove</button></td></tr>)}</tbody></table></div>}
      {tab === 'records' && <Records reqs={reqs} recs={recs} add={b => run(() => api('/admin/records', 'POST', b))} />}
    </>
  );
}

function ReqRow({ r, save, del }) {
  const [status, setStatus] = useState(r.status), [date, setDate] = useState(day(r.scheduledDate)), [note, setNote] = useState(r.adminNote || '');
  return (
    <article className="card">
      <div className="row"><h3>{device(r)} <span className="muted">× {r.quantity}</span></h3><Badge s={r.status} /></div>
      <p className="muted">{r.user?.name} · {r.user?.email} · {r.user?.phone || 'no phone'}</p>
      <p>{r.deviceType} · {r.condition} · {r.address}</p>
      {r.description && <p className="muted">{r.description}</p>}
      <p className="muted">Preferred: {fmt(r.preferredDate)}</p>
      <div className="edit">
        <label>Status<select value={status} onChange={e => setStatus(e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Pickup date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label>Note to user<input value={note} onChange={e => setNote(e.target.value)} /></label>
        <button className="btn" onClick={() => save({ status, scheduledDate: date, adminNote: note })}>Save</button>
        <button className="link danger" onClick={del}>Delete</button>
      </div>
    </article>
  );
}

function Records({ reqs, recs, add }) {
  const eligible = reqs.filter(r => r.status === 'Collected');
  const [f, setF] = useState({ request: '', outcome: 'Recycled', weightKg: '', materials: '', recycler: '', method: '' });
  const set = k => ev => setF({ ...f, [k]: ev.target.value });
  const csv = () => {
    const rows = [['Device', 'User', 'Outcome', 'Weight (kg)', 'Materials', 'Recycler', 'Method', 'Date'], ...recs.map(x => [x.request ? device(x.request) : 'Deleted', x.request?.user?.name, x.outcome, x.weightKg, x.materials, x.recycler, x.method, fmt(x.createdAt)])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => '"' + (c ?? '') + '"').join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'recycling-records.csv'; a.click();
  };
  return (
    <>
      <form className="card" onSubmit={ev => { ev.preventDefault(); add(f); setF({ request: '', outcome: 'Recycled', weightKg: '', materials: '', recycler: '', method: '' }); }}>
        <h3>Add recycling record</h3>
        {!eligible.length ? <p className="muted">Mark a request as "Collected" to add its recycling record.</p> : <>
          <label>Collected request<select required value={f.request} onChange={set('request')}><option value="">Select…</option>
            {eligible.map(r => <option key={r._id} value={r._id}>{device(r)} ({r.user?.name})</option>)}</select></label>
          <label>Outcome<select value={f.outcome} onChange={set('outcome')}><option>Recycled</option><option>Disposed</option></select></label>
          <div className="two"><label>Weight (kg)<input type="number" step="0.1" required value={f.weightKg} onChange={set('weightKg')} /></label>
            <label>Recycler<input required value={f.recycler} onChange={set('recycler')} /></label></div>
          <label>Materials recovered<input placeholder="e.g. copper, aluminium, plastic" value={f.materials} onChange={set('materials')} /></label>
          <label>Method<input placeholder="e.g. shredding, refurbishing" value={f.method} onChange={set('method')} /></label>
          <button className="btn">Save record</button></>}
      </form>
      <div className="card"><div className="row"><h3>Recycling &amp; disposal records</h3>{recs.length > 0 && <button className="btn" onClick={csv}>Download CSV</button>}</div><table><thead><tr><th>Device</th><th>User</th><th>Outcome</th><th>Kg</th><th>Materials</th><th>Recycler</th><th>Method</th><th>Date</th></tr></thead><tbody>
        {recs.map(x => <tr key={x._id}><td>{x.request ? device(x.request) : 'Deleted'}</td><td>{x.request?.user?.name}</td><td>{x.outcome}</td><td>{x.weightKg}</td>
          <td>{x.materials}</td><td>{x.recycler}</td><td>{x.method}</td><td>{fmt(x.createdAt)}</td></tr>)}</tbody></table>
        {!recs.length && <p className="muted">No records yet.</p>}</div>
    </>
  );
}

const INFO = {
  'tell-us': ['Step 1', 'Tell us what you have', 'Create an account and submit a request with the details of your e-waste.', ['Choose the device type, brand, model and quantity.', 'Mention the condition: working, damaged or dead.', 'Enter your collection address, a preferred date and a time slot.', 'Add any extra details that help us prepare for the pickup.']],
  pickup: ['Step 2', 'We coordinate pickup', 'Our admin team reviews every request and plans the collection.', ['Your request is verified and approved or rejected with a note.', 'A collection date is scheduled and shown on your dashboard.', 'The status updates from Submitted to Approved to Scheduled.', 'You can cancel a request while it is still Submitted.']],
  recycle: ['Step 3', 'Recycle responsibly', 'After collection, your e-waste is sent for recycling or safe disposal.', ['Collected items are recorded with weight, materials and recycler.', 'The final outcome is marked Recycled or Disposed.', 'You can follow the whole journey on your progress tracker.', 'Records are maintained by the admin for transparency.']],
  mobiles: ['We accept', 'Mobiles & tablets', 'Phones and tablets hold batteries and valuable metals such as copper and gold that can be recovered.', ['Back up your data and sign out of your accounts.', 'Factory reset the device and remove the SIM and memory card.', 'Broken or dead devices are accepted too.', 'Never throw these in household waste.']],
  laptops: ['We accept', 'Laptops & desktops', 'Computers contain circuit boards, metals and plastics that can be reused when recycled properly.', ['Copy anything important and wipe your personal files.', 'Include chargers or accessories if you want them recycled.', 'Tell us if a battery looks swollen so it is handled safely.', 'Add the quantity if you have several machines.']],
  monitors: ['We accept', 'Monitors & TVs', 'Older screens can contain hazardous materials such as lead or mercury, so they need proper handling.', ['Keep the screen intact and avoid breaking it before pickup.', 'Mention the size or number of screens in your request.', 'Cracked or non-working screens are accepted.', 'Disconnect and pack cables separately.']],
  batteries: ['We accept', 'Batteries & chargers', 'Batteries can catch fire or leak when thrown away, so they must never go in normal bins.', ['Cover the terminals of loose batteries with tape.', 'Keep swollen or leaking batteries away from heat and note it in the request.', 'Store them in a dry place until pickup.', 'Chargers and power banks can be included.']],
  printers: ['We accept', 'Printers & scanners', 'Printers have plastics, metals and electronics, and cartridges need separate handling.', ['Remove ink or toner cartridges if you can.', 'Mention if it is a large office printer.', 'Include scanners and copiers in the same request.', 'Keep the power cable with the device.']],
  cables: ['We accept', 'Cables & accessories', 'Wires, keyboards, mice and adapters contain copper and plastics that are worth recovering.', ['Bundle cables together so they are easy to collect.', 'Add accessories such as headphones and chargers.', 'Small items can be grouped in a single request.', 'Mention the approximate quantity.']],
};

export function Info({ user }) {
  const { slug } = useParams();
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  const d = INFO[slug];
  if (!d) return <Navigate to="/" />;
  return (
    <article className="info">
      <Link to="/" className="back">← Back to home</Link>
      <span className="eyebrow dark">{d[0]}</span>
      <h1>{d[1]}</h1>
      <p className="lead">{d[2]}</p>
      <ul>{d[3].map(x => <li key={x}>{x}</li>)}</ul>
      <Link className="btn" to={user ? '/new' : '/register'}>{user ? 'Submit a request' : 'Sign up to get started'}</Link>
    </article>
  );
}
