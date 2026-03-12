import { useState, useEffect, useMemo, useCallback } from "react";

const C = {
  bg: "#080B12", bg2: "#0D1117",
  accent: "#58A6FF", accentDim: "rgba(88,166,255,0.08)", accentBdr: "rgba(88,166,255,0.18)",
  text: "#E6EDF3", text2: "#7D8590", text3: "#484F58",
  bdr: "rgba(230,237,243,0.06)", bdrH: "rgba(230,237,243,0.13)",
  glass: "rgba(230,237,243,0.02)", green: "#3FB950", purple: "#D2A8FF",
  orange: "#F0883E", red: "#F85149",
  sf: "Georgia,'Times New Roman',serif", ss: "system-ui,-apple-system,sans-serif",
};

const APPS = [
  { id:"obj-resp",name:"Objection Response Generator",icon:"⚡",cat:"Outreach",price:19,desc:"3 response frameworks for any objection — mid-call.",long:"Get 3 strategic frameworks with talk tracks tailored to deal stage and persona.",feats:["3 frameworks","Stage aware","Persona tailored","Live-call ready"],rating:4.9,reviews:342,users:2147,badge:"Most Popular",dev:"SalesAI",official:true,ver:"1.2.0",installs:3420,revenue:48260 },
  { id:"crm-notes",name:"CRM Note Summarizer",icon:"📋",cat:"Productivity",price:19,desc:"Messy notes to CRM-ready summary with next steps.",long:"Paste raw notes, get structured records with action items.",feats:["SF & HubSpot","Action items","Deal signals","One-click copy"],rating:4.8,reviews:289,users:1823,badge:"Editor's Pick",dev:"SalesAI",official:true,ver:"1.1.3",installs:2890,revenue:38620 },
  { id:"cold-email",name:"Cold Email Writer",icon:"✉️",cat:"Outreach",price:29,desc:"Personalized 3-5 email sequences that sound human.",long:"Prospect-specific sequences with configurable tone and CTA.",feats:["3-5 sequences","Personalization","A/B subjects","Tone control"],rating:4.8,reviews:267,users:1634,badge:"Top Rated",dev:"OutboundLabs",ver:"3.1.0",installs:2680,revenue:54520 },
  { id:"commission",name:"Commission Calculator",icon:"💰",cat:"Productivity",price:9,desc:"Instant comp estimate with what-if scenarios.",long:"Configure your plan once, model any deal. AI interprets comp docs.",feats:["What-if sliders","Accelerators","AI interpreter","Multi-year"],rating:4.9,reviews:412,users:2834,badge:"Fan Favorite",dev:"SalesAI",official:true,ver:"2.0.0",installs:4120,revenue:26000 },
  { id:"icp-score",name:"ICP Match Scorer",icon:"🎯",cat:"Prospecting",price:29,desc:"Instant 0-100 fit score against your ICP.",long:"See pass/fail on each criterion with approach suggestions.",feats:["0-100 scoring","6 criteria","Approach angle","Custom ICP"],rating:4.7,reviews:178,users:1204,dev:"SalesAI",official:true,ver:"1.0.2",installs:1540,revenue:31280 },
  { id:"contact",name:"Contact Enricher",icon:"👤",cat:"Prospecting",price:29,desc:"Name + company to contact card with outreach hooks.",long:"Complete profile with email prediction and personalization.",feats:["Email prediction","Org chart","Outreach hooks","API-ready"],rating:4.6,reviews:156,users:982,dev:"RevenueStack",ver:"2.0.1",installs:1280,revenue:26040 },
  { id:"linkedin",name:"LinkedIn Message Crafter",icon:"💬",cat:"Outreach",price:19,desc:"Connection requests and InMails that get replies.",long:"3 variants with character enforcement and strategy notes.",feats:["300-char","3 variants","Profile hooks","InMail mode"],rating:4.7,reviews:198,users:1345,dev:"OutboundLabs",ver:"1.4.0",installs:1890,revenue:25160 },
  { id:"brief",name:"Account Briefing Builder",icon:"📊",cat:"Meeting Prep",price:49,desc:"One-click account dossier with talk tracks.",long:"Comprehensive briefing: overview, people, competitors, risks.",feats:["Full dossier","Talk tracks","Competitors","Risk flags"],rating:4.8,reviews:223,users:1412,dev:"RevenueStack",ver:"1.3.0",installs:1680,revenue:57720 },
  { id:"email-crm",name:"Email-to-CRM Logger",icon:"📧",cat:"Productivity",price:19,desc:"Email thread to structured CRM entry with deal signals.",long:"Formatted logs with sentiment analysis.",feats:["Thread parsing","Sentiment","Deal signals","CRM format"],rating:4.6,reviews:134,users:891,dev:"CRMFlow",ver:"1.0.0",installs:920,revenue:12260 },
  { id:"discovery",name:"Discovery Question Generator",icon:"❓",cat:"Meeting Prep",price:19,desc:"Tailored questions with listen-for coaching.",long:"Industry/persona/stage specific with framework support.",feats:["MEDDIC/SPIN","Coaching","Industry fit","Persona specific"],rating:4.7,reviews:187,users:1134,dev:"SalesAI",official:true,ver:"1.1.0",installs:1460,revenue:19440 },
];

const CATS = ["All","Outreach","Prospecting","Meeting Prep","Productivity"];
const QUEUE = [
  {id:"s1",name:"Deal Forecast Narrator",dev:"PipelineAI",icon:"📈",date:"Mar 8",status:"pending",desc:"Pipeline data into Slack-ready narrative.",score:92},
  {id:"s2",name:"Competitive Intel Tracker",dev:"BattleCard.io",icon:"⚔️",date:"Mar 7",status:"review",desc:"Auto-updated battle cards from public data.",score:87},
  {id:"s3",name:"Meeting Scheduler AI",dev:"CalendarKit",icon:"📅",date:"Mar 5",status:"pending",desc:"AI optimal meeting times by deal stage.",score:95},
];

