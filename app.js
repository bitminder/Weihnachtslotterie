const SUPABASE_URL = "https://kwsatixuftemxlhluzjc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1xUoMevCXVbJeF5S3Q2D_w_ouZ2eJRJ";
const NAMES = ["Alexander","Nicolina","Anna","Jan","Iwona","Dariusz","Magda","Livan"];
const DEVICE_LOCK_KEY = "weihnachtslotterie-2026-drawn";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const el = id => document.getElementById(id);
let state = { selected: null, drawnCount: 0, locked: localStorage.getItem(DEVICE_LOCK_KEY) === "1" };

function toast(msg){
  const t=el("toast");
  t.textContent=msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2600);
}

function render(){
  el("drawnCount").textContent = state.drawnCount;
  el("participants").innerHTML = "";

  NAMES.forEach(name=>{
    const b=document.createElement("button");
    b.className="participant"+(state.selected===name?" selected":"");
    b.textContent=name;
    b.disabled=state.locked;
    b.onclick=()=>{
      if(state.locked) return;
      state.selected=name;
      render();
    };
    el("participants").appendChild(b);
  });

  el("selectionPanel").hidden = !state.selected || state.locked;
  el("selectedName").textContent = state.selected || "—";
  el("lockedPanel").hidden = !state.locked;
}

async function refresh(){
  const {data,error}=await db.rpc("lottery_status");
  if(error){
    console.error(error);
    toast("Status konnte nicht geladen werden.");
    return;
  }
  state.drawnCount = Number(data?.[0]?.drawn_count ?? 0);
  render();
}

async function draw(){
  if(!state.selected || state.locked) return;
  const btn=el("drawButton");
  btn.disabled=true;
  btn.innerHTML="✨ Los wird gezogen …";
  await new Promise(r=>setTimeout(r,900));

  const {data,error}=await db.rpc("draw_lottery",{p_giver:state.selected});

  btn.disabled=false;
  btn.innerHTML='<span class="button-icon">🎟️</span> Los ziehen';

  if(error){
    console.error(error);
    toast(error.message||"Ziehung fehlgeschlagen.");
    await refresh();
    return;
  }

  const recipient=typeof data==="string"?data:data?.recipient;
  if(!recipient){
    toast("Kein Ergebnis erhalten.");
    return;
  }

  localStorage.setItem(DEVICE_LOCK_KEY,"1");
  state.locked=true;
  el("recipientName").textContent=recipient;
  el("lotteryCard").hidden=true;
  el("resultCard").hidden=false;
  await refresh();
  window.scrollTo({top:el("resultCard").offsetTop-20,behavior:"smooth"});
}

el("drawButton").addEventListener("click",draw);
el("closeResult").addEventListener("click",()=>{
  el("resultCard").hidden=true;
  el("lotteryCard").hidden=false;
  state.selected=null;
  render();
  window.scrollTo({top:0,behavior:"smooth"});
});

render();
refresh();