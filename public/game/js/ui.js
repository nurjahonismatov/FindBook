// All DOM screens: menu, setup screens, shop/collection, HUD, result, toasts.
import { S, save, levelOf, levelProgress, effAttrs, reset } from "./store.js";
import { t, setLang, getLang, LANG_NAMES } from "./i18n.js";
import { CLUBS, clubById, badge, ITEMS, CATS, CAT_KEY, itemById, CAREER, TOURNAMENTS, MISSIONS, SKINS, HAIRS, HAIR_COLORS, POSITIONS } from "./data.js";
import { sfx } from "./audio.js";

const $app=()=>document.getElementById("app");
const L=()=>({en:0,uz:1,ru:2})[getLang()]??0;
const nm=it=>it.name[L()], ds=it=>it.desc[L()];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const CAT_IC={boots:"👟",kits:"👕",gloves:"🧤",balls:"⚽",stadium:"💡",acc:"🎽",celeb:"🎉"};
const ATTRS=["power","acc","curve","pen","reflex","dive"];
const upCost=v=>Math.round(60+(v-50)*14);

let api={}, cur="menu", st={ opp:"rma", diff:"normal", cat:"boots", ccat:"all" };

export function init(handlers){
  api=handlers;
  const app=$app();
  app.addEventListener("click",e=>{
    const el=e.target.closest("[data-act]"); if(!el||el.disabled) return;
    sfx.click(); const fn=ACT[el.dataset.act]; fn&&fn(el.dataset,el);
  });
  app.addEventListener("input",onField); app.addEventListener("change",onField);
  app.addEventListener("pointerover",e=>{ if(e.target.closest?.(".mi,.btn,.card")&&e.pointerType==="mouse") sfx.hover(); });
}

function onField(e){
  const el=e.target, k=el.dataset.set; if(!k) return;
  const v=el.type==="range"?parseFloat(el.value):el.type==="number"?parseInt(el.value||"0",10):el.value;
  const path=k.split("."); let o=S; for(let i=0;i<path.length-1;i++) o=o[path[i]];
  o[path[path.length-1]]=k==="player.num"?Math.max(1,Math.min(99,v||1)):k==="player.name"?String(v).slice(0,16):v;
  save(); api.onSettings?.(k);
}

/* ---------- helpers ---------- */
function topbar(title){ return `<div class="topbar"><button class="back" data-act="go" data-s="menu">‹</button><h2>${title}</h2>${wallet()}</div>`; }
function wallet(){ return `<span class="chip gold">🪙 ${S.coins}</span><span class="chip neon">${t("level")} ${levelOf(S.xp)}</span>`; }
function render(html){ const a=$app(); a.innerHTML=html; }
export function toast(msg){ const el=document.getElementById("toast"); el.textContent=msg; el.classList.add("on"); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove("on"),2200); }
function seg(key,opts,val,act="seg"){ return `<div class="seg">${opts.map(o=>`<button class="${o===val?"on":""}" data-act="${act}" data-k="${key}" data-v="${o}">${t(o)}</button>`).join("")}</div>`; }
function clubCard(c,sel,act,lockLv){ const locked=lockLv&&levelOf(S.xp)<c.unlock; return `<div class="card glass ${sel?"sel":""} ${locked?"lock":""}" data-act="${locked?"":act}" data-id="${c.id}">${badge(c,52)}<div class="t">${c.name}</div><div class="s">${locked?`🔒 ${t("unlockAt")} ${c.unlock}`:`${t("rating")} ${c.rating}`}</div></div>`; }