function AppCard({ app, owned, onToggle, onDetail }) {
  const [h, setH] = useState(false);
  const io = owned.includes(app.id);
  return (
    <div onClick={() => onDetail(app)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background:h?"rgba(230,237,243,0.04)":C.glass, border:"1px solid "+(h?C.bdrH:C.bdr), borderRadius:14, padding:22, cursor:"pointer", transform:h?"translateY(-4px)":"none", boxShadow:h?"0 12px 40px rgba(0,0,0,0.5)":"none", transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)", position:"relative", overflow:"hidden" }}>
      {app.badge && <div style={{ position:"absolute",top:12,right:12,background:C.accentDim,color:C.accent,fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:4,textTransform:"uppercase" }}>{app.badge}</div>}
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
        <div style={{ width:42,height:42,background:C.accentDim,border:"1px solid "+C.accentBdr,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{app.icon}</div>
        <div><div style={{ fontSize:14,fontWeight:600,color:C.text }}>{app.name}</div><span style={{ fontSize:10,color:app.official?C.accent:C.green }}>{app.official?"◆":"●"} {app.dev} ✓</span></div>
      </div>
      <p style={{ fontSize:13,color:C.text2,lineHeight:1.55,marginBottom:16,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{app.desc}</p>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:11,color:C.accent }}>★ {app.rating} <span style={{ color:C.text3 }}>· {app.users.toLocaleString()}</span></span>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <span style={{ fontSize:14,fontWeight:700,fontFamily:C.sf }}>${app.price}<span style={{ fontSize:10,fontWeight:400,color:C.text3 }}>/mo</span></span>
          <button onClick={e=>{e.stopPropagation();onToggle(app.id);}} style={{ background:io?"rgba(63,185,80,0.08)":C.accentDim,color:io?C.green:C.accent,border:"none",padding:"5px 12px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer" }}>{io?"✓ Owned":"+ Add"}</button>
        </div>
      </div>
      <div style={{ marginTop:14,height:2,borderRadius:1,background:"rgba(230,237,243,0.04)",overflow:"hidden" }}><div style={{ height:"100%",background:"linear-gradient(90deg,"+C.accent+","+C.accent+"33)",width:h?"100%":"0%",transition:"width 0.5s ease" }}/></div>
    </div>
  );
}

function DashCard({ app, onToggle }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ background:h?"rgba(230,237,243,0.04)":C.glass,border:"1px solid "+(h?"rgba(88,166,255,0.12)":C.bdr),borderRadius:14,padding:20,cursor:"pointer",transform:h?"translateY(-3px)":"none",transition:"all 0.25s" }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:42,height:42,background:C.accentDim,border:"1px solid "+C.accentBdr,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{app.icon}</div>
          <div><div style={{ fontSize:14,fontWeight:600 }}>{app.name}</div><div style={{ fontSize:11,color:C.text2 }}>by {app.dev} · ${app.price}/mo</div></div>
        </div>
        <div style={{ width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:"0 0 6px "+C.green+"66" }}/>
      </div>
      <div style={{ display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:11,color:C.text3 }}>★ {app.rating}</span>
        <div style={{ display:"flex",gap:6 }}>
          <button onClick={e=>{e.stopPropagation();onToggle(app.id);}} style={{ background:"transparent",border:"1px solid "+C.bdr,color:C.text3,padding:"5px 10px",borderRadius:5,fontSize:10,cursor:"pointer" }}>Remove</button>
          <button style={{ background:C.accentDim,color:C.accent,border:"none",padding:"5px 14px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer" }}>Launch →</button>
        </div>
      </div>
      <div style={{ marginTop:12,height:2,borderRadius:1,background:"rgba(230,237,243,0.04)",overflow:"hidden" }}><div style={{ height:"100%",background:"linear-gradient(90deg,"+C.accent+","+C.accent+"33)",width:h?"100%":"0%",transition:"width 0.4s ease" }}/></div>
    </div>
  );
}

function DevAppCard({ app }) {
  return (
    <div style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:14,padding:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
        <div style={{ width:42,height:42,background:C.accentDim,border:"1px solid "+C.accentBdr,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{app.icon}</div>
        <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600 }}>{app.name}</div><div style={{ fontSize:10,color:C.text3 }}>v{app.ver}</div></div>
        <span style={{ fontSize:9,color:C.green,background:C.green+"14",padding:"2px 7px",borderRadius:3,fontWeight:700,textTransform:"uppercase" }}>Live</span>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
        {[["$"+app.price,"/mo"],[app.installs.toLocaleString(),"installs"],["★ "+app.rating,"rating"],["$"+Math.round(app.revenue*0.8).toLocaleString(),"earned"]].map(([v,l])=>(
          <div key={l} style={{ textAlign:"center" }}><div style={{ fontSize:13,fontWeight:700,color:C.text }}>{v}</div><div style={{ fontSize:9,color:C.text3 }}>{l}</div></div>
        ))}
      </div>
    </div>
  );
}

