import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { api } from "./api";
import { CareAppointmentsPage, NearbyHospitalsPage } from "./pages/CarePages";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("care360-token"),
  );
  const [user, setUser] = useState(null);
  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      signIn: (result) => {
        sessionStorage.setItem("care360-token", result.token);
        setToken(result.token);
        setUser(result.user);
      },
      signOut: () => {
        sessionStorage.removeItem("care360-token");
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function Shell() {
  const { user, setUser, signOut } = useAuth();
  const [profile, setProfile] = useState(user);
  useEffect(() => {
    api("/profile")
      .then((value) => {
        setProfile(value);
        setUser(value);
      })
      .catch(() => signOut());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const links = [
    { to: "/dashboard", label: "Overview", icon: "◫" },
    { to: "/appointments", label: "Appointments", icon: "▦" },
    { to: "/tracker", label: "Health tracker", icon: "⌁" },
    { to: "/assistant", label: "Symptom guide", icon: "✳" },
    { to: "/hospitals", label: "Nearby care", icon: "⌖" },
    { to: "/notifications", label: "Notifications", icon: "♧" },
  ];
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <a className="brand" href="/dashboard">
          <span className="brand-mark">+</span>
          <span>
            care<span className="brand-light">360</span>
            <small>YOUR HEALTH, IN VIEW</small>
          </span>
        </a>
        <div className="nav-label">YOUR SPACE</div>
        <nav className="side-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <span className="support-dot" />
            <strong>Here for your wellbeing</strong>
            <p>Small steps, thoughtful care.</p>
          </div>
          <NavLink className="profile-link" to="/profile">
            <span className="avatar">
              {(profile?.name || "U").slice(0, 1).toUpperCase()}
            </span>
            <span className="profile-copy">
              <strong>{profile?.name || "Your profile"}</strong>
              <small>Personal account</small>
            </span>
            <span className="profile-more">···</span>
          </NavLink>
          <button className="signout" onClick={signOut}>
            Sign out <span>↗</span>
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-eyebrow">CARE360 · PERSONAL HEALTH</span>
            <div className="topbar-date">A little care goes a long way</div>
          </div>
          <NavLink to="/profile" className="topbar-avatar">
            {(profile?.name || "U").slice(0, 1).toUpperCase()}
          </NavLink>
        </header>
        <div className="page-wrap">
          <Outlet context={{ profile, setProfile }} />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthScreen />} />
          <Route
            path="/"
            element={
              <Protected>
                <Shell />
              </Protected>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="appointments" element={<CareAppointmentsPage />} />
            <Route path="tracker" element={<TrackerPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="hospitals" element={<NearbyHospitalsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { token, signIn } = useAuth();
  const navigate = useNavigate();
  if (token) return <Navigate to="/dashboard" replace />;
  const register = mode === "register";
  const change = (event) =>
    setValues({ ...values, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      signIn(result);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-screen">
      <section className="auth-story">
        <div className="auth-story-inner">
          <a className="brand brand-inverse" href="/">
            <span className="brand-mark">+</span>
            <span>
              care<span className="brand-light">360</span>
              <small>YOUR HEALTH, IN VIEW</small>
            </span>
          </a>
          <div className="story-copy">
            <span className="eyebrow-pill">
              <i /> CARE THAT SEES THE WHOLE YOU
            </span>
            <h1>
              Your health,
              <br />
              <em>more connected.</em>
            </h1>
            <p>
              One calm place to keep track of your care, appointments and
              everyday wellbeing.
            </p>
          </div>
          <div className="story-footer">
            <span>Thoughtful tools for your health journey</span>
            <span>01 — 06</span>
          </div>
        </div>
        <div className="story-orbit orbit-one" />
        <div className="story-orbit orbit-two" />
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="mobile-brand">
            <span className="brand-mark">+</span> care
            <span className="brand-light">360</span>
          </div>
          <span className="form-kicker">WELCOME TO CARE360</span>
          <h2>{register ? "Create your account" : "Welcome back"}</h2>
          <p className="muted">
            {register
              ? "Start your personal health space in a moment."
              : "Sign in to pick up where you left off."}
          </p>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label>
                Your name
                <input
                  name="name"
                  value={values.name}
                  onChange={change}
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                  required
                  maxLength="100"
                />{" "}
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={change}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={values.password}
                onChange={change}
                placeholder={
                  register ? "At least 8 characters" : "Your password"
                }
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 8 : undefined}
                maxLength="72"
              />
            </label>
            {error && <div className="notice error-notice">{error}</div>}
            <button
              className="button button-primary full-button"
              disabled={busy}
            >
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              <span>→</span>
            </button>
          </form>
          <div className="switch-auth">
            {register ? "Already have an account?" : "New to Care360?"}{" "}
            <button
              onClick={() => {
                setMode(register ? "login" : "register");
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </div>
          <div className="auth-disclaimer">
            Your health information is only visible to your account.
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tip, setTip] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([api("/dashboard"), api("/tips/today"), api("/appointments")])
      .then(([s, t, a]) => {
        setSummary(s);
        setTip(t);
        setAppointments(
          a
            .filter((item) => ["BOOKED", "PLANNED"].includes(item.status))
            .slice(0, 3),
        );
      })
      .catch((e) => setError(e.message));
  }, []);
  async function callForHelp() {
    setBusy(true);
    setError("");
    const send = (latitude, longitude) =>
      api("/emergency", {
        method: "POST",
        body: JSON.stringify({ latitude, longitude }),
      });
    const call = async (latitude, longitude) => {
      try {
        await send(latitude, longitude);
        window.location.href = "tel:112";
      } catch (e) {
        setError(e.message);
        setBusy(false);
      }
    };
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        (position) => call(position.coords.latitude, position.coords.longitude),
        () => call(null, null),
        { timeout: 7000 },
      );
    else call(null, null);
  }
  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR OVERVIEW</span>
          <h1>
            Good to see you, {user?.name?.split(" ")[0] || "friend"}
            <span className="wave">✳</span>
          </h1>
          <p className="muted">Your health journey, gathered in one place.</p>
        </div>
        <button
          onClick={callForHelp}
          disabled={busy}
          className="button button-emergency"
        >
          <span className="pulse-dot" />
          {busy ? "Connecting…" : "Emergency help"}
          <span>↗</span>
        </button>
      </div>
      {error && <div className="notice error-notice">{error}</div>}
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-kicker">A MOMENT FOR YOURSELF</span>
          <h2>
            Wellbeing is built
            <br />
            one day at a time.
          </h2>
          <p>
            Keep your appointments close, notice your progress and take the next
            small step.
          </p>
          <NavLink to="/tracker" className="hero-link">
            View your health tracker <span>→</span>
          </NavLink>
        </div>
        <div className="hero-photo">
          <img
            src="/images/care-team-consultation.png"
            alt="A doctor speaking with a patient in a calm clinic"
          />
        </div>
        <div className="hero-photo-wash" aria-hidden="true" />
        <div className="hero-index">
          CARE, AT YOUR PACE <span>✳</span>
        </div>
      </section>
      <section className="stats-grid">
        <StatCard
          icon="▦"
          label="Upcoming visits"
          value={summary?.upcomingAppointments ?? "—"}
          note="Appointments ahead"
          tone="mint"
        />
        <StatCard
          icon="⌁"
          label="Health entries"
          value={summary?.metricsRecorded ?? "—"}
          note="Measurements recorded"
          tone="lavender"
        />
        <StatCard
          icon="♧"
          label="New updates"
          value={summary?.unreadNotifications ?? "—"}
          note="Unread notifications"
          tone="peach"
        />
      </section>
      <div className="dashboard-columns">
        <section className="panel upcoming-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">KEEP IN THE LOOP</span>
              <h2>Upcoming appointments</h2>
            </div>
            <NavLink to="/appointments" className="text-link">
              See all <span>→</span>
            </NavLink>
          </div>
          {appointments.length ? (
            appointments.map((a) => (
              <div className="appointment-row" key={a.id}>
                <div className="date-tile">
                  <strong>
                    {new Date(a.appointmentAt).toLocaleDateString(undefined, {
                      day: "2-digit",
                    })}
                  </strong>
                  <small>
                    {new Date(a.appointmentAt).toLocaleDateString(undefined, {
                      month: "short",
                    })}
                  </small>
                </div>
                <div className="appointment-info">
                  <strong>{a.doctorName}</strong>
                  <span>
                    {a.specialty} · {a.clinicName}
                  </span>
                </div>
                <span className="status-chip">Visit plan</span>
              </div>
            ))
          ) : (
            <div className="empty-inline">
              <span className="empty-icon">▦</span>
              <strong>No visits scheduled</strong>
              <span>When you book one, it will show up here.</span>
              <NavLink to="/appointments" className="text-link">
                Plan a visit →
              </NavLink>
            </div>
          )}
        </section>
        <section className="panel tip-panel">
          <div className="tip-icon">✳</div>
          <span className="eyebrow">A SMALL DAILY REMINDER</span>
          <h2>Today's health note</h2>
          <p>
            {tip?.tip ||
              "A little movement, a glass of water, or a few calm minutes can be a good place to start."}
          </p>
          <div className="tip-foot">
            <span>EVERYDAY WELLBEING</span>
            <span>✦</span>
          </div>
        </section>
      </div>
      <div className="quick-title">
        <span className="eyebrow">YOUR NEXT STEP</span>
        <h2>What would help today?</h2>
      </div>
      <div className="quick-grid">
        <QuickLink
          to="/assistant"
          icon="✳"
          title="Explore symptoms"
          text="Get general health information"
        />
        <QuickLink
          to="/hospitals"
          icon="⌖"
          title="Find nearby care"
          text="Browse nearby hospitals & clinics"
        />
        <QuickLink
          to="/tracker"
          icon="⌁"
          title="Log a measurement"
          text="Keep a record of your health"
        />
      </div>
      <p className="medical-note">
        Care360 is an informational tool and does not replace professional
        medical care. In an emergency in India, call 112.
      </p>
    </>
  );
}
function StatCard({ icon, label, value, note, tone }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${tone}`}>{icon}</span>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <small>{note}</small>
      </div>
      <span className="stat-spark">↗</span>
    </div>
  );
}
function QuickLink({ to, icon, title, text }) {
  return (
    <NavLink className="quick-link" to={to}>
      <span className="quick-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <span className="quick-arrow">↗</span>
    </NavLink>
  );
}

function TrackerPage() {
  const [items, setItems] = useState([]);
  const [values, setValues] = useState({
    weightKg: "",
    heightCm: "",
    systolic: "",
    diastolic: "",
    heartRate: "",
    bloodSugar: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = () =>
    api("/metrics")
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    const body = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value === "" ? null : Number(value),
      ]),
    );
    try {
      await api("/metrics", { method: "POST", body: JSON.stringify(body) });
      setValues({
        weightKg: "",
        heightCm: "",
        systolic: "",
        diastolic: "",
        heartRate: "",
        bloodSugar: "",
      });
      setMessage("Your measurement has been saved.");
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <PageHeading
      eyebrow="NOTICE YOUR PROGRESS"
      title="Health tracker"
      intro="Keep a private record of measurements you choose to track."
    >
      <div className="page-grid">
        <section className="panel form-panel">
          <h2>Add a measurement</h2>
          <p className="muted">
            Leave fields blank when you do not have that measurement.
          </p>
          <form className="metric-form" onSubmit={submit}>
            <Field
              label="Weight"
              suffix="kg"
              name="weightKg"
              value={values.weightKg}
              onChange={(e) =>
                setValues({ ...values, weightKg: e.target.value })
              }
              type="number"
              step="0.1"
              min="1"
              max="500"
            />
            <Field
              label="Height"
              suffix="cm"
              name="heightCm"
              value={values.heightCm}
              onChange={(e) =>
                setValues({ ...values, heightCm: e.target.value })
              }
              type="number"
              step="0.1"
              min="20"
              max="260"
            />
            <Field
              label="Blood pressure"
              suffix="mmHg"
              name="systolic"
              value={values.systolic}
              onChange={(e) =>
                setValues({ ...values, systolic: e.target.value })
              }
              type="number"
              min="40"
              max="300"
              placeholder="Systolic"
            />
            <Field
              label="Diastolic pressure"
              suffix="mmHg"
              name="diastolic"
              value={values.diastolic}
              onChange={(e) =>
                setValues({ ...values, diastolic: e.target.value })
              }
              type="number"
              min="20"
              max="200"
              placeholder="Diastolic"
            />
            <Field
              label="Heart rate"
              suffix="bpm"
              name="heartRate"
              value={values.heartRate}
              onChange={(e) =>
                setValues({ ...values, heartRate: e.target.value })
              }
              type="number"
              min="20"
              max="250"
            />
            <Field
              label="Blood sugar"
              suffix="mg/dL"
              name="bloodSugar"
              value={values.bloodSugar}
              onChange={(e) =>
                setValues({ ...values, bloodSugar: e.target.value })
              }
              type="number"
              step="0.1"
              min="1"
              max="2000"
            />
            <Feedback error={error} message={message} />
            <button className="button button-primary">
              Save measurement <span>→</span>
            </button>
          </form>
        </section>
        <section className="panel history-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR RECORD</span>
              <h2>Recent measurements</h2>
            </div>
            <span className="record-count">{items.length} entries</span>
          </div>
          {items.length ? (
            <div className="metric-list">
              {items.map((m) => (
                <div className="metric-row" key={m.id}>
                  <div className="metric-date">
                    <strong>
                      {new Date(m.recordedAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </strong>
                    <small>
                      {new Date(m.recordedAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <div className="metric-values">
                    {m.weightKg != null && (
                      <span>
                        <b>{m.weightKg}</b> kg
                      </span>
                    )}
                    {m.heightCm != null && (
                      <span>
                        <b>{m.heightCm}</b> cm
                      </span>
                    )}
                    {m.systolic != null && (
                      <span>
                        <b>
                          {m.systolic}/{m.diastolic}
                        </b>{" "}
                        mmHg
                      </span>
                    )}
                    {m.heartRate != null && (
                      <span>
                        <b>{m.heartRate}</b> bpm
                      </span>
                    )}
                    {m.bloodSugar != null && (
                      <span>
                        <b>{m.bloodSugar}</b> mg/dL
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="⌁"
              title="Your record starts here"
              text="Your saved measurements will appear here."
            />
          )}
          <p className="medical-note">
            Measurements are user-entered records, not medical advice or
            clinical monitoring.
          </p>
        </section>
      </div>
    </PageHeading>
  );
}

function AssistantPage() {
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api("/symptoms")
      .then((value) => setChoices(value.symptoms))
      .catch((e) => setError(e.message));
  }, []);
  function toggle(value) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
    setResult(null);
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      setResult(
        await api("/symptoms/assess", {
          method: "POST",
          body: JSON.stringify({ symptoms: selected }),
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageHeading
      eyebrow="GENERAL HEALTH INFORMATION"
      title="Symptom guide"
      intro="Share a few symptoms to see general next-step information."
    >
      <div className="assistant-layout">
        <section className="panel assistant-panel">
          <div className="assistant-intro">
            <span className="assistant-mark">✳</span>
            <div>
              <h2>What are you noticing?</h2>
              <p className="muted">
                Choose any symptoms that apply. This guide is for general
                information only.
              </p>
            </div>
          </div>
          <form onSubmit={submit}>
            <div className="symptom-grid">
              {choices.map((choice) => (
                <button
                  type="button"
                  key={choice}
                  onClick={() => toggle(choice)}
                  className={`symptom-chip ${selected.includes(choice) ? "selected" : ""}`}
                  aria-pressed={selected.includes(choice)}
                >
                  {selected.includes(choice) && <span>✓</span>}
                  {choice}
                </button>
              ))}
            </div>
            <Feedback error={error} />
            <button
              className="button button-primary"
              disabled={!selected.length || busy}
            >
              {busy ? "Reviewing…" : "Get general guidance"} <span>→</span>
            </button>
          </form>
          {result && (
            <div
              className={`assessment-result ${result.urgency.includes("Urgent") ? "urgent-result" : ""}`}
            >
              <span className="eyebrow">YOUR NEXT STEP</span>
              <h3>{result.urgency}</h3>
              <p>{result.guidance}</p>
              <div className="assessment-disclaimer">{result.disclaimer}</div>
              {result.urgency.includes("Urgent") && (
                <a className="button button-emergency" href="tel:112">
                  Call 112 <span>↗</span>
                </a>
              )}
            </div>
          )}
        </section>
        <aside className="panel safety-panel">
          <div className="safety-symbol">!</div>
          <span className="eyebrow">PLEASE KEEP IN MIND</span>
          <h2>This is not a diagnosis</h2>
          <p>
            Many different conditions can share the same symptoms. Only a
            qualified healthcare professional can assess your health.
          </p>
          <div className="safety-divider" />
          <strong>Need urgent help?</strong>
          <p>
            For a medical emergency in India, call <a href="tel:112">112</a> or
            go to the nearest emergency department.
          </p>
        </aside>
      </div>
    </PageHeading>
  );
}

function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const load = () =>
    api("/notifications")
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  async function act(id, action) {
    try {
      await api(`/notifications/${id}${action === "read" ? "/read" : ""}`, {
        method: action === "read" ? "PATCH" : "DELETE",
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <PageHeading
      eyebrow="YOUR UPDATES"
      title="Notifications"
      intro="A quiet place for reminders and account updates."
    >
      <section className="panel history-panel">
        <Feedback error={error} />
        {items.length ? (
          <div className="notification-list">
            {items.map((item) => (
              <article
                className={`notification-row ${item.read ? "" : "notification-unread"}`}
                key={item.id}
              >
                <span className="notification-icon">
                  {item.read ? "♧" : "✳"}
                </span>
                <div className="notification-copy">
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </div>
                <div className="notification-actions">
                  {!item.read && (
                    <button onClick={() => act(item.id, "read")}>
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => act(item.id, "delete")}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="♧"
            title="All caught up"
            text="New account reminders will appear here."
          />
        )}
      </section>
    </PageHeading>
  );
}

function ProfilePage() {
  const { profile, setProfile } = useOutletContext();
  const [values, setValues] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(
    () => setValues({ name: profile?.name || "", phone: profile?.phone || "" }),
    [profile],
  );
  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const updated = await api("/profile", {
        method: "PUT",
        body: JSON.stringify(values),
      });
      setProfile(updated);
      setMessage("Your profile has been updated.");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <PageHeading
      eyebrow="YOUR ACCOUNT"
      title="Profile"
      intro="Keep your personal details up to date."
    >
      <section className="panel profile-panel">
        <div className="profile-hero">
          <span className="profile-large-avatar">
            {(profile?.name || "U").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <span className="eyebrow">PERSONAL ACCOUNT</span>
            <h2>{profile?.name || "Your profile"}</h2>
            <p>{profile?.email}</p>
          </div>
        </div>
        <form className="profile-form" onSubmit={submit}>
          <Field
            label="Full name"
            name="name"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            required
            maxLength="100"
          />
          <label>
            Email address
            <input value={profile?.email || ""} disabled />
          </label>
          <Field
            label="Phone number (optional)"
            name="phone"
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            maxLength="30"
            placeholder="Add a contact number"
          />
          <Feedback error={error} message={message} />
          <button className="button button-primary">
            Save changes <span>→</span>
          </button>
        </form>
      </section>
    </PageHeading>
  );
}

function PageHeading({ eyebrow, title, intro, children }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="muted">{intro}</p>
        </div>
      </div>
      {children}
    </>
  );
}
function Field({ label, suffix, ...props }) {
  return (
    <label className="field-label">
      {label}
      <span className="input-wrap">
        <input {...props} />
        {suffix && <small>{suffix}</small>}
      </span>
    </label>
  );
}
function Feedback({ error, message }) {
  return (
    <>
      {error && <div className="notice error-notice">{error}</div>}
      {message && <div className="notice success-notice">{message}</div>}
    </>
  );
}
function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
export default App;