/* ---------- screens ---------- */
const SCREENS={
  menu(){
    const c=clubById(S.club), lv=levelOf(S.xp), today=new Date().toDateString(), canDaily=S.daily.last!==today;
    return `<div class="screen menu"><div class="menu-wrap">
      <div><div class="logo">FINAL<span>KICK</span></div><div class="tagline">${t("tagline")}</div></div>
      <div class="profile glass">${badge(c,40)}<div style="flex:1"><div class="pn">${esc(S.player.name)} <small style="color:var(--mut)">#${S.player.num}</small></div><div class="disc" style="opacity:1">${c.name} · ${t("level")} ${lv}</div><div class="lvl"><i style="width:${levelProgress(S.xp)*100}%"></i></div></div><span class="chip gold">🪙 ${S.coins}</span></div>
      <div class="menu-list">
        <button class="mi main" data-act="go" data-s="quick"><span class="ic">▶</span>${t("play")}</button>
        <button class="mi" data-act="go" data-s="career"><span class="ic">🏟</span>${t("career")}</button>
        <button class="mi" data-act="go" data-s="tournament"><span class="ic">🏆</span>${t("tournament")}</button>
        <button class="mi" data-act="go" data-s="shop"><span class="ic">🛒</span>${t("shop")}</button>
        <button class="mi" data-act="go" data-s="settings"><span class="ic">⚙</span>${t("settings")}</button>
      </div>
      <div class="menu-sub">
        <button class="mi" data-act="go" data-s="player">👤<span>${t("myPlayer")}</span></button>
        <button class="mi" data-act="go" data-s="club">🛡<span>${t("myClub")}</span></button>
        <button class="mi" data-act="go" data-s="collection">🎒<span>${t("collection")}</span></button>
        <button class="mi" data-act="go" data-s="stats">📊<span>${t("stats")}</span></button>
        <button class="mi" data-act="go" data-s="missions">🎯<span>${t("missions")}</span></button>
        <button class="mi" data-act="daily" ${canDaily?"":"disabled style='opacity:.4'"}>🎁<span>${t("daily")}</span></button>
      </div>
      <div class="seg">${Object.keys(LANG_NAMES).map(l=>`<button class="${l===getLang()?"on":""}" data-act="lang" data-v="${l}">${LANG_NAMES[l]}</button>`).join("")}</div>
      <div class="disc">${t("disclaimer")}</div>
    </div></div>`;
  },
  quick(){
    return `<div class="screen">${topbar(t("quick"))}
      <div class="sec glass"><h3>${t("yourClub")}</h3><div class="row">${badge(clubById(S.club),44)}<b style="font-family:var(--hd);font-size:22px">${clubById(S.club).name}</b></div></div>
      <div class="sec glass"><h3>${t("difficulty")}</h3>${seg("diff",["easy","normal","hard","pro"],st.diff)}</div>
      <div class="sec glass"><h3>${t("opponent")}</h3><div class="grid">${CLUBS.filter(c=>c.id!==S.club).map(c=>clubCard(c,c.id===st.opp,"opp")).join("")}</div></div>
      <div class="footer"><button class="btn primary" data-act="kick">${t("kickoff")} ▶</button></div></div>`;
  },
  career(){
    const s=S.career.stage, done=s>=CAREER.length;
    return `<div class="screen">${topbar(t("career"))}
      <div class="sec glass"><div style="color:var(--mut)">${t("careerDesc")}</div></div>
      <div class="grid">${CAREER.map((c,i)=>{ const cl=clubById(c.opp); const st2=i<s?"✅ "+t("completed"):i===s?"▶ "+t("current"):"🔒 "+t("locked");
        return `<div class="card glass ${i===s?"sel":""} ${i>s?"lock":""}">${badge(cl,48)}<div class="t">${t("stage")} ${i+1}</div><div class="s">${cl.name}</div><div class="s">${t(c.diff)} · ${st2}</div></div>`; }).join("")}</div>
      <div class="footer">${done?`<span class="chip neon">🏆 ${t("champion")}</span>`:`<button class="btn primary" data-act="career">${t("playStage")} ${s+1} ▶</button>`}</div></div>`;
  },
  tournament(){
    const tr=S.tour, lv=levelOf(S.xp);
    if(tr){ const T=TOURNAMENTS.find(x=>x.id===tr.id), rk=["qf","sf","final"][tr.round], opp=clubById(tr.opps[tr.round]);
      return `<div class="screen">${topbar(t(T.key))}
        <div class="sec glass" style="align-items:center;text-align:center"><div style="font-size:54px">${T.icon}</div><h3>${t(rk)}</h3>
        <div class="row" style="justify-content:center">${badge(clubById(S.club),56)}<b style="font-family:var(--hd);font-size:28px">${t("homeAway")}</b>${badge(opp,56)}</div>
        <div>${opp.name} · ${t(T.diff)}</div><div class="s" style="color:var(--gold)">${t("prize")}: 🪙 ${T.prize} · ${T.xp} XP</div></div>
        <div class="footer"><button class="btn danger" data-act="tourQuit">${t("abandon")}</button><button class="btn primary" data-act="tourPlay">${t("play")} ▶</button></div></div>`; }
    return `<div class="screen">${topbar(t("tournament"))}<div class="grid">${TOURNAMENTS.map(T=>{ const lock=lv<T.minLevel;
      return `<div class="card glass ${lock?"lock":""}" data-act="${lock?"":"tourStart"}" data-id="${T.id}"><div style="font-size:44px">${T.icon}</div><div class="t">${t(T.key)}</div><div class="s">${t(T.diff)}</div><div class="s" style="color:var(--gold)">🪙 ${T.prize} · ${T.xp} XP</div>${lock?`<div class="s">🔒 ${t("unlockAt")} ${T.minLevel}</div>`:`<span class="btn sm primary">${t("enter")}</span>`}</div>`; }).join("")}</div></div>`;
  },
  club(){ return `<div class="screen">${topbar(t("myClub"))}<div class="grid">${CLUBS.map(c=>clubCard(c,c.id===S.club,"club",true)).join("")}</div></div>`; },
  player(){
    const p=S.player, a=effAttrs();
    return `<div class="screen">${topbar(t("myPlayer"))}
      <div class="sec glass"><div class="row">
        <label class="field" style="flex:2;min-width:160px">${t("name")}<input type="text" maxlength="16" value="${esc(p.name)}" data-set="player.name"></label>
        <label class="field" style="flex:1;min-width:80px">${t("number")}<input type="number" min="1" max="99" value="${p.num}" data-set="player.num"></label>
        <label class="field" style="flex:1;min-width:120px">${t("position")}<select data-set="player.pos">${POSITIONS.map(x=>`<option value="${x}" ${x===p.pos?"selected":""}>${t(x)}</option>`).join("")}</select></label></div>
        <div class="field">${t("skin")}<div class="row">${SKINS.map((c,i)=>`<span class="swatch ${i===p.skin?"on":""}" style="background:${c}" data-act="look" data-k="skin" data-v="${i}"></span>`).join("")}</div></div>
        <div class="field">${t("hair")}${seg("hair",HAIRS,HAIRS[p.hair],"hair")}</div>
        <div class="field">${t("hairColor")}<div class="row">${HAIR_COLORS.map((c,i)=>`<span class="swatch ${i===p.hairColor?"on":""}" style="background:${c}" data-act="look" data-k="hairColor" data-v="${i}"></span>`).join("")}</div></div></div>
      <div class="sec glass"><h3>${t("attributes")}</h3>${ATTRS.map(k=>{ const v=p.attrs[k], c=upCost(v);
        return `<div class="attr"><span>${t("a_"+k)}</span><div class="bar"><i style="width:${a[k]}%"></i></div><b>${a[k]}</b><button class="btn sm" data-act="up" data-k="${k}" ${v>=99||S.coins<c?"disabled":""}>+ 🪙${c}</button></div>`; }).join("")}</div></div>`;
  },
  shop(){
    return `<div class="screen">${topbar(t("shop"))}
      <div class="seg">${CATS.map(c=>`<button class="${c===st.cat?"on":""}" data-act="cat" data-v="${c}">${CAT_IC[c]} ${t(CAT_KEY[c])}</button>`).join("")}</div>
      <div class="grid">${ITEMS.filter(i=>i.cat===st.cat).map(itemCard).join("")}</div></div>`;
  },
  collection(){
    const list=ITEMS.filter(i=>S.owned.includes(i.id)&&(st.ccat==="all"||i.cat===st.ccat));
    return `<div class="screen">${topbar(t("collection"))}
      <div class="seg"><button class="${st.ccat==="all"?"on":""}" data-act="ccat" data-v="all">${t("all")}</button>${CATS.map(c=>`<button class="${c===st.ccat?"on":""}" data-act="ccat" data-v="${c}">${CAT_IC[c]} ${t(CAT_KEY[c])}</button>`).join("")}</div>
      <div class="grid">${list.length?list.map(itemCard).join(""):`<div style="color:var(--mut)">${t("empty")}</div>`}</div></div>`;
  },
  stats(){
    const s=S.stats, wr=s.matches?Math.round(s.wins/s.matches*100):0;
    const box=(v,k)=>`<div class="stat glass"><b>${v}</b><span>${t(k)}</span></div>`;
    return `<div class="screen">${topbar(t("stats"))}
      <div class="stat-grid">${box(s.matches,"matches")}${box(s.wins,"wins")}${box(s.losses,"losses")}${box(wr+"%","winRate")}${box(s.goals,"goalsScored")}${box(s.conceded,"goalsConceded")}${box(s.saves,"pensSaved")}${box(s.tours,"tournament")}${box(s.bestStreak,"dayStreak")}</div>
      <div class="sec glass"><h3>${t("last10")}</h3>${s.history.length?s.history.map(h=>`<div class="hist"><span>${badge(clubById(h.opp),20).replace('class="badge"','class="badge" style="display:inline-grid;vertical-align:middle"')} ${clubById(h.opp).name}</span><b class="${h.win?"w":"l"}">${h.gh} – ${h.ga} ${h.win?"W":"L"}</b></div>`).join(""):`<div style="color:var(--mut)">${t("noHistory")}</div>`}</div></div>`;
  },
  missions(){
    return `<div class="screen">${topbar(t("missions"))}<div style="display:flex;flex-direction:column;gap:10px">${MISSIONS.map(m=>{ const p=missionProg(m), done=p>=m.goal;
      return `<div class="mission glass"><div style="font-size:26px">🎯</div><div class="grow"><b>${t(m.key)}</b><div class="bar" style="margin-top:6px"><i style="width:${Math.min(1,p/m.goal)*100}%"></i></div><div class="s" style="font-size:12px;color:var(--mut);margin-top:4px">${Math.min(p,m.goal)}/${m.goal} · 🪙 ${m.coins} · ${m.xp} XP</div></div><button class="btn sm ${done?"primary":""}" data-act="claim" data-id="${m.id}" ${done?"":"disabled"}>${t("claim")}</button></div>`; }).join("")}</div></div>`;
  },
  settings(){
    const s=S.settings;
    return `<div class="screen">${topbar(t("settings"))}
      <div class="sec glass"><h3>${t("language")}</h3><div class="seg">${Object.keys(LANG_NAMES).map(l=>`<button class="${l===getLang()?"on":""}" data-act="lang" data-v="${l}">${LANG_NAMES[l]}</button>`).join("")}</div></div>
      <div class="sec glass"><label class="field">${t("music")}<input type="range" min="0" max="1" step="0.05" value="${s.music}" data-set="settings.music"></label>
        <label class="field">${t("sfx")}<input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-set="settings.sfx"></label>
        <label class="field">${t("sensitivity")}<input type="range" min="0.5" max="1.8" step="0.05" value="${s.sens}" data-set="settings.sens"></label></div>
      <div class="sec glass"><h3>${t("graphics")}</h3>${seg("quality",["low","medium","high"],s.quality,"set")}<h3>${t("camera")}</h3>${seg("camera",["camPlayer","camBroadcast"],s.camera,"set")}</div>
      <div class="row"><button class="btn" data-act="fs">⛶ ${t("fullscreen")}</button><button class="btn danger" data-act="reset">${t("reset")}</button></div></div>`;
  },
};

