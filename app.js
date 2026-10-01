const SUPABASE_URL = "https://kwsatixuftemxlhluzjc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1xUoMevCXVbJeF5S3Q2D_w_ouZ2eJRJ";

const NAMES = ["Alexander","Nicolina","Anna","Jan","Iwona","Dariusz","Magda","Livan"];
const configured = !SUPABASE_URL.includes("DEIN-PROJEKT") && !SUPABASE_ANON_KEY.includes("DEIN_ANON_KEY");
const db = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const el = id => document.getElementById(id);
let state = { drawn: [], selected: null };

function toast(msg){ const t=el("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2600); }
function render(){
  el("participants").innerHTML="";
  NAMES.forEach(name=>{
    const b=document.createElement("button");
    b.className="participant"+(state.selected===name?" selected":"");
    b.textContent=name;
    b.disabled=state.drawn.includes(name);
    b.onclick=()=>{state.selected=name; render();};
    el("participants").appendChild(b);
  });
  el("selectionPanel").hidden=!state.selected;
  el("selectedName").textContent=state.selected||"—";
  el("statusList").innerHTML=NAMES.map(n=>`<div class="status-row"><strong>${n}</strong><span class="status-state ${state.drawn.includes(n)?"done":"open"}">${state.drawn.includes(n)?"gezogen ✓":"offen"}</span></div>`).join("");
  el("drawnCount").textContent=state.drawn.length;
  el("remainingCount").textContent=NAMES.length-state.drawn.length;
}

async function refresh(){
  if(!configured){ render(); toast("Supabase-Zugangsdaten fehlen noch."); return; }
  const {data,error}=await db.rpc("lottery_status");
  if(error){ console.error(error); toast("Status konnte nicht geladen werden."); return; }
  state.drawn=(data||[]).filter(x=>x.has_drawn).map(x=>x.name);
  if(state.selected && state.drawn.includes(state.selected)) state.selected=null;
  render();
}

async function draw(){
  if(!state.selected) return;
  if(!configured){ toast("Bitte zuerst Supabase in app.js konfigurieren."); return; }
  const btn=el("drawButton");
  btn.disabled=true;
  btn.innerHTML="✨ Los wird gezogen …";
  await new Promise(r=>setTimeout(r,900));
  const {data,error}=await db.rpc("draw_lottery",{p_giver:state.selected});
  btn.disabled=false;
  btn.innerHTML='<span class="button-icon">🎟️</span> Los ziehen';
  if(error){ console.error(error); toast(error.message||"Ziehung fehlgeschlagen."); await refresh(); return; }
  const recipient=typeof data==="string"?data:data?.recipient;
  if(!recipient){ toast("Kein Ergebnis erhalten."); return; }
  el("recipientName").textContent=recipient;
  el("lotteryCard").hidden=true;
  el("resultCard").hidden=false;
  await refresh();
  window.scrollTo({top:el("resultCard").offsetTop-20,behavior:"smooth"});
}

el("drawButton").addEventListener("click",draw);
el("refreshButton").addEventListener("click",refresh);
el("closeResult").addEventListener("click",()=>{
  el("resultCard").hidden=true;
  el("lotteryCard").hidden=false;
  state.selected=null;
  render();
  window.scrollTo({top:0,behavior:"smooth"});
});
render();
refresh();