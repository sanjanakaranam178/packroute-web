import { useState, useEffect, useRef } from "react"
import { initializeApp } from "firebase/app"
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, onAuthStateChanged
} from "firebase/auth"
import {
  getDatabase, ref, set, push, get, onValue, off, update, query, orderByChild, equalTo
} from "firebase/database"

// ─── Firebase Config ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDHp3KlBMxiXZ4Z0XaV8zE2ckUJepAPlXc",
  authDomain: "packroute2.firebaseapp.com",
  databaseURL: "https://packroute2-default-rtdb.firebaseio.com",
  projectId: "packroute2",
  storageBucket: "packroute2.firebasestorage.app",
  messagingSenderId: "95826653113",
  appId: "1:95826653113:android:e9d5e616b6b16537859068"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
} catch (e) {
  app = initializeApp(firebaseConfig, "packroute-" + Date.now());
  auth = getAuth(app);
  db = getDatabase(app);
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  userBlue: "#1a6ef5",
  userBlueDark: "#1255c7",
  agentGreen: "#0f9e6e",
  agentGreenDark: "#0b7a54",
  adminPurple: "#6c3fc8",
  adminPurpleDark: "#4e2d99",
  bg: "#f5f7fb",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a202c",
  textMuted: "#718096",
  danger: "#e53e3e",
  success: "#38a169",
  pending: "#d69e2e",
  accepted: "#3182ce",
  delivered: "#38a169",
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:${C.bg};color:${C.text};}
  .packroute-app{min-height:100vh;display:flex;flex-direction:column;}

  /* Buttons */
  .btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:all .18s;letter-spacing:.01em;}
  .btn:active{transform:scale(.97);}
  .btn-primary{background:${C.userBlue};color:#fff;}
  .btn-primary:hover{background:${C.userBlueDark};}
  .btn-green{background:${C.agentGreen};color:#fff;}
  .btn-green:hover{background:${C.agentGreenDark};}
  .btn-purple{background:${C.adminPurple};color:#fff;}
  .btn-purple:hover{background:${C.adminPurpleDark};}
  .btn-ghost{background:transparent;color:${C.textMuted};border:1.5px solid ${C.border};}
  .btn-ghost:hover{border-color:#aaa;background:#f0f0f0;}
  .btn-danger{background:${C.danger};color:#fff;}
  .btn-danger:hover{background:#c53030;}
  .btn-sm{padding:6px 14px;font-size:13px;}
  .btn-full{width:100%;justify-content:center;}
  .btn:disabled{opacity:.5;cursor:not-allowed;}

  /* Inputs */
  .input{width:100%;padding:11px 14px;border:1.5px solid ${C.border};border-radius:10px;font-size:14px;outline:none;transition:border .15s;background:#fff;}
  .input:focus{border-color:${C.userBlue};}
  .input.green:focus{border-color:${C.agentGreen};}
  .input.purple:focus{border-color:${C.adminPurple};}
  .label{display:block;font-size:13px;font-weight:600;color:${C.textMuted};margin-bottom:5px;letter-spacing:.02em;}
  .field{margin-bottom:16px;}
  select.input{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23718096' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}

  /* Cards */
  .card{background:${C.card};border-radius:16px;border:1px solid ${C.border};padding:24px;box-shadow:0 1px 4px rgba(0,0,0,.05);}
  .card-sm{padding:16px;}

  /* Navigation */
  .nav{background:#fff;border-bottom:1px solid ${C.border};padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
  .nav-brand{font-size:20px;font-weight:800;letter-spacing:-.5px;}
  .nav-brand span{color:${C.userBlue};}
  .nav-actions{display:flex;align-items:center;gap:10px;}

  /* Sidebar + Layout */
  .app-layout{display:flex;min-height:calc(100vh - 60px);}
  .sidebar{width:220px;background:#fff;border-right:1px solid ${C.border};padding:20px 12px;flex-shrink:0;}
  .sidebar-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;color:${C.textMuted};transition:all .15s;margin-bottom:2px;}
  .sidebar-item:hover{background:${C.bg};color:${C.text};}
  .sidebar-item.active{background:#eff6ff;color:${C.userBlue};font-weight:600;}
  .sidebar-item.active.green{background:#f0fdf4;color:${C.agentGreen};}
  .sidebar-item.active.purple{background:#f5f0ff;color:${C.adminPurple};}
  .main-content{flex:1;padding:28px;overflow-y:auto;}

  /* Page Sections */
  .page-title{font-size:24px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px;}
  .page-sub{font-size:14px;color:${C.textMuted};margin-bottom:24px;}
  .section-title{font-size:16px;font-weight:700;margin-bottom:16px;color:${C.text};}

  /* Auth Pages */
  .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:${C.bg};padding:20px;}
  .auth-card{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:36px;border:1px solid ${C.border};box-shadow:0 4px 24px rgba(0,0,0,.07);}
  .auth-logo{font-size:32px;font-weight:900;letter-spacing:-1px;margin-bottom:4px;}
  .auth-logo .s{color:${C.userBlue};}
  .auth-logo .a{color:${C.agentGreen};}
  .auth-logo .d{color:${C.adminPurple};}
  .auth-tagline{font-size:13px;color:${C.textMuted};margin-bottom:28px;}
  .role-tabs{display:flex;background:${C.bg};border-radius:10px;padding:4px;gap:4px;margin-bottom:24px;}
  .role-tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;color:${C.textMuted};}
  .role-tab.active-user{background:${C.userBlue};color:#fff;}
  .role-tab.active-agent{background:${C.agentGreen};color:#fff;}
  .role-tab.active-admin{background:${C.adminPurple};color:#fff;}
  .auth-switch{text-align:center;margin-top:18px;font-size:13px;color:${C.textMuted};}
  .auth-switch a{color:${C.userBlue};cursor:pointer;font-weight:600;text-decoration:none;}
  .auth-switch a:hover{text-decoration:underline;}
  .auth-switch a.green{color:${C.agentGreen};}
  .auth-switch a.purple{color:${C.adminPurple};}

  /* Status badges */
  .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;letter-spacing:.02em;}
  .badge-pending{background:#fef3c7;color:#92400e;}
  .badge-accepted{background:#dbeafe;color:#1e40af;}
  .badge-delivered{background:#d1fae5;color:#065f46;}
  .badge-cancelled{background:#fee2e2;color:#991b1b;}
  .badge-user{background:#eff6ff;color:${C.userBlue};}
  .badge-agent{background:#f0fdf4;color:${C.agentGreen};}

  /* Delivery cards */
  .delivery-card{background:#fff;border:1px solid ${C.border};border-radius:14px;padding:18px;margin-bottom:14px;transition:box-shadow .15s;}
  .delivery-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.09);}
  .delivery-card-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;}
  .delivery-id{font-size:12px;font-weight:700;color:${C.textMuted};letter-spacing:.05em;}
  .delivery-route{display:flex;flex-direction:column;gap:8px;margin-bottom:12px;}
  .route-item{display:flex;align-items:flex-start;gap:10px;font-size:13px;}
  .route-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px;}
  .route-dot.pickup{background:${C.agentGreen};}
  .route-dot.delivery{background:${C.danger};}
  .delivery-meta{display:flex;gap:12px;flex-wrap:wrap;}
  .meta-item{font-size:12px;color:${C.textMuted};}
  .meta-item strong{color:${C.text};}

  /* Stats Grid */
  .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;}
  .stat-card{background:#fff;border:1px solid ${C.border};border-radius:14px;padding:20px;}
  .stat-value{font-size:32px;font-weight:800;letter-spacing:-1px;}
  .stat-label{font-size:13px;color:${C.textMuted};margin-top:2px;}

  /* Chat */
  .chat-wrap{display:flex;flex-direction:column;height:500px;}
  .chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:${C.bg};border-radius:12px 12px 0 0;}
  .chat-msg{max-width:72%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;}
  .chat-msg.user{align-self:flex-end;background:${C.userBlue};color:#fff;border-radius:14px 14px 4px 14px;}
  .chat-msg.agent{align-self:flex-start;background:#fff;color:${C.text};border:1px solid ${C.border};border-radius:14px 14px 14px 4px;}
  .chat-sender{font-size:10px;font-weight:700;letter-spacing:.05em;margin-bottom:3px;opacity:.7;}
  .chat-input-row{display:flex;gap:10px;padding:12px;background:#fff;border:1px solid ${C.border};border-top:none;border-radius:0 0 12px 12px;}
  .chat-input-row .input{margin:0;}

  /* Tables */
  .table-wrap{overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;padding:10px 14px;font-weight:600;color:${C.textMuted};border-bottom:2px solid ${C.border};white-space:nowrap;}
  td{padding:12px 14px;border-bottom:1px solid ${C.border};}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:#f9fafb;}

  /* Charts */
  .bar-chart{display:flex;align-items:flex-end;gap:8px;height:140px;padding:0 4px;}
  .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
  .bar{width:100%;border-radius:6px 6px 0 0;transition:height .4s;}
  .bar-label{font-size:10px;color:${C.textMuted};font-weight:600;}
  .bar-val{font-size:10px;color:${C.text};font-weight:700;}

  /* Misc */
  .toast{position:fixed;bottom:24px;right:24px;background:#1a202c;color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:slideIn .2s ease;}
  @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .divider{border:none;border-top:1px solid ${C.border};margin:20px 0;}
  .empty-state{text-align:center;padding:48px 24px;color:${C.textMuted};}
  .empty-state .icon{font-size:48px;margin-bottom:12px;}
  .empty-state p{font-size:14px;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;}
  .modal{background:#fff;border-radius:20px;padding:28px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto;}
  .modal-title{font-size:18px;font-weight:700;margin-bottom:20px;}
  .terms-text{font-size:12px;line-height:1.7;color:${C.textMuted};max-height:280px;overflow-y:auto;background:${C.bg};padding:14px;border-radius:10px;margin-bottom:16px;}
  .checkbox-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px;}
  .checkbox-row input{margin-top:2px;width:16px;height:16px;flex-shrink:0;}
  .checkbox-row label{font-size:13px;color:${C.textMuted};cursor:pointer;}
  .home-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
  .home-btn{background:#fff;border:1px solid ${C.border};border-radius:16px;padding:24px;cursor:pointer;transition:all .15s;text-align:center;}
  .home-btn:hover{border-color:${C.userBlue};box-shadow:0 4px 16px rgba(26,110,245,.1);}
  .home-btn.green:hover{border-color:${C.agentGreen};box-shadow:0 4px 16px rgba(15,158,110,.1);}
  .home-btn-icon{font-size:32px;margin-bottom:8px;}
  .home-btn-label{font-size:14px;font-weight:600;color:${C.text};}
  .acct-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${C.border};font-size:14px;}
  .acct-row:last-child{border:none;}
  .acct-key{color:${C.textMuted};font-weight:500;}
  .acct-val{font-weight:600;}
  .page-header{display:flex;align-items:center;gap:12px;margin-bottom:24px;}
  .back-btn{background:none;border:none;cursor:pointer;color:${C.textMuted};font-size:18px;padding:4px;border-radius:8px;}
  .back-btn:hover{background:${C.bg};}
  .support-textarea{width:100%;padding:11px 14px;border:1.5px solid ${C.border};border-radius:10px;font-size:14px;outline:none;resize:vertical;min-height:100px;font-family:inherit;}
  .support-textarea:focus{border-color:${C.userBlue};}
  .pie-wrap{display:flex;align-items:center;gap:24px;padding:8px 0;}
  .pie-legend{display:flex;flex-direction:column;gap:8px;}
  .pie-legend-item{display:flex;align-items:center;gap:8px;font-size:13px;}
  .pie-dot{width:12px;height:12px;border-radius:50%;}
  .track-info-row{display:flex;flex-direction:column;gap:10px;padding:16px 0;}
  .track-field{font-size:13px;color:${C.textMuted};}
  .track-field strong{color:${C.text};font-weight:600;}
  .delivered-banner{text-align:center;padding:48px 24px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border-radius:16px;margin-top:20px;}
  .delivered-banner h2{font-size:24px;font-weight:800;color:#065f46;margin-bottom:8px;}
  .delivered-banner p{color:#047857;}
  .map-placeholder{background:linear-gradient(135deg,#e2e8f0,#cbd5e0);border-radius:14px;height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${C.textMuted};font-size:13px;gap:8px;margin-bottom:16px;}
  .map-placeholder .icon{font-size:36px;}
  @media(max-width:768px){
    .sidebar{display:none;}
    .home-grid{grid-template-columns:1fr;}
    .stats-grid{grid-template-columns:1fr 1fr;}
  }
`;

// ─── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  return [toast, showToast];
}

// ─── Auth Context ─────────────────────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(undefined);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { 
        console.log("🔓 User logged out");
        setUser(null); 
        setRole(null); 
        setProfile(null); 
        return; 
      }
      console.log("✅ User logged in, uid:", u.uid);
      setUser(u);
      // Detect role by checking nodes
      const adminSnap = await get(ref(db, `Admins/${u.uid}`));
      if (adminSnap.exists()) { 
        console.log("👑 User is ADMIN");
        setRole("admin"); 
        setProfile(adminSnap.val()); 
        return; 
      }
      const agentSnap = await get(ref(db, `Delivery Agents/${u.uid}`));
      if (agentSnap.exists()) { 
        console.log("🛵 User is AGENT");
        setRole("agent"); 
        setProfile(agentSnap.val()); 
        return; 
      }
      const userSnap = await get(ref(db, `Users/${u.uid}`));
      if (userSnap.exists()) { 
        console.log("👤 User is USER");
        setRole("user"); 
        setProfile(userSnap.val()); 
        return; 
      }
      console.warn("⚠️ User role unknown");
      setRole("unknown");
    });
    return unsub;
  }, []);

  return { user, role, profile };
}

// ─── Terms Text ───────────────────────────────────────────────────────────────
const USER_TERMS = `1. Acceptance of Terms
By signing up and using the PackRoute App, you agree to comply with and be bound by these Terms and Conditions.

2. User Responsibilities
• You are solely responsible for the accuracy of all delivery-related details.
• You must ensure packages comply with applicable laws and regulations.
• You must not send prohibited, illegal, or hazardous items.

3. Prohibited Items
• Illegal drugs, firearms, ammunition, explosives, and other contraband.
• Hazardous materials such as chemicals, flammable substances, or radioactive items.
• Perishable goods requiring specific storage conditions.

4. Delivery Policy
PackRoute aims to provide timely delivery services; delays may occur due to unforeseen circumstances.

5. Privacy
Your information and location details will only be shared with authorized delivery agents.

Contact: support@packroute.com`;

const AGENT_TERMS = `1. Acceptance of Terms
By signing up as a delivery agent on the PackRoute Delivery Application, you agree to comply with these Terms and Conditions.

2. Delivery Agent Responsibilities
• You must have valid identification, vehicle registration, and required licenses.
• You must verify package contents at pickup.
• You are responsible for delivering packages to the correct recipient.

3. Prohibited Items
You must not accept or transport illegal drugs, firearms, hazardous materials, or stolen goods.

4. Insurance and Liability
PackRoute does not provide insurance coverage for packages, your vehicle, or yourself.

5. Privacy
You must not use or disclose user personal information obtained through the PackRoute App for other purposes.

Contact: support@packroute.com`;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, role, profile } = useAuth();
  const [toast, showToast] = useToast();
  const [authView, setAuthView] = useState("login"); // login | register
  const [authRole, setAuthRole] = useState("user"); // user | agent | admin

  if (user === undefined) {
    return (
      <div className="auth-wrap">
        <style>{css}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <div style={{ color: C.textMuted }}>Loading PackRoute Delivery…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <style>{css}</style>
        {toast && <div className="toast">{toast}</div>}
        {authView === "login"
          ? <LoginPage authRole={authRole} setAuthRole={setAuthRole} setView={setAuthView} showToast={showToast} />
          : <RegisterPage authRole={authRole} setAuthRole={setAuthRole} setView={setAuthView} showToast={showToast} />
        }
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      {toast && <div className="toast">{toast}</div>}
      {role === "user" && <UserApp profile={profile} showToast={showToast} uid={user.uid} />}
      {role === "agent" && <AgentApp profile={profile} showToast={showToast} uid={user.uid} />}
      {role === "admin" && <AdminApp profile={profile} showToast={showToast} uid={user.uid} />}
      {role === "unknown" && (
        <div className="auth-wrap">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <p style={{ marginBottom: 16 }}>Account role not recognized.</p>
            <button className="btn btn-ghost" onClick={() => signOut(auth)}>Sign Out</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ authRole, setAuthRole, setView, showToast }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const colorForRole = { user: C.userBlue, agent: C.agentGreen, admin: C.adminPurple };
  const btnClass = { user: "btn-primary", agent: "btn-green", admin: "btn-purple" };
  const activeClass = { user: "active-user", agent: "active-agent", admin: "active-admin" };

  async function handleLogin() {
    if (!email || !pass) { showToast("Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass.trim());
      // Admin role check
      if (authRole === "admin") {
        const snap = await get(ref(db, `Admins/${cred.user.uid}`));
        if (!snap.exists()) {
          await signOut(auth);
          showToast("Admin privileges required.");
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      showToast("Login failed: " + (e.message || "Check credentials"));
    }
    setLoading(false);
  }

  async function handleForgot() {
    if (!email) { showToast("Enter your email first"); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast("Password reset email sent!");
    } catch (e) {
      showToast("Error: " + e.message);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="s">P</span><span>ackRoute</span>
          {authRole === "agent" && <span style={{ color: C.agentGreen }}> Agent</span>}
          {authRole === "admin" && <span style={{ color: C.adminPurple }}> Admin</span>}
        </div>
        <div className="auth-tagline">Delivery made PackRoute ⚡</div>

        <div className="role-tabs">
          {["user", "agent", "admin"].map(r => (
            <div key={r} className={`role-tab ${authRole === r ? activeClass[r] : ""}`} onClick={() => setAuthRole(r)}>
              {r === "user" ? "👤 User" : r === "agent" ? "🛵 Agent" : "🔑 Admin"}
            </div>
          ))}
        </div>

        <div className="field">
          <label className="label">Email</label>
          <input className={`input ${authRole}`} value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@email.com" />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input className={`input ${authRole}`} value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <a style={{ fontSize: 13, color: colorForRole[authRole], cursor: "pointer" }} onClick={handleForgot}>Forgot password?</a>
        </div>
        <button className={`btn ${btnClass[authRole]} btn-full`} onClick={handleLogin} disabled={loading}>
          {loading ? <span className="spinner" /> : "Sign In"}
        </button>
        {authRole !== "admin" && (
          <div className="auth-switch">
            Don't have an account?{" "}
            <a className={authRole === "agent" ? "green" : ""} onClick={() => setView("register")}>
              Register as {authRole}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Register Page ─────────────────────────────────────────────────────────────
function RegisterPage({ authRole, setAuthRole, setView, showToast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", mobile: "", resident: "", registration: "", vehicle: "2-wheeler" });
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const btnClass = authRole === "agent" ? "btn-green" : "btn-primary";
  const terms = authRole === "agent" ? AGENT_TERMS : USER_TERMS;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleRegister() {
    const { name, email, password, mobile } = form;
    if (!name || !email || !password || !mobile) { showToast("Please fill all required fields"); return; }
    if (!agreed) { showToast("Please accept the Terms and Conditions"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      const node = authRole === "agent" ? "Delivery Agents" : "Users";
      const data = authRole === "agent"
        ? { name, email, phone: mobile, password, resident: form.resident, vehicle: form.vehicle, registration: form.registration, role: "agent" }
        : { name, email, phone: "+968" + mobile, password, role: "user" };
      await set(ref(db, `${node}/${uid}`), data);
      showToast("Registration successful! Please sign in.");
      setView("login");
    } catch (e) {
      showToast("Registration failed: " + e.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          Register as{" "}
          <span style={{ color: authRole === "agent" ? C.agentGreen : C.userBlue }}>
            {authRole === "agent" ? "Agent" : "User"}
          </span>
        </div>
        <div className="auth-tagline">Join the PackRoute network</div>

        <div className="role-tabs">
          {["user", "agent"].map(r => (
            <div key={r} className={`role-tab ${authRole === r ? (r === "agent" ? "active-agent" : "active-user") : ""}`} onClick={() => setAuthRole(r)}>
              {r === "user" ? "👤 User" : "🛵 Agent"}
            </div>
          ))}
        </div>

        <div className="field"><label className="label">Full Name *</label><input className={`input ${authRole}`} value={form.name} onChange={set("name")} placeholder="Jane Doe" /></div>
        <div className="field"><label className="label">Email *</label><input className={`input ${authRole}`} value={form.email} onChange={set("email")} type="email" placeholder="you@email.com" /></div>
        <div className="field"><label className="label">Password *</label><input className={`input ${authRole}`} value={form.password} onChange={set("password")} type="password" placeholder="Min 6 characters" /></div>
        <div className="field">
          <label className="label">Mobile {authRole === "user" ? "(after +968)" : ""} *</label>
          <input className={`input ${authRole}`} value={form.mobile} onChange={set("mobile")} placeholder={authRole === "user" ? "9XXXXXXX" : "+968XXXXXXXX"} />
        </div>
        {authRole === "agent" && <>
          <div className="field"><label className="label">Resident ID *</label><input className="input green" value={form.resident} onChange={set("resident")} placeholder="National ID number" /></div>
          <div className="field">
            <label className="label">Vehicle Type *</label>
            <select className="input green" value={form.vehicle} onChange={set("vehicle")}>
              <option value="2-wheeler">2-Wheeler (Bike)</option>
              <option value="4-wheeler">4-Wheeler (Car)</option>
            </select>
          </div>
          <div className="field"><label className="label">Vehicle Registration *</label><input className="input green" value={form.registration} onChange={set("registration")} placeholder="Plate number" /></div>
        </>}

        <div className="checkbox-row">
          <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          <label htmlFor="agree">
            I agree to the{" "}
            <a style={{ color: authRole === "agent" ? C.agentGreen : C.userBlue, cursor: "pointer" }} onClick={() => setShowTerms(true)}>
              Terms and Conditions
            </a>
          </label>
        </div>

        <button className={`btn ${btnClass} btn-full`} onClick={handleRegister} disabled={loading}>
          {loading ? <span className="spinner" /> : "Create Account"}
        </button>
        <div className="auth-switch">
          Already have an account?{" "}
          <a className={authRole === "agent" ? "green" : ""} onClick={() => setView("login")}>Sign in</a>
        </div>
      </div>

      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Terms and Conditions</div>
            <div className="terms-text" style={{ whiteSpace: "pre-wrap" }}>{terms}</div>
            <button className={`btn ${btnClass} btn-full`} onClick={() => setShowTerms(false)}>I Understand</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER APP
// ═══════════════════════════════════════════════════════════════════════════════
function UserApp({ profile, showToast, uid }) {
  const [page, setPage] = useState("home");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [chatDeliveryId, setChatDeliveryId] = useState(null);

  const nav = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "new", label: "New Delivery", icon: "📦" },
    { id: "history", label: "History", icon: "📋" },
    { id: "support", label: "Support", icon: "💬" },
    { id: "account", label: "Account", icon: "👤" },
  ];

  return (
    <div className="packroute-app">
      <nav className="nav">
        <div className="nav-brand"><span>PackRoute</span> Delivery</div>
        <div className="nav-actions">
          <span style={{ fontSize: 13, color: C.textMuted }}>👤 {profile?.name || "User"}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </nav>
      <div className="app-layout">
        <aside className="sidebar">
          {nav.map(n => (
            <div key={n.id} className={`sidebar-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
              <span>{n.icon}</span>{n.label}
            </div>
          ))}
        </aside>
        <main className="main-content">
          {page === "home" && <UserHome profile={profile} setPage={setPage} />}
          {page === "new" && <UserNewDelivery uid={uid} profile={profile} showToast={showToast} setPage={setPage} />}
          {page === "history" && <UserHistory uid={uid} setSelectedDelivery={setSelectedDelivery} setPage={setPage} setChatDeliveryId={setChatDeliveryId} />}
          {page === "tracking" && selectedDelivery && <UserTracking delivery={selectedDelivery} setPage={setPage} showToast={showToast} setChatDeliveryId={setChatDeliveryId} setPage2={setPage} />}
          {page === "chat" && chatDeliveryId && <LiveChat deliveryId={chatDeliveryId} senderType="user" onBack={() => setPage("tracking")} />}
          {page === "support" && <UserSupport uid={uid} profile={profile} showToast={showToast} />}
          {page === "account" && <UserAccount profile={profile} uid={uid} showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

function UserHome({ profile, setPage }) {
  return (
    <div>
      <div className="page-title">Welcome, {profile?.name?.split(" ")[0] || "User"}! 👋</div>
      <div className="page-sub">What would you like to do today?</div>
      <div className="home-grid">
        {[
          { icon: "📦", label: "New Delivery", page: "new" },
          { icon: "📋", label: "Delivery History", page: "history" },
          { icon: "💬", label: "Support", page: "support" },
          { icon: "👤", label: "My Account", page: "account" },
        ].map(b => (
          <div key={b.page} className="home-btn" onClick={() => setPage(b.page)}>
            <div className="home-btn-icon">{b.icon}</div>
            <div className="home-btn-label">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserNewDelivery({ uid, profile, showToast, setPage }) {
  const [form, setForm] = useState({ pickupAddress: "", deliveryAddress: "", pickupPhone: "", deliveryPhone: "", pickupNote: "", deliveryNote: "", packageDetails: "" });
  const [loading, setLoading] = useState(false);
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    // Validate user is logged in
    if (!uid || !profile) { showToast("❌ User session not loaded. Please refresh or log in again."); console.error("Missing uid or profile", { uid, profile }); return; }
    
    for (const v of Object.values(form)) {
      if (!v.trim()) { showToast("Please fill in all fields"); return; }
    }
    setLoading(true);
    try {
      const delRef = ref(db, "Deliveries");
      const newRef = push(delRef);
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}/${today.getFullYear()}`;
      
      const deliveryData = {
        UserID: uid,
        UserName: profile?.name || "",
        UserMobile: profile?.phone || "",
        PickupAddress: form.pickupAddress,
        PickupLatitude: 0,
        PickupLongitude: 0,
        PickupPhone: form.pickupPhone,
        PickupNote: form.pickupNote,
        DeliveryAddress: form.deliveryAddress,
        DeliveryLatitude: 0,
        DeliveryLongitude: 0,
        DeliveryPhone: form.deliveryPhone,
        DeliveryNote: form.deliveryNote,
        PackageDetails: form.packageDetails,
        PackageSize: "Standard",
        Status: "pending",
        AssignedAgent: "",
        AssignedAgentName: "",
        AssignedAgentMobile: "",
        AssignedAgentVehicleType: "",
        AssignedAgentVehicleRegistration: "",
        DeliveryRequestDate: dateStr,
        CreatedAt: Date.now(),
        Timestamp: Date.now(),
      };
      
      console.log("💾 Saving delivery to Firebase:", deliveryData);
      await set(newRef, deliveryData);
      console.log("✅ Delivery saved successfully with ID:", newRef.key);
      
      showToast("Delivery request created! ✅");
      setForm({ pickupAddress: "", deliveryAddress: "", pickupPhone: "", deliveryPhone: "", pickupNote: "", deliveryNote: "", packageDetails: "" });
      
      // Wait a moment for Firebase to sync before navigating
      setTimeout(() => setPage("history"), 500);
    } catch (e) {
      console.error("❌ Firebase save error:", e);
      showToast("Failed: " + (e.message || "Unknown error"));
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-title">New Delivery Request</div>
      <div className="page-sub">Fill in the pickup and delivery details</div>
      <div className="card" style={{ maxWidth: 620 }}>
        <div className="section-title">📍 Pickup Details</div>
        <div className="field"><label className="label">Pickup Address</label><input className="input" value={form.pickupAddress} onChange={s("pickupAddress")} placeholder="Enter pickup address" /></div>
        <div className="field"><label className="label">Pickup Contact Phone</label><input className="input" value={form.pickupPhone} onChange={s("pickupPhone")} placeholder="+968XXXXXXXX" /></div>
        <div className="field"><label className="label">Pickup Note</label><input className="input" value={form.pickupNote} onChange={s("pickupNote")} placeholder="e.g. Ring doorbell, gate code..." /></div>
        <hr className="divider" />
        <div className="section-title">🎯 Delivery Details</div>
        <div className="field"><label className="label">Delivery Address</label><input className="input" value={form.deliveryAddress} onChange={s("deliveryAddress")} placeholder="Enter delivery address" /></div>
        <div className="field"><label className="label">Delivery Contact Phone</label><input className="input" value={form.deliveryPhone} onChange={s("deliveryPhone")} placeholder="+968XXXXXXXX" /></div>
        <div className="field"><label className="label">Delivery Note</label><input className="input" value={form.deliveryNote} onChange={s("deliveryNote")} placeholder="e.g. Leave at door, call recipient..." /></div>
        <hr className="divider" />
        <div className="section-title">📦 Package</div>
        <div className="field"><label className="label">Package Details</label><input className="input" value={form.packageDetails} onChange={s("packageDetails")} placeholder="Describe the package contents and size" /></div>
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>
          {loading ? <span className="spinner" /> : "Create Delivery Request"}
        </button>
      </div>
    </div>
  );
}

function UserHistory({ uid, setSelectedDelivery, setPage, setChatDeliveryId }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    console.log("🔍 UserHistory: Loading deliveries for uid:", uid);
    
    // Get ALL deliveries and filter in code (more reliable than orderByChild index)
    const allDelRef = ref(db, "Deliveries");
    
    const unsub = onValue(allDelRef, snap => {
      const list = [];
      let matchCount = 0;
      
      snap.forEach(c => {
        const d = c.val();
        console.log(`📄 Checking delivery ${c.key}: UserID="${d.UserID}" vs current uid="${uid}"`);
        
        if (d.UserID === uid) {
          matchCount++;
          list.push({ id: c.key, ...d });
          console.log(`✅ MATCH found! Delivery ${c.key}`);
        }
      });
      
      console.log(`\n📦 UserHistory query complete:`);
      console.log(`   Total deliveries in DB: ${snap.size}`);
      console.log(`   Matched to your uid: ${matchCount}`);
      console.log(`   Results:`, list);
      
      setDeliveries(list.reverse());
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("❌ Error fetching deliveries:", error);
      setDebugInfo(`Error: ${error.message}`);
      setLoading(false);
      setRefreshing(false);
    });
    
    return () => off(allDelRef, "value", unsub);
  }, [uid]);

  async function refreshDeliveries() {
    setRefreshing(true);
    console.log("🔄 Manually refreshing deliveries...");
    // The useEffect will re-run automatically if uid changes
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading deliveries…</p></div>;
  
  if (!deliveries.length) return (
    <div>
      <div className="page-title">Delivery History</div>
      <div style={{ backgroundColor: "#fff3cd", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#856404" }}>
        <strong>🔍 Debug Info:</strong><br />
        Your UID: <code>{uid?.slice(0, 16)}...</code><br />
        Deliveries Found: 0<br />
        {debugInfo && <>Status: {debugInfo}<br /></>}
        <strong>Note:</strong> If deliveries still don't show, open browser Console (F12) and look for "✅ MATCH found" messages.
      </div>
      <div className="empty-state">
        <div className="icon">📭</div>
        <p>No deliveries yet. Create your first delivery!</p>
        <button className="btn btn-ghost btn-sm" onClick={refreshDeliveries} style={{ marginTop: 12 }}>
          {refreshing ? <span className="spinner" /> : "🔄 Refresh"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-title">Delivery History</div>
      <div className="page-sub">{deliveries.length} deliveries total
        <button className="btn btn-ghost btn-sm" onClick={refreshDeliveries} style={{ marginLeft: 12 }}>
          {refreshing ? <span className="spinner" /> : "🔄"}
        </button>
      </div>
      {debugInfo && <div style={{ backgroundColor: "#f8d7da", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#721c24" }}>
        ⚠️ {debugInfo}
      </div>}
      {deliveries.map(d => (
        <div key={d.id} className="delivery-card">
          <div className="delivery-card-header">
            <div><div className="delivery-id">#{d.id?.slice(-8).toUpperCase()}</div><div style={{ fontSize: 13, marginTop: 4 }}>{d.DeliveryRequestDate}</div></div>
            <StatusBadge status={d.Status} />
          </div>
          <div className="delivery-route">
            <div className="route-item"><span className="route-dot pickup" /><span><strong>From:</strong> {d.PickupAddress}</span></div>
            <div className="route-item"><span className="route-dot delivery" /><span><strong>To:</strong> {d.DeliveryAddress}</span></div>
          </div>
          <div className="delivery-meta">
            <div className="meta-item">📦 <strong>{d.PackageDetails}</strong></div>
            <div className="meta-item">📊 Status: <strong>{d.Status}</strong></div>
          </div>
          {d.AssignedAgent && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setSelectedDelivery(d); setPage("tracking"); }}>📍 Track</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setChatDeliveryId(d.id); setPage("chat"); }}>💬 Chat</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UserTracking({ delivery, setPage, showToast, setChatDeliveryId }) {
  const [data, setData] = useState(delivery);

  useEffect(() => {
    const r = ref(db, `Deliveries/${delivery.id}`);
    const unsub = onValue(r, snap => { if (snap.exists()) setData({ id: delivery.id, ...snap.val() }); });
    return () => off(r, "value", unsub);
  }, [delivery.id]);

  return (
    <div>
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage("history")}>←</button>
        <div className="page-title" style={{ margin: 0 }}>Tracking</div>
        <StatusBadge status={data.Status} />
      </div>

      {data.Status?.toLowerCase() === "delivered" ? (
        <div className="delivered-banner">
          <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
          <h2>Package Delivered!</h2>
          <p>Your delivery has been completed successfully.</p>
        </div>
      ) : (
        <>
          <div className="map-placeholder">
            <div className="icon">🗺️</div>
            <div>Live map tracking available in the mobile app</div>
            <div style={{ fontSize: 11 }}>Delivery #{data.id?.slice(-8).toUpperCase()}</div>
          </div>
          <div className="card">
            <div className="section-title">Agent Details</div>
            {data.AssignedAgent ? (
              <div className="track-info-row">
                <div className="track-field">👤 <strong>{data.AssignedAgentName || "Assigned"}</strong></div>
                <div className="track-field">📞 <strong>{data.AssignedAgentMobile}</strong></div>
                <div className="track-field">🚗 <strong>{data.AssignedAgentVehicleType}</strong> — {data.AssignedAgentVehicleRegistration}</div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "16px 0" }}><p>Awaiting agent assignment…</p></div>
            )}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="section-title">Delivery Details</div>
            <div className="track-info-row">
              <div className="track-field">📍 From: <strong>{data.PickupAddress}</strong></div>
              <div className="track-field">🎯 To: <strong>{data.DeliveryAddress}</strong></div>
              <div className="track-field">📦 Package: <strong>{data.PackageDetails}</strong></div>
            </div>
          </div>
          {data.AssignedAgent && (
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setChatDeliveryId(data.id); setPage("chat"); }}>
              💬 Chat with Agent
            </button>
          )}
        </>
      )}
    </div>
  );
}

function UserSupport({ uid, profile, showToast }) {
  const [form, setForm] = useState({ subject: "", question: "" });
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!form.subject || !form.question) { showToast("Please fill all fields"); return; }
    setLoading(true);
    try {
      const r = push(ref(db, "User Support"));
      await set(r, { ID: uid, name: profile?.name || "", email: profile?.email || "", subject: form.subject, question: form.question });
      showToast("Support request submitted! ✅");
      setForm({ subject: "", question: "" });
    } catch (e) { showToast("Failed: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-title">Support</div>
      <div className="page-sub">Need help? Send us a message and we'll get back to you.</div>
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="field"><label className="label">Subject</label><input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Delivery issue, Account problem..." /></div>
        <div className="field"><label className="label">Message</label><textarea className="support-textarea" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Describe your issue in detail..." /></div>
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : "Submit Request"}</button>
      </div>
    </div>
  );
}

function UserAccount({ profile, uid, showToast }) {
  const [dbInfo, setDbInfo] = useState(null);
  
  async function checkDatabase() {
    console.log("🔎 Checking Firebase Database...");
    try {
      const allDelRef = ref(db, "Deliveries");
      const snap = await get(allDelRef);
      
      const info = {
        totalDeliveries: snap.size,
        userIds: {},
        statusCounts: {}
      };
      
      snap.forEach(child => {
        const d = child.val();
        const userId = d.UserID || "NO_USER_ID";
        const status = d.Status || "NO_STATUS";
        
        info.userIds[userId] = (info.userIds[userId] || 0) + 1;
        info.statusCounts[status] = (info.statusCounts[status] || 0) + 1;
      });
      
      setDbInfo(info);
      console.log("✅ Database check complete:", info);
      showToast("✅ Database info loaded. Check console.");
    } catch (e) {
      console.error("❌ Database check failed:", e);
      showToast("❌ Error: " + e.message);
    }
  }
  
  const fields = [
    { label: "Name", value: profile?.name },
    { label: "Email", value: profile?.email },
    { label: "Phone", value: profile?.phone },
    { label: "Role", value: profile?.role },
    { label: "User ID", value: uid?.slice(0, 16) + "..." },
  ];
  return (
    <div>
      <div className="page-title">My Account</div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.userBlue, color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            {profile?.name?.[0] || "U"}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.name}</div>
          <span className="badge badge-user">User</span>
        </div>
        {fields.map(f => (
          <div key={f.label} className="acct-row">
            <span className="acct-key">{f.label}</span>
            <span className="acct-val">{f.value || "—"}</span>
          </div>
        ))}
        
        {dbInfo && (
          <>
            <hr className="divider" />
            <div style={{ fontSize: 12, backgroundColor: "#f0f0f0", padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <strong>🔍 Database Info:</strong><br />
              Total Deliveries: {dbInfo.totalDeliveries}<br />
              <br />
              <strong>By Status:</strong><br />
              {Object.entries(dbInfo.statusCounts).map(([status, count]) => (
                <div key={status}>{status}: {count}</div>
              ))}<br />
              <strong>Your Deliveries: {dbInfo.userIds[uid] || 0}</strong>
            </div>
          </>
        )}
        
        <button className="btn btn-ghost btn-sm btn-full" onClick={checkDatabase} style={{ marginBottom: 12 }}>
          🔍 Check Database Info
        </button>
        
        <hr className="divider" />
        <button className="btn btn-danger btn-full" onClick={() => signOut(auth)}>Sign Out</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT APP
// ═══════════════════════════════════════════════════════════════════════════════
function AgentApp({ profile, showToast, uid }) {
  const [page, setPage] = useState("home");
  const [chatDeliveryId, setChatDeliveryId] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);

  const nav = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "available", label: "Available", icon: "📦" },
    { id: "history", label: "History", icon: "📋" },
    { id: "support", label: "Support", icon: "💬" },
    { id: "account", label: "Account", icon: "🛵" },
  ];

  return (
    <div className="packroute-app">
      <nav className="nav">
        <div className="nav-brand"><span style={{ color: C.agentGreen }}>PackRoute</span> Agent</div>
        <div className="nav-actions">
          <span style={{ fontSize: 13, color: C.textMuted }}>🛵 {profile?.name || "Agent"}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </nav>
      <div className="app-layout">
        <aside className="sidebar">
          {nav.map(n => (
            <div key={n.id} className={`sidebar-item ${page === n.id ? "active green" : ""}`} onClick={() => setPage(n.id)}>
              <span>{n.icon}</span>{n.label}
            </div>
          ))}
        </aside>
        <main className="main-content">
          {page === "home" && <AgentHome profile={profile} setPage={setPage} />}
          {page === "available" && <AgentAvailableDeliveries uid={uid} profile={profile} showToast={showToast} setPage={setPage} setActiveDelivery={setActiveDelivery} setChatDeliveryId={setChatDeliveryId} />}
          {page === "navigation" && activeDelivery && <AgentNavigation delivery={activeDelivery} uid={uid} showToast={showToast} setPage={setPage} setChatDeliveryId={setChatDeliveryId} />}
          {page === "history" && <AgentHistory uid={uid} />}
          {page === "chat" && chatDeliveryId && <LiveChat deliveryId={chatDeliveryId} senderType="agent" onBack={() => setPage("navigation")} />}
          {page === "support" && <AgentSupport uid={uid} profile={profile} showToast={showToast} />}
          {page === "account" && <AgentAccount profile={profile} uid={uid} showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

function AgentHome({ profile, setPage }) {
  return (
    <div>
      <div className="page-title">Welcome, Agent {profile?.name?.split(" ")[0]}! 🛵</div>
      <div className="page-sub">Ready to deliver?</div>
      <div className="home-grid">
        {[
          { icon: "📦", label: "Available Deliveries", page: "available" },
          { icon: "📋", label: "Delivery History", page: "history" },
          { icon: "💬", label: "Support", page: "support" },
          { icon: "🛵", label: "My Account", page: "account" },
        ].map(b => (
          <div key={b.page} className="home-btn green" onClick={() => setPage(b.page)}>
            <div className="home-btn-icon">{b.icon}</div>
            <div className="home-btn-label">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentAvailableDeliveries({ uid, profile, showToast, setPage, setActiveDelivery, setChatDeliveryId }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasActive, setHasActive] = useState(null);

  useEffect(() => {
    console.log("🔍 AgentAvailableDeliveries: Checking for uid:", uid);
    
    // Get ALL deliveries and filter in code
    const allDelRef = ref(db, "Deliveries");
    
    const unsub = onValue(allDelRef, snap => {
      let active = null;
      const pendingDeliveries = [];
      
      snap.forEach(c => {
        const d = c.val();
        const status = d.Status?.toLowerCase() || "";
        
        console.log(`📋 Checking delivery ${c.key}: Status="${d.Status}", AssignedAgent="${d.AssignedAgent}"`);
        
        // Check if this agent has an active delivery
        if (d.AssignedAgent === uid && status !== "delivered") {
          console.log(`✅ Found active delivery for agent: ${c.key}`);
          active = { id: c.key, ...d };
        }
        // Collect pending deliveries (not assigned to anyone + pending/ready status)
        else if (!d.AssignedAgent && (status === "pending" || status === "going to deliver" || d.Status === "Going to Deliver")) {
          console.log(`📦 Found pending delivery: ${c.key}`);
          pendingDeliveries.push({ id: c.key, ...d });
        }
      });
      
      console.log(`\n🔍 Agent scan complete:`);
      console.log(`   Active deliveries: ${active ? 1 : 0}`);
      console.log(`   Pending deliveries: ${pendingDeliveries.length}`);
      
      if (active) {
        setHasActive(active);
        setLoading(false);
      } else {
        setHasActive(null);
        setDeliveries(pendingDeliveries);
        setLoading(false);
      }
    }, (error) => {
      console.error("❌ Error fetching deliveries:", error);
      setLoading(false);
    });
    
    return () => unsub();
  }, [uid]);

  async function accept(d) {
    console.log("✅ Agent accepting delivery:", d.id);
    await update(ref(db, `Deliveries/${d.id}`), {
      Status: "accepted",
      AssignedAgent: uid,
      AssignedAgentName: profile?.name || "",
      AssignedAgentMobile: profile?.phone || "",
      AssignedAgentVehicleType: profile?.vehicle || "",
      AssignedAgentVehicleRegistration: profile?.registration || "",
    });
    showToast("Delivery accepted! 🎉");
    setActiveDelivery({ ...d, Status: "accepted", AssignedAgent: uid });
    setPage("navigation");
  }

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Checking deliveries…</p></div>;

  if (hasActive) {
    return (
      <div>
        <div className="page-title">Active Delivery</div>
        <div className="page-sub">You have an ongoing delivery</div>
        <div className="delivery-card" style={{ borderColor: C.agentGreen }}>
          <div className="delivery-card-header">
            <div className="delivery-id">#{hasActive.id?.slice(-8).toUpperCase()}</div>
            <StatusBadge status={hasActive.Status} />
          </div>
          <div className="delivery-route">
            <div className="route-item"><span className="route-dot pickup" /><span><strong>Pickup:</strong> {hasActive.PickupAddress}</span></div>
            <div className="route-item"><span className="route-dot delivery" /><span><strong>Deliver:</strong> {hasActive.DeliveryAddress}</span></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-green btn-sm" onClick={() => { setActiveDelivery(hasActive); setPage("navigation"); }}>📍 Navigate</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setChatDeliveryId(hasActive.id); setPage("chat"); }}>💬 Chat</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Available Deliveries</div>
      <div className="page-sub">{deliveries.length} pending requests</div>
      {deliveries.length === 0 ? (
        <div className="empty-state"><div className="icon">📭</div><p>No pending deliveries right now. Check back soon!</p></div>
      ) : deliveries.map(d => (
        <div key={d.id} className="delivery-card">
          <div className="delivery-card-header">
            <div><div className="delivery-id">#{d.id?.slice(-8).toUpperCase()}</div><div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{d.DeliveryRequestDate}</div></div>
            <StatusBadge status={d.Status} />
          </div>
          <div className="delivery-route">
            <div className="route-item"><span className="route-dot pickup" /><strong>From:</strong>&nbsp;{d.PickupAddress}</div>
            <div className="route-item"><span className="route-dot delivery" /><strong>To:</strong>&nbsp;{d.DeliveryAddress}</div>
          </div>
          <div className="delivery-meta" style={{ marginBottom: 12 }}>
            <div className="meta-item">📦 {d.PackageDetails}</div>
            <div className="meta-item">👤 {d.UserName}</div>
          </div>
          <button className="btn btn-green btn-sm" onClick={() => accept(d)}>✅ Accept Delivery</button>
        </div>
      ))}
    </div>
  );
}

function AgentNavigation({ delivery, uid, showToast, setPage, setChatDeliveryId }) {
  const [data, setData] = useState(delivery);

  useEffect(() => {
    const r = ref(db, `Deliveries/${delivery.id}`);
    const unsub = onValue(r, snap => { if (snap.exists()) setData({ id: delivery.id, ...snap.val() }); });
    return () => off(r, "value", unsub);
  }, [delivery.id]);

  async function updateStatus(status) {
    await update(ref(db, `Deliveries/${delivery.id}`), { Status: status });
    showToast(`Status updated to: ${status}`);
    if (status === "delivered") setPage("history");
  }

  return (
    <div>
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage("available")}>←</button>
        <div className="page-title" style={{ margin: 0 }}>Navigation</div>
        <StatusBadge status={data.Status} />
      </div>
      <div className="map-placeholder">
        <div className="icon">🗺️</div>
        <div>Navigation available in the mobile app</div>
        <div style={{ fontSize: 11 }}>Delivery #{data.id?.slice(-8).toUpperCase()}</div>
      </div>
      <div className="card">
        <div className="section-title">Delivery Info</div>
        <div className="track-info-row">
          <div className="track-field">👤 User: <strong>{data.UserName}</strong> · {data.UserMobile}</div>
          <div className="track-field">📍 Pickup: <strong>{data.PickupAddress}</strong></div>
          <div className="track-field">📞 Pickup Contact: <strong>{data.PickupPhone}</strong></div>
          <div className="track-field">📝 Pickup Note: <strong>{data.PickupNote}</strong></div>
          <div className="track-field">🎯 Delivery: <strong>{data.DeliveryAddress}</strong></div>
          <div className="track-field">📞 Delivery Contact: <strong>{data.DeliveryPhone}</strong></div>
          <div className="track-field">📝 Delivery Note: <strong>{data.DeliveryNote}</strong></div>
          <div className="track-field">📦 Package: <strong>{data.PackageDetails}</strong></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {data.Status === "accepted" && <button className="btn btn-green" onClick={() => updateStatus("in-transit")}>🚗 Mark In Transit</button>}
        {data.Status === "in-transit" && <button className="btn btn-green" onClick={() => updateStatus("delivered")}>✅ Mark Delivered</button>}
        <button className="btn btn-ghost" onClick={() => { setChatDeliveryId(data.id); setPage("chat"); }}>💬 Chat with User</button>
      </div>
    </div>
  );
}

function AgentHistory({ uid }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(ref(db, "Deliveries"), orderByChild("AssignedAgent"), equalTo(uid));
    const unsub = onValue(q, snap => {
      const list = [];
      snap.forEach(c => { const d = c.val(); if (d.Status?.toLowerCase() === "delivered") list.push({ id: c.key, ...d }); });
      setDeliveries(list.reverse());
      setLoading(false);
    });
    return () => off(q, "value", unsub);
  }, [uid]);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;
  if (!deliveries.length) return <div><div className="page-title">Delivery History</div><div className="empty-state"><div className="icon">📭</div><p>No completed deliveries yet.</p></div></div>;

  return (
    <div>
      <div className="page-title">Delivery History</div>
      <div className="page-sub">{deliveries.length} completed</div>
      {deliveries.map(d => (
        <div key={d.id} className="delivery-card">
          <div className="delivery-card-header">
            <div><div className="delivery-id">#{d.id?.slice(-8).toUpperCase()}</div><div style={{ fontSize: 12, color: C.textMuted }}>{d.DeliveryRequestDate}</div></div>
            <StatusBadge status={d.Status} />
          </div>
          <div className="delivery-route">
            <div className="route-item"><span className="route-dot pickup" /><strong>From:</strong>&nbsp;{d.PickupAddress}</div>
            <div className="route-item"><span className="route-dot delivery" /><strong>To:</strong>&nbsp;{d.DeliveryAddress}</div>
          </div>
          <div className="meta-item">👤 {d.UserName} · 📦 {d.PackageDetails}</div>
        </div>
      ))}
    </div>
  );
}

function AgentSupport({ uid, profile, showToast }) {
  const [form, setForm] = useState({ subject: "", question: "" });
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!form.subject || !form.question) { showToast("Please fill all fields"); return; }
    setLoading(true);
    try {
      const r = push(ref(db, "Agent Support"));
      await set(r, { ID: uid, name: profile?.name || "", email: profile?.email || "", subject: form.subject, question: form.question });
      showToast("Support request submitted! ✅");
      setForm({ subject: "", question: "" });
    } catch (e) { showToast("Failed: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-title">Support</div>
      <div className="page-sub">Need help? We're here for you.</div>
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="field"><label className="label">Subject</label><input className="input green" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="What do you need help with?" /></div>
        <div className="field"><label className="label">Message</label><textarea className="support-textarea" style={{ borderColor: C.border }} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Describe your issue..." /></div>
        <button className="btn btn-green btn-full" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : "Submit Request"}</button>
      </div>
    </div>
  );
}

function AgentAccount({ profile, uid, showToast }) {
  const [dbInfo, setDbInfo] = useState(null);
  
  async function checkDatabase() {
    console.log("🔎 Checking Firebase Database (Agent)...");
    try {
      const allDelRef = ref(db, "Deliveries");
      const snap = await get(allDelRef);
      
      const info = {
        totalDeliveries: snap.size,
        pendingDeliveries: 0,
        yourAssignedDeliveries: 0,
        statusCounts: {}
      };
      
      snap.forEach(child => {
        const d = child.val();
        const status = d.Status || "NO_STATUS";
        
        info.statusCounts[status] = (info.statusCounts[status] || 0) + 1;
        
        if (status === "pending") info.pendingDeliveries++;
        if (d.AssignedAgent === uid) info.yourAssignedDeliveries++;
      });
      
      setDbInfo(info);
      console.log("✅ Agent database check complete:", info);
      showToast("✅ Database info loaded. Check console.");
    } catch (e) {
      console.error("❌ Database check failed:", e);
      showToast("❌ Error: " + e.message);
    }
  }
  
  const fields = [
    { label: "Name", value: profile?.name },
    { label: "Email", value: profile?.email },
    { label: "Phone", value: profile?.phone },
    { label: "Vehicle", value: profile?.vehicle },
    { label: "Registration", value: profile?.registration },
    { label: "Resident ID", value: profile?.resident },
    { label: "Agent ID", value: uid?.slice(0, 16) + "..." },
  ];
  return (
    <div>
      <div className="page-title">My Account</div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.agentGreen, color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            {profile?.name?.[0] || "A"}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.name}</div>
          <span className="badge badge-agent">Delivery Agent</span>
        </div>
        {fields.map(f => (
          <div key={f.label} className="acct-row">
            <span className="acct-key">{f.label}</span>
            <span className="acct-val">{f.value || "—"}</span>
          </div>
        ))}
        
        {dbInfo && (
          <>
            <hr className="divider" />
            <div style={{ fontSize: 12, backgroundColor: "#f0f0f0", padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <strong>🔍 Database Info:</strong><br />
              Total Deliveries: {dbInfo.totalDeliveries}<br />
              Pending (Available): {dbInfo.pendingDeliveries}<br />
              Your Assigned: {dbInfo.yourAssignedDeliveries}<br />
              <br />
              <strong>By Status:</strong><br />
              {Object.entries(dbInfo.statusCounts).map(([status, count]) => (
                <div key={status}>{status}: {count}</div>
              ))}
            </div>
          </>
        )}
        
        <button className="btn btn-ghost btn-sm btn-full" onClick={checkDatabase} style={{ marginBottom: 12 }}>
          🔍 Check Database Info
        </button>
        
        <hr className="divider" />
        <button className="btn btn-danger btn-full" onClick={() => signOut(auth)}>Sign Out</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN APP
// ═══════════════════════════════════════════════════════════════════════════════
function AdminApp({ profile, showToast, uid }) {
  const [page, setPage] = useState("home");

  const nav = [
    { id: "home", label: "Dashboard", icon: "🏠" },
    { id: "users", label: "Manage Users", icon: "👥" },
    { id: "agents", label: "Manage Agents", icon: "🛵" },
    { id: "deliveries", label: "Deliveries", icon: "📦" },
    { id: "support", label: "Support", icon: "💬" },
    { id: "insights", label: "Insights", icon: "📊" },
    { id: "reports", label: "Reports", icon: "📄" },
  ];

  return (
    <div className="packroute-app">
      <nav className="nav">
        <div className="nav-brand"><span style={{ color: C.adminPurple }}>PackRoute</span> Admin</div>
        <div className="nav-actions">
          <span style={{ fontSize: 13, color: C.textMuted }}>🔑 Admin</span>
          <button className="btn btn-ghost btn-sm" onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </nav>
      <div className="app-layout">
        <aside className="sidebar">
          {nav.map(n => (
            <div key={n.id} className={`sidebar-item ${page === n.id ? "active purple" : ""}`} onClick={() => setPage(n.id)}>
              <span>{n.icon}</span>{n.label}
            </div>
          ))}
        </aside>
        <main className="main-content">
          {page === "home" && <AdminDashboard setPage={setPage} />}
          {page === "users" && <AdminManageUsers showToast={showToast} />}
          {page === "agents" && <AdminManageAgents showToast={showToast} />}
          {page === "deliveries" && <AdminManageDeliveries showToast={showToast} />}
          {page === "support" && <AdminSupport />}
          {page === "insights" && <AdminInsights />}
          {page === "reports" && <AdminReports showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

function AdminDashboard({ setPage }) {
  const [stats, setStats] = useState({ users: 0, agents: 0, pending: 0, delivered: 0, total: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersSnap, agentsSnap, delivSnap] = await Promise.all([
        get(ref(db, "Users")), get(ref(db, "Delivery Agents")), get(ref(db, "Deliveries"))
      ]);
      let pending = 0, delivered = 0, total = 0;
      delivSnap.forEach(c => { const s = c.val().Status?.toLowerCase(); total++; if (s === "pending") pending++; if (s === "delivered") delivered++; });
      setStats({ users: usersSnap.size || 0, agents: agentsSnap.size || 0, pending, delivered, total });
    };
    fetchStats();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <div className="page-title">Admin Dashboard</div>
      <div className="page-sub">{dateStr}</div>
      <div className="stats-grid">
        {[
          { label: "Users", value: stats.users, color: C.userBlue, icon: "👤" },
          { label: "Agents", value: stats.agents, color: C.agentGreen, icon: "🛵" },
          { label: "Pending", value: stats.pending, color: C.pending, icon: "⏳" },
          { label: "Delivered", value: stats.delivered, color: C.success, icon: "✅" },
          { label: "Total Deliveries", value: stats.total, color: C.adminPurple, icon: "📦" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="home-grid">
        {[
          { icon: "👥", label: "Manage Users", page: "users" },
          { icon: "🛵", label: "Manage Agents", page: "agents" },
          { icon: "📦", label: "All Deliveries", page: "deliveries" },
          { icon: "💬", label: "Support Requests", page: "support" },
          { icon: "📊", label: "App Insights", page: "insights" },
          { icon: "📄", label: "Reports", page: "reports" },
        ].map(b => (
          <div key={b.page} className="home-btn" style={{ borderColor: C.border }} onClick={() => setPage(b.page)}>
            <div className="home-btn-icon">{b.icon}</div>
            <div className="home-btn-label">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminManageUsers({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = ref(db, "Users");
    const unsub = onValue(r, snap => {
      const list = [];
      snap.forEach(c => list.push({ id: c.key, ...c.val() }));
      setUsers(list);
      setLoading(false);
    });
    return () => off(r, "value", unsub);
  }, []);

  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;
    await set(ref(db, `Users/${id}`), null);
    showToast("User removed");
  }

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;
  return (
    <div>
      <div className="page-title">Manage Users</div>
      <div className="page-sub">{users.length} registered users</div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminManageAgents({ showToast }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = ref(db, "Delivery Agents");
    const unsub = onValue(r, snap => {
      const list = [];
      snap.forEach(c => list.push({ id: c.key, ...c.val() }));
      setAgents(list);
      setLoading(false);
    });
    return () => off(r, "value", unsub);
  }, []);

  async function deleteAgent(id) {
    if (!confirm("Remove this agent?")) return;
    await set(ref(db, `Delivery Agents/${id}`), null);
    showToast("Agent removed");
  }

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;
  return (
    <div>
      <div className="page-title">Manage Agents</div>
      <div className="page-sub">{agents.length} registered agents</div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Vehicle</th><th>Plate</th><th>Actions</th></tr></thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td>{a.phone}</td>
                  <td>{a.vehicle}</td>
                  <td>{a.registration}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteAgent(a.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminManageDeliveries({ showToast }) {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = ref(db, "Deliveries");
    const unsub = onValue(r, snap => {
      const list = [];
      snap.forEach(c => list.push({ id: c.key, ...c.val() }));
      setDeliveries(list.reverse());
      setLoading(false);
    });
    return () => off(r, "value", unsub);
  }, []);

  const filtered = filter === "all" ? deliveries : deliveries.filter(d => d.Status?.toLowerCase() === filter);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;
  return (
    <div>
      <div className="page-title">All Deliveries</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "pending", "accepted", "in-transit", "delivered"].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? "btn-purple" : "btn-ghost"}`} onClick={() => setFilter(s)}>
            {s === "all" ? `All (${deliveries.length})` : `${s} (${deliveries.filter(d => d.Status?.toLowerCase() === s).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <div className="empty-state"><div className="icon">📭</div><p>No deliveries match this filter.</p></div> :
        filtered.map(d => (
          <div key={d.id} className="delivery-card">
            <div className="delivery-card-header">
              <div>
                <div className="delivery-id">#{d.id?.slice(-8).toUpperCase()}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{d.DeliveryRequestDate}</div>
              </div>
              <StatusBadge status={d.Status} />
            </div>
            <div className="delivery-route">
              <div className="route-item"><span className="route-dot pickup" /><strong>From:</strong>&nbsp;{d.PickupAddress}</div>
              <div className="route-item"><span className="route-dot delivery" /><strong>To:</strong>&nbsp;{d.DeliveryAddress}</div>
            </div>
            <div className="delivery-meta">
              <div className="meta-item">👤 User: <strong>{d.UserName}</strong></div>
              {d.AssignedAgentName && <div className="meta-item">🛵 Agent: <strong>{d.AssignedAgentName}</strong></div>}
              <div className="meta-item">📦 {d.PackageDetails}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

function AdminSupport() {
  const [userSupport, setUserSupport] = useState([]);
  const [agentSupport, setAgentSupport] = useState([]);

  useEffect(() => {
    onValue(ref(db, "User Support"), snap => { const l = []; snap.forEach(c => l.push({ id: c.key, ...c.val() })); setUserSupport(l); });
    onValue(ref(db, "Agent Support"), snap => { const l = []; snap.forEach(c => l.push({ id: c.key, ...c.val() })); setAgentSupport(l); });
  }, []);

  function SupportList({ items, title }) {
    return (
      <div style={{ marginBottom: 32 }}>
        <div className="section-title">{title} ({items.length})</div>
        {items.length === 0 ? <div className="empty-state" style={{ padding: "20px 0" }}><p>No requests</p></div> :
          items.map(s => (
            <div key={s.id} className="card card-sm" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.subject}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{s.name}</div>
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>{s.question}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.email}</div>
            </div>
          ))
        }
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Support Requests</div>
      <SupportList items={userSupport} title="User Requests" />
      <SupportList items={agentSupport} title="Agent Requests" />
    </div>
  );
}

function AdminInsights() {
  const [data, setData] = useState({ users: 0, agents: 0, monthly: new Array(12).fill(0) });

  useEffect(() => {
    const fetch = async () => {
      const [usSnap, agSnap, delSnap] = await Promise.all([
        get(ref(db, "Users")), get(ref(db, "Delivery Agents")), get(ref(db, "Deliveries"))
      ]);
      const monthly = new Array(12).fill(0);
      delSnap.forEach(c => {
        const d = c.val().DeliveryRequestDate;
        if (d) {
          const parts = d.split("/");
          if (parts.length === 3) { const m = parseInt(parts[1]) - 1; if (m >= 0 && m < 12) monthly[m]++; }
        }
      });
      setData({ users: usSnap.size || 0, agents: agSnap.size || 0, monthly });
    };
    fetch();
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maxVal = Math.max(...data.monthly, 1);
  const total = data.users + data.agents;
  const userPct = total > 0 ? Math.round((data.users / total) * 100) : 0;
  const agentPct = 100 - userPct;

  return (
    <div>
      <div className="page-title">App Insights</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Users vs Agents</div>
          <div className="pie-wrap">
            <svg width={100} height={100} viewBox="0 0 36 36">
              <circle r="15.9" cx="18" cy="18" fill="none" stroke={C.userBlue} strokeWidth="3.2" strokeDasharray={`${userPct} ${100 - userPct}`} strokeDashoffset="25" />
              <circle r="15.9" cx="18" cy="18" fill="none" stroke={C.agentGreen} strokeWidth="3.2" strokeDasharray={`${agentPct} ${100 - agentPct}`} strokeDashoffset={`${25 - userPct}`} />
              <text x="18" y="20.5" textAnchor="middle" fontSize="7" fontWeight="700" fill={C.text}>{total}</text>
            </svg>
            <div className="pie-legend">
              <div className="pie-legend-item"><div className="pie-dot" style={{ background: C.userBlue }} /><span>Users: <strong>{data.users}</strong></span></div>
              <div className="pie-legend-item"><div className="pie-dot" style={{ background: C.agentGreen }} /><span>Agents: <strong>{data.agents}</strong></span></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Delivery Growth (Monthly)</div>
          <div className="bar-chart">
            {data.monthly.map((v, i) => (
              <div key={i} className="bar-col">
                <div className="bar-val">{v || ""}</div>
                <div className="bar" style={{ height: Math.max(4, (v / maxVal) * 100) + "px", background: C.adminPurple }} />
                <div className="bar-label">{months[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminReports({ showToast }) {
  const [monthYear, setMonthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  async function generate() {
    if (!monthYear.match(/^\d{2}\/\d{4}$/)) { showToast("Format: MM/YYYY"); return; }
    setLoading(true);
    const [usSnap, agSnap, delSnap] = await Promise.all([
      get(ref(db, "Users")), get(ref(db, "Delivery Agents")), get(ref(db, "Deliveries"))
    ]);
    let count = 0;
    delSnap.forEach(c => {
      const d = c.val().DeliveryRequestDate;
      if (d) { const parts = d.split("/"); if (parts.length === 3 && `${parts[1]}/${parts[2]}` === monthYear) count++; }
    });
    setReport({ users: usSnap.size || 0, agents: agSnap.size || 0, deliveries: count, month: monthYear });
    setLoading(false);
  }

  function download() {
    const text = `PackRoute Delivery — Monthly Report\nMonth: ${report.month}\nUsers: ${report.users}\nAgents: ${report.agents}\nDeliveries: ${report.deliveries}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `PackRouteReport_${report.month.replace("/", "-")}.txt`; a.click();
    showToast("Report downloaded!");
  }

  return (
    <div>
      <div className="page-title">Generate Reports</div>
      <div className="page-sub">Generate monthly delivery statistics</div>
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="field">
          <label className="label">Month / Year</label>
          <input className="input purple" value={monthYear} onChange={e => setMonthYear(e.target.value)} placeholder="MM/YYYY e.g. 05/2026" />
        </div>
        <button className="btn btn-purple btn-full" onClick={generate} disabled={loading}>{loading ? <span className="spinner" /> : "Generate Report"}</button>

        {report && (
          <div style={{ marginTop: 20 }}>
            <hr className="divider" />
            <div className="section-title">📊 Report — {report.month}</div>
            {[
              { label: "Total Users", value: report.users },
              { label: "Registered Agents", value: report.agents },
              { label: "Deliveries This Month", value: report.deliveries },
            ].map(r => (
              <div key={r.label} className="acct-row">
                <span className="acct-key">{r.label}</span>
                <span className="acct-val" style={{ fontSize: 20, fontWeight: 800 }}>{r.value}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-full" style={{ marginTop: 12 }} onClick={download}>⬇️ Download Report</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE CHAT (shared)
// ═══════════════════════════════════════════════════════════════════════════════
function LiveChat({ deliveryId, senderType, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const accentColor = senderType === "user" ? C.userBlue : C.agentGreen;

  useEffect(() => {
    const r = ref(db, `Chats/${deliveryId}/Messages`);
    const unsub = onValue(r, snap => {
      const list = [];
      snap.forEach(c => list.push({ id: c.key, ...c.val() }));
      list.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(list);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => off(r, "value", unsub);
  }, [deliveryId]);

  async function send() {
    if (!input.trim()) return;
    const r = push(ref(db, `Chats/${deliveryId}/Messages`));
    await set(r, { senderType, message: input.trim(), timestamp: Date.now() });
    setInput("");
  }

  return (
    <div>
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="page-title" style={{ margin: 0 }}>Live Chat</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>#{deliveryId?.slice(-8).toUpperCase()}</div>
      </div>
      <div className="chat-wrap">
        <div className="chat-messages">
          {messages.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "32px 0" }}>No messages yet. Say hello!</div>}
          {messages.map(m => (
            <div key={m.id} className={`chat-msg ${m.senderType}`} style={m.senderType === senderType ? { alignSelf: "flex-end", background: accentColor } : {}}>
              <div className="chat-sender">{m.senderType?.toUpperCase()}</div>
              {m.message}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input className="input" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message…" onKeyDown={e => e.key === "Enter" && send()} />
          <button className="btn" style={{ background: accentColor, color: "#fff" }} onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  const cls = s === "pending" ? "badge-pending" : s === "accepted" ? "badge-accepted" : s === "delivered" ? "badge-delivered" : s === "in-transit" ? "badge-accepted" : "badge-pending";
  return <span className={`badge ${cls}`}>{status || "Unknown"}</span>;
}
