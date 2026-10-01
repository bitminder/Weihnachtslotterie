const SUPABASE_URL = "https://kwsatixuftemxlhluzjc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1xUoMevCXVbJeF5S3Q2D_w_ouZ2eJRJ";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const el = id => document.getElementById(id);
const params = new URLSearchParams(window.location.search);
const person = params.get("p");
const code = Number(params.get("c"));

let state = { drawnCount: 0, valid: false, claimed: false };

function toast(msg){
  const t=el("toast");
  t.textContent=msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2600);
}

function showOnly(id){
  ["loadingCard","drawCard","lockedCard","invalidCard","resultCard"].forEach(x=>{
    el(x).hidden = x !== id;
  });
}

async function refreshCount(){
  const {data,error}=await db.rpc("lottery_status_secure");
  if(!error){
    state.drawnCount = Number(data?.[0]?.drawn_count ?? 0);
    el("drawnCount").textContent = state.drawnCount;
  }
}

async function init(){
  await refreshCount();

  if(!person || !Number.isInteger(code) || code < 100000 || code > 999999){
    showOnly("invalidCard");
    return;
  }

  const {data,error}=await db.rpc("lottery_identity",{p_name:person,p_code:code});
  if(error || !data?.length){
    showOnly("invalidCard");
    return;
  }

  state.valid = true;
  state.claimed = Boolean(data[0].claimed);
  el("helloName").textContent = `Hallo ${data[0].name}!`;

  if(state.claimed){
    showOnly("lockedCard");
  }else{
    showOnly("drawCard");
  }
}

async function draw(){
  if(!state.valid || state.claimed) return;

  const btn=el("drawButton");
  btn.disabled=true;
  btn.innerHTML="✨ Los wird gezogen …";
  await new Promise(r=>setTimeout(r,900));

  const {data,error}=await db.rpc("draw_lottery_secure",{p_name:person,p_code:code});

  btn.disabled=false;
  btn.innerHTML='<span class="button-icon">🎟️</span>Mein Los ziehen';

  if(error){
    console.error(error);
    state.claimed=true;
    await refreshCount();
    showOnly("lockedCard");
    toast("Dieses Los wurde bereits gezogen.");
    return;
  }

  state.claimed=true;
  el("recipientName").textContent=data;
  await refreshCount();
  showOnly("resultCard");
  window.scrollTo({top:el("resultCard").offsetTop-20,behavior:"smooth"});
}

el("drawButton").addEventListener("click",draw);
el("closeResult").addEventListener("click",()=>{
  showOnly("lockedCard");
  window.scrollTo({top:0,behavior:"smooth"});
});

init();