function missionProg(m){ const v=S.stats[m.stat]||0; return v-(S.missionBase[m.id]||0); }
function itemCard(it){
  const own=S.owned.includes(it.id), eq=S.equipped[it.cat]===it.id, col=it.col==="#club"?clubById(S.club).c1:it.col;
  const btn=eq?`<span class="chip neon">✓ ${t("equipped")}</span>`:own?`<button class="btn sm" data-act="equip" data-id="${it.id}">${t("equip")}</button>`:`<button class="btn sm primary" data-act="buy" data-id="${it.id}" ${S.coins<it.price?"disabled":""}>🪙 ${it.price}</button>`;
  return `<div class="card glass r-${it.rar} ${eq?"sel":""}"><div class="item-ic" style="--col:${col}">${CAT_IC[it.cat]}</div><div class="rar ${it.rar}">${t(it.rar)}</div><div class="t">${nm(it)}</div><div class="s">${ds(it)}</div>${btn}</div>`;
}

/* ---------- actions ---------- */
const ACT={
  go:d=>show(d.s),
  lang:d=>{ S.lang=d.v; setLang(d.v); save(); show(cur); },
  seg:d=>{ st[d.k]=d.v; show(cur); },
  opp:d=>{ st.opp=d.id; show(cur); },
  kick:()=>api.startMatch({ kind:"quick", opp:st.opp, diff:st.diff }),
  career:()=>{ const c=CAREER[S.career.stage]; if(!c) return; let opp=c.opp===S.club?"rma":c.opp; if(opp===S.club) opp="bar"; api.startMatch({ kind:"career", opp, diff:c.diff }); },
  tourStart:d=>{ const pool=CLUBS.filter(c=>c.id!==S.club).sort(()=>Math.random()-0.5).slice(0,3).sort((a,b)=>a.rating-b.rating); S.tour={ id:d.id, round:0, opps:pool.map(c=>c.id) }; save(); show("tournament"); },
  tourPlay:()=>{ const T=TOURNAMENTS.find(x=>x.id===S.tour.id); api.startMatch({ kind:"tour", opp:S.tour.opps[S.tour.round], diff:T.diff }); },
  tourQuit:()=>{ S.tour=null; save(); show("tournament"); },
  club:d=>{ S.club=d.id; if(st.opp===d.id) st.opp=CLUBS.find(c=>c.id!==d.id).id; save(); api.onSettings?.("club"); toast(`${t("selectClub")}: ${clubById(d.id).name}`); show(cur); },
  look:d=>{ S.player[d.k]=+d.v; save(); show(cur); },
  hair:d=>{ S.player.hair=HAIRS.indexOf(d.v); save(); show(cur); },
  up:d=>{ const v=S.player.attrs[d.k], c=upCost(v); if(S.coins<c||v>=99) return toast(t("noCoins")); S.coins-=c; S.player.attrs[d.k]=v+1; save(); sfx.coin(); show(cur); },
  cat:d=>{ st.cat=d.v; show(cur); },
  ccat:d=>{ st.ccat=d.v; show(cur); },
  buy:d=>{ const it=itemById(d.id); if(S.coins<it.price) return toast(t("noCoins")); S.coins-=it.price; S.owned.push(it.id); S.equipped[it.cat]=it.id; save(); sfx.coin(); toast(`${t("bought")}: ${nm(it)}`); api.onSettings?.("equip"); show(cur); },
  equip:d=>{ const it=itemById(d.id); S.equipped[it.cat]=it.id; save(); api.onSettings?.("equip"); toast(`${t("equipped")}: ${nm(it)}`); show(cur); },
  claim:d=>{ const m=MISSIONS.find(x=>x.id===d.id); if(missionProg(m)<m.goal) return; S.missionBase[m.id]=(S.missionBase[m.id]||0)+m.goal; const up=api.reward(m.coins,m.xp); sfx.coin(); toast(`${t("claimed")} +🪙${m.coins} +${m.xp} XP`); if(up) setTimeout(()=>toast(t("levelUp")),2300); show(cur); },
  daily:()=>{ const today=new Date().toDateString(); if(S.daily.last===today) return; const y=new Date(Date.now()-864e5).toDateString();
    S.daily.streak=S.daily.last===y?S.daily.streak+1:1; S.daily.last=today; const c=100+Math.min(S.daily.streak,7)*50; api.reward(c,50); sfx.coin(); toast(`${t("daily")}: +🪙${c} · ${t("dayStreak")} ${S.daily.streak}`); show(cur); },
  set:d=>{ S.settings[d.k]=d.v; save(); api.onSettings?.("settings."+d.k); show(cur); },
  fs:()=>{ const de=document.documentElement; if(!document.fullscreenElement) de.requestFullscreen?.().catch(()=>{}); else document.exitFullscreen?.(); },
  reset:()=>{ if(!confirm(t("resetConfirm"))) return; reset(); setLang(S.lang); api.onSettings?.("reset"); toast(t("resetDone")); show("menu"); },
  quit:()=>{ if(confirm(t("quit")+"?")) api.quitMatch(); },
  rematch:()=>api.rematch(),
  next:()=>api.next(),
  menu:()=>api.toMenu(),
};

