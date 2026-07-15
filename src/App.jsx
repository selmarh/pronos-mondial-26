import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase.js";

// ============================================================================
// ADMINS — emails autorisés à saisir les vrais résultats
// ============================================================================
const ADMIN_EMAILS = ["selmarhanim@hotmail.com"];
const isAdmin = (email) => email && ADMIN_EMAILS.includes(email.toLowerCase());

// ============================================================================
// BONUS — message d'excuse + +10 pts pour tout le monde
// Affiché jusqu'à la date ci-dessous (modifiable)
// ============================================================================
const BONUS_POINTS = 10;
const BONUS_MESSAGE_UNTIL = "2026-06-30T21:00";
const BONUS_TEXT = "Désolé, la MAJ a pris du temps, il n'a donc pas été possible de parier sur Canada–Afrique du Sud. Pour me faire pardonner : +10 points offerts à tout le monde 🎁";

// ============================================================================
// DRAPEAUX
// ============================================================================
const FLAGS = {
  Mexique: "🇲🇽", "Afrique du Sud": "🇿🇦", Canada: "🇨🇦", Suisse: "🇨🇭",
  "Bosnie-Herzégovine": "🇧🇦", Brésil: "🇧🇷", Maroc: "🇲🇦",
  "États-Unis": "🇺🇸", Paraguay: "🇵🇾", Australie: "🇦🇺",
  Allemagne: "🇩🇪", "Côte d'Ivoire": "🇨🇮", Équateur: "🇪🇨",
  "Pays-Bas": "🇳🇱", Japon: "🇯🇵", Suède: "🇸🇪",
  Belgique: "🇧🇪", Égypte: "🇪🇬",
  Espagne: "🇪🇸", "Cap-Vert": "🇨🇻", Uruguay: "🇺🇾",
  France: "🇫🇷", Sénégal: "🇸🇳", Norvège: "🇳🇴",
  Argentine: "🇦🇷", Algérie: "🇩🇿", Autriche: "🇦🇹",
  Portugal: "🇵🇹", "RD Congo": "🇨🇩", Colombie: "🇨🇴",
  Angleterre: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Croatie: "🇭🇷", Ghana: "🇬🇭",
};
const flag = (t) => FLAGS[t] || "⚽";

// ============================================================================
// BRACKET — Les 2 demi-finales (officiel FIFA, horaires France)
// ============================================================================
const BRACKET_SF = [
  ["SF-1", "France",     "Espagne",   "2026-07-14T21:00", "Dallas 🇺🇸"],
  ["SF-2", "Angleterre", "Argentine", "2026-07-15T21:00", "Atlanta 🇺🇸"],
];

function buildMatches() {
  return BRACKET_SF.map(([id, home, away, kickoff, venue, resultFixed]) => ({
    id, round: "demi", home, away, kickoff, venue,
    resultFixed: resultFixed || null,
  }));
}
const MATCHES = buildMatches();
const KICKOFF_BY_ID = Object.fromEntries(MATCHES.map((m) => [m.id, m.kickoff]));
const FIXED_RESULTS = Object.fromEntries(
  MATCHES.filter((m) => m.resultFixed).map((m) => [m.id, m.resultFixed])
);

// ============================================================================
// HISTORIQUE — matchs des tours précédents dont on garde les points
// (poules M1-M72 + seizièmes R16-1..16 + huitièmes R8-1..8 + quarts QF-1..4)
// ============================================================================
const LEGACY_POULES_IDS = Array.from({ length: 72 }, (_, i) => `M${i + 1}`);
const LEGACY_R16_IDS = Array.from({ length: 16 }, (_, i) => `R16-${i + 1}`);
const LEGACY_R8_IDS = Array.from({ length: 8 }, (_, i) => `R8-${i + 1}`);
const LEGACY_QF_IDS = Array.from({ length: 4 }, (_, i) => `QF-${i + 1}`);
const LEGACY_MATCH_IDS = [...LEGACY_POULES_IDS, ...LEGACY_R16_IDS, ...LEGACY_R8_IDS, ...LEGACY_QF_IDS];

// Les 2 demi-finales sont sur M6 + beIN Sports
const M6_MATCHES = new Set(["SF-1", "SF-2"]);
function channelsFor(id) {
  return M6_MATCHES.has(id) ? ["M6", "beIN Sports"] : ["beIN Sports"];
}

// ============================================================================
// HISTORIQUE COMPLET — permet d'afficher les pronos passés avec noms d'équipes
// ============================================================================
const HISTORIC_MATCHES_R16 = [
  ["R16-1",  "Afrique du Sud", "Canada",             "2026-06-28T21:00"],
  ["R16-2",  "Brésil",         "Japon",              "2026-06-29T19:00"],
  ["R16-3",  "Allemagne",      "Paraguay",           "2026-06-29T22:30"],
  ["R16-4",  "Pays-Bas",       "Maroc",              "2026-06-30T03:00"],
  ["R16-5",  "Côte d'Ivoire",  "Norvège",            "2026-06-30T19:00"],
  ["R16-6",  "France",         "Suède",              "2026-06-30T23:00"],
  ["R16-7",  "Mexique",        "Équateur",           "2026-07-01T03:00"],
  ["R16-8",  "Angleterre",     "RD Congo",           "2026-07-01T18:00"],
  ["R16-9",  "Belgique",       "Sénégal",            "2026-07-01T22:00"],
  ["R16-10", "États-Unis",     "Bosnie-Herzégovine", "2026-07-02T02:00"],
  ["R16-11", "Espagne",        "Autriche",           "2026-07-02T21:00"],
  ["R16-12", "Portugal",       "Croatie",            "2026-07-03T01:00"],
  ["R16-13", "Suisse",         "Algérie",            "2026-07-03T05:00"],
  ["R16-14", "Australie",      "Égypte",             "2026-07-03T20:00"],
  ["R16-15", "Argentine",      "Cap-Vert",           "2026-07-04T00:00"],
  ["R16-16", "Colombie",       "Ghana",              "2026-07-04T03:30"],
];
const HISTORIC_MATCHES_R8 = [
  ["R8-1", "Canada",     "Maroc",      "2026-07-04T19:00"],
  ["R8-2", "Paraguay",   "France",     "2026-07-04T23:00"],
  ["R8-3", "Brésil",     "Norvège",    "2026-07-05T22:00"],
  ["R8-4", "Mexique",    "Angleterre", "2026-07-06T02:00"],
  ["R8-5", "Portugal",   "Espagne",    "2026-07-06T21:00"],
  ["R8-6", "États-Unis", "Belgique",   "2026-07-07T02:00"],
  ["R8-7", "Argentine",  "Égypte",     "2026-07-07T18:00"],
  ["R8-8", "Suisse",     "Colombie",   "2026-07-07T22:00"],
];
const HISTORIC_MATCHES_QF = [
  ["QF-1", "France",    "Maroc",      "2026-07-09T22:00"],
  ["QF-2", "Espagne",   "Belgique",   "2026-07-10T21:00"],
  ["QF-3", "Norvège",   "Angleterre", "2026-07-11T23:00"],
  ["QF-4", "Argentine", "Suisse",     "2026-07-12T03:00"],
];
// Table lookup pour retrouver les infos d'un match ancien à partir de son ID
const HISTORIC_LOOKUP = {};
[...HISTORIC_MATCHES_R16, ...HISTORIC_MATCHES_R8, ...HISTORIC_MATCHES_QF].forEach(([id, home, away, kickoff]) => {
  HISTORIC_LOOKUP[id] = { id, home, away, kickoff };
});

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

