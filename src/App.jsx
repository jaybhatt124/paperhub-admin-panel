import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './utils/firebase';

const ADMIN_PASSWORD = 'admin123';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'papers', label: 'Papers' },
  { id: 'academic', label: 'Academic Data' },
  { id: 'branches', label: 'Branches' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'suggestions', label: 'Suggestions' },
];

const PREDEFINED_ACADEMIC_ITEMS = [
  {
    id: 'cbse',
    name: 'CBSE',
    type: 'board',
    classes: ['10th', '12th'],
    branches: [],
    semesters: 0,
    streams: { '12th': ['Science', 'Commerce', 'Arts'] },
    subjects: {
      '10th': ['Maths', 'Science', 'Social Science', 'English', 'Hindi', 'Sanskrit'],
      '12th_Science': ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Computer Science'],
      '12th_Commerce': ['Accounts', 'Economics', 'Business Studies', 'English', 'Maths'],
      '12th_Arts': ['History', 'Geography', 'Political Science', 'English', 'Sociology'],
    },
  },
  {
    id: 'gseb',
    name: 'GSEB',
    type: 'board',
    classes: ['10th', '12th'],
    branches: [],
    semesters: 0,
    streams: { '12th': ['Science', 'Commerce', 'Arts'] },
    subjects: {
      '10th': ['Maths', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati'],
      '12th_Science': ['Physics', 'Chemistry', 'Maths', 'Biology', 'English'],
      '12th_Commerce': ['Accounts', 'Economics', 'Business Studies', 'English'],
      '12th_Arts': ['History', 'Geography', 'Political Science', 'English', 'Gujarati'],
    },
  },
  {
    id: 'gtu',
    name: 'GTU',
    type: 'university',
    classes: ['Diploma'],
    degrees: ['Diploma'],
    noBranchDegrees: [],
    branches: [
      'Computer Engineering',
      'Information Technology',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Electronics & Communication',
      'Automobile Engineering',
      'Chemical Engineering',
    ],
    semesters: 6,
    streams: {},
    subjects: {
      'Computer Engineering_1': ['Maths-1', 'Physics', 'Basic Electronics', 'Programming in C', 'English'],
      'Computer Engineering_2': ['Maths-2', 'Data Structures', 'Digital Electronics', 'OOP with Java'],
      'Computer Engineering_3': ['Maths-3', 'Database Management', 'Computer Networks', 'Operating Systems'],
      'Computer Engineering_4': ['Web Technology', 'Software Engineering', 'Python Programming', 'Linux'],
      'Computer Engineering_5': ['Mobile App Development', 'Cloud Computing', 'Cyber Security', 'AI & ML'],
      'Computer Engineering_6': ['Project Work', 'Professional Ethics', 'Entrepreneurship'],
      'Mechanical Engineering_1': ['Maths-1', 'Physics', 'Engineering Drawing', 'Workshop', 'English'],
      'Mechanical Engineering_2': ['Maths-2', 'Material Science', 'Thermodynamics', 'Manufacturing Processes'],
      'Civil Engineering_1': ['Maths-1', 'Physics', 'Engineering Drawing', 'Surveying', 'English'],
      'Civil Engineering_2': ['Maths-2', 'Strength of Materials', 'Fluid Mechanics', 'Concrete Technology'],
    },
  },
];

const BOARD_COLORS = {
  CBSE: '#2563eb',
  GSEB: '#16a34a',
  GTU: '#f97316',
};

const blankPaper = {
  board: '',
  classLevel: '',
  branch: '',
  stream: '',
  semester: '',
  subject: '',
  year: '',
  title: '',
  viewLink: '',
  downloadLink: '',
};

const blankAcademicItem = {
  name: '',
  type: 'board',
  classes: [],
  degrees: [],
  noBranchDegrees: [],
  branches: [],
  semesters: 6,
  streams: {},
  subjects: {},
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now()}`;
}

function uniq(values) {
  return [...new Set((values || []).map(v => String(v || '').trim()).filter(Boolean))];
}

function mergeAcademicItems(remoteItems) {
  const map = new Map();

  PREDEFINED_ACADEMIC_ITEMS.forEach(item => {
    map.set(normalize(item.name), { ...item, isPredefined: true });
  });

  remoteItems.forEach(item => {
    const key = normalize(item.name || item.id);
    const existing = map.get(key) || {};
    map.set(key, {
      ...existing,
      ...item,
      id: item.id || existing.id,
      classes: uniq([...(existing.classes || []), ...(item.classes || [])]),
      degrees: uniq([...(existing.degrees || []), ...(item.degrees || [])]),
      noBranchDegrees: uniq([...(existing.noBranchDegrees || []), ...(item.noBranchDegrees || [])]),
      branches: uniq([...(existing.branches || []), ...(item.branches || [])]),
      streams: { ...(existing.streams || {}), ...(item.streams || {}) },
      subjects: { ...(existing.subjects || {}), ...(item.subjects || {}) },
      isPredefined: Boolean(existing.isPredefined),
    });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function findAcademicItem(items, name) {
  return items.find(item => normalize(item.name) === normalize(name) || normalize(item.id) === normalize(name));
}

function getSubjectKey(item, paper) {
  if (!item) return '';
  if (item.type === 'university') {
    if (!paper.semester) return '';
    if ((item.noBranchDegrees || []).includes(paper.classLevel)) {
      return paper.classLevel ? `${paper.classLevel}_${paper.semester}` : '';
    }
    return paper.branch ? `${paper.branch}_${paper.semester}` : '';
  }
  if (paper.classLevel === '12th' && paper.stream) return `${paper.classLevel}_${paper.stream}`;
  return paper.classLevel || '';
}

function getSubjectsForPaper(item, paper) {
  const key = getSubjectKey(item, paper);
  return key ? item?.subjects?.[key] || [] : [];
}

function years() {
  const current = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) => String(current - index));
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [papers, setPapers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [remoteAcademicItems, setRemoteAcademicItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const academicItems = useMemo(() => mergeAcademicItems(remoteAcademicItems), [remoteAcademicItems]);

  useEffect(() => {
    if (!loggedIn) return undefined;

    setLoading(true);
    const unsubscribePapers = onSnapshot(
      collection(db, 'papers'),
      snap => {
        setPapers(snap.docs.map(item => ({ id: item.id, ...item.data() })));
        setLoading(false);
      },
      () => {
        setPapers([]);
        setLoading(false);
      }
    );
    const unsubscribeAcademic = onSnapshot(
      collection(db, 'universities'),
      snap => setRemoteAcademicItems(snap.docs.map(item => ({ id: item.id, ...item.data() }))),
      () => setRemoteAcademicItems([])
    );
    const unsubscribeSuggestions = onSnapshot(
      collection(db, 'suggestions'),
      snap => setSuggestions(snap.docs.map(item => ({ id: item.id, ...item.data() }))),
      () => setSuggestions([])
    );

    return () => {
      unsubscribePapers();
      unsubscribeAcademic();
      unsubscribeSuggestions();
    };
  }, [loggedIn]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2800);
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'papers'));
      setPapers(snap.docs.map(item => ({ id: item.id, ...item.data() })));
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicItems = async () => {
    try {
      const snap = await getDocs(collection(db, 'universities'));
      setRemoteAcademicItems(snap.docs.map(item => ({ id: item.id, ...item.data() })));
    } catch {
      setRemoteAcademicItems([]);
    }
  };

  const seedPredefined = async () => {
    try {
      await Promise.all(PREDEFINED_ACADEMIC_ITEMS.map(item => setDoc(doc(db, 'universities', item.id), item, { merge: true })));
      await fetchAcademicItems();
      showToast('Predefined boards, branches, semesters and subjects saved.');
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setError('');
    } else {
      setError('Wrong password. Try again.');
    }
  };

  if (!loggedIn) {
    return <LoginScreen password={password} setPassword={setPassword} onLogin={handleLogin} error={error} />;
  }

  return (
    <div className="app-layout">
      {toast && <div className="toast">{toast}</div>}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">PH</div>
          <div>
            <div className="logo-title">PaperHub</div>
            <div className="logo-sub">Admin workspace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {TABS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="logout-btn" onClick={() => setLoggedIn(false)}>Logout</button>
      </aside>

      <main className="main-content">
        {tab === 'dashboard' && (
          <Dashboard papers={papers} academicItems={academicItems} suggestions={suggestions} loading={loading} />
        )}
        {tab === 'papers' && (
          <PapersTab
            papers={papers}
            academicItems={academicItems}
            showToast={showToast}
            fetchPapers={fetchPapers}
          />
        )}
        {tab === 'academic' && (
          <AcademicDataTab
            academicItems={academicItems}
            showToast={showToast}
            fetchAcademicItems={fetchAcademicItems}
            seedPredefined={seedPredefined}
          />
        )}
        {tab === 'subjects' && (
          <SubjectsTab
            academicItems={academicItems}
            showToast={showToast}
            fetchAcademicItems={fetchAcademicItems}
          />
        )}
        {tab === 'branches' && (
          <BranchesTab
            academicItems={academicItems}
            showToast={showToast}
            fetchAcademicItems={fetchAcademicItems}
          />
        )}
        {tab === 'suggestions' && (
          <SuggestionsTab
            suggestions={suggestions}
            academicItems={academicItems}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}

function LoginScreen({ password, setPassword, onLogin, error }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">PH</div>
        <h1 className="login-title">PaperHub Admin</h1>
        <p className="login-sub">Manage papers, boards, branches and subjects.</p>
        <input
          type="password"
          className="login-input"
          placeholder="Admin password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          onKeyDown={event => event.key === 'Enter' && onLogin()}
        />
        {error && <p className="login-error">{error}</p>}
        <button className="login-btn" onClick={onLogin}>Login</button>
      </div>
    </div>
  );
}

function Dashboard({ papers, academicItems, suggestions, loading }) {
  const boardCounts = papers.reduce((acc, paper) => {
    acc[paper.board] = (acc[paper.board] || 0) + 1;
    return acc;
  }, {});
  const branches = academicItems.reduce((count, item) => count + (item.branches?.length || 0), 0);

  return (
    <div className="tab-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2 className="tab-title">Dashboard</h2>
        </div>
        <span className="sync-pill">{loading ? 'Loading...' : 'Live data'}</span>
      </div>

      <div className="stats-grid">
        <MetricCard label="Total papers" value={papers.length} tone="blue" />
        <MetricCard label="Boards / universities" value={academicItems.length} tone="green" />
        <MetricCard label="Branches" value={branches} tone="orange" />
        <MetricCard label="Pending suggestions" value={suggestions.filter(item => item.status !== 'published').length} tone="violet" />
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3 className="section-title">Papers by board</h3>
        </div>
        <div className="mini-grid">
          {academicItems.map(item => (
            <div key={item.id} className="mini-stat">
              <span className="mini-label">{item.name}</span>
              <strong>{boardCounts[item.name] || 0}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="section-title">Recent papers</h3>
        </div>
        <PapersTable papers={papers.slice(0, 8)} onEdit={null} onDelete={null} />
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function PapersTab({ papers, academicItems, showToast, fetchPapers }) {
  const [form, setForm] = useState(blankPaper);
  const [editId, setEditId] = useState(null);
  const [filterBoard, setFilterBoard] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const selectedItem = findAcademicItem(academicItems, form.board);
  const isUniversity = selectedItem?.type === 'university';
  const needsBranch = isUniversity && !(selectedItem?.noBranchDegrees || []).includes(form.classLevel);
  const classOptions = (isUniversity ? selectedItem?.degrees : selectedItem?.classes)?.length
    ? (isUniversity ? selectedItem.degrees : selectedItem.classes)
    : isUniversity ? ['Diploma', 'Degree'] : ['10th', '12th'];
  const streamOptions = selectedItem?.streams?.[form.classLevel] || [];
  const subjectOptions = getSubjectsForPaper(selectedItem, form);
  const subjectKey = getSubjectKey(selectedItem, form);
  const yearOptions = years();

  const filtered = papers.filter(paper => {
    const q = search.trim().toLowerCase();
    if (filterBoard && paper.board !== filterBoard) return false;
    if (!q) return true;
    return [paper.title, paper.subject, paper.branch, paper.stream, paper.year]
      .some(value => String(value || '').toLowerCase().includes(q));
  });

  const updateForm = (changes) => setForm(prev => ({ ...prev, ...changes }));

  const save = async () => {
    if (!form.board || !form.classLevel || !form.title || !form.subject || !form.year) {
      showToast('Fill board, class, subject, year and title.');
      return;
    }
    if (isUniversity && (!form.semester || (needsBranch && !form.branch))) {
      showToast(needsBranch ? 'Select branch and semester for university papers.' : 'Select semester for this degree.');
      return;
    }

    try {
      const payload = {
        ...form,
        branch: isUniversity && needsBranch ? form.branch : '',
        semester: isUniversity ? String(form.semester) : '',
        stream: !isUniversity ? form.stream : '',
        year: String(form.year),
      };
      if (editId) {
        await updateDoc(doc(db, 'papers', editId), payload);
        showToast('Paper updated.');
      } else {
        await addDoc(collection(db, 'papers'), { ...payload, createdAt: new Date() });
        showToast('Paper added.');
      }
      setForm(blankPaper);
      setEditId(null);
      setShowForm(false);
      fetchPapers();
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this paper?')) return;
    await deleteDoc(doc(db, 'papers', id));
    showToast('Paper deleted.');
    fetchPapers();
  };

  const edit = (paper) => {
    setForm({ ...blankPaper, ...paper });
    setEditId(paper.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tab-content wide">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Question papers</p>
          <h2 className="tab-title">Papers ({papers.length})</h2>
        </div>
        <button className="btn-primary" onClick={() => {
          setForm(blankPaper);
          setEditId(null);
          setShowForm(value => !value);
        }}>
          {showForm ? 'Close form' : 'Add paper'}
        </button>
      </div>

      {showForm && (
        <section className="form-card">
          <div className="panel-header">
            <div>
              <h3 className="form-title">{editId ? 'Edit paper' : 'Add new paper'}</h3>
              <p className="muted">Subject dropdowns are based on the selected board, class, branch and semester.</p>
            </div>
          </div>

          <div className="form-grid">
            <Field label="Board / university *">
              <select
                value={form.board}
                onChange={event => updateForm({
                  board: event.target.value,
                  classLevel: '',
                  branch: '',
                  stream: '',
                  semester: '',
                  subject: '',
                })}
              >
                <option value="">Select board or university</option>
                {academicItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </Field>

            <Field label={isUniversity ? 'Degree *' : 'Standard / class *'}>
              <select
                value={form.classLevel}
                disabled={!form.board}
                onChange={event => updateForm({ classLevel: event.target.value, branch: '', stream: '', semester: '', subject: '' })}
              >
                <option value="">{isUniversity ? 'Select degree' : 'Select standard'}</option>
                {classOptions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>

            {isUniversity && needsBranch && (
              <Field label="Branch *">
                <select
                  value={form.branch}
                  onChange={event => updateForm({ branch: event.target.value, subject: '' })}
                >
                  <option value="">Select branch</option>
                  {(selectedItem.branches || []).map(branch => <option key={branch} value={branch}>{branch}</option>)}
                </select>
              </Field>
            )}

            {isUniversity && (
              <Field label="Semester *">
                <select
                  value={form.semester}
                  onChange={event => updateForm({ semester: event.target.value, subject: '' })}
                >
                  <option value="">Select semester</option>
                  {Array.from({ length: Number(selectedItem.semesters) || 6 }, (_, index) => String(index + 1))
                    .map(semester => <option key={semester} value={semester}>Semester {semester}</option>)}
                </select>
              </Field>
            )}

            {!isUniversity && form.classLevel === '12th' && (
              <Field label="Stream">
                <select
                  value={form.stream}
                  onChange={event => updateForm({ stream: event.target.value, subject: '' })}
                >
                  <option value="">Select stream</option>
                  {(streamOptions.length ? streamOptions : ['Science', 'Commerce', 'Arts'])
                    .map(stream => <option key={stream} value={stream}>{stream}</option>)}
                </select>
              </Field>
            )}

            <Field label="Subject *" hint={subjectKey ? `Group: ${subjectKey}` : 'Select details above first'}>
              <select
                value={subjectOptions.includes(form.subject) ? form.subject : ''}
                disabled={!subjectKey || subjectOptions.length === 0}
                onChange={event => updateForm({ subject: event.target.value })}
              >
                <option value="">{subjectOptions.length ? 'Select subject' : 'No subjects added yet'}</option>
                {subjectOptions.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <input
                value={form.subject}
                onChange={event => updateForm({ subject: event.target.value })}
                placeholder="Or type a subject manually"
              />
            </Field>

            <Field label="Year *">
              <input
                list="paper-years"
                value={form.year}
                onChange={event => updateForm({ year: event.target.value })}
                placeholder="2026"
              />
              <datalist id="paper-years">
                {yearOptions.map(year => <option key={year} value={year} />)}
              </datalist>
            </Field>

            <Field label="Paper title *" full>
              <input value={form.title} onChange={event => updateForm({ title: event.target.value })} placeholder="CBSE 10th Maths 2026" />
            </Field>

            <Field label="Google Drive view link" full>
              <input value={form.viewLink} onChange={event => updateForm({ viewLink: event.target.value })} placeholder="https://drive.google.com/file/d/FILE_ID/view" />
            </Field>

            <Field label="Google Drive download link" full>
              <input value={form.downloadLink} onChange={event => updateForm({ downloadLink: event.target.value })} placeholder="https://drive.google.com/uc?export=download&id=FILE_ID" />
            </Field>
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setForm(blankPaper); setEditId(null); setShowForm(false); }}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editId ? 'Update paper' : 'Add paper'}</button>
          </div>
        </section>
      )}

      <div className="filter-bar">
        <input className="search-input" placeholder="Search title, subject, branch or year" value={search} onChange={event => setSearch(event.target.value)} />
        <select value={filterBoard} onChange={event => setFilterBoard(event.target.value)}>
          <option value="">All boards</option>
          {academicItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
      </div>

      <section className="panel table-panel">
        <PapersTable papers={filtered} onEdit={edit} onDelete={remove} />
        {filtered.length === 0 && <div className="empty-table">No papers found.</div>}
      </section>
    </div>
  );
}

function PapersTable({ papers, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Board</th>
            <th>Class</th>
            <th>Branch / stream</th>
            <th>Sem</th>
            <th>Subject</th>
            <th>Year</th>
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {papers.map(paper => (
            <tr key={paper.id}>
              <td className="td-title">{paper.title || '-'}</td>
              <td><BoardBadge name={paper.board} /></td>
              <td>{paper.classLevel || '-'}</td>
              <td>{paper.branch || paper.stream || '-'}</td>
              <td>{paper.semester || '-'}</td>
              <td>{paper.subject || '-'}</td>
              <td>{paper.year || '-'}</td>
              {(onEdit || onDelete) && (
                <td>
                  <div className="action-btns">
                    {onEdit && <button className="btn-edit" onClick={() => onEdit(paper)}>Edit</button>}
                    {onDelete && <button className="btn-delete" onClick={() => onDelete(paper.id)}>Delete</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AcademicDataTab({ academicItems, showToast, fetchAcademicItems, seedPredefined }) {
  const [form, setForm] = useState(blankAcademicItem);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [classInput, setClassInput] = useState('');
  const [degreeInput, setDegreeInput] = useState('');
  const [branchInput, setBranchInput] = useState('');
  const [streamInput, setStreamInput] = useState('');

  const updateForm = changes => setForm(prev => ({ ...prev, ...changes }));

  const addClass = () => {
    if (!classInput.trim()) return;
    updateForm({ classes: uniq([...form.classes, classInput]) });
    setClassInput('');
  };

  const addDegree = () => {
    if (!degreeInput.trim()) return;
    updateForm({ degrees: uniq([...(form.degrees || []), degreeInput]) });
    setDegreeInput('');
  };

  const toggleNoBranchDegree = (degree) => {
    const current = form.noBranchDegrees || [];
    updateForm({
      noBranchDegrees: current.includes(degree)
        ? current.filter(item => item !== degree)
        : uniq([...current, degree]),
    });
  };

  const addBranch = () => {
    if (!branchInput.trim()) return;
    updateForm({ branches: uniq([...form.branches, branchInput]) });
    setBranchInput('');
  };

  const addStream = () => {
    if (!streamInput.trim()) return;
    updateForm({
      streams: {
        ...form.streams,
        '12th': uniq([...(form.streams?.['12th'] || []), streamInput]),
      },
    });
    setStreamInput('');
  };

  const save = async () => {
    if (!form.name.trim()) {
      showToast('Enter a board or university name.');
      return;
    }

    const degreeList = uniq(form.degrees || []);
    const noBranchDegreeList = uniq(form.noBranchDegrees || []).filter(degree => degreeList.includes(degree));
    const classList = form.type === 'university' ? degreeList : uniq(form.classes);
    const payload = {
      ...form,
      name: form.name.trim(),
      classes: classList,
      degrees: form.type === 'university' ? degreeList : [],
      noBranchDegrees: form.type === 'university' ? noBranchDegreeList : [],
      branches: form.type === 'university' ? uniq(form.branches) : [],
      semesters: form.type === 'university' ? Number(form.semesters) || 6 : 0,
      streams: form.type === 'board' ? form.streams : {},
      subjects: form.subjects || {},
    };

    try {
      if (editId) {
        await setDoc(doc(db, 'universities', editId), payload, { merge: true });
        showToast('Academic item updated.');
      } else {
        await setDoc(doc(db, 'universities', slugify(payload.name)), payload, { merge: true });
        showToast('Academic item added.');
      }
      setForm(blankAcademicItem);
      setEditId(null);
      setShowForm(false);
      fetchAcademicItems();
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  const edit = (item) => {
    setForm({
      ...blankAcademicItem,
      ...item,
      classes: item.classes || [],
      degrees: item.degrees || (item.type === 'university' ? item.classes || [] : []),
      noBranchDegrees: item.noBranchDegrees || [],
      branches: item.branches || [],
      streams: item.streams || {},
      subjects: item.subjects || {},
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (item) => {
    if (item.isPredefined && !confirm(`${item.name} is predefined. Delete Firestore override only?`)) return;
    if (!item.isPredefined && !confirm(`Delete ${item.name}?`)) return;
    try {
      await deleteDoc(doc(db, 'universities', item.id));
      showToast('Deleted.');
      fetchAcademicItems();
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  return (
    <div className="tab-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Boards, standards and branches</p>
          <h2 className="tab-title">Academic data</h2>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={seedPredefined}>Save predefined data</button>
          <button className="btn-primary" onClick={() => {
            setForm(blankAcademicItem);
            setEditId(null);
            setShowForm(value => !value);
          }}>
            {showForm ? 'Close form' : 'Add board / university'}
          </button>
        </div>
      </div>

      {showForm && (
        <section className="form-card">
          <h3 className="form-title">{editId ? 'Edit academic item' : 'Add academic item'}</h3>
          <div className="form-grid">
            <Field label="Name *">
              <input value={form.name} onChange={event => updateForm({ name: event.target.value })} placeholder="GTU, CBSE, Mumbai University" />
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={event => updateForm({ type: event.target.value })}>
                <option value="board">Board</option>
                <option value="university">University</option>
              </select>
            </Field>
            {form.type === 'university' && (
              <Field label="Total semesters">
                <input type="number" min="1" value={form.semesters} onChange={event => updateForm({ semesters: event.target.value })} />
              </Field>
            )}
          </div>

          {form.type === 'board' && (
            <TagEditor
              label="Standards / classes"
              value={classInput}
              setValue={setClassInput}
              add={addClass}
              placeholder="10th, 12th"
              tags={form.classes}
              remove={tag => updateForm({ classes: form.classes.filter(item => item !== tag) })}
            />
          )}

          {form.type === 'university' && (
            <>
              <TagEditor
                label="Degrees"
                value={degreeInput}
                setValue={setDegreeInput}
                add={addDegree}
                placeholder="MCA, BCA, B.Tech, M.Tech"
                tags={form.degrees || []}
                remove={tag => updateForm({
                  degrees: (form.degrees || []).filter(item => item !== tag),
                  noBranchDegrees: (form.noBranchDegrees || []).filter(item => item !== tag),
                })}
              />
              {(form.degrees || []).length > 0 && (
                <div className="tag-section">
                  <label>Degrees without branch</label>
                  <div className="tags">
                    {(form.degrees || []).map(degree => (
                      <label key={degree} className="tag tag-subject">
                        <input
                          type="checkbox"
                          checked={(form.noBranchDegrees || []).includes(degree)}
                          onChange={() => toggleNoBranchDegree(degree)}
                        />
                        {degree}
                      </label>
                    ))}
                  </div>
                  <span className="field-hint">Example: mark BBA if students should go directly from BBA to semester without selecting a branch.</span>
                </div>
              )}
            </>
          )}

          {form.type === 'board' && (
            <TagEditor
              label="12th streams"
              value={streamInput}
              setValue={setStreamInput}
              add={addStream}
              placeholder="Science, Commerce, Arts"
              tags={form.streams?.['12th'] || []}
              remove={tag => updateForm({ streams: { ...form.streams, '12th': (form.streams?.['12th'] || []).filter(item => item !== tag) } })}
            />
          )}

          {form.type === 'university' && (
            <TagEditor
              label="Branches"
              value={branchInput}
              setValue={setBranchInput}
              add={addBranch}
              placeholder="Computer Engineering"
              tags={form.branches}
              remove={tag => updateForm({ branches: form.branches.filter(item => item !== tag) })}
            />
          )}

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setForm(blankAcademicItem); setEditId(null); setShowForm(false); }}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editId ? 'Update' : 'Save'}</button>
          </div>
        </section>
      )}

      <div className="cards-grid">
        {academicItems.map(item => (
          <article key={item.id} className="uni-card">
            <div className="uni-card-top">
              <div>
                <div className="uni-name">{item.name}</div>
                <div className="card-badges">
                  <span className={`badge ${item.type === 'board' ? 'badge-board' : 'badge-university'}`}>{item.type}</span>
                  {item.isPredefined && <span className="badge badge-muted">predefined</span>}
                </div>
              </div>
              <div className="action-btns">
                <button className="btn-edit" onClick={() => edit(item)}>Edit</button>
                <button className="btn-delete" onClick={() => remove(item)}>Delete</button>
              </div>
            </div>
            {item.type === 'board' && <div className="uni-detail"><strong>Standards:</strong> {(item.classes || []).join(', ') || '-'}</div>}
            {item.type === 'university' && <div className="uni-detail"><strong>Degrees:</strong> {(item.degrees || item.classes || []).join(', ') || '-'}</div>}
            {item.type === 'university' && <div className="uni-detail"><strong>No-branch degrees:</strong> {(item.noBranchDegrees || []).join(', ') || '-'}</div>}
            {item.type === 'board' && <div className="uni-detail"><strong>Streams:</strong> {(item.streams?.['12th'] || []).join(', ') || '-'}</div>}
            {item.type === 'university' && <div className="uni-detail"><strong>Branches:</strong> {(item.branches || []).join(', ') || '-'}</div>}
            {item.type === 'university' && <div className="uni-detail"><strong>Semesters:</strong> {item.semesters || 6}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}

function SubjectsTab({ academicItems, showToast, fetchAcademicItems }) {
  const [selectedId, setSelectedId] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const item = academicItems.find(entry => entry.id === selectedId);
  const isUniversity = item?.type === 'university';
  const noBranchSelected = isUniversity && (item?.noBranchDegrees || []).includes(selectedClass);

  const subjectKey = item
    ? isUniversity
      ? selectedSemester && (noBranchSelected ? selectedClass : selectedBranch)
        ? `${noBranchSelected ? selectedClass : selectedBranch}_${selectedSemester}`
        : ''
      : selectedClass === '12th' && selectedStream ? `${selectedClass}_${selectedStream}` : selectedClass
    : '';

  const subjectGroups = Object.keys(item?.subjects || {}).sort();

  const updateSubjects = async (subjects) => {
    if (!item) return;
    try {
      await setDoc(doc(db, 'universities', item.id), { ...item, subjects }, { merge: true });
      fetchAcademicItems();
    } catch (e) {
      showToast(`Error: ${e.message}`);
      throw e;
    }
  };

  const addSubject = async () => {
    if (!item || !subjectKey) {
      showToast('Select a subject group first.');
      return;
    }
    if (!newSubject.trim()) return;
    const current = item.subjects?.[subjectKey] || [];
    if (current.includes(newSubject.trim())) {
      showToast('Subject already exists.');
      return;
    }
    try {
      await updateSubjects({ ...(item.subjects || {}), [subjectKey]: [...current, newSubject.trim()] });
      setNewSubject('');
      showToast('Subject added.');
    } catch {
      // The toast is shown in updateSubjects.
    }
  };

  const ensureGroup = async () => {
    if (!item || !subjectKey) {
      showToast('Select all group details first.');
      return;
    }
    if (item.subjects?.[subjectKey]) {
      showToast('Subject group already exists.');
      return;
    }
    try {
      await updateSubjects({ ...(item.subjects || {}), [subjectKey]: [] });
      showToast('Subject group added.');
    } catch {
      // The toast is shown in updateSubjects.
    }
  };

  const removeSubject = async (groupKey, subject) => {
    const next = {
      ...(item.subjects || {}),
      [groupKey]: (item.subjects?.[groupKey] || []).filter(entry => entry !== subject),
    };
    try {
      await updateSubjects(next);
      showToast('Subject removed.');
    } catch {
      // The toast is shown in updateSubjects.
    }
  };

  const removeGroup = async (groupKey) => {
    if (!confirm(`Delete subject group ${groupKey}?`)) return;
    const next = { ...(item.subjects || {}) };
    delete next[groupKey];
    try {
      await updateSubjects(next);
      showToast('Subject group deleted.');
    } catch {
      // The toast is shown in updateSubjects.
    }
  };

  return (
    <div className="tab-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Subject dropdown data</p>
          <h2 className="tab-title">Subjects</h2>
        </div>
      </div>

      <section className="form-card">
        <div className="form-grid">
          <Field label="Board / university">
            <select
              value={selectedId}
              onChange={event => {
                setSelectedId(event.target.value);
                setSelectedClass('');
                setSelectedStream('');
                setSelectedBranch('');
                setSelectedSemester('');
              }}
            >
              <option value="">Choose board or university</option>
              {academicItems.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </Field>

          {item && !isUniversity && (
            <>
              <Field label="Standard">
                <select value={selectedClass} onChange={event => { setSelectedClass(event.target.value); setSelectedStream(''); }}>
                  <option value="">{isUniversity ? 'Select degree' : 'Select standard'}</option>
                  {((isUniversity ? item.degrees || item.classes : item.classes) || []).map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              {selectedClass === '12th' && (
                <Field label="Stream">
                  <select value={selectedStream} onChange={event => setSelectedStream(event.target.value)}>
                    <option value="">Select stream</option>
                    {(item.streams?.['12th'] || ['Science', 'Commerce', 'Arts']).map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}

          {item && isUniversity && (
            <>
              <Field label="Degree">
                <select
                  value={selectedClass}
                  onChange={event => {
                    setSelectedClass(event.target.value);
                    setSelectedBranch('');
                    setSelectedSemester('');
                  }}
                >
                  <option value="">Select degree</option>
                  {((item.degrees || item.classes) || []).map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              {selectedClass && !noBranchSelected && (
                <Field label="Branch">
                  <select value={selectedBranch} onChange={event => setSelectedBranch(event.target.value)}>
                    <option value="">Select branch</option>
                    {(item.branches || []).map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Semester">
                <select value={selectedSemester} onChange={event => setSelectedSemester(event.target.value)}>
                  <option value="">Select semester</option>
                  {Array.from({ length: Number(item.semesters) || 6 }, (_, index) => String(index + 1))
                    .map(value => <option key={value} value={value}>Semester {value}</option>)}
                </select>
              </Field>
            </>
          )}
        </div>

        {item && (
          <div className="subject-builder">
            <div>
              <span className="muted">Selected subject group</span>
              <div className="subject-key">{subjectKey || 'Select details above'}</div>
            </div>
            <button className="btn-secondary" onClick={ensureGroup} disabled={!subjectKey}>Create group</button>
          </div>
        )}

        {item && subjectKey && (
          <div className="tag-section">
            <label>Add subject to {subjectKey}</label>
            <div className="tag-input-row">
              <input value={newSubject} onChange={event => setNewSubject(event.target.value)} placeholder="Subject name" onKeyDown={event => event.key === 'Enter' && addSubject()} />
              <button className="btn-add-tag" onClick={addSubject}>Add subject</button>
            </div>
            <div className="tags">
              {(item.subjects?.[subjectKey] || []).map(subject => (
                <span key={subject} className="tag tag-subject">{subject}<button onClick={() => removeSubject(subjectKey, subject)}>x</button></span>
              ))}
              {(item.subjects?.[subjectKey] || []).length === 0 && <span className="muted">No subjects in this group yet.</span>}
            </div>
          </div>
        )}
      </section>

      {item && (
        <section className="subjects-overview">
          <div className="panel-header">
            <h3 className="section-title">All subject groups for {item.name}</h3>
          </div>
          {subjectGroups.length === 0 && <div className="empty-table">No subject groups yet.</div>}
          {subjectGroups.map(groupKey => (
            <div key={groupKey} className="subject-group-card">
              <div className="subject-group-top">
                <div className="subject-group-title">{groupKey}</div>
                <button className="btn-delete" onClick={() => removeGroup(groupKey)}>Delete group</button>
              </div>
              <div className="tags">
                {(item.subjects[groupKey] || []).map(subject => (
                  <span key={subject} className="tag tag-subject">{subject}<button onClick={() => removeSubject(groupKey, subject)}>x</button></span>
                ))}
                {(item.subjects[groupKey] || []).length === 0 && <span className="muted">No subjects</span>}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function BranchesTab({ academicItems, showToast, fetchAcademicItems }) {
  const universities = academicItems.filter(item => item.type === 'university');
  const [selectedId, setSelectedId] = useState('');
  const [branchInput, setBranchInput] = useState('');

  const item = universities.find(entry => entry.id === selectedId);

  const updateBranches = async (branches) => {
    if (!item) return;
    try {
      await setDoc(doc(db, 'universities', item.id), { ...item, branches: uniq(branches) }, { merge: true });
      await fetchAcademicItems();
      showToast('Branches updated.');
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  const addBranch = () => {
    if (!item || !branchInput.trim()) return;
    const next = uniq([...(item.branches || []), branchInput]);
    setBranchInput('');
    updateBranches(next);
  };

  const removeBranch = (branch) => {
    if (!item) return;
    updateBranches((item.branches || []).filter(entry => entry !== branch));
  };

  return (
    <div className="tab-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">University branch data</p>
          <h2 className="tab-title">Branches</h2>
        </div>
      </div>

      <section className="form-card">
        <div className="form-grid">
          <Field label="University">
            <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
              <option value="">Select university</option>
              {universities.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </Field>
        </div>

        {item && (
          <TagEditor
            label={`Branches for ${item.name}`}
            value={branchInput}
            setValue={setBranchInput}
            add={addBranch}
            placeholder="Computer Engineering, Finance, Marketing"
            tags={item.branches || []}
            remove={removeBranch}
          />
        )}

        {item && (
          <div className="subject-builder">
            <div>
              <span className="muted">No-branch degrees</span>
              <div className="subject-key">{(item.noBranchDegrees || []).join(', ') || 'None'}</div>
            </div>
            <span className="muted">Manage this from Academic Data.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function SuggestionsTab({ suggestions, academicItems, showToast }) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [form, setForm] = useState(blankPaper);

  const selectedItem = findAcademicItem(academicItems, form.board);
  const isUniversity = selectedItem?.type === 'university';
  const classOptions = (isUniversity ? selectedItem?.degrees : selectedItem?.classes)?.length
    ? (isUniversity ? selectedItem.degrees : selectedItem.classes)
    : isUniversity ? ['Diploma', 'Degree'] : ['10th', '12th'];
  const streamOptions = selectedItem?.streams?.[form.classLevel] || [];
  const subjectOptions = getSubjectsForPaper(selectedItem, form);
  const subjectKey = getSubjectKey(selectedItem, form);
  const needsBranch = isUniversity && !(selectedItem?.noBranchDegrees || []).includes(form.classLevel);

  const pending = suggestions
    .filter(item => item.status !== 'published')
    .sort((a, b) => Number(b.createdAt?.seconds || 0) - Number(a.createdAt?.seconds || 0));
  const published = suggestions.filter(item => item.status === 'published');

  const updateForm = changes => setForm(prev => ({ ...prev, ...changes }));

  const startPublish = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setForm({
      ...blankPaper,
      board: suggestion.universityName || '',
      classLevel: suggestion.degree || '',
      branch: suggestion.department || '',
      semester: suggestion.semester || '',
      title: suggestion.fileName ? `${suggestion.universityName || 'Suggested'} ${suggestion.fileName}` : `${suggestion.universityName || 'Suggested'} paper`,
      viewLink: suggestion.paperLink || suggestion.fileUrl || '',
      downloadLink: suggestion.paperLink || suggestion.fileUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const publish = async () => {
    if (!selectedSuggestion) return;
    if (!form.board || !form.classLevel || !form.title || !form.subject || !form.year) {
      showToast('Fill board, class, subject, year and title before publishing.');
      return;
    }
    if (isUniversity && (!form.semester || (needsBranch && !form.branch))) {
      showToast(needsBranch ? 'Select branch and semester before publishing.' : 'Select semester before publishing.');
      return;
    }

    try {
      const payload = {
        ...form,
        branch: isUniversity && needsBranch ? form.branch : '',
        semester: isUniversity ? String(form.semester) : '',
        stream: !isUniversity ? form.stream : '',
        year: String(form.year),
        sourceSuggestionId: selectedSuggestion.id,
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'papers'), payload);
      await updateDoc(doc(db, 'suggestions', selectedSuggestion.id), {
        status: 'published',
        publishedAt: new Date(),
      });
      showToast('Suggestion published to papers.');
      setSelectedSuggestion(null);
      setForm(blankPaper);
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  const markReviewed = async (suggestion) => {
    try {
      await updateDoc(doc(db, 'suggestions', suggestion.id), { status: 'reviewed', reviewedAt: new Date() });
      showToast('Suggestion marked reviewed.');
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  return (
    <div className="tab-content wide">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Student uploads</p>
          <h2 className="tab-title">Suggestions ({pending.length})</h2>
        </div>
      </div>

      {selectedSuggestion && (
        <section className="form-card">
          <div className="panel-header">
            <div>
              <h3 className="form-title">Publish suggested paper</h3>
              <p className="muted">
                Uploaded by {selectedSuggestion.student?.name || 'student'} for {selectedSuggestion.universityName || '-'}
                {selectedSuggestion.degree ? ` • ${selectedSuggestion.degree}` : ''}
                {selectedSuggestion.department ? ` • ${selectedSuggestion.department}` : ''}
                {selectedSuggestion.semester ? ` • Sem ${selectedSuggestion.semester}` : ''}
              </p>
            </div>
            <a className="link-btn" href={selectedSuggestion.paperLink || selectedSuggestion.fileUrl} target="_blank" rel="noreferrer">View link</a>
          </div>

          <div className="form-grid">
            <Field label="Board / university *">
              <select
                value={form.board}
                onChange={event => updateForm({ board: event.target.value, classLevel: '', branch: '', stream: '', semester: '', subject: '' })}
              >
                <option value="">Select board or university</option>
                {academicItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </Field>

            <Field label={isUniversity ? 'Degree *' : 'Standard / class *'}>
              <select
                value={form.classLevel}
                disabled={!form.board}
                onChange={event => updateForm({ classLevel: event.target.value, branch: '', stream: '', semester: '', subject: '' })}
              >
                <option value="">{isUniversity ? 'Select degree' : 'Select standard'}</option>
                {classOptions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>

            {isUniversity && (
              <>
                {needsBranch && (
                <Field label="Branch *">
                  <select value={form.branch} onChange={event => updateForm({ branch: event.target.value, subject: '' })}>
                    <option value="">Select branch</option>
                    {(selectedItem.branches || []).map(branch => <option key={branch} value={branch}>{branch}</option>)}
                  </select>
                </Field>
                )}

                <Field label="Semester *">
                  <select value={form.semester} onChange={event => updateForm({ semester: event.target.value, subject: '' })}>
                    <option value="">Select semester</option>
                    {Array.from({ length: Number(selectedItem.semesters) || 6 }, (_, index) => String(index + 1))
                      .map(semester => <option key={semester} value={semester}>Semester {semester}</option>)}
                  </select>
                </Field>
              </>
            )}

            {!isUniversity && form.classLevel === '12th' && (
              <Field label="Stream">
                <select value={form.stream} onChange={event => updateForm({ stream: event.target.value, subject: '' })}>
                  <option value="">Select stream</option>
                  {(streamOptions.length ? streamOptions : ['Science', 'Commerce', 'Arts'])
                    .map(stream => <option key={stream} value={stream}>{stream}</option>)}
                </select>
              </Field>
            )}

            <Field label="Subject *" hint={subjectKey ? `Group: ${subjectKey}` : 'Select details above first'}>
              <select
                value={subjectOptions.includes(form.subject) ? form.subject : ''}
                disabled={!subjectKey || subjectOptions.length === 0}
                onChange={event => updateForm({ subject: event.target.value })}
              >
                <option value="">{subjectOptions.length ? 'Select subject' : 'No subjects added yet'}</option>
                {subjectOptions.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <input value={form.subject} onChange={event => updateForm({ subject: event.target.value })} placeholder="Or type a subject manually" />
            </Field>

            <Field label="Year *">
              <input value={form.year} onChange={event => updateForm({ year: event.target.value })} placeholder="2026" />
            </Field>

            <Field label="Paper title *" full>
              <input value={form.title} onChange={event => updateForm({ title: event.target.value })} placeholder="Paper title" />
            </Field>
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setSelectedSuggestion(null); setForm(blankPaper); }}>Cancel</button>
            <button className="btn-primary" onClick={publish}>Publish paper</button>
          </div>
        </section>
      )}

      <section className="panel table-panel">
        <SuggestionsTable suggestions={pending} onPublish={startPublish} onReviewed={markReviewed} />
        {pending.length === 0 && <div className="empty-table">No pending suggestions.</div>}
      </section>

      {published.length > 0 && (
        <section className="panel table-panel">
          <div className="panel-header padded-header">
            <h3 className="section-title">Published suggestions</h3>
          </div>
          <SuggestionsTable suggestions={published.slice(0, 8)} onPublish={null} onReviewed={null} />
        </section>
      )}
    </div>
  );
}

function SuggestionsTable({ suggestions, onPublish, onReviewed }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Contact</th>
            <th>University</th>
            <th>Details</th>
            <th>Link</th>
            <th>Status</th>
            {(onPublish || onReviewed) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {suggestions.map(suggestion => (
            <tr key={suggestion.id}>
              <td className="td-title">{suggestion.student?.name || '-'}</td>
              <td>
                <div>{suggestion.student?.mobileNumber || '-'}</div>
                <div className="muted">{suggestion.student?.email || '-'}</div>
              </td>
              <td>{suggestion.universityName || '-'}</td>
              <td>
                <div>{suggestion.degree || '-'}</div>
                <div className="muted">{suggestion.department || '-'}</div>
                <div className="muted">{suggestion.semester ? `Semester ${suggestion.semester}` : '-'}</div>
              </td>
              <td>
                {suggestion.paperLink || suggestion.fileUrl
                  ? <a className="table-link" href={suggestion.paperLink || suggestion.fileUrl} target="_blank" rel="noreferrer">{suggestion.fileName || 'Open link'}</a>
                  : '-'}
              </td>
              <td><span className="badge badge-muted">{suggestion.status || 'pending'}</span></td>
              {(onPublish || onReviewed) && (
                <td>
                  <div className="action-btns">
                    {onPublish && <button className="btn-edit" onClick={() => onPublish(suggestion)}>Publish</button>}
                    {onReviewed && <button className="btn-secondary" onClick={() => onReviewed(suggestion)}>Reviewed</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, hint, full, children }) {
  return (
    <div className={`form-group ${full ? 'form-full' : ''}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function TagEditor({ label, value, setValue, add, placeholder, tags, remove }) {
  return (
    <div className="tag-section">
      <label>{label}</label>
      <div className="tag-input-row">
        <input value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} onKeyDown={event => event.key === 'Enter' && add()} />
        <button className="btn-add-tag" onClick={add}>Add</button>
      </div>
      <div className="tags">
        {(tags || []).map(tag => (
          <span key={tag} className="tag">{tag}<button onClick={() => remove(tag)}>x</button></span>
        ))}
      </div>
    </div>
  );
}

function BoardBadge({ name }) {
  const color = BOARD_COLORS[name] || '#64748b';
  return <span className="badge custom-badge" style={{ '--badge-color': color }}>{name || '-'}</span>;
}