export function show(name){ cur=name; render(SCREENS[name]()); }
export function current(){ return cur; }

/* ---------- match HUD ---------- */
export function hud(m){
  // m: { home, away, homeClub, awayClub, round, sudden, shooter, keeper, userShoots }
  const hc=m.homeClub, ac=m.awayClub, gh=m.home.filter(Boolean).length, ga=m.away.filter(Boolean).length;
  const n=Math.max(5,m.home.length+(m.turn==="home"?1:0),m.away.length+(m.turn==="away"?1:0));
  const dots=(arr,side)=>{ let h=""; for(let i=n-5;i<n;i++){ const v=arr[i]; h+=`<span class="dot ${v===true?"g":v===false?"m":""} ${i===arr.length&&m.turn===side?"cur":""}"></span>`; } return h; };
  render(`<div class="hud">
    <div class="scoreboard glass"><div class="sb-main"><div class="sb-team">${badge(hc,30)}${hc.short}</div><div class="sb-score">${gh} : ${ga}</div><div class="sb-team away">${ac.short}${badge(ac,30)}</div></div>
      <div class="sb-dots"><div class="dots">${dots(m.home,"home")}</div><div class="dots">${dots(m.away,"away")}</div></div>
      <div class="sb-round ${m.sudden?"sd":""}">${m.sudden?t("suddenDeath"):`${t("round")} ${m.round}`}</div></div>
    <div class="duel glass"><span>⚽ <b>${esc(m.shooter)}</b></span><span class="vs">${t("homeAway")}</span><span>🧤 <b>${esc(m.keeper)}</b></span></div>
    ${m.userShoots?`<div class="power glass"><i id="pw"></i><b id="power-value">0%</b></div><div class="curve-ind" id="cv">${t("curve")}<br>0</div>`:`<div class="dive-picker" aria-label="${t('youKeep')}">${[0,1].map(row=>[0,1,2].map(col=>`<button data-dive="1" data-col="${col}" data-row="${row}" aria-label="${['↖','↑','↗','↙','↓','↘'][row*3+col]}">${['↖','↑','↗','↙','↓','↘'][row*3+col]}</button>`).join('')).join('')}</div>`}
    <div class="help glass" id="help">${m.userShoots?t("shootHelp"):t("keepHelp")}</div>
  </div><button class="hud-quit glass" data-act="quit" title="${t("quit")}">✕</button>`);
}
export function setPower(v){ const el=document.getElementById("pw"); if(el){el.style.height=Math.round(v*100)+"%";el.parentElement.classList.toggle('overcharged',v>0.92);}const val=document.getElementById('power-value');if(val)val.textContent=Math.round(v*100)+'%'; }
export function setDive(col,row){document.querySelectorAll('[data-dive]').forEach(el=>{const active=Number(el.dataset.col)===col&&Number(el.dataset.row)===row;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});}
export function setCurve(v){ const el=document.getElementById("cv"); if(el) el.innerHTML=`${t("curve")}<br>${v>0?"↻ ":v<0?"↺ ":""}${Math.abs(v).toFixed(1)}`; }
export function hideHelp(){ const el=document.getElementById("help"); if(el) el.style.display="none"; document.querySelector('.dive-picker')?.classList.add('committed'); }
export function banner(text,cls="info"){ const a=$app(); a.querySelector(".banner")?.remove(); const d=document.createElement("div"); d.className="banner "+cls; d.textContent=text; a.appendChild(d); setTimeout(()=>d.remove(),1700); }