// ============================================================================
// SCORING — score exact : +500 en demi, +100 en quart, +10 avant / +5 bon vainqueur / +3 bonne différence
// ============================================================================
// pred = { h, a, tabWinner? }    actual = { h, a, tabWinner? }    matchId = "SF-1" | "QF-1" | "R8-3" | "M42" | ...
// Barème progressif : 500 pts en demi-finale, 100 pts en quart, 10 pts partout ailleurs.
function scorePrediction(pred, actual, matchId) {
  if (!actual || actual.h == null || actual.a == null) return null;
  if (!pred || pred.h == null || pred.a == null) return 0;
  const ph = +pred.h, pa = +pred.a, ah = +actual.h, aa = +actual.a;
  const actualIsDraw = ah === aa;
  const predIsDraw = ph === pa;
  // Barème progressif selon le tour
  const isSemiFinal = typeof matchId === "string" && matchId.startsWith("SF-");
  const isQuarterFinal = typeof matchId === "string" && matchId.startsWith("QF-");
  const EXACT_PTS = isSemiFinal ? 500 : isQuarterFinal ? 100 : 10;

  // Cas spécial : le match réel a fini sur un nul (=> TAB)
  if (actualIsDraw) {
    const sameTabWinner = pred.tabWinner && actual.tabWinner && pred.tabWinner === actual.tabWinner;
    if (predIsDraw && ph === ah && sameTabWinner) return EXACT_PTS; // score nul exact + bon vainqueur TAB
    if (sameTabWinner) return 5;                                    // bon vainqueur TAB sans le score exact
    if (predIsDraw && ph - pa === ah - aa) return 3;                // bon score nul, mauvais TAB
    return 0;
  }

  // Cas normal : match avec un vrai vainqueur (pas de TAB)
  if (ph === ah && pa === aa) return EXACT_PTS;
  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  const predRes = sign(ph - pa), actRes = sign(ah - aa);
  let pts = 0;
  if (predRes === actRes) pts += 5;
  if (ph - pa === ah - aa) pts += 3;
  return Math.min(pts, 8);
}

