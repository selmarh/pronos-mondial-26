import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase.js";

// ============================================================================
// DONNÉES — Phase de groupes, Coupe du Monde 2026 (calendrier officiel FIFA)
// Tous les horaires sont en HEURE DE PARIS.
// ============================================================================
const GROUPS = {
  A: ["Mexique", "Afrique du Sud", "Corée du Sud", "Rép. tchèque"],
  B: ["Canada", "Bosnie-Herzégovine", "Qatar", "Suisse"],
  C: ["Brésil", "Maroc", "Haïti", "Écosse"],
  D: ["États-Unis", "Paraguay", "Australie", "Turquie"],
  E: ["Allemagne", "Curaçao", "Côte d'Ivoire", "Équateur"],
  F: ["Pays-Bas", "Japon", "Suède", "Tunisie"],
  G: ["Belgique", "Égypte", "Iran", "Nouvelle-Zélande"],
  H: ["Espagne", "Cap-Vert", "Arabie saoudite", "Uruguay"],
  I: ["France", "Sénégal", "Irak", "Norvège"],
  J: ["Argentine", "Algérie", "Autriche", "Jordanie"],
  K: ["Portugal", "RD Congo", "Ouzbékistan", "Colombie"],
  L: ["Angleterre", "Croatie", "Ghana", "Panama"],
};

const FLAGS = {
  Mexique: "🇲🇽", "Afrique du Sud": "🇿🇦", "Corée du Sud": "🇰🇷", "Rép. tchèque": "🇨🇿",
  Canada: "🇨🇦", "Bosnie-Herzégovine": "🇧🇦", Qatar: "🇶🇦", Suisse: "🇨🇭",
  Brésil: "🇧🇷", Maroc: "🇲🇦", Haïti: "🇭🇹", Écosse: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "États-Unis": "🇺🇸", Paraguay: "🇵🇾", Australie: "🇦🇺", Turquie: "🇹🇷",
  Allemagne: "🇩🇪", Curaçao: "🇨🇼", "Côte d'Ivoire": "🇨🇮", Équateur: "🇪🇨",
  "Pays-Bas": "🇳🇱", Japon: "🇯🇵", Suède: "🇸🇪", Tunisie: "🇹🇳",
  Belgique: "🇧🇪", Égypte: "🇪🇬", Iran: "🇮🇷", "Nouvelle-Zélande": "🇳🇿",
  Espagne: "🇪🇸", "Cap-Vert": "🇨🇻", "Arabie saoudite": "🇸🇦", Uruguay: "🇺🇾",
  France: "🇫🇷", Sénégal: "🇸🇳", Irak: "🇮🇶", Norvège: "🇳🇴",
  Argentine: "🇦🇷", Algérie: "🇩🇿", Autriche: "🇦🇹", Jordanie: "🇯🇴",
  Portugal: "🇵🇹", "RD Congo": "🇨🇩", Ouzbékistan: "🇺🇿", Colombie: "🇨🇴",
  Angleterre: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Croatie: "🇭🇷", Ghana: "🇬🇭", Panama: "🇵🇦",
};
const flag = (t) => FLAGS[t] || "⚽";