/* ---------- result ---------- */
export function result(r){
  // r: { win, gh, ga, homeClub, awayClub, coins, xp, levelUp, nextLabel }
  const a=$app(); a.querySelector(".result")?.remove();
  const d=document.createElement("div"); d.className="result";
  d.innerHTML=`<div class="res-card glass">
    <div class="res-title ${r.win?"win":"lose"}">${r.title||(r.win?t("victory"):t("defeat"))}</div>
    <div class="res-score">${badge(r.homeClub,48)}<span>${r.gh} – ${r.ga}</span>${badge(r.awayClub,48)}</div>
    <div class="sec" style="padding:0;align-items:center"><h3>${t("rewards")}</h3><div class="rewards"><div class="rew">🪙 +${r.coins}<small>${t("coins")}</small></div><div class="rew">⭐ +${r.xp}<small>XP</small></div></div></div>
    ${r.levelUp?`<div class="lvlup">⬆ ${t("levelUp")} ${t("level")} ${levelOf(S.xp)}</div>`:""}
    <div class="row" style="justify-content:center">
      <button class="btn" data-act="menu">${t("menu")}</button>
      ${r.nextLabel?`<button class="btn primary" data-act="next">${r.nextLabel} ▶</button>`:`<button class="btn primary" data-act="rematch">↻ ${t("rematch")}</button>`}
    </div></div>`;
  a.appendChild(d);
}