// ============================================================================
// APP racine
// ============================================================================
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Injection unique de l'animation "néon pulse" pour l'encadré 24h
  useEffect(() => {
    if (document.getElementById("neon-pulse-anim")) return;
    const style = document.createElement("style");
    style.id = "neon-pulse-anim";
    style.textContent = `
      @keyframes neonPulse {
        0%, 100% {
          box-shadow:
            0 0 8px rgba(234, 106, 31, 0.5),
            0 0 16px rgba(234, 106, 31, 0.35),
            0 0 24px rgba(220, 40, 20, 0.2),
            inset 0 0 8px rgba(234, 106, 31, 0.15);
          border-color: rgba(234, 106, 31, 0.9);
        }
        50% {
          box-shadow:
            0 0 14px rgba(255, 100, 0, 0.85),
            0 0 28px rgba(255, 60, 20, 0.6),
            0 0 42px rgba(220, 40, 20, 0.4),
            inset 0 0 14px rgba(255, 100, 0, 0.3);
          border-color: rgba(255, 90, 20, 1);
        }
      }
      .neon-pulse-box {
        animation: neonPulse 1.8s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
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

  if (loading) return <Shell><p style={{ textAlign: "center", padding: 60, color: MUTE }}>Chargement…</p></Shell>;
  if (!session) return <AuthScreen />;
  if (!profile) return <PseudoScreen userId={session.user.id} onDone={loadProfile} />;
  return <Game session={session} profile={profile} />;
}

// ============================================================================
// AUTH SCREEN
// ============================================================================
function AuthScreen() {
  const [mode, setMode] = useState("login");
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
        setMsg({ type: "ok", text: "Compte créé ! Vérifie ta boîte mail pour confirmer, puis reviens te connecter." });
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
        <img src="/fifa-logo.png" alt="Coupe du Monde 2026" style={s.heroLogo} />
        <h1 style={s.loginTitle}>TechInno<br />Pronos<br /><span style={{ color: ACCENT }}>Mondial 26</span></h1>
        <p style={s.loginSub}>{mode === "signup" ? "Crée ton compte pour participer" : "Connecte-toi pour jouer"}</p>
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
// PSEUDO SCREEN
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
        <div style={{ fontSize: 56 }}>👋</div>
        <h1 style={s.loginTitle}>Bienvenue !</h1>
        <p style={s.loginSub}>Choisis un pseudo qui apparaîtra dans le classement.</p>
        <input style={s.bigInput} placeholder="Ton pseudo" value={pseudo}
          onChange={(e) => setPseudo(e.target.value)} maxLength={20}
          onKeyDown={(e) => e.key === "Enter" && save()} />
        <button style={s.cta} disabled={busy} onClick={save}>{busy ? "..." : "C'est parti →"}</button>
        {err && <div style={s.alertErr}>{err}</div>}
      </div>
    </Shell>
  );
}

// ============================================================================
// GAME
// ============================================================================
function Game({ session, profile }) {
  const [tab, setTab] = useState("matchs");
  const [adminOn, setAdminOn] = useState(false);
  const [allPredictions, setAllPredictions] = useState([]);
  const [results, setResults] = useState({});
  const [profiles, setProfiles] = useState({});
  const [myPreds, setMyPreds] = useState({});
  const [saved, setSaved] = useState(false);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [bonusDismissed, setBonusDismissed] = useState(false);
  const [tabWinnerPrompt, setTabWinnerPrompt] = useState(null);
  const userId = session.user.id;

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [preds, res, profs] = await Promise.all([
      supabase.from("predictions").select("*"),
      supabase.from("results").select("*"),
      supabase.from("profiles").select("id, pseudo"),
    ]);
    setAllPredictions(preds.data || []);
    const resMap = { ...FIXED_RESULTS };
    (res.data || []).forEach((r) => {
      resMap[r.match_id] = { h: r.home_score, a: r.away_score, tabWinner: r.tab_winner || null };
    });
    setResults(resMap);
    const profMap = {};
    (profs.data || []).forEach((p) => { profMap[p.id] = p.pseudo; });
    setProfiles(profMap);
    const mine = {};
    (preds.data || []).filter((p) => p.user_id === userId).forEach((p) => {
      mine[p.match_id] = { h: p.home_score, a: p.away_score, tabWinner: p.tab_winner || null };
    });
    setMyPreds(mine);
  }

  // Set des IDs valides pour les pronos (uniquement les matchs du tour en cours : demi-finales)
  const CURRENT_MATCH_IDS = useMemo(() => new Set(MATCHES.map((m) => m.id)), []);

  function setPred(matchId, side, val) {
    const ko = KICKOFF_BY_ID[matchId];
    if (ko && Date.now() >= new Date(ko).getTime()) return;
    if (FIXED_RESULTS[matchId]) return;
    const clean = val === "" ? null : Math.max(0, Math.min(20, parseInt(val) || 0));
    setMyPreds((m) => {
      const next = { ...m, [matchId]: { ...(m[matchId] || {}), [side]: clean } };
      return next;
    });
  }

  // Détection des matchs nuls avec délai de 1,5s (laisse le temps à l'utilisateur de finir de taper)
  useEffect(() => {
    // Cherche le 1er prono de nul sans tabWinner sur un match non commencé
    const drawWithoutWinner = Object.entries(myPreds).find(([mid, v]) => {
      if (v.h == null || v.a == null) return false;
      if (v.h !== v.a) return false;
      if (v.tabWinner) return false;
      if (!CURRENT_MATCH_IDS.has(mid)) return false; // uniquement les matchs du tour en cours
      const ko = KICKOFF_BY_ID[mid];
      if (ko && Date.now() >= new Date(ko).getTime()) return false;
      return true;
    });
    if (!drawWithoutWinner) return;

    // Attend 1,5s avant d'ouvrir la modal (pour éviter le déclenchement intempestif pendant la frappe)
    const timer = setTimeout(() => {
      setTabWinnerPrompt(drawWithoutWinner[0]);
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [myPreds]);

  // Sauvegarde automatique : debounce 1s après la dernière modif (sauf au premier chargement)
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  useEffect(() => {
    if (!initialLoadDone) {
      // Premier chargement : on attend que les données arrivent puis on active l'auto-save
      if (Object.keys(myPreds).length > 0 || allPredictions.length > 0) {
        setInitialLoadDone(true);
      }
      return;
    }
    if (Object.keys(myPreds).length === 0) return;
    const timer = setTimeout(() => {
      autoSavePreds();
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [myPreds]);

  async function autoSavePreds() {
    // On ne sauvegarde QUE les pronos sur des matchs valides (16es de finale)
    // et qui ont au moins un score renseigné
    const rows = Object.entries(myPreds)
      .filter(([mid, v]) => CURRENT_MATCH_IDS.has(mid) && (v.h != null || v.a != null))
      .map(([match_id, v]) => ({
        user_id: userId, match_id,
        home_score: v.h, away_score: v.a,
        tab_winner: v.tabWinner || null,
      }));
    if (rows.length === 0) return;
    const { error } = await supabase.from("predictions").upsert(rows);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      // Rafraîchit les données globales (allPredictions, classement) sans écraser myPreds
      refreshGlobalData();
    } else {
      console.error("Erreur enregistrement :", error.message);
    }
  }

  // Rafraîchit allPredictions et results sans toucher à myPreds en cours d'édition
  async function refreshGlobalData() {
    const [preds, res] = await Promise.all([
      supabase.from("predictions").select("*"),
      supabase.from("results").select("*"),
    ]);
    setAllPredictions(preds.data || []);
    const resMap = { ...FIXED_RESULTS };
    (res.data || []).forEach((r) => {
      resMap[r.match_id] = { h: r.home_score, a: r.away_score, tabWinner: r.tab_winner || null };
    });
    setResults(resMap);
  }

  // Bouton manuel : déclenche aussi la sauvegarde (utile si l'utilisateur n'attend pas)
  async function savePreds() {
    await autoSavePreds();
  }

  function setResult(matchId, side, val) {
    if (FIXED_RESULTS[matchId]) return;
    const clean = val === "" ? null : Math.max(0, Math.min(20, parseInt(val) || 0));
    setResults((r) => ({ ...r, [matchId]: { ...(r[matchId] || {}), [side]: clean } }));
  }

  function setResultTabWinner(matchId, winner) {
    if (FIXED_RESULTS[matchId]) return;
    setResults((r) => ({ ...r, [matchId]: { ...(r[matchId] || {}), tabWinner: winner } }));
  }

  async function saveResults() {
    const rows = Object.entries(results)
      .filter(([mid, v]) => !FIXED_RESULTS[mid] && (v.h != null || v.a != null))
      .map(([match_id, v]) => ({
        match_id, home_score: v.h, away_score: v.a,
        tab_winner: v.tabWinner || null,
      }));
    if (rows.length === 0) return;
    const { error } = await supabase.from("results").upsert(rows);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      loadData();
    } else alert("Erreur : " + error.message);
  }

  const bonusActive = Date.now() < new Date(BONUS_MESSAGE_UNTIL).getTime();

  const leaderboard = useMemo(() => {
    const byUser = {};
    allPredictions.forEach((p) => {
      const key = p.user_id;
      if (!byUser[key]) byUser[key] = {};
      byUser[key][p.match_id] = { h: p.home_score, a: p.away_score };
    });
    const allUserIds = new Set([...Object.keys(byUser), ...Object.keys(profiles)]);
    // Tous les IDs à scorer : 72 poules + 16es de finale
    const allMatchIds = [...LEGACY_MATCH_IDS, ...MATCHES.map((m) => m.id)];
    const rows = Array.from(allUserIds).map((uid) => {
      let pts = BONUS_POINTS;
      let exact = 0, good = 0, played = 0;
      allMatchIds.forEach((mid) => {
        const userPred = byUser[uid]?.[mid];
        const matchRes = results[mid];
        const hasPred = userPred && userPred.h != null && userPred.a != null;
        const hasResult = matchRes && matchRes.h != null && matchRes.a != null;
        if (hasPred && hasResult) {
          const sc = scorePrediction(userPred, matchRes, mid);
          played++;
          pts += sc;
          if (sc === 500 || sc === 100 || sc === 10) exact++; else if (sc >= 3) good++;
        }
      });
      return { uid, pseudo: profiles[uid] || "?", pts, exact, good, played };
    }).filter((r) => r.pseudo !== "?");
    return rows.sort((a, b) => b.pts - a.pts || b.exact - a.exact);
  }, [allPredictions, results, profiles]);

  const myScore = leaderboard.find((r) => r.uid === userId)?.pts || BONUS_POINTS;

  const upcomingMatches = useMemo(() => {
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;
    const future = MATCHES
      .filter((m) => m.kickoff && new Date(m.kickoff).getTime() > now && !FIXED_RESULTS[m.id])
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    const next24h = future.filter((m) => new Date(m.kickoff).getTime() <= in24h);
    return next24h.length > 0 ? next24h : future.slice(0, 3);
  }, []);

  function resolveTabWinner(matchId, winnerTeam) {
    setMyPreds((m) => ({ ...m, [matchId]: { ...(m[matchId] || {}), tabWinner: winnerTeam } }));
    setTabWinnerPrompt(null);
    setTimeout(() => savePreds(), 100);
  }

  return (
    <Shell>
      <div style={s.header}>
        <div>
          <div style={s.logo}>TechInno Pronos <span style={{ color: ACCENT }}>Mondial 26</span></div>
          <div style={s.hello}>Salut <b>{profile.pseudo}</b> 👋</div>
        </div>
        <div style={s.headerStats}>
          <div style={s.statPill}><b>{myScore}</b> pts</div>
          <div style={s.statPillGhost}>Demi-finales</div>
        </div>
      </div>

      <div style={s.decisiveBox}>
        <div style={s.decisiveContent}>
          <span style={s.decisiveEmoji}>🔥</span>
          <div style={{ flex: 1 }}>
            <div style={s.decisiveTitle}>Ça devient sérieux !</div>
            <div style={s.decisiveText}>On est en demi-finales ! Un <b>score exact rapporte désormais +500 pts</b> (les quarts restent à 100 pts). Bon vainqueur = +5, bonne différence = +3. Plus que 2 matchs à jouer avant la finale.</div>
          </div>
        </div>
      </div>

      {bonusActive && !bonusDismissed && (
        <div style={s.bonusBox}>
          <div style={s.bonusContent}>
            <span style={s.bonusEmoji}>🎁</span>
            <div style={{ flex: 1 }}>
              <div style={s.bonusTitle}>+{BONUS_POINTS} points offerts à tous !</div>
              <div style={s.bonusText}>{BONUS_TEXT}</div>
            </div>
            <button style={s.bonusClose} onClick={() => setBonusDismissed(true)}>✕</button>
          </div>
        </div>
      )}

      <UpcomingBox
        matches={upcomingMatches}
        myPreds={myPreds}
        setPred={setPred}
        onSave={savePreds}
        saved={saved}
      />

      <div style={s.tabRulesInfo}>
        <span style={s.tabRulesIcon}>⚽</span>
        <div>
          <b>Match nul ?</b> Si tu pronostiques un nul (ex : 1–1), l'app te demandera de choisir qui passe aux <b>tirs au but</b>.
        </div>
      </div>

      <div style={s.tabs}>
        {[
          ["matchs", "⚽ Matchs"],
          ["classement", "🏆 Classement"],
          ["regles", "📖 Règles"],
          ...(isAdmin(session.user.email) ? [["admin", "🔧 Résultats"]] : []),
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...s.tab, ...(tab === k ? s.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "matchs" && (
        <>
          <div style={s.bracketTitle}>🏆 Demi-finales</div>
          <p style={s.bracketSub}>2 matchs à élimination directe. Devine le score, et si tu pronostiques un nul, indique aussi qui passe aux tirs au but.</p>
          {MATCHES.map((m) => {
            const p = myPreds[m.id] || {};
            const res = results[m.id];
            const pts = scorePrediction(p, res, m.id);
            const ko = formatKickoff(m.kickoff);
            const isFixed = !!FIXED_RESULTS[m.id];
            const locked = isFixed || (ko ? Date.now() >= ko.ts : false);
            return (
              <div key={m.id} style={{ ...s.matchCard, ...(locked ? s.matchCardLocked : {}) }}>
                <div style={s.koLine}>
                  <span style={s.koDate}>🗓️ {ko ? `${ko.long} · ${ko.time}` : "Date à confirmer"}</span>
                  {locked ? <span style={s.lockTag}>{isFixed ? "✅ Joué" : "🔒 Pronos fermés"}</span>
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
                {p.h != null && p.a != null && p.h === p.a && !locked && (
                  <div style={s.drawHint}>
                    ⚠️ Match nul prédit — vainqueur aux TAB : <b>{p.tabWinner || "à confirmer à l'enregistrement"}</b>
                  </div>
                )}
                {res?.h != null && (
                  <div style={s.resultLine}>
                    Résultat : <b>{res.h} — {res.a}</b>
                    {pts != null && <span style={{ ...s.ptsBadge, background: pts >= 10 ? GOLD : pts >= 5 ? "#8FD694" : pts > 0 ? "#FDD9B8" : "#eee" }}>+{pts} pts</span>}
                  </div>
                )}
              </div>
            );
          })}
          <div style={s.autoSaveBar}>
            <span style={s.autoSaveInfo}>💾 Sauvegarde automatique active</span>
            {saved && <span style={s.savedMsg}>✓ Enregistré !</span>}
          </div>
        </>
      )}

      {tab === "classement" && (
        <div>
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: "center", padding: 30, color: MUTE, fontWeight: 500 }}>Aucun joueur inscrit pour l'instant.</p>
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
                <div key={row.uid}
                  onClick={() => setViewingPlayer(row.uid)}
                  style={{ ...s.lbRow, ...(row.uid === userId ? s.lbMe : {}), cursor: "pointer" }}>
                  <div style={{ ...s.lbColRank, ...s.rank, ...(i === 0 ? s.rankGold : i === 1 ? s.rankSilver : i === 2 ? s.rankBronze : {}) }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div style={s.lbColName}>
                    <div style={s.lbName}>{row.pseudo}{row.uid === userId && " (toi)"}</div>
                    <div style={s.lbDetail}>{row.played} joué{row.played > 1 ? "s" : ""} · voir détails ›</div>
                  </div>
                  <div style={s.lbColStat}><span style={s.lbStatVal}>{row.exact}</span></div>
                  <div style={s.lbColStat}><span style={s.lbStatVal}>{row.good}</span></div>
                  <div style={s.lbColPts}><span style={s.lbPts}>{row.pts}</span></div>
                </div>
              ))}
              <p style={s.lbLegend}>
                <b>Exact</b> = score exact (+500 en demi, +100 en quart, +10 avant) · <b>Bon</b> = bon vainqueur (+5) ou bonne différence (+3) · <b>+{BONUS_POINTS} pts</b> de bonus inclus pour tous
              </p>
            </>
          )}
        </div>
      )}

      {tab === "regles" && (
        <div style={s.rulesWrap}>
          <p style={s.rulesIntro}>
            🔥 On est en demi-finales ! Plus que 2 matchs pour décrocher un ticket pour la finale. Les 4 meilleures équipes du monde s'affrontent — chaque prono peut faire basculer le classement.
          </p>
          <div style={s.rulesSectionTitle}>Comment marquer des points</div>
          <div style={s.ruleCard}>
            <div style={{ ...s.rulePts, background: GOLD, fontSize: 13 }}>+500</div>
            <div>
              <div style={s.ruleName}>Score exact ⚡</div>
              <div style={s.ruleDesc}>Le barème augmente à chaque tour : <b>500 pts en demi-finales</b>, 100 pts en quarts, 10 pts avant. Tu trouves le score final pile poil, ex : 2–1 et c'est 2–1.</div>
            </div>
          </div>
          <div style={s.ruleCard}>
            <div style={{ ...s.rulePts, background: "#8FD694" }}>+5</div>
            <div>
              <div style={s.ruleName}>Bon vainqueur</div>
              <div style={s.ruleDesc}>Tu trouves qui gagne le match (à 90 min ou nul + bon vainqueur aux TAB).</div>
            </div>
          </div>
          <div style={s.ruleCard}>
            <div style={{ ...s.rulePts, background: "#FDD9B8", color: INK }}>+3</div>
            <div>
              <div style={s.ruleName}>Bonne différence de buts</div>
              <div style={s.ruleDesc}>Tu trouves l'écart exact entre les deux équipes (ex : tu dis 2–0, c'est 3–1).</div>
            </div>
          </div>

          <p style={s.rulesNote}>
            ⚽ <b>Spécial élimination directe :</b> chaque match doit avoir un vainqueur. Si tu pronostiques un nul, l'app te demandera de préciser qui passe aux tirs au but pour valider ton pari.
          </p>

          <div style={s.rulesSectionTitle}>Où regarder les matchs</div>
          <p style={s.rulesIntro}>
            📺 <b style={{ color: ACCENT }}>beIN Sports</b> diffuse tous les matchs (abonnement).
            Les matchs marqués <b style={{ color: "#1E9E5A" }}>M6</b> sont aussi en clair (M6, W9, M6+) — dont ceux des Bleus.
          </p>
        </div>
      )}

      {tab === "admin" && isAdmin(session.user.email) && (
        <div>
          {!adminOn ? (
            <div style={s.adminLock}>
              <p style={{ marginBottom: 16 }}>🔒 Espace pour saisir les <b>vrais résultats</b> des matchs.</p>
              <button style={s.cta} onClick={() => setAdminOn(true)}>Activer le mode résultats</button>
            </div>
          ) : (
            <>
              <p style={s.adminHint}>Saisis les scores réels au fur et à mesure. Le classement se met à jour automatiquement.</p>
              {MATCHES.map((m) => {
                const res = results[m.id] || {};
                const isFixed = !!FIXED_RESULTS[m.id];
                const isDraw = res.h != null && res.a != null && res.h === res.a && !isFixed;
                return (
                  <div key={m.id} style={s.adminBlock}>
                    <div style={s.adminRow}>
                      <span style={s.adminTeam}>{flag(m.home)} {m.home}</span>
                      <input type="number" min="0" max="20" value={res.h ?? ""} disabled={isFixed}
                        onChange={(e) => setResult(m.id, "h", e.target.value)} style={s.scoreInputSm} />
                      <span style={{ opacity: 0.4 }}>—</span>
                      <input type="number" min="0" max="20" value={res.a ?? ""} disabled={isFixed}
                        onChange={(e) => setResult(m.id, "a", e.target.value)} style={s.scoreInputSm} />
                      <span style={{ ...s.adminTeam, textAlign: "right" }}>{m.away} {flag(m.away)}</span>
                    </div>
                    {isDraw && (
                      <div style={s.adminTabBlock}>
                        <div style={s.adminTabLabel}>⚽ Vainqueur aux tirs au but :</div>
                        <div style={s.adminTabBtns}>
                          <button
                            style={{ ...s.adminTabBtn, ...(res.tabWinner === m.home ? s.adminTabBtnActive : {}) }}
                            onClick={() => setResultTabWinner(m.id, m.home)}>
                            {flag(m.home)} {m.home}
                          </button>
                          <button
                            style={{ ...s.adminTabBtn, ...(res.tabWinner === m.away ? s.adminTabBtnActive : {}) }}
                            onClick={() => setResultTabWinner(m.id, m.away)}>
                            {flag(m.away)} {m.away}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={s.saveBar}>
                <button style={s.cta} onClick={saveResults}>💾 Enregistrer les résultats</button>
                {saved && <span style={s.savedMsg}>✓ Enregistré !</span>}
              </div>
            </>
          )}
        </div>
      )}

      {viewingPlayer && (
        <PlayerPronosModal
          uid={viewingPlayer}
          pseudo={profiles[viewingPlayer] || "?"}
          isMe={viewingPlayer === userId}
          allPredictions={allPredictions}
          results={results}
          onClose={() => setViewingPlayer(null)}
        />
      )}

      {tabWinnerPrompt && (
        <TabWinnerModal
          match={MATCHES.find((m) => m.id === tabWinnerPrompt)}
          onChoose={(winner) => resolveTabWinner(tabWinnerPrompt, winner)}
          onCancel={() => setTabWinnerPrompt(null)}
        />
      )}

      <button style={s.logout} onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
    </Shell>
  );
}

// ============================================================================
// UPCOMING BOX
// ============================================================================
function UpcomingBox({ matches, myPreds, setPred, onSave, saved }) {
  if (matches.length === 0) {
    return <div style={s.upcomingEmpty}>⚽ Aucun match à venir dans les 24h.</div>;
  }
  const isWithin24h = matches.length > 0 && new Date(matches[0].kickoff).getTime() - Date.now() <= 24 * 60 * 60 * 1000;
  return (
    <div style={s.upcomingBox} className="neon-pulse-box">
      <div style={s.upcomingHeader}>
        <span>⚡ {isWithin24h ? "Prochains matchs (24h)" : "À venir"}</span>
        <span style={s.upcomingCount}>{matches.length} match{matches.length > 1 ? "s" : ""}</span>
      </div>
      {matches.map((m) => {
        const p = myPreds[m.id] || {};
        const ko = formatKickoff(m.kickoff);
        return (
          <div key={m.id} style={s.upcomingRow}>
            <div style={s.upcomingTop}>
              <span style={s.upcomingDate}>{ko ? `${ko.long.slice(0, 3)}. ${ko.long.split(" ").slice(1).join(" ")} · ${ko.time}` : ""}</span>
              <span style={s.upcomingGroup}>Demi</span>
            </div>
            <div style={s.upcomingMatch}>
              <span style={s.upcomingTeam}><span style={s.flag}>{flag(m.home)}</span>{m.home}</span>
              <div style={s.scoreInputs}>
                <input type="number" min="0" max="20" value={p.h ?? ""}
                  onChange={(e) => setPred(m.id, "h", e.target.value)} style={s.scoreInput} />
                <span style={s.vs}>—</span>
                <input type="number" min="0" max="20" value={p.a ?? ""}
                  onChange={(e) => setPred(m.id, "a", e.target.value)} style={s.scoreInput} />
              </div>
              <span style={{ ...s.upcomingTeam, justifyContent: "flex-end" }}>{m.away}<span style={s.flag}>{flag(m.away)}</span></span>
            </div>
          </div>
        );
      })}
      <div style={s.upcomingSaveBar}>
        <span style={s.autoSaveInfo}>💾 Sauvegarde automatique</span>
        {saved && <span style={s.savedMsg}>✓ Enregistré !</span>}
      </div>
    </div>
  );
}

// ============================================================================
// MODAL — vainqueur aux TAB
// ============================================================================
function TabWinnerModal({ match, onChoose, onCancel }) {
  if (!match) return null;
  return (
    <div style={s.modalOverlay} onClick={onCancel}>
      <div style={{ ...s.modalBox, alignSelf: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalTitle}>Match nul prédit ?</div>
            <div style={s.modalSubtitle}>En élimination directe, il faut un vainqueur. Qui passe aux tirs au but ?</div>
          </div>
          <button style={s.modalClose} onClick={onCancel}>✕</button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <button style={s.tabChoice} onClick={() => onChoose(match.home)}>
            <span style={{ fontSize: 24 }}>{flag(match.home)}</span> {match.home}
          </button>
          <button style={s.tabChoice} onClick={() => onChoose(match.away)}>
            <span style={{ fontSize: 24 }}>{flag(match.away)}</span> {match.away}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL — pronos d'un joueur (matchs terminés)
// ============================================================================
function PlayerPronosModal({ uid, pseudo, isMe, allPredictions, results, onClose }) {
  const userPreds = {};
  allPredictions.forEach((p) => {
    if (p.user_id === uid) {
      userPreds[p.match_id] = { h: p.home_score, a: p.away_score };
    }
  });

  // Calcul des points par tour (poules + 16es + 8es + quarts historiques + demi en cours)
  let poulesPts = 0, poulesPlayed = 0;
  LEGACY_POULES_IDS.forEach((mid) => {
    const pred = userPreds[mid];
    const res = results[mid];
    if (pred && pred.h != null && pred.a != null && res && res.h != null && res.a != null) {
      poulesPts += scorePrediction(pred, res, mid);
      poulesPlayed++;
    }
  });
  let r16Pts_historic = 0, r16Played = 0;
  LEGACY_R16_IDS.forEach((mid) => {
    const pred = userPreds[mid];
    const res = results[mid];
    if (pred && pred.h != null && pred.a != null && res && res.h != null && res.a != null) {
      r16Pts_historic += scorePrediction(pred, res, mid);
      r16Played++;
    }
  });
  let r8Pts_historic = 0, r8Played = 0;
  LEGACY_R8_IDS.forEach((mid) => {
    const pred = userPreds[mid];
    const res = results[mid];
    if (pred && pred.h != null && pred.a != null && res && res.h != null && res.a != null) {
      r8Pts_historic += scorePrediction(pred, res, mid);
      r8Played++;
    }
  });
  let qfPts_historic = 0, qfPlayed_historic = 0;
  LEGACY_QF_IDS.forEach((mid) => {
    const pred = userPreds[mid];
    const res = results[mid];
    if (pred && pred.h != null && pred.a != null && res && res.h != null && res.a != null) {
      qfPts_historic += scorePrediction(pred, res, mid);
      qfPlayed_historic++;
    }
  });

  // Construit une liste unifiée de TOUS les pronos détaillés (16es + 8es + quarts + demi)
  // avec les noms d'équipes, la date et le tour, triés du plus récent au plus ancien.
  function buildDetailedRow(id, home, away, kickoff, round) {
    const pred = userPreds[id];
    const res = results[id];
    const hasPred = pred && pred.h != null && pred.a != null;
    const hasResult = res && res.h != null && res.a != null;
    if (!hasPred || !hasResult) return null;
    const pts = scorePrediction(pred, res, id);
    return { id, home, away, kickoff, round, pred, res, pts };
  }
  const rows = [
    ...MATCHES.map((m) => buildDetailedRow(m.id, m.home, m.away, m.kickoff, "Demi")),
    ...HISTORIC_MATCHES_QF.map(([id, h, a, k]) => buildDetailedRow(id, h, a, k, "Quarts")),
    ...HISTORIC_MATCHES_R8.map(([id, h, a, k]) => buildDetailedRow(id, h, a, k, "8es")),
    ...HISTORIC_MATCHES_R16.map(([id, h, a, k]) => buildDetailedRow(id, h, a, k, "16es")),
  ]
    .filter((r) => r !== null)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  const sfPts = MATCHES.reduce((sum, m) => {
    const pred = userPreds[m.id];
    const res = results[m.id];
    if (pred && pred.h != null && pred.a != null && res && res.h != null && res.a != null) {
      return sum + scorePrediction(pred, res, m.id);
    }
    return sum;
  }, 0);
  let sfPlayed = 0;
  MATCHES.forEach((m) => {
    const pred = userPreds[m.id];
    const res = results[m.id];
    if (pred && pred.h != null && pred.a != null && res && res.h != null && res.a != null) sfPlayed++;
  });
  const totalPts = poulesPts + r16Pts_historic + r8Pts_historic + qfPts_historic + sfPts;
  const totalPlayed = poulesPlayed + r16Played + r8Played + qfPlayed_historic + sfPlayed;

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalTitle}>{pseudo}{isMe && " (toi)"}</div>
            <div style={s.modalSubtitle}>{totalPts} pts au total · {totalPlayed} matchs joués</div>
          </div>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          {poulesPts > 0 && (
            <div style={s.legacySummary}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: INK }}>Phase de poules</div>
                <div style={{ fontSize: 11.5, color: MUTE, marginTop: 1 }}>{poulesPlayed} match{poulesPlayed > 1 ? "s" : ""} · {poulesPts} pts cumulés</div>
              </div>
            </div>
          )}
          {rows.length === 0 ? (
            <p style={s.modalEmpty}>Aucun prono à afficher pour l'instant.</p>
          ) : (
            rows.map(({ id, home, away, kickoff, round, pred, res, pts }) => {
              const ko = formatKickoff(kickoff);
              return (
                <div key={id} style={s.pronoCard}>
                  <div style={s.pronoTop}>
                    <span style={s.pronoDate}>{ko ? `${ko.long.slice(0, 3)}. ${ko.long.split(" ").slice(1).join(" ")}` : ""}</span>
                    <span style={s.pronoGroup}>{round}</span>
                  </div>
                  <div style={s.pronoRow}>
                    <span style={s.pronoTeam}><span style={s.flag}>{flag(home)}</span>{home}</span>
                    <span style={s.pronoScore}>{pred.h} — {pred.a}</span>
                    <span style={{ ...s.pronoTeam, justifyContent: "flex-end" }}>{away}<span style={s.flag}>{flag(away)}</span></span>
                  </div>
                  <div style={s.pronoFooter}>
                    <span style={s.pronoActual}>Résultat réel : <b>{res.h} — {res.a}</b></span>
                    <span style={{ ...s.pronoPts, background: pts >= 10 ? GOLD : pts >= 5 ? "#8FD694" : pts > 0 ? "#FDD9B8" : "#eee" }}>
                      +{pts} pt{pts > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Shell({ children }) {
  return <div style={s.bg}><div style={s.frame}>{children}</div></div>;
}

// ============================================================================
// STYLES — thème ORANGE
// ============================================================================
const ACCENT = "#EA6A1F";
const ACCENT_DARK = "#C24E0E";
const GOLD = "#E9B949";
const INK = "#1A0F08";
const PAPER = "#FFFBF6";
const BODY = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "'Sora', 'Manrope', sans-serif";
const LINE = "#F3E5D5";
const MUTE = "#8B7B69";

const s = {
  bg: { minHeight: "100vh", background: `linear-gradient(165deg, #7A0F0F 0%, #4A0808 45%, #200303 100%)`, fontFamily: BODY, padding: "28px 14px", boxSizing: "border-box" },
  frame: { maxWidth: 540, margin: "0 auto", background: PAPER, borderRadius: 24, padding: 26, boxShadow: "0 24px 70px rgba(40,15,5,.45)", position: "relative", border: `1px solid ${LINE}` },
  loginWrap: { textAlign: "center", padding: "26px 8px" },
  heroLogo: { width: 110, height: "auto", margin: "0 auto 4px", display: "block", filter: "drop-shadow(0 8px 14px rgba(234,106,31,.3))" },
  loginTitle: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, lineHeight: 1.02, letterSpacing: -1.2, margin: "14px 0 6px", color: INK },
  loginSub: { fontSize: 15.5, color: MUTE, marginBottom: 28, lineHeight: 1.5, fontWeight: 500 },
  bigInput: { width: "100%", boxSizing: "border-box", padding: "15px 18px", fontSize: 17, borderRadius: 14, border: `1.5px solid ${LINE}`, marginBottom: 12, fontFamily: BODY, fontWeight: 600, background: "#fff", color: INK, outline: "none" },
  cta: { background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`, color: "#fff", border: "none", padding: "15px 24px", fontSize: 16, fontWeight: 700, borderRadius: 14, cursor: "pointer", fontFamily: BODY, letterSpacing: 0.2, boxShadow: "0 8px 20px rgba(234,106,31,.32)", width: "100%" },
  switchMode: { background: "none", border: "none", color: ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 18, fontFamily: BODY, textDecoration: "underline" },
  alertOk: { background: "#E7F6EE", color: "#1E7A47", padding: "12px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, marginTop: 14, textAlign: "left", lineHeight: 1.5 },
  alertErr: { background: "#FDECEC", color: "#B33", padding: "12px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, marginTop: 14, textAlign: "left", lineHeight: 1.5 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: `1px solid ${LINE}`, paddingBottom: 18 },
  logo: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 16, letterSpacing: -0.4, color: INK, lineHeight: 1.2 },
  hello: { fontSize: 13.5, color: MUTE, marginTop: 3, fontWeight: 500 },
  headerStats: { display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" },
  statPill: { background: `linear-gradient(180deg, ${INK} 0%, #3A1A08 100%)`, color: GOLD, padding: "7px 15px", borderRadius: 22, fontSize: 14, fontWeight: 800, fontFamily: DISPLAY },
  statPillGhost: { fontSize: 11, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  bonusBox: { background: `linear-gradient(180deg, #FFF2DF 0%, #FFE7C2 100%)`, border: `1.5px solid ${ACCENT}`, borderRadius: 18, padding: "14px 16px", marginBottom: 16, boxShadow: "0 4px 14px rgba(234,106,31,.18)" },
  decisiveBox: { background: `linear-gradient(180deg, #7A0F0F 0%, #5A0808 100%)`, border: `1.5px solid #E9B949`, borderRadius: 18, padding: "16px 18px", marginBottom: 16, boxShadow: "0 6px 20px rgba(122,15,15,.35)" },
  decisiveContent: { display: "flex", alignItems: "flex-start", gap: 13 },
  decisiveEmoji: { fontSize: 34, lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,.3))" },
  decisiveTitle: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, color: "#FFE7A3", marginBottom: 5, letterSpacing: -0.3 },
  decisiveText: { fontSize: 13, color: "#FFF1D6", lineHeight: 1.55, fontWeight: 500 },
  bonusContent: { display: "flex", alignItems: "flex-start", gap: 12 },
  bonusEmoji: { fontSize: 32, lineHeight: 1 },
  bonusTitle: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 15, color: INK, marginBottom: 4 },
  bonusText: { fontSize: 12.5, color: "#3A1A08", lineHeight: 1.5, fontWeight: 500 },
  bonusClose: { background: "rgba(0,0,0,.06)", border: "none", borderRadius: 999, width: 26, height: 26, fontSize: 13, fontWeight: 700, color: MUTE, cursor: "pointer", flexShrink: 0 },
  upcomingBox: { background: `linear-gradient(180deg, #FFFEF5 0%, #FFFAEB 100%)`, border: `2px solid ${GOLD}`, borderRadius: 18, padding: "14px 16px", marginBottom: 20, boxShadow: "0 4px 14px rgba(233,185,73,.18)", position: "relative" },
  upcomingEmpty: { background: "#FAF5EE", border: `1px solid ${LINE}`, borderRadius: 14, padding: "16px", marginBottom: 20, fontSize: 13, color: MUTE, textAlign: "center", fontWeight: 500 },
  upcomingHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 14, color: INK, marginBottom: 12, letterSpacing: -0.2 },
  upcomingCount: { fontSize: 10.5, fontWeight: 700, color: "#9A7E2E", background: "rgba(233,185,73,.18)", padding: "3px 9px", borderRadius: 20, letterSpacing: 0.3, textTransform: "uppercase" },
  upcomingRow: { background: "#fff", border: `1px solid #F1DFA8`, borderRadius: 12, padding: "10px 12px", marginBottom: 8 },
  upcomingTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 11, fontWeight: 700 },
  upcomingDate: { color: ACCENT },
  upcomingGroup: { color: MUTE, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  upcomingMatch: { display: "flex", alignItems: "center", gap: 8 },
  upcomingTeam: { flex: 1, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: INK },
  upcomingSaveBar: { display: "flex", alignItems: "center", gap: 12, marginTop: 12 },
  upcomingSaveBtn: { background: `linear-gradient(180deg, ${INK} 0%, #3A1A08 100%)`, color: GOLD, border: "none", padding: "10px 16px", fontSize: 13, fontWeight: 700, borderRadius: 11, cursor: "pointer", fontFamily: BODY, flex: 1, boxShadow: "0 4px 12px rgba(40,15,5,.22)" },
  tabRulesInfo: { display: "flex", alignItems: "flex-start", gap: 11, background: "#FFF4E0", border: `1px dashed ${ACCENT}`, borderRadius: 14, padding: "12px 14px", marginBottom: 20, fontSize: 12.5, color: "#3D2A18", lineHeight: 1.55, fontWeight: 500 },
  tabRulesIcon: { fontSize: 20, lineHeight: 1, flexShrink: 0 },
  tabs: { display: "flex", gap: 6, marginBottom: 20, background: "#FAF0E0", padding: 5, borderRadius: 14 },
  tab: { flex: 1, padding: "10px 4px", border: "none", background: "transparent", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: BODY, color: MUTE },
  tabActive: { background: "#fff", color: INK, boxShadow: "0 2px 6px rgba(40,15,5,.1)" },
  bracketTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, color: INK, marginBottom: 6, letterSpacing: -0.4 },
  bracketSub: { fontSize: 13, color: MUTE, fontWeight: 500, lineHeight: 1.5, marginBottom: 16 },
  matchCard: { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "14px 16px", marginBottom: 11, boxShadow: "0 2px 8px rgba(40,15,5,.05)" },
  matchCardLocked: { background: "#FAF5EE", borderColor: "#E8DDC8", boxShadow: "none" },
  lockTag: { fontSize: 10, color: MUTE, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 800 },
  scoreInputLocked: { background: "#F5EEE0", color: "#B5A78F", borderColor: "#E8DDC8", cursor: "not-allowed" },
  koLine: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11, paddingBottom: 9, borderBottom: `1px solid ${LINE}` },
  koDate: { fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: 0.1 },
  koTz: { fontSize: 10, color: MUTE, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 800 },
  channelLine: { display: "flex", gap: 6, marginBottom: 11, flexWrap: "wrap" },
  chanClear: { fontSize: 10.5, fontWeight: 800, color: "#1E9E5A", background: "#E7F6EE", borderRadius: 7, padding: "3px 8px" },
  chanPay: { fontSize: 10.5, fontWeight: 800, color: ACCENT, background: "#FDECDB", borderRadius: 7, padding: "3px 8px" },
  venue: { fontSize: 10.5, fontWeight: 700, color: MUTE, background: "#F5EEE0", borderRadius: 7, padding: "3px 8px", marginLeft: "auto" },
  matchTeams: { display: "flex", alignItems: "center", gap: 8 },
  team: { flex: 1, display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700, color: INK },
  flag: { fontSize: 21 },
  scoreInputs: { display: "flex", alignItems: "center", gap: 6 },
  scoreInput: { width: 40, height: 44, textAlign: "center", fontSize: 19, fontWeight: 800, border: `1.5px solid ${LINE}`, borderRadius: 11, fontFamily: DISPLAY, color: INK, outline: "none", background: "#FFFBF6" },
  vs: { fontWeight: 800, color: "#C9B89C", fontSize: 14 },
  resultLine: { marginTop: 12, paddingTop: 10, borderTop: `1px solid ${LINE}`, fontSize: 12.5, color: MUTE, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 },
  ptsBadge: { marginLeft: "auto", padding: "4px 11px", borderRadius: 20, fontWeight: 800, fontSize: 12.5, color: INK },
  drawHint: { marginTop: 10, padding: "8px 12px", background: "#FFF4E0", borderRadius: 10, fontSize: 12, color: "#8A5A1A", fontWeight: 600 },
  saveBar: { display: "flex", alignItems: "center", gap: 14, marginTop: 20 },
  autoSaveBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 20, padding: "12px 14px", background: "#FAF5EE", borderRadius: 12, border: `1px solid ${LINE}` },
  autoSaveInfo: { fontSize: 12.5, color: MUTE, fontWeight: 600 },
  savedMsg: { color: "#1E9E5A", fontWeight: 700, fontSize: 14 },
  lbHeader: { display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", marginBottom: 6, fontSize: 10, fontWeight: 800, color: MUTE, textTransform: "uppercase", letterSpacing: 0.6 },
  lbColRank: { width: 26, textAlign: "left", flexShrink: 0 },
  lbColName: { flex: 1, minWidth: 0, textAlign: "left" },
  lbColStat: { width: 50, textAlign: "center", flexShrink: 0, fontSize: 13.5, color: MUTE, fontWeight: 600 },
  lbColPts: { width: 56, textAlign: "right", flexShrink: 0 },
  lbStatVal: { fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: INK },
  lbRow: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "13px 14px", marginBottom: 8, boxShadow: "0 2px 8px rgba(40,15,5,.05)" },
  lbMe: { background: "linear-gradient(180deg, #FFFBEF 0%, #FFF7E1 100%)", borderColor: "#F1DFA8" },
  rank: { fontSize: 17, fontWeight: 800, fontFamily: DISPLAY, color: MUTE },
  rankGold: { color: GOLD }, rankSilver: { color: "#A8A0A8" }, rankBronze: { color: "#C68B5E" },
  lbName: { fontWeight: 700, fontSize: 14.5, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  lbDetail: { fontSize: 11, color: MUTE, fontWeight: 500, marginTop: 1 },
  lbPts: { fontFamily: DISPLAY, fontSize: 21, fontWeight: 800, color: ACCENT, letterSpacing: -0.5 },
  lbLegend: { fontSize: 11.5, color: MUTE, marginTop: 14, lineHeight: 1.5, fontWeight: 500, textAlign: "center" },
  adminLock: { textAlign: "center", padding: "30px 10px", fontSize: 14.5, color: MUTE, lineHeight: 1.5, fontWeight: 500 },
  adminHint: { fontSize: 13, color: MUTE, marginBottom: 18, lineHeight: 1.55, fontWeight: 500 },
  adminRow: { display: "flex", alignItems: "center", gap: 7, padding: "6px 0", fontSize: 12.5 },
  adminBlock: { padding: "6px 0", borderBottom: `1px solid ${LINE}`, marginBottom: 4 },
  adminTabBlock: { background: "#FFF4E0", borderRadius: 10, padding: "10px 12px", marginTop: 8, marginBottom: 6 },
  adminTabLabel: { fontSize: 11.5, fontWeight: 700, color: "#8A5A1A", marginBottom: 7 },
  adminTabBtns: { display: "flex", gap: 6 },
  adminTabBtn: { flex: 1, padding: "8px 10px", border: `1.5px solid #F1DFA8`, borderRadius: 9, background: "#fff", fontSize: 12, fontWeight: 600, color: INK, cursor: "pointer", fontFamily: BODY, textAlign: "center" },
  adminTabBtnActive: { background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`, color: "#fff", borderColor: ACCENT },
  adminTeam: { flex: 1, fontWeight: 600, color: INK },
  scoreInputSm: { width: 34, height: 32, textAlign: "center", fontSize: 14, fontWeight: 700, border: `1.5px solid ${LINE}`, borderRadius: 8, fontFamily: DISPLAY, color: INK, outline: "none", background: "#FFFBF6" },
  rulesWrap: { paddingBottom: 4 },
  rulesIntro: { fontSize: 14, lineHeight: 1.6, color: "#3D2A18", marginBottom: 22, background: "linear-gradient(180deg, #FFF8EE 0%, #FDECDB 100%)", border: `1px solid ${LINE}`, borderRadius: 16, padding: "16px 18px", fontWeight: 500 },
  rulesSectionTitle: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 16, color: INK, margin: "20px 0 12px", letterSpacing: -0.3 },
  ruleCard: { display: "flex", alignItems: "center", gap: 14, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "13px 15px", marginBottom: 10, boxShadow: "0 2px 8px rgba(40,15,5,.05)" },
  rulePts: { minWidth: 50, height: 50, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: INK, fontFamily: DISPLAY },
  ruleName: { fontWeight: 700, fontSize: 14.5, marginBottom: 3, color: INK },
  ruleDesc: { fontSize: 12.5, color: MUTE, lineHeight: 1.5, fontWeight: 500 },
  rulesNote: { fontSize: 12.5, color: "#3D2A18", background: "#FDECDB", borderRadius: 13, padding: "13px 15px", marginTop: 14, lineHeight: 1.55, fontWeight: 500 },
  logout: { display: "block", margin: "24px auto 0", background: "none", border: "none", color: MUTE, fontSize: 12.5, cursor: "pointer", fontWeight: 600, fontFamily: BODY, textDecoration: "underline" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(40,15,5,.65)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "20px 12px" },
  modalBox: { background: PAPER, borderRadius: 22, width: "100%", maxWidth: 540, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 -10px 40px rgba(40,15,5,.5)", overflow: "hidden", border: `1px solid ${LINE}` },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${LINE}`, background: "#fff" },
  modalTitle: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 19, color: INK, letterSpacing: -0.4 },
  modalSubtitle: { fontSize: 12, color: MUTE, fontWeight: 500, marginTop: 3 },
  modalClose: { background: "#F5EEE0", border: "none", borderRadius: 999, width: 34, height: 34, fontSize: 15, fontWeight: 700, color: MUTE, cursor: "pointer" },
  modalBody: { overflow: "auto", padding: "18px 18px 22px", flex: 1 },
  modalEmpty: { textAlign: "center", color: MUTE, fontSize: 14, padding: "40px 20px", fontWeight: 500, lineHeight: 1.5 },
  pronoCard: { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "11px 13px", marginBottom: 9, boxShadow: "0 1px 3px rgba(40,15,5,.04)" },
  pronoTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, fontSize: 11, fontWeight: 700 },
  pronoDate: { color: ACCENT },
  pronoGroup: { color: MUTE, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  pronoRow: { display: "flex", alignItems: "center", gap: 8 },
  pronoTeam: { flex: 1, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: INK },
  pronoScore: { fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: INK, minWidth: 64, textAlign: "center" },
  pronoFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9, paddingTop: 8, borderTop: `1px solid ${LINE}` },
  pronoActual: { fontSize: 11.5, color: MUTE, fontWeight: 600 },
  pronoPts: { padding: "3px 10px", borderRadius: 18, fontWeight: 800, fontSize: 11.5, color: INK },
  legacySummary: { display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(180deg, #FFF4E0 0%, #FDECDB 100%)", border: `1px dashed ${ACCENT}`, borderRadius: 12, padding: "11px 13px", marginBottom: 14 },
  tabChoice: { display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", border: `1.5px solid ${LINE}`, borderRadius: 14, background: "#fff", fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10, cursor: "pointer", fontFamily: BODY, textAlign: "left" },
};