const FIXTURES = [
  ["A", "Mexique", "Afrique du Sud", "2026-06-11T21:00", "Mexico 🇲🇽"],
  ["A", "Corée du Sud", "Rép. tchèque", "2026-06-12T04:00", "Guadalajara 🇲🇽"],
  ["A", "Rép. tchèque", "Afrique du Sud", "2026-06-18T18:00", "Atlanta 🇺🇸"],
  ["A", "Mexique", "Corée du Sud", "2026-06-19T03:00", "Guadalajara 🇲🇽"],
  ["A", "Rép. tchèque", "Mexique", "2026-06-25T03:00", "Mexico 🇲🇽"],
  ["A", "Afrique du Sud", "Corée du Sud", "2026-06-25T03:00", "Monterrey 🇲🇽"],
  ["B", "Canada", "Bosnie-Herzégovine", "2026-06-12T21:00", "Toronto 🇨🇦"],
  ["B", "Qatar", "Suisse", "2026-06-13T21:00", "Santa Clara 🇺🇸"],
  ["B", "Suisse", "Bosnie-Herzégovine", "2026-06-18T21:00", "Inglewood 🇺🇸"],
  ["B", "Canada", "Qatar", "2026-06-19T00:00", "Vancouver 🇨🇦"],
  ["B", "Suisse", "Canada", "2026-06-24T21:00", "Vancouver 🇨🇦"],
  ["B", "Bosnie-Herzégovine", "Qatar", "2026-06-24T21:00", "Seattle 🇺🇸"],
  ["C", "Brésil", "Maroc", "2026-06-14T00:00", "New York 🇺🇸"],
  ["C", "Haïti", "Écosse", "2026-06-14T03:00", "Foxborough 🇺🇸"],
  ["C", "Brésil", "Haïti", "2026-06-20T00:00", "Foxborough 🇺🇸"],
  ["C", "Écosse", "Maroc", "2026-06-20T03:00", "Philadelphie 🇺🇸"],
  ["C", "Écosse", "Brésil", "2026-06-25T00:00", "Miami 🇺🇸"],
  ["C", "Maroc", "Haïti", "2026-06-25T00:00", "Atlanta 🇺🇸"],
  ["D", "États-Unis", "Paraguay", "2026-06-13T03:00", "Inglewood 🇺🇸"],
  ["D", "Australie", "Turquie", "2026-06-14T06:00", "Vancouver 🇨🇦"],
  ["D", "Turquie", "Paraguay", "2026-06-20T06:00", "Santa Clara 🇺🇸"],
  ["D", "États-Unis", "Australie", "2026-06-19T21:00", "Seattle 🇺🇸"],
  ["D", "Turquie", "États-Unis", "2026-06-26T04:00", "Inglewood 🇺🇸"],
  ["D", "Paraguay", "Australie", "2026-06-26T04:00", "Santa Clara 🇺🇸"],
  ["E", "Allemagne", "Curaçao", "2026-06-14T19:00", "Houston 🇺🇸"],
  ["E", "Côte d'Ivoire", "Équateur", "2026-06-15T01:00", "Philadelphie 🇺🇸"],
  ["E", "Allemagne", "Côte d'Ivoire", "2026-06-20T22:00", "Toronto 🇨🇦"],
  ["E", "Équateur", "Curaçao", "2026-06-21T02:00", "Kansas City 🇺🇸"],
  ["E", "Équateur", "Allemagne", "2026-06-25T22:00", "New York 🇺🇸"],
  ["E", "Curaçao", "Côte d'Ivoire", "2026-06-25T22:00", "Philadelphie 🇺🇸"],
  ["F", "Pays-Bas", "Japon", "2026-06-14T22:00", "Arlington 🇺🇸"],
  ["F", "Suède", "Tunisie", "2026-06-15T04:00", "Monterrey 🇲🇽"],
  ["F", "Pays-Bas", "Suède", "2026-06-20T19:00", "Houston 🇺🇸"],
  ["F", "Tunisie", "Japon", "2026-06-21T06:00", "Monterrey 🇲🇽"],
  ["F", "Tunisie", "Pays-Bas", "2026-06-26T01:00", "Kansas City 🇺🇸"],
  ["F", "Japon", "Suède", "2026-06-26T01:00", "Arlington 🇺🇸"],
  ["G", "Belgique", "Égypte", "2026-06-15T21:00", "Seattle 🇺🇸"],
  ["G", "Iran", "Nouvelle-Zélande", "2026-06-16T03:00", "Inglewood 🇺🇸"],
  ["G", "Belgique", "Iran", "2026-06-21T21:00", "Inglewood 🇺🇸"],
  ["G", "Nouvelle-Zélande", "Égypte", "2026-06-22T03:00", "Vancouver 🇨🇦"],
  ["G", "Nouvelle-Zélande", "Belgique", "2026-06-27T05:00", "Seattle 🇺🇸"],
  ["G", "Égypte", "Iran", "2026-06-27T05:00", "Vancouver 🇨🇦"],
  ["H", "Espagne", "Cap-Vert", "2026-06-15T18:00", "Atlanta 🇺🇸"],
  ["H", "Arabie saoudite", "Uruguay", "2026-06-16T00:00", "Miami 🇺🇸"],
  ["H", "Espagne", "Arabie saoudite", "2026-06-21T18:00", "Atlanta 🇺🇸"],
  ["H", "Uruguay", "Cap-Vert", "2026-06-22T00:00", "Miami 🇺🇸"],
  ["H", "Uruguay", "Espagne", "2026-06-27T02:00", "Houston 🇺🇸"],
  ["H", "Cap-Vert", "Arabie saoudite", "2026-06-27T02:00", "Guadalajara 🇲🇽"],
  ["I", "France", "Sénégal", "2026-06-16T21:00", "New York 🇺🇸"],
  ["I", "Irak", "Norvège", "2026-06-17T00:00", "Foxborough 🇺🇸"],
  ["I", "France", "Irak", "2026-06-22T23:00", "Philadelphie 🇺🇸"],
  ["I", "Norvège", "Sénégal", "2026-06-23T02:00", "New York 🇺🇸"],
  ["I", "Norvège", "France", "2026-06-26T21:00", "Foxborough 🇺🇸"],
  ["I", "Sénégal", "Irak", "2026-06-26T21:00", "Toronto 🇨🇦"],
  ["J", "Argentine", "Algérie", "2026-06-17T03:00", "Kansas City 🇺🇸"],
  ["J", "Autriche", "Jordanie", "2026-06-17T06:00", "Santa Clara 🇺🇸"],
  ["J", "Argentine", "Autriche", "2026-06-22T19:00", "Arlington 🇺🇸"],
  ["J", "Jordanie", "Algérie", "2026-06-23T05:00", "Santa Clara 🇺🇸"],
  ["J", "Jordanie", "Argentine", "2026-06-28T04:00", "Kansas City 🇺🇸"],
  ["J", "Algérie", "Autriche", "2026-06-28T04:00", "Arlington 🇺🇸"],
  ["K", "Portugal", "RD Congo", "2026-06-17T19:00", "Houston 🇺🇸"],
  ["K", "Ouzbékistan", "Colombie", "2026-06-18T04:00", "Mexico 🇲🇽"],
  ["K", "Portugal", "Ouzbékistan", "2026-06-23T19:00", "Houston 🇺🇸"],
  ["K", "Colombie", "RD Congo", "2026-06-24T04:00", "Guadalajara 🇲🇽"],
  ["K", "Colombie", "Portugal", "2026-06-28T01:30", "Miami 🇺🇸"],
  ["K", "RD Congo", "Ouzbékistan", "2026-06-28T01:30", "Atlanta 🇺🇸"],
  ["L", "Angleterre", "Croatie", "2026-06-17T22:00", "Arlington 🇺🇸"],
  ["L", "Ghana", "Panama", "2026-06-18T01:00", "Toronto 🇨🇦"],
  ["L", "Angleterre", "Ghana", "2026-06-23T22:00", "Foxborough 🇺🇸"],
  ["L", "Panama", "Croatie", "2026-06-24T01:00", "Toronto 🇨🇦"],
  ["L", "Panama", "Angleterre", "2026-06-27T23:00", "New York 🇺🇸"],
  ["L", "Croatie", "Ghana", "2026-06-27T23:00", "Philadelphie 🇺🇸"],
];

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function formatKickoff(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return {
    long: `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`,
    time: `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`,
    ts: d.getTime(),
  };
}