function Landing({ onAuth, onDevAuth, onDetail, onStore, owned, onToggle }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 100); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-200,right:-60,width:650,height:650,background:"radial-gradient(circle,rgba(88,166,255,0.06) 0%,transparent 65%)",pointerEvents:"none" }}/>
      <div style={{ position:"absolute",top:300,left:"-10%",width:400,height:400,background:"radial-gradient(circle,rgba(210,168,255,0.04) 0%,transparent 65%)",pointerEvents:"none" }}/>

      <div style={{ padding:"90px 48px 50px",maxWidth:1100,margin:"0 auto",position:"relative",zIndex:10 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1.15fr 0.85fr",gap:60,alignItems:"center" }}>
          <div style={{ opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(28px)",transition:"all 0.9s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"5px 14px",border:"1px solid "+C.accentBdr,borderRadius:4,fontSize:10,color:C.accent,letterSpacing:"2px",textTransform:"uppercase",marginBottom:32 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:"0 0 8px "+C.green+"66",animation:"pulse 2s infinite" }}/>OPEN MARKETPLACE · {APPS.length}+ TOOLS
            </div>
            <h1 style={{ fontFamily:C.sf,fontSize:"clamp(40px,5vw,58px)",lineHeight:1.02,letterSpacing:-2,fontWeight:400,color:C.text,marginBottom:24 }}>The marketplace for<br/><em style={{ color:C.accent,fontStyle:"italic" }}>AI sales tools.</em></h1>
            <p style={{ fontSize:16,color:C.text2,lineHeight:1.75,maxWidth:420,marginBottom:40,fontWeight:300 }}>Buy tools that close deals. Or build and sell your own. 80% revenue share. Keys never leave your machine.</p>
            <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
              <button onClick={onAuth} style={{ background:C.accent,color:"#fff",border:"none",padding:"14px 32px",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer" }}>Browse marketplace</button>
              <button onClick={onDevAuth} style={{ background:"transparent",color:C.purple,border:"1px solid rgba(210,168,255,0.2)",padding:"14px 32px",borderRadius:6,fontSize:14,cursor:"pointer" }}>Build & sell apps →</button>
            </div>
          </div>
          <div style={{ position:"relative",paddingLeft:40 }}>
            <div style={{ position:"absolute",top:0,left:20,width:1,height:vis?"100%":"0%",background:"linear-gradient(180deg,transparent,"+C.accentBdr+",transparent)",transition:"height 1.4s ease 0.5s" }}/>
            {APPS.slice(0,5).map((app,i)=>(
              <div key={app.id} onClick={()=>onDetail(app)} style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",opacity:vis?1:0,transform:vis?"translateX(0)":"translateX(40px)",transition:`all 0.7s cubic-bezier(0.16,1,0.3,1) ${0.35+i*0.1}s` }}>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:36,height:36,background:C.accentDim,border:"1px solid "+C.accentBdr,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>{app.icon}</div>
                  <div><div style={{ fontSize:13,color:C.text,fontWeight:500 }}>{app.name}</div><div style={{ fontSize:10,color:C.text3 }}>by {app.dev} · ★ {app.rating}</div></div>
                </div>
                <span style={{ fontSize:12,color:C.text2,fontFamily:C.sf,fontWeight:700 }}>${app.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop:"1px solid "+C.bdr,borderBottom:"1px solid "+C.bdr,padding:"44px 48px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between" }}>
          {[["2,400+","Sellers",C.accent],["80/20","Dev split",C.green],["AES-256","Encryption",C.purple],[APPS.length+"+","Tools",C.text]].map(([v,l,col])=>(
            <div key={l}><div style={{ fontFamily:C.sf,fontSize:30,letterSpacing:-1,color:col }}>{v}</div><div style={{ fontSize:11,color:C.text3,marginTop:4 }}>{l}</div></div>
          ))}
        </div>
      </div>

      <div style={{ padding:"64px 48px",borderBottom:"1px solid "+C.bdr }}>
        <div style={{ maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"center" }}>
          <div>
            <span style={{ fontSize:9,color:C.purple,background:C.purple+"14",padding:"2px 7px",borderRadius:3,fontWeight:700,textTransform:"uppercase" }}>FOR DEVELOPERS</span>
            <h2 style={{ fontFamily:C.sf,fontSize:32,fontWeight:400,color:C.text,letterSpacing:-1,marginTop:16,marginBottom:16 }}>Build once. <em style={{ color:C.purple,fontStyle:"italic" }}>Earn forever.</em></h2>
            <p style={{ fontSize:15,color:C.text2,lineHeight:1.7,marginBottom:24 }}>Ship an HTML app. We handle payments, distribution, security. You keep 80%.</p>
            <button onClick={onDevAuth} style={{ background:`linear-gradient(135deg,${C.purple},${C.accent})`,color:"#fff",border:"none",padding:"14px 32px",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer" }}>Open developer portal →</button>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {[["80%","Revenue share"],["< 48h","Review time"],["$0–999","Your price"],["2,400+","Buyers"]].map(([v,l])=>(
              <div key={v} style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:12,padding:20,textAlign:"center" }}><div style={{ fontFamily:C.sf,fontSize:24,color:C.purple,letterSpacing:-1 }}>{v}</div><div style={{ fontSize:11,color:C.text3,marginTop:6 }}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"56px 48px 72px",maxWidth:1100,margin:"0 auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:28 }}>
          <h2 style={{ fontFamily:C.sf,fontSize:28,fontWeight:400,color:C.text,letterSpacing:-1 }}>Featured <em style={{ color:C.accent,fontStyle:"italic" }}>tools</em></h2>
          <button onClick={onStore} style={{ background:"none",border:"none",color:C.accent,fontSize:13,cursor:"pointer" }}>View all →</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14 }}>
          {APPS.slice(0,6).map(app=><AppCard key={app.id} app={app} owned={owned} onToggle={onToggle} onDetail={onDetail} />)}
        </div>
      </div>

      <div style={{ padding:"32px 48px",borderTop:"1px solid "+C.bdr,textAlign:"center" }}><p style={{ fontSize:12,color:C.text3 }}>© 2026 SalesAI Marketplace · Privacy · Terms · Developer Agreement</p></div>
    </div>
  );
}

export default function Marketplace() {
  const [view,setView] = useState("landing");
  const [user,setUser] = useState(null);
  const [role,setRole] = useState("buyer");
  const [modal,setModal] = useState(null);
  const [selApp,setSelApp] = useState(null);
  const [owned,setOwned] = useState([]);
  const [cat,setCat] = useState("All");
  const [sort,setSort] = useState("Popular");
  const [search,setSearch] = useState("");
  const [toast,setToast] = useState(null);
  const [devTab,setDevTab] = useState("apps");
  const [subStep,setSubStep] = useState(0);
  const [subForm,setSubForm] = useState({name:"",cat:"Outreach",price:"",desc:"",icon:"⚡"});
  const [authForm,setAuthForm] = useState({name:"",email:"",pw:""});

  const notify = useCallback((m,t="info")=>{setToast({m,t});setTimeout(()=>setToast(null),3500);},[]);
  const go = (v)=>{setView(v);setSearch("");setCat("All");};
  const openDetail = (app)=>{setSelApp(app);setModal("detail");};

  const doAuth = (r)=>{
    const n = authForm.name||"Demo User";
    setUser({name:n,email:authForm.email||"user@demo.com"});setRole(r);
    setOwned(r==="buyer"?["obj-resp","crm-notes","commission"]:[]);
    setModal(null);setAuthForm({name:"",email:"",pw:""});
    go(r==="developer"?"dev":r==="admin"?"admin":"dashboard");
    notify("Welcome, "+n+"!","success");
  };

  const toggleOwn = useCallback((id)=>{
    if(!user){setModal("auth");return;}
    setOwned(prev=>{
      const has=prev.includes(id);
      notify(has?"Removed":"Added!",has?"info":"success");
      return has?prev.filter(x=>x!==id):[...prev,id];
    });
  },[user,notify]);

  const filtered = useMemo(()=>{
    let r=APPS.filter(a=>(cat==="All"||a.cat===cat)&&(!search||a.name.toLowerCase().includes(search.toLowerCase())||a.dev.toLowerCase().includes(search.toLowerCase())));
    if(sort==="Top Rated")r.sort((a,b)=>b.rating-a.rating);
    else if(sort==="Price ↑")r.sort((a,b)=>a.price-b.price);
    else if(sort==="Price ↓")r.sort((a,b)=>b.price-a.price);
    else r.sort((a,b)=>b.users-a.users);
    return r;
  },[cat,search,sort]);

  const myApps = useMemo(()=>APPS.filter(a=>owned.includes(a.id)),[owned]);
  const devApps = useMemo(()=>APPS.filter(a=>a.official||a.dev===user?.name),[user]);
  const totRev = devApps.reduce((s,a)=>s+(a.revenue||0)*0.8,0);
  const totInst = devApps.reduce((s,a)=>s+(a.installs||0),0);

  return (
    <div style={{ background:C.bg,color:C.text,minHeight:"100vh",fontFamily:C.ss }}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}::selection{background:rgba(88,166,255,.25)}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(230,237,243,.08);border-radius:3px}input::placeholder,textarea::placeholder{color:rgba(230,237,243,.2)}select option{background:${C.bg2}}`}</style>

      <div style={{ position:"fixed",inset:0,opacity:0.025,pointerEvents:"none",zIndex:50,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")'}}/>

      {/* NAV */}
      <nav style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 48px",height:56,position:"sticky",top:0,zIndex:200,background:"rgba(8,11,18,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid "+C.bdr }}>
        <div onClick={()=>go("landing")} style={{ display:"flex",alignItems:"center",gap:12,cursor:"pointer" }}>
          <div style={{ width:30,height:30,border:"1.5px solid "+C.accent,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.sf,fontSize:17,color:C.accent }}>S</div>
          <span style={{ fontFamily:C.sf,fontSize:18,color:C.text,letterSpacing:"-0.5px" }}>SalesAI</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          <button onClick={()=>go("store")} style={{ background:view==="store"?C.accentDim:"transparent",border:"none",color:view==="store"?C.accent:C.text2,padding:"6px 14px",borderRadius:5,fontSize:13,fontWeight:500,cursor:"pointer" }}>Store</button>
          {user&&role==="buyer"&&<button onClick={()=>go("dashboard")} style={{ background:view==="dashboard"?C.accentDim:"transparent",border:"none",color:view==="dashboard"?C.accent:C.text2,padding:"6px 14px",borderRadius:5,fontSize:13,fontWeight:500,cursor:"pointer" }}>My Apps</button>}
          {user&&role==="developer"&&<button onClick={()=>go("dev")} style={{ background:view==="dev"?C.accentDim:"transparent",border:"none",color:view==="dev"?C.purple:C.text2,padding:"6px 14px",borderRadius:5,fontSize:13,fontWeight:500,cursor:"pointer" }}>Dev Portal</button>}
          {user&&role==="admin"&&<button onClick={()=>go("admin")} style={{ background:view==="admin"?C.accentDim:"transparent",border:"none",color:view==="admin"?C.orange:C.text2,padding:"6px 14px",borderRadius:5,fontSize:13,fontWeight:500,cursor:"pointer" }}>Admin</button>}
          <span style={{ width:1,height:20,background:C.bdr,margin:"0 8px" }}/>
          {!user&&<button onClick={()=>setModal("dev-auth")} style={{ background:"transparent",border:"1px solid rgba(210,168,255,0.2)",color:C.purple,padding:"6px 14px",borderRadius:6,fontSize:12,cursor:"pointer",marginRight:6 }}>Developers</button>}
          {user?(
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:9,color:role==="developer"?C.purple:role==="admin"?C.orange:C.accent,background:(role==="developer"?C.purple:role==="admin"?C.orange:C.accent)+"14",padding:"2px 7px",borderRadius:3,fontWeight:700,textTransform:"uppercase" }}>{role}</span>
              <div onClick={()=>{setUser(null);setOwned([]);setRole("buyer");go("landing");}} style={{ width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${role==="developer"?C.purple:role==="admin"?C.orange:C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer" }} title="Sign out">{user.name[0].toUpperCase()}</div>
            </div>
          ):(
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setModal("auth")} style={{ background:"transparent",border:"1px solid "+C.bdr,color:C.text2,padding:"7px 18px",borderRadius:6,fontSize:12,cursor:"pointer" }}>Sign in</button>
              <button onClick={()=>setModal("auth")} style={{ background:C.accent,color:"#fff",border:"none",padding:"7px 18px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer" }}>Get started</button>
            </div>
          )}
        </div>
      </nav>

      {toast&&<div style={{ position:"fixed",top:72,right:24,zIndex:9999,padding:"12px 18px",borderRadius:10,fontSize:12,fontWeight:500,maxWidth:320,background:toast.t==="success"?"rgba(63,185,80,0.08)":"rgba(88,166,255,0.08)",border:"1px solid "+(toast.t==="success"?"rgba(63,185,80,0.2)":C.accentBdr),color:toast.t==="success"?C.green:C.accent }}>{toast.t==="success"?"✓ ":"ℹ "}{toast.m}</div>}

      {/* VIEWS */}
      {view==="landing"&&<Landing onAuth={()=>setModal("auth")} onDevAuth={()=>setModal("dev-auth")} onDetail={openDetail} onStore={()=>go("store")} owned={owned} onToggle={toggleOwn} />}

      {view==="store"&&(
        <div style={{ padding:"32px 48px",maxWidth:1100,margin:"0 auto" }}>
          <h1 style={{ fontFamily:C.sf,fontSize:26,fontWeight:400,marginBottom:4 }}>Marketplace</h1>
          <p style={{ fontSize:13,color:C.text2,marginBottom:24 }}>{APPS.length} tools by {new Set(APPS.map(a=>a.dev)).size} developers</p>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:24,flexWrap:"wrap" }}>
            <input placeholder="Search apps or developers..." value={search} onChange={e=>setSearch(e.target.value)} style={{ background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:"8px 14px",borderRadius:7,fontSize:12,width:220,outline:"none" }}/>
            <div style={{ display:"flex",gap:4 }}>{CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{ background:cat===c?C.accentDim:"transparent",border:"1px solid "+(cat===c?C.accentBdr:C.bdr),color:cat===c?C.accent:C.text2,padding:"6px 12px",borderRadius:5,fontSize:11,fontWeight:500,cursor:"pointer" }}>{c}</button>)}</div>
            <select value={sort} onChange={e=>setSort(e.target.value)} style={{ marginLeft:"auto",background:C.glass,border:"1px solid "+C.bdr,color:C.text2,padding:"7px 10px",borderRadius:5,fontSize:11 }}>{["Popular","Top Rated","Price ↑","Price ↓"].map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14 }}>
            {filtered.map(app=><AppCard key={app.id} app={app} owned={owned} onToggle={toggleOwn} onDetail={openDetail} />)}
          </div>
        </div>
      )}

      {view==="dashboard"&&user&&(
        <div style={{ padding:"32px 48px",maxWidth:1100,margin:"0 auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:24 }}><div><h1 style={{ fontFamily:C.sf,fontSize:26,fontWeight:400 }}>My Apps</h1><p style={{ fontSize:13,color:C.text2,marginTop:2 }}>{myApps.length} installed</p></div><button onClick={()=>go("store")} style={{ background:C.accent,color:"#fff",border:"none",padding:"8px 18px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer" }}>+ Browse</button></div>
          <div style={{ background:"rgba(88,166,255,0.03)",border:"1px solid "+C.accentBdr,borderRadius:10,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10 }}><span>🔐</span><div><div style={{ fontSize:13,fontWeight:600 }}>Keys encrypted locally — AES-256</div><div style={{ fontSize:11,color:C.text2 }}>Never leaves your device</div></div></div>
          {myApps.length===0?<div style={{ textAlign:"center",padding:72,background:C.glass,borderRadius:16,border:"1px solid "+C.bdr }}><div style={{ fontSize:40,marginBottom:12 }}>🛒</div><h3 style={{ fontFamily:C.sf,fontSize:18,fontWeight:400,marginBottom:12 }}>No apps yet</h3><button onClick={()=>go("store")} style={{ background:C.accent,color:"#fff",border:"none",padding:"12px 28px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" }}>Browse →</button></div>
          :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14 }}>{myApps.map(app=><DashCard key={app.id} app={app} onToggle={toggleOwn} />)}</div>}
        </div>
      )}

      {view==="dev"&&user&&(
        <div style={{ padding:"32px 48px",maxWidth:1100,margin:"0 auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:24 }}><div><h1 style={{ fontFamily:C.sf,fontSize:26,fontWeight:400 }}>Developer Portal</h1><p style={{ fontSize:13,color:C.text2,marginTop:2 }}>Build, publish, earn</p></div><button onClick={()=>{setSubStep(0);setSubForm({name:"",cat:"Outreach",price:"",desc:"",icon:"⚡"});setModal("submit");}} style={{ background:`linear-gradient(135deg,${C.purple},${C.accent})`,color:"#fff",border:"none",padding:"10px 24px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer" }}>+ Submit app</button></div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24 }}>
            {[["$"+Math.round(totRev).toLocaleString(),"Earnings (80%)",C.green],[totInst.toLocaleString(),"Installs",C.accent],[String(devApps.length),"Apps",C.purple],["4.78","Avg rating",C.orange]].map(([v,l,col])=>(
              <div key={l} style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:12,padding:20,textAlign:"center" }}><div style={{ fontFamily:C.sf,fontSize:26,letterSpacing:-1,color:col }}>{v}</div><div style={{ fontSize:11,color:C.text3,marginTop:4 }}>{l}</div></div>
            ))}
          </div>
          <div style={{ display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid "+C.bdr,paddingBottom:12 }}>{[["apps","My Apps"],["revenue","Revenue"],["payouts","Payouts"]].map(([id,label])=><button key={id} onClick={()=>setDevTab(id)} style={{ background:devTab===id?C.accentDim:"transparent",border:"none",color:devTab===id?C.accent:C.text2,padding:"8px 16px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer" }}>{label}</button>)}</div>
          {devTab==="apps"&&<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14 }}>{devApps.map(app=><DevAppCard key={app.id} app={app} />)}</div>}
          {devTab==="revenue"&&<div style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:14,padding:24 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}><div><div style={{ fontSize:11,color:C.text2,textTransform:"uppercase",letterSpacing:1 }}>Total earnings</div><div style={{ fontFamily:C.sf,fontSize:36,color:C.green,letterSpacing:-1,marginTop:4 }}>${Math.round(totRev).toLocaleString()}</div></div><div style={{ textAlign:"right" }}><div style={{ fontSize:11,color:C.text2 }}>Fee: 20%</div><div style={{ fontSize:11,color:C.green,marginTop:2 }}>You keep: 80%</div></div></div>
            <div style={{ display:"flex",alignItems:"flex-end",gap:4,height:80 }}>{[40,55,45,70,65,80,72,90,85,95,88,100].map((h,i)=><div key={i} style={{ flex:1,background:`linear-gradient(180deg,${C.accent},${C.accent}33)`,height:h+"%",borderRadius:"3px 3px 0 0",opacity:0.5+i*0.04 }}/>)}</div>
          </div>}
          {devTab==="payouts"&&<div style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:14,padding:20 }}><div style={{ fontSize:13,fontWeight:600,marginBottom:12 }}>Payout Schedule</div>{[["Next payout","Apr 1, 2026",C.green],["Method","Stripe Connect → •••• 4242",C.text],["Minimum","$50.00",C.text],["Frequency","Monthly",C.text]].map(([l,v,col])=><div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+C.bdr }}><span style={{ fontSize:12,color:C.text2 }}>{l}</span><span style={{ fontSize:12,color:col,fontWeight:500 }}>{v}</span></div>)}</div>}
        </div>
      )}

      {view==="admin"&&user&&(
        <div style={{ padding:"32px 48px",maxWidth:1100,margin:"0 auto" }}>
          <h1 style={{ fontFamily:C.sf,fontSize:26,fontWeight:400,marginBottom:4 }}>Admin — Review Queue</h1>
          <p style={{ fontSize:13,color:C.text2,marginBottom:24 }}>{QUEUE.length} pending</p>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>{QUEUE.map(sub=>(
            <div key={sub.id} style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:42,height:42,background:C.accentDim,border:"1px solid "+C.accentBdr,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{sub.icon}</div>
                <div><div style={{ fontSize:14,fontWeight:600 }}>{sub.name}</div><div style={{ fontSize:11,color:C.text2 }}>by {sub.dev} · {sub.date}</div><div style={{ fontSize:11,color:C.text3,marginTop:2 }}>{sub.desc}</div></div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:12,flexShrink:0 }}>
                <div style={{ textAlign:"center" }}><div style={{ fontSize:18,fontWeight:700,color:sub.score>=90?C.green:sub.score>=80?C.orange:C.red }}>{sub.score}</div><div style={{ fontSize:9,color:C.text3 }}>Security</div></div>
                <span style={{ fontSize:9,color:sub.status==="review"?C.orange:C.text3,background:(sub.status==="review"?C.orange:C.text3)+"14",padding:"2px 7px",borderRadius:3,fontWeight:700,textTransform:"uppercase" }}>{sub.status==="review"?"In Review":"Pending"}</span>
                <button onClick={()=>notify("Approved!","success")} style={{ background:"rgba(63,185,80,0.08)",color:C.green,border:"none",padding:"7px 14px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer" }}>Approve</button>
                <button onClick={()=>notify("Rejected","info")} style={{ background:"rgba(248,81,73,0.08)",color:C.red,border:"none",padding:"7px 14px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer" }}>Reject</button>
              </div>
            </div>
          ))}</div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {modal==="auth"&&<div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setModal(null)}><div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)" }}/><div onClick={e=>e.stopPropagation()} style={{ position:"relative",background:C.bg2,border:"1px solid "+C.bdr,borderRadius:20,width:380,padding:"36px 28px" }}>
        <button onClick={()=>setModal(null)} style={{ position:"absolute",top:14,right:14,background:"rgba(230,237,243,0.04)",border:"none",color:C.text3,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:14 }}>×</button>
        <div style={{ textAlign:"center",marginBottom:24 }}><div style={{ width:36,height:36,border:"1.5px solid "+C.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.sf,fontSize:18,color:C.accent,margin:"0 auto 12px" }}>S</div><h2 style={{ fontFamily:C.sf,fontSize:22,fontWeight:400 }}>Get started</h2></div>
        {[["Name","name","text"],["Email","email","email"],["Password","pw","password"]].map(([ph,k,t])=><input key={k} type={t} placeholder={ph} value={authForm[k]} onChange={e=>setAuthForm(p=>({...p,[k]:e.target.value}))} style={{ width:"100%",background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:"11px 14px",borderRadius:8,fontSize:13,marginBottom:10,outline:"none" }}/>)}
        <button onClick={()=>doAuth("buyer")} style={{ width:"100%",background:C.accent,color:"#fff",border:"none",padding:12,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:6 }}>Create account →</button>
      </div></div>}

      {modal==="dev-auth"&&<div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setModal(null)}><div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)" }}/><div onClick={e=>e.stopPropagation()} style={{ position:"relative",background:C.bg2,border:"1px solid "+C.bdr,borderRadius:20,width:420,padding:"36px 28px" }}>
        <button onClick={()=>setModal(null)} style={{ position:"absolute",top:14,right:14,background:"rgba(230,237,243,0.04)",border:"none",color:C.text3,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:14 }}>×</button>
        <div style={{ textAlign:"center",marginBottom:24 }}><div style={{ width:36,height:36,background:`linear-gradient(135deg,${C.purple},${C.accent})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.sf,fontSize:18,color:"#fff",margin:"0 auto 12px" }}>S</div><h2 style={{ fontFamily:C.sf,fontSize:22,fontWeight:400 }}>Developer Portal</h2><p style={{ fontSize:12,color:C.text2,marginTop:4 }}>Build apps. Earn 80% of every sale.</p></div>
        {[["Company name","name","text"],["Email","email","email"],["Password","pw","password"]].map(([ph,k,t])=><input key={k} type={t} placeholder={ph} value={authForm[k]} onChange={e=>setAuthForm(p=>({...p,[k]:e.target.value}))} style={{ width:"100%",background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:"11px 14px",borderRadius:8,fontSize:13,marginBottom:10,outline:"none" }}/>)}
        <button onClick={()=>doAuth("developer")} style={{ width:"100%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,color:"#fff",border:"none",padding:12,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:6 }}>Create developer account →</button>
        <div style={{ marginTop:16,padding:12,background:C.glass,borderRadius:8,border:"1px solid "+C.bdr,fontSize:11,color:C.text2,lineHeight:1.6 }}>✓ 80% revenue · ✓ $0–999/mo pricing · ✓ Stripe payouts · ✓ {"<"}48h review · ✓ 2,400+ buyers</div>
        <p style={{ textAlign:"center",fontSize:10,color:C.text3,marginTop:12 }}>Admin? <span style={{ color:C.orange,cursor:"pointer" }} onClick={()=>doAuth("admin")}>Sign in as admin →</span></p>
      </div></div>}

      {modal==="detail"&&selApp&&<div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>{setModal(null);setSelApp(null);}}><div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)" }}/><div onClick={e=>e.stopPropagation()} style={{ position:"relative",background:C.bg2,border:"1px solid "+C.bdr,borderRadius:20,width:"90%",maxWidth:560,padding:28 }}>
        <button onClick={()=>{setModal(null);setSelApp(null);}} style={{ position:"absolute",top:14,right:14,background:"rgba(230,237,243,0.04)",border:"none",color:C.text3,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:14 }}>×</button>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:18 }}><div style={{ width:52,height:52,background:C.accentDim,border:"1px solid "+C.accentBdr,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>{selApp.icon}</div><div><div style={{ fontSize:20,fontFamily:C.sf,fontWeight:400 }}>{selApp.name}</div><div style={{ display:"flex",alignItems:"center",gap:10,marginTop:3 }}><span style={{ fontSize:10,color:selApp.official?C.accent:C.green }}>{selApp.official?"◆":"●"} {selApp.dev} ✓</span><span style={{ fontSize:11,color:C.accent }}>★ {selApp.rating}</span><span style={{ fontSize:11,color:C.text3 }}>{selApp.reviews} reviews</span></div></div></div>
        <p style={{ fontSize:14,color:C.text2,lineHeight:1.7,marginBottom:16 }}>{selApp.long}</p>
        <div style={{ marginBottom:20 }}><div style={{ fontSize:10,fontWeight:600,color:C.accent,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:10 }}>Features</div><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>{selApp.feats.map(f=><div key={f} style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.text2 }}><span style={{ color:C.green }}>✓</span>{f}</div>)}</div></div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,background:C.glass,borderRadius:12,border:"1px solid "+C.bdr }}>
          <div><span style={{ fontFamily:C.sf,fontSize:28 }}>${selApp.price}</span><span style={{ fontSize:13,color:C.text3 }}>/mo</span><div style={{ fontSize:10,color:C.text3,marginTop:2 }}>Dev gets 80% · 14-day trial</div></div>
          <button onClick={()=>{user?toggleOwn(selApp.id):setModal("auth");}} style={{ background:owned.includes(selApp.id)?"rgba(63,185,80,0.08)":C.accent,color:owned.includes(selApp.id)?C.green:"#fff",border:owned.includes(selApp.id)?"1px solid rgba(63,185,80,0.2)":"none",padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" }}>{owned.includes(selApp.id)?"✓ In workspace":"Add to workspace"}</button>
        </div>
      </div></div>}

      {modal==="submit"&&<div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setModal(null)}><div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)" }}/><div onClick={e=>e.stopPropagation()} style={{ position:"relative",background:C.bg2,border:"1px solid "+C.bdr,borderRadius:20,width:520,padding:"32px 28px" }}>
        <button onClick={()=>setModal(null)} style={{ position:"absolute",top:14,right:14,background:"rgba(230,237,243,0.04)",border:"none",color:C.text3,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:14 }}>×</button>
        <h2 style={{ fontFamily:C.sf,fontSize:22,fontWeight:400,marginBottom:4 }}>Submit new app</h2>
        <p style={{ fontSize:12,color:C.text2,marginBottom:24 }}>Step {subStep+1} of 3</p>
        <div style={{ display:"flex",gap:4,marginBottom:24 }}>{[0,1,2].map(s=><div key={s} style={{ flex:1,height:3,borderRadius:1,background:s<=subStep?C.accent:C.bdr,transition:"background 0.3s" }}/>)}</div>

        {subStep===0&&<div>
          <div style={{ fontSize:11,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>App Details</div>
          <div style={{ display:"grid",gridTemplateColumns:"70px 1fr",gap:12,marginBottom:12 }}>
            <div><div style={{ fontSize:10,color:C.text2,marginBottom:4 }}>Icon</div><select value={subForm.icon} onChange={e=>setSubForm(p=>({...p,icon:e.target.value}))} style={{ width:"100%",background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:10,borderRadius:8,fontSize:20,textAlign:"center" }}>{["⚡","📋","🎯","✉️","💬","💰","📧","📊","❓","📈","⚔️","📅","🏆","🔥"].map(e=><option key={e} value={e}>{e}</option>)}</select></div>
            <div><div style={{ fontSize:10,color:C.text2,marginBottom:4 }}>App name</div><input placeholder="e.g. Deal Forecast Narrator" value={subForm.name} onChange={e=>setSubForm(p=>({...p,name:e.target.value}))} style={{ width:"100%",background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:"10px 14px",borderRadius:8,fontSize:13,outline:"none" }}/></div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
            <div><div style={{ fontSize:10,color:C.text2,marginBottom:4 }}>Category</div><select value={subForm.cat} onChange={e=>setSubForm(p=>({...p,cat:e.target.value}))} style={{ width:"100%",background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:10,borderRadius:8,fontSize:13 }}>{CATS.slice(1).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><div style={{ fontSize:10,color:C.text2,marginBottom:4 }}>Price ($/mo)</div><input type="number" placeholder="0–999" value={subForm.price} onChange={e=>setSubForm(p=>({...p,price:e.target.value}))} style={{ width:"100%",background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:"10px 14px",borderRadius:8,fontSize:13,outline:"none" }}/></div>
          </div>
          <div style={{ fontSize:10,color:C.text2,marginBottom:4 }}>Description</div>
          <input placeholder="One line that sells it" value={subForm.desc} onChange={e=>setSubForm(p=>({...p,desc:e.target.value}))} style={{ width:"100%",background:C.glass,border:"1px solid "+C.bdr,color:C.text,padding:"10px 14px",borderRadius:8,fontSize:13,outline:"none" }}/>
        </div>}

        {subStep===1&&<div>
          <div style={{ fontSize:11,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>Upload App File</div>
          <div style={{ border:"2px dashed "+C.bdr,borderRadius:12,padding:40,textAlign:"center",marginBottom:16 }}>
            <div style={{ fontSize:32,marginBottom:8 }}>📁</div>
            <div style={{ fontSize:14,fontWeight:500,marginBottom:4 }}>Drop your HTML file here</div>
            <div style={{ fontSize:12,color:C.text3 }}>Single .html, max 5MB</div>
            <button style={{ background:C.accentDim,color:C.accent,border:"1px solid "+C.accentBdr,padding:"8px 20px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:16 }}>Choose file</button>
          </div>
          <div style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:10,padding:14 }}><div style={{ fontSize:11,fontWeight:600,marginBottom:8 }}>Requirements</div>{["Single HTML with embedded JS/CSS","Provider selector (OpenAI/Anthropic)","API key input field","No external scripts (except CDNs)","No data exfiltration","postMessage bridge for keys"].map(r=><div key={r} style={{ fontSize:11,color:C.text2,padding:"3px 0",display:"flex",gap:6 }}><span style={{ color:C.accent }}>○</span>{r}</div>)}</div>
        </div>}

        {subStep===2&&<div>
          <div style={{ fontSize:11,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>Review & Submit</div>
          <div style={{ background:C.glass,border:"1px solid "+C.bdr,borderRadius:12,padding:20,marginBottom:16,display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:48,height:48,background:C.accentDim,border:"1px solid "+C.accentBdr,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>{subForm.icon}</div>
            <div><div style={{ fontSize:16,fontWeight:600 }}>{subForm.name||"Untitled"}</div><div style={{ fontSize:11,color:C.text2 }}>{subForm.cat} · ${subForm.price||"0"}/mo</div></div>
          </div>
          <div style={{ background:"rgba(88,166,255,0.03)",border:"1px solid "+C.accentBdr,borderRadius:10,padding:14,fontSize:12,color:C.text2,lineHeight:1.7 }}>
            <div style={{ fontWeight:600,color:C.accent,marginBottom:6 }}>What happens next</div>
            1. Automated security scan<br/>2. Manual review ({"<"} 48h)<br/>3. Email with result<br/>4. Live in marketplace<br/>5. Revenue via Stripe Connect
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",marginTop:12,fontSize:12,color:C.text2 }}><span>Split: <strong style={{ color:C.green }}>You 80%</strong> / 20%</span><span>Payout: Monthly</span></div>
        </div>}

        <div style={{ display:"flex",justifyContent:"space-between",marginTop:20 }}>
          {subStep>0?<button onClick={()=>setSubStep(s=>s-1)} style={{ background:"transparent",border:"1px solid "+C.bdr,color:C.text2,padding:"10px 24px",borderRadius:8,fontSize:13,cursor:"pointer" }}>← Back</button>:<div/>}
          {subStep<2?<button onClick={()=>setSubStep(s=>s+1)} style={{ background:C.accent,color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" }}>Continue →</button>
          :<button onClick={()=>{setModal(null);notify("Submitted for review!","success");}} style={{ background:`linear-gradient(135deg,${C.green},${C.accent})`,color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" }}>Submit ✓</button>}
        </div>
      </div></div>}
    </div>
  );
}
