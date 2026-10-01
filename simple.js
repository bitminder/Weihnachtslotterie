const NAMES = ["Alexander","Nicolina","Anna","Jan","Iwona","Dariusz","Magda","Livan"];
const DEVICE_LOCK_KEY = "weihnachtslotterie-2026-device-drawn";
const el = id => document.getElementById(id);
let state = {
  selected: null,
  drawnCount: 0,
  deviceLocked: localStorage.getItem(DEVICE_LOCK_KEY) === "1"
};
let db = null;

function toast(message){
  const t = el("toast");
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function render(){
  el("participants").innerHTML = "";

  NAMES.forEach(name => {
    const button = document.createElement("button");
    button.className = "participant" + (state.selected === name ? " selected" : "");
    button.textContent = name;
    button.disabled = state.deviceLocked;
    button.onclick = () => {
      if(state.deviceLocked) return;
      state.selected = name;
      render();
    };
    el("participants").appendChild(button);
  });

  el("selectionPanel").hidden = !state.selected || state.deviceLocked;
  el("lockedPanel").hidden = !state.deviceLocked;
  el("selectedName").textContent = state.selected || "—";
  el("drawnCount").textContent = state.drawnCount;
}

async function initClient(){
  const source = await fetch("./app.js", { cache: "no-store" }).then(r => r.text());
  const url = source.match(/const SUPABASE_URL = "([^"]+)"/)?.[1];
  const key = source.match(/const SUPABASE_ANON_KEY = "([^"]+)"/)?.[1];
  if(!url || !key) throw new Error("Supabase-Konfiguration fehlt");
  db = window.supabase.createClient(url, key);
}

async function refreshCount(){
  const { data, error } = await db.rpc("lottery_status");
  if(error){
    console.error(error);
    toast("Status konnte nicht geladen werden.");
    return;
  }
  state.drawnCount = Number(data?.[0]?.drawn_count ?? 0);
  render();
}

async function draw(){
  if(!state.selected || !db || state.deviceLocked) return;

  const button = el("drawButton");
  button.disabled = true;
  button.innerHTML = "✨ Los wird gezogen …";
  await new Promise(resolve => setTimeout(resolve, 900));

  const { data, error } = await db.rpc("draw_lottery", { p_giver: state.selected });

  button.disabled = false;
  button.innerHTML = '<span class="button-icon">🎟️</span>Los ziehen';

  if(error){
    console.error(error);
    toast(String(error.message || "").includes("bereits gezogen")
      ? "Diese Person hat bereits gezogen."
      : (error.message || "Ziehung fehlgeschlagen."));
    await refreshCount();
    return;
  }

  localStorage.setItem(DEVICE_LOCK_KEY, "1");
  state.deviceLocked = true;

  el("recipientName").textContent = data;
  el("lotteryCard").hidden = true;
  el("resultCard").hidden = false;

  await refreshCount();
  window.scrollTo({ top: el("resultCard").offsetTop - 20, behavior: "smooth" });
}

el("drawButton").addEventListener("click", draw);

el("closeResult").addEventListener("click", () => {
  el("resultCard").hidden = true;
  el("lotteryCard").hidden = false;
  state.selected = null;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

(async () => {
  render();
  try {
    await initClient();
    await refreshCount();
  } catch (error) {
    console.error(error);
    toast("Verbindung zur Ziehung fehlgeschlagen.");
  }
})();