function buildMatches() {
  return FIXTURES.map(([group, home, away, kickoff, venue], i) => ({
    id: `M${i + 1}`, group, home, away, kickoff: kickoff || null, venue: venue || null,
  }));
}
const MATCHES = buildMatches();
const KICKOFF_BY_ID = Object.fromEntries(MATCHES.map((m) => [m.id, m.kickoff]));

// Matchs diffusés en clair sur M6 (à compléter quand M6 publie la liste)
const M6_MATCHES = new Set(["M1", "M49", "M51", "M53"]);
function channelsFor(id) {
  return M6_MATCHES.has(id) ? ["M6", "beIN Sports"] : ["beIN Sports"];
}

// Scoring
function scorePrediction(pred, actual) {
  if (!actual || actual.h == null || actual.a == null) return null;
  if (!pred || pred.h == null || pred.a == null) return 0;
  const ph = +pred.h, pa = +pred.a, ah = +actual.h, aa = +actual.a;
  if (ph === ah && pa === aa) return 10;
  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  const predRes = sign(ph - pa), actRes = sign(ah - aa);
  let pts = 0;
  if (predRes === actRes) pts += 5;
  if (ph - pa === ah - aa) pts += 3;
  return Math.min(pts, 8);
}

// ============================================================================
// APP — racine, gère la session utilisateur
// ============================================================================
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // récupère la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    // écoute les changements (connexion/déconnexion)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data);
    setLoading(false);
  }

  if (loading) {
    return <Shell><p style={{ textAlign: "center", padding: 60, color: MUTE }}>Chargement…</p></Shell>;
  }

  if (!session) return <AuthScreen />;
  if (!profile) return <PseudoScreen userId={session.user.id} onDone={loadProfile} />;
  return <Game session={session} profile={profile} />;
}

// ============================================================================
// AUTH SCREEN — connexion / inscription
// ============================================================================
function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit() {
    setMsg(null);
    if (!email.trim() || password.length < 6) {
      setMsg({ type: "err", text: "Email valide et mot de passe d'au moins 6 caractères requis." });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({ type: "ok", text: "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis reviens te connecter." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setMsg({ type: "err", text: traduireErreur(e.message) });
    }
    setBusy(false);
  }

  return (
    <Shell>
      <div style={s.loginWrap}>
        <div style={s.ball}>⚽</div>
        <h1 style={s.loginTitle}>Pronos<br /><span style={{ color: ACCENT }}>Mondial 26</span></h1>
        <p style={s.loginSub}>
          {mode === "signup" ? "Crée ton compte pour participer" : "Connecte-toi pour jouer"}
        </p>
        <input style={s.bigInput} placeholder="Email" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={s.bigInput} placeholder="Mot de passe (min. 6 caractères)" type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        <button style={{ ...s.cta, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>
          {busy ? "..." : (mode === "signup" ? "Créer mon compte" : "Se connecter")}
        </button>
        {msg && <div style={msg.type === "ok" ? s.alertOk : s.alertErr}>{msg.text}</div>}
        <button style={s.switchMode} onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMsg(null); }}>
          {mode === "signup" ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
        </button>
      </div>
    </Shell>
  );
}

function traduireErreur(msg) {
  if (!msg) return "Une erreur est survenue.";
  if (msg.includes("Invalid login")) return "Email ou mot de passe incorrect.";
  if (msg.includes("already registered")) return "Cet email a déjà un compte. Utilise « Se connecter ».";
  if (msg.includes("Email not confirmed")) return "Vérifie ta boîte mail pour confirmer ton adresse.";
  return msg;
}

// ============================================================================
// PSEUDO SCREEN — choisir un pseudo au premier login
// ============================================================================
function PseudoScreen({ userId, onDone }) {
  const [pseudo, setPseudo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function save() {
    setErr(null);
    if (pseudo.trim().length < 2) { setErr("Pseudo trop court."); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").insert({ id: userId, pseudo: pseudo.trim() });
    setBusy(false);
    if (error) {
      if (error.message.includes("duplicate")) setErr("Ce pseudo est déjà pris.");
      else setErr(error.message);
      return;
    }
    onDone(userId);
  }

  return (
    <Shell>
      <div style={s.loginWrap}>
        <div style={s.ball}>👋</div>
        <h1 style={s.loginTitle}>Bienvenue !</h1>
        <p style={s.loginSub}>Choisis un pseudo qui apparaîtra dans le classement.</p>
        <input style={s.bigInput} placeholder="Ton pseudo" value={pseudo}
          onChange={(e) => setPseudo(e.target.value)} maxLength={20}
          onKeyDown={(e) => e.key === "Enter" && save()} />
        <button style={s.cta} disabled={busy} onClick={save}>
          {busy ? "..." : "C'est parti →"}
        </button>
        {err && <div style={s.alertErr}>{err}</div>}
      </div>
    </Shell>
  );
}

// ============================================================================
// GAME — l'app principale, une fois connecté avec un pseudo
// ============================================================================
function Game({ session, profile }) {
  const [tab, setTab] = useState("matchs");
  const [adminOn, setAdminOn] = useState(false);
  const [groupFilter, setGroupFilter] = useState("I");
  const [allPredictions, setAllPredictions] = useState([]); // toutes les lignes de la table
  const [results, setResults] = useState({}); // {matchId: {h, a}}
  const [profiles, setProfiles] = useState({}); // {userId: pseudo}
  const [myPreds, setMyPreds] = useState({}); // {matchId: {h, a}}
  const [saved, setSaved] = useState(false);
  const userId = session.user.id;

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [preds, res, profs] = await Promise.all([
      supabase.from("predictions").select("*"),
      supabase.from("results").select("*"),
      supabase.from("profiles").select("id, pseudo"),
    ]);
    setAllPredictions(preds.data || []);
    const resMap = {};
    (res.data || []).forEach((r) => { resMap[r.match_id] = { h: r.home_score, a: r.away_score }; });
    setResults(resMap);
    const profMap = {};
    (profs.data || []).forEach((p) => { profMap[p.id] = p.pseudo; });
    setProfiles(profMap);
    const mine = {};
    (preds.data || []).filter((p) => p.user_id === userId).forEach((p) => {
      mine[p.match_id] = { h: p.home_score, a: p.away_score };
    });
    setMyPreds(mine);
  }

  function setPred(matchId, side, val) {
    const ko = KICKOFF_BY_ID[matchId];
    if (ko && Date.now() >= new Date(ko).getTime()) return;
    const clean = val === "" ? null : Math.max(0, Math.min(20, parseInt(val) || 0));
    setMyPreds((m) => ({ ...m, [matchId]: { ...(m[matchId] || {}), [side]: clean } }));
  }

  async function savePreds() {
    // upsert toutes les prédictions de l'utilisateur
    const rows = Object.entries(myPreds)
      .filter(([_, v]) => v.h != null || v.a != null)
      .map(([match_id, v]) => ({
        user_id: userId, match_id, home_score: v.h, away_score: v.a,
      }));
    if (rows.length === 0) return;
    const { error } = await supabase.from("predictions").upsert(rows);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      loadData();
    } else {
      alert("Erreur : " + error.message);
    }
  }

  function setResult(matchId, side, val) {
    const clean = val === "" ? null : Math.max(0, Math.min(20, parseInt(val) || 0));
    setResults((r) => ({ ...r, [matchId]: { ...(r[matchId] || {}), [side]: clean } }));
  }

  async function saveResults() {
    const rows = Object.entries(results)
      .filter(([_, v]) => v.h != null || v.a != null)
      .map(([match_id, v]) => ({ match_id, home_score: v.h, away_score: v.a }));
    if (rows.length === 0) return;
    const { error } = await supabase.from("results").upsert(rows);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      loadData();
    } else alert("Erreur : " + error.message);
  }

  // Classement
  const leaderboard = useMemo(() => {
    const byUser = {};
    allPredictions.forEach((p) => {
      const key = p.user_id;
      if (!byUser[key]) byUser[key] = {};
      byUser[key][p.match_id] = { h: p.home_score, a: p.away_score };
    });
    const rows = Object.keys(byUser).map((uid) => {
      let pts = 0, exact = 0, good = 0, played = 0;
      MATCHES.forEach((m) => {
        const sc = scorePrediction(byUser[uid][m.id], results[m.id]);
        if (sc != null) {
          played++; pts += sc;
          if (sc === 10) exact++; else if (sc >= 3) good++;
        }
      });
      return { uid, pseudo: profiles[uid] || "?", pts, exact, good, played };
    });
    return rows.sort((a, b) => b.pts - a.pts || b.exact - a.exact);
  }, [allPredictions, results, profiles]);

  const totalPlayed = Object.values(results).filter((r) => r?.h != null && r?.a != null).length;
  const myScore = leaderboard.find((r) => r.uid === userId)?.pts || 0;

  return (
    <Shell>
      <div style={s.header}>
        <div>
          <div style={s.logo}>Pronos <span style={{ color: ACCENT }}>Mondial 26</span></div>
          <div style={s.hello}>Salut <b>{profile.pseudo}</b> 👋</div>
        </div>
        <div style={s.headerStats}>
          <div style={s.statPill}><b>{myScore}</b> pts</div>
          <div style={s.statPillGhost}>{totalPlayed}/72 joués</div>
        </div>
      </div>

      <div style={s.tabs}>
        {[["matchs", "⚽ Matchs"], ["classement", "🏆 Classement"], ["regles", "📖 Règles"], ["admin", "🔧 Résultats"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...s.tab, ...(tab === k ? s.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "matchs" && (
        <>
          <div style={s.groupBar}>
            {Object.keys(GROUPS).map((g) => (
              <button key={g} onClick={() => setGroupFilter(g)}
                style={{ ...s.groupChip, ...(groupFilter === g ? s.groupChipActive : {}) }}>{g}</button>
            ))}
          </div>
          <div style={s.groupHeading}>
            Groupe {groupFilter}
            <span style={s.groupTeams}>{GROUPS[groupFilter].map((t) => `${flag(t)} ${t}`).join("  ·  ")}</span>
          </div>
          {MATCHES.filter((m) => m.group === groupFilter).map((m) => {
            const p = myPreds[m.id] || {};
            const res = results[m.id];
            const pts = scorePrediction(p, res);
            const ko = formatKickoff(m.kickoff);
            const locked = ko ? Date.now() >= ko.ts : false;
            return (
              <div key={m.id} style={{ ...s.matchCard, ...(locked ? s.matchCardLocked : {}) }}>
                <div style={s.koLine}>
                  <span style={s.koDate}>🗓️ {ko ? `${ko.long} · ${ko.time}` : "Date à confirmer"}</span>
                  {locked ? <span style={s.lockTag}>🔒 Pronos fermés</span>
                    : ko && <span style={s.koTz}>heure FR</span>}
                </div>
                <div style={s.channelLine}>
                  {channelsFor(m.id).map((ch) => (
                    <span key={ch} style={ch === "M6" ? s.chanClear : s.chanPay}>📺 {ch}</span>
                  ))}
                  {m.venue && <span style={s.venue}>📍 {m.venue}</span>}
                </div>
                <div style={s.matchTeams}>
                  <span style={s.team}><span style={s.flag}>{flag(m.home)}</span>{m.home}</span>
                  <div style={s.scoreInputs}>
                    <input type="number" min="0" max="20" value={p.h ?? ""} disabled={locked}
                      onChange={(e) => setPred(m.id, "h", e.target.value)}
                      style={{ ...s.scoreInput, ...(locked ? s.scoreInputLocked : {}) }} />
                    <span style={s.vs}>—</span>
                    <input type="number" min="0" max="20" value={p.a ?? ""} disabled={locked}
                      onChange={(e) => setPred(m.id, "a", e.target.value)}
                      style={{ ...s.scoreInput, ...(locked ? s.scoreInputLocked : {}) }} />
                  </div>
                  <span style={{ ...s.team, justifyContent: "flex-end" }}>{m.away}<span style={s.flag}>{flag(m.away)}</span></span>
                </div>
                {res?.h != null && (
                  <div style={s.resultLine}>
                    Résultat réel : <b>{res.h} — {res.a}</b>
                    {pts != null && <span style={{ ...s.ptsBadge, background: pts >= 10 ? GOLD : pts >= 5 ? "#8FD694" : pts > 0 ? "#cde" : "#eee" }}>+{pts} pts</span>}
                  </div>
                )}
              </div>
            );
          })}
          <div style={s.saveBar}>
            <button style={s.cta} onClick={savePreds}>💾 Enregistrer mes pronos</button>
            {saved && <span style={s.savedMsg}>✓ Enregistré !</span>}
          </div>
        </>
      )}

      {tab === "classement" && (
        <div>
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: "center", padding: 30, color: MUTE, fontWeight: 500 }}>Aucun prono enregistré pour l'instant.</p>
          ) : (
            <>
              <div style={s.lbHeader}>
                <div style={s.lbColRank}>#</div>
                <div style={s.lbColName}>Joueur</div>
                <div style={s.lbColStat}>Exact</div>
                <div style={s.lbColStat}>Bon</div>
                <div style={s.lbColPts}>Pts</div>
              </div>
              {leaderboard.map((row, i) => (
                <div key={row.uid} style={{ ...s.lbRow, ...(row.uid === userId ? s.lbMe : {}) }}>
                  <div style={{ ...s.lbColRank, ...s.rank, ...(i === 0 ? s.rankGold : i === 1 ? s.rankSilver : i === 2 ? s.rankBronze : {}) }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div style={s.lbColName}>
                    <div style={s.lbName}>{row.pseudo}{row.uid === userId && " (toi)"}</div>
                    <div style={s.lbDetail}>{row.played} joués</div>
                  </div>
                  <div style={s.lbColStat}><span style={s.lbStatVal}>{row.exact}</span></div>
                  <div style={s.lbColStat}><span style={s.lbStatVal}>{row.good}</span></div>
                  <div style={s.lbColPts}><span style={s.lbPts}>{row.pts}</span></div>
                </div>
              ))}
              <p style={s.lbLegend}>
                <b>Exact</b> = score exact (+10 pts) · <b>Bon</b> = bon résultat ou bonne différence de buts (+5 ou +3)
              </p>
            </>
          )}
        </div>
      )}

      {tab === "regles" && (
        <div style={s.rulesWrap}>
          <p style={s.rulesIntro}>
            Le principe est simple : avant chaque match, tu devines le score final.
            Plus ton pronostic est proche de la réalité, plus tu gagnes de points. 🎯
          </p>
          <div style={s.rulesSectionTitle}>Comment marquer des points</div>
          <div style={s.ruleCard}>
            <div style={{ ...s.rulePts, background: GOLD }}>+10</div>
            <div>
              <div style={s.ruleName}>Score exact</div>
              <div style={s.ruleDesc}>Tu trouves le score pile poil. Ex : tu pronostiques 2–1 et le match finit 2–1.</div>
            </div>
          </div>
          <div style={s.ruleCard}>
            <div style={{ ...s.rulePts, background: "#8FD694" }}>+5</div>
            <div>
              <div style={s.ruleName}>Bon résultat</div>
              <div style={s.ruleDesc}>Tu trouves la bonne issue (victoire, nul ou défaite) mais pas le score exact.</div>
            </div>
          </div>
          <div style={s.ruleCard}>
            <div style={{ ...s.rulePts, background: "#Bcd6f5", color: INK }}>+3</div>
            <div>
              <div style={s.ruleName}>Bonne différence de buts</div>
              <div style={s.ruleDesc}>Tu trouves l'écart exact entre les deux équipes. Ex : tu dis 2–0, c'est 3–1.</div>
            </div>
          </div>
          <p style={s.rulesNote}>💡 Bon résultat et bonne différence peuvent se cumuler. Score exact = max 10 points.</p>

          <div style={s.rulesSectionTitle}>Où regarder les matchs</div>
          <p style={s.rulesIntro}>
            📺 <b style={{ color: ACCENT }}>beIN Sports</b> diffuse les 104 matchs (sur abonnement).
            Les matchs marqués <b style={{ color: "#1E9E5A" }}>M6</b> sont aussi en clair (M6, W9, M6+) — dont tous ceux de la France.
          </p>
        </div>
      )}

      {tab === "admin" && (
        <div>
          {!adminOn ? (
            <div style={s.adminLock}>
              <p style={{ marginBottom: 16 }}>🔒 Espace pour saisir les <b>vrais résultats</b> des matchs (réservé à l'organisateur).</p>
              <button style={s.cta} onClick={() => setAdminOn(true)}>Activer le mode résultats</button>
            </div>
          ) : (
            <>
              <p style={s.adminHint}>Saisis les scores réels au fur et à mesure. Le classement se met à jour automatiquement.</p>
              {Object.keys(GROUPS).map((g) => (
                <div key={g} style={{ marginBottom: 18 }}>
                  <div style={s.adminGroupTitle}>Groupe {g}</div>
                  {MATCHES.filter((m) => m.group === g).map((m) => {
                    const res = results[m.id] || {};
                    return (
                      <div key={m.id} style={s.adminRow}>
                        <span style={s.adminTeam}>{flag(m.home)} {m.home}</span>
                        <input type="number" min="0" max="20" value={res.h ?? ""}
                          onChange={(e) => setResult(m.id, "h", e.target.value)} style={s.scoreInputSm} />
                        <span style={{ opacity: 0.4 }}>—</span>
                        <input type="number" min="0" max="20" value={res.a ?? ""}
                          onChange={(e) => setResult(m.id, "a", e.target.value)} style={s.scoreInputSm} />
                        <span style={{ ...s.adminTeam, textAlign: "right" }}>{m.away} {flag(m.away)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={s.saveBar}>
                <button style={s.cta} onClick={saveResults}>💾 Enregistrer les résultats</button>
                {saved && <span style={s.savedMsg}>✓ Enregistré !</span>}
              </div>
            </>
          )}
        </div>
      )}

      <button style={s.logout} onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={s.bg}>
      <div style={s.frame}>{children}</div>
    </div>
  );
}

// ============================================================================
// STYLES (identiques à la version artifact, version premium bleue)
// ============================================================================
const ACCENT = "#1E5BD6";
const ACCENT_DARK = "#1647A8";
const GOLD = "#E9B949";
const INK = "#0B1A33";
const PAPER = "#FBFCFE";
const BODY = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "'Sora', 'Manrope', sans-serif";
const LINE = "#E7ECF4";
const MUTE = "#6B7689";

const s = {
  bg: { minHeight: "100vh", background: `linear-gradient(165deg, #0E2347 0%, ${INK} 45%, #081428 100%)`, fontFamily: BODY, padding: "28px 14px", boxSizing: "border-box" },
  frame: { maxWidth: 540, margin: "0 auto", background: PAPER, borderRadius: 24, padding: 26, boxShadow: "0 24px 70px rgba(5,15,40,.45)", position: "relative", border: `1px solid ${LINE}` },
  loginWrap: { textAlign: "center", padding: "26px 8px" },
  ball: { fontSize: 56, filter: "drop-shadow(0 8px 14px rgba(30,91,214,.3))" },
  loginTitle: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, lineHeight: 1.02, letterSpacing: -1.2, margin: "14px 0 6px", color: INK },
  loginSub: { fontSize: 15.5, color: MUTE, marginBottom: 28, lineHeight: 1.5, fontWeight: 500 },
  bigInput: { width: "100%", boxSizing: "border-box", padding: "15px 18px", fontSize: 17, borderRadius: 14, border: `1.5px solid ${LINE}`, marginBottom: 12, fontFamily: BODY, fontWeight: 600, background: "#fff", color: INK, outline: "none" },
  cta: { background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`, color: "#fff", border: "none", padding: "15px 24px", fontSize: 16, fontWeight: 700, borderRadius: 14, cursor: "pointer", fontFamily: BODY, letterSpacing: 0.2, boxShadow: "0 8px 20px rgba(30,91,214,.32)", width: "100%" },
  switchMode: { background: "none", border: "none", color: ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 18, fontFamily: BODY, textDecoration: "underline" },
  alertOk: { background: "#E7F6EE", color: "#1E7A47", padding: "12px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, marginTop: 14, textAlign: "left", lineHeight: 1.5 },
  alertErr: { background: "#FDECEC", color: "#B33", padding: "12px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, marginTop: 14, textAlign: "left", lineHeight: 1.5 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: `1px solid ${LINE}`, paddingBottom: 18 },
  logo: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 19, letterSpacing: -0.6, color: INK },
  hello: { fontSize: 13.5, color: MUTE, marginTop: 3, fontWeight: 500 },
  headerStats: { display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" },
  statPill: { background: `linear-gradient(180deg, ${INK} 0%, #16294a 100%)`, color: GOLD, padding: "7px 15px", borderRadius: 22, fontSize: 14, fontWeight: 800, fontFamily: DISPLAY },
  statPillGhost: { fontSize: 11.5, color: "#9AA4B6", fontWeight: 600 },
  tabs: { display: "flex", gap: 6, marginBottom: 20, background: "#EEF2F8", padding: 5, borderRadius: 14 },
  tab: { flex: 1, padding: "10px 4px", border: "none", background: "transparent", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: BODY, color: MUTE },
  tabActive: { background: "#fff", color: INK, boxShadow: "0 2px 6px rgba(11,26,51,.1)" },
  groupBar: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 },
  groupChip: { minWidth: 36, height: 36, borderRadius: 10, border: `1.5px solid ${LINE}`, background: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: DISPLAY, color: MUTE, fontSize: 14 },
  groupChipActive: { background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`, color: "#fff", borderColor: ACCENT },
  groupHeading: { fontFamily: DISPLAY, fontSize: 19, fontWeight: 800, color: INK, marginBottom: 14, display: "flex", flexDirection: "column", gap: 5, letterSpacing: -0.4 },
  groupTeams: { fontFamily: BODY, fontSize: 12.5, fontWeight: 500, color: MUTE, lineHeight: 1.4 },
  matchCard: { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "14px 16px", marginBottom: 11, boxShadow: "0 2px 8px rgba(11,26,51,.05)" },
  matchCardLocked: { background: "#F6F8FB", borderColor: "#E2E7F0", boxShadow: "none" },
  lockTag: { fontSize: 10, color: "#9AA4B6", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 800 },
  scoreInputLocked: { background: "#EEF1F6", color: "#AEB6C5", borderColor: "#E2E7F0", cursor: "not-allowed" },
  koLine: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11, paddingBottom: 9, borderBottom: `1px solid ${LINE}` },
  koDate: { fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: 0.1 },
  koTz: { fontSize: 10, color: "#9AA4B6", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 800 },
  channelLine: { display: "flex", gap: 6, marginBottom: 11, flexWrap: "wrap" },
  chanClear: { fontSize: 10.5, fontWeight: 800, color: "#1E9E5A", background: "#E7F6EE", borderRadius: 7, padding: "3px 8px" },
  chanPay: { fontSize: 10.5, fontWeight: 800, color: ACCENT, background: "#EAF1FD", borderRadius: 7, padding: "3px 8px" },
  venue: { fontSize: 10.5, fontWeight: 700, color: MUTE, background: "#F1F4F9", borderRadius: 7, padding: "3px 8px", marginLeft: "auto" },
  matchTeams: { display: "flex", alignItems: "center", gap: 8 },
  team: { flex: 1, display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700, color: INK },
  flag: { fontSize: 21 },
  scoreInputs: { display: "flex", alignItems: "center", gap: 6 },
  scoreInput: { width: 40, height: 44, textAlign: "center", fontSize: 19, fontWeight: 800, border: `1.5px solid ${LINE}`, borderRadius: 11, fontFamily: DISPLAY, color: INK, outline: "none", background: "#FBFCFE" },
  vs: { fontWeight: 800, color: "#C2CAD8", fontSize: 14 },
  resultLine: { marginTop: 12, paddingTop: 10, borderTop: `1px solid ${LINE}`, fontSize: 12.5, color: MUTE, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 },
  ptsBadge: { marginLeft: "auto", padding: "4px 11px", borderRadius: 20, fontWeight: 800, fontSize: 12.5, color: INK },
  saveBar: { display: "flex", alignItems: "center", gap: 14, marginTop: 20 },
  savedMsg: { color: "#1E9E5A", fontWeight: 700, fontSize: 14 },
  lbHeader: { display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", marginBottom: 6, fontSize: 10, fontWeight: 800, color: MUTE, textTransform: "uppercase", letterSpacing: 0.6 },
  lbColRank: { width: 26, textAlign: "left", flexShrink: 0 },
  lbColName: { flex: 1, minWidth: 0, textAlign: "left" },
  lbColStat: { width: 50, textAlign: "center", flexShrink: 0, fontSize: 13.5, color: MUTE, fontWeight: 600 },
  lbColPts: { width: 56, textAlign: "right", flexShrink: 0 },
  lbStatVal: { fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: INK },
  lbRow: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "13px 14px", marginBottom: 8, boxShadow: "0 2px 8px rgba(11,26,51,.05)" },
  lbMe: { background: "linear-gradient(180deg, #FFFBEF 0%, #FFF7E1 100%)", borderColor: "#F1DFA8" },
  rank: { fontSize: 17, fontWeight: 800, fontFamily: DISPLAY, color: MUTE },
  rankGold: { color: GOLD }, rankSilver: { color: "#A8B0C2" }, rankBronze: { color: "#C68B5E" },
  lbName: { fontWeight: 700, fontSize: 14.5, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  lbDetail: { fontSize: 11, color: "#9AA4B6", fontWeight: 500, marginTop: 1 },
  lbPts: { fontFamily: DISPLAY, fontSize: 21, fontWeight: 800, color: ACCENT, letterSpacing: -0.5 },
  lbLegend: { fontSize: 11.5, color: MUTE, marginTop: 14, lineHeight: 1.5, fontWeight: 500, textAlign: "center" },
  adminLock: { textAlign: "center", padding: "30px 10px", fontSize: 14.5, color: MUTE, lineHeight: 1.5, fontWeight: 500 },
  adminHint: { fontSize: 13, color: MUTE, marginBottom: 18, lineHeight: 1.55, fontWeight: 500 },
  adminGroupTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, marginBottom: 8, color: ACCENT, letterSpacing: 0.2 },
  adminRow: { display: "flex", alignItems: "center", gap: 7, padding: "6px 0", fontSize: 12.5 },
  adminTeam: { flex: 1, fontWeight: 600, color: INK },
  scoreInputSm: { width: 34, height: 32, textAlign: "center", fontSize: 14, fontWeight: 700, border: `1.5px solid ${LINE}`, borderRadius: 8, fontFamily: DISPLAY, color: INK, outline: "none", background: "#FBFCFE" },
  rulesWrap: { paddingBottom: 4 },
  rulesIntro: { fontSize: 14, lineHeight: 1.6, color: "#3D4A5F", marginBottom: 22, background: "linear-gradient(180deg, #F4F8FF 0%, #EDF3FD 100%)", border: `1px solid ${LINE}`, borderRadius: 16, padding: "16px 18px", fontWeight: 500 },
  rulesSectionTitle: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 16, color: INK, margin: "20px 0 12px", letterSpacing: -0.3 },
  ruleCard: { display: "flex", alignItems: "center", gap: 14, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "13px 15px", marginBottom: 10, boxShadow: "0 2px 8px rgba(11,26,51,.05)" },
  rulePts: { minWidth: 50, height: 50, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: INK, fontFamily: DISPLAY },
  ruleName: { fontWeight: 700, fontSize: 14.5, marginBottom: 3, color: INK },
  ruleDesc: { fontSize: 12.5, color: MUTE, lineHeight: 1.5, fontWeight: 500 },
  rulesNote: { fontSize: 12.5, color: "#3D4A5F", background: "#EDF3FD", borderRadius: 13, padding: "13px 15px", marginTop: 14, lineHeight: 1.55, fontWeight: 500 },
  logout: { display: "block", margin: "24px auto 0", background: "none", border: "none", color: "#9AA4B6", fontSize: 12.5, cursor: "pointer", fontWeight: 600, fontFamily: BODY, textDecoration: "underline" },
};
