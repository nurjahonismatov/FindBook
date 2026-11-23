const KEY = "finalkick_save_v1";
const fresh = () => ({
  lang:"en", coins:500, xp:0, club:"bar",
  player:{ name:"Player", num:10, pos:"pos_fw", skin:0, hair:0, hairColor:0,
    attrs:{ power:60, acc:60, curve:50, pen:60, reflex:55, dive:55 } },
  owned:["boots_basic","kit_home","gloves_basic","ball_classic","stad_default","acc_none","cel_fist"],
  equipped:{ boots:"boots_basic", kits:"kit_home", gloves:"gloves_basic", balls:"ball_classic", stadium:"stad_default", acc:"acc_none", celeb:"cel_fist" },
  stats:{ matches:0, wins:0, losses:0, goals:0, conceded:0, saves:0, tours:0, streak:0, bestStreak:0, history:[] },
  missionBase:{}, missionClaimed:{},
  daily:{ last:"", streak:0 },
  career:{ stage:0 },
  tour:null,
  settings:{ music:0.5, sfx:0.8, quality:"high", camera:"camPlayer", sens:1 },
});
function merge(a,b){ for(const k in a){ if(b[k]===undefined) b[k]=a[k]; else if(a[k]&&typeof a[k]==="object"&&!Array.isArray(a[k])) merge(a[k],b[k]); } return b; }
export let S;
export function load(){ try{ S = merge(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); }catch{ S = fresh(); } return S; }
export function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch{} }
export function reset(){ const lang=S.lang; S = fresh(); S.lang=lang; save(); }
export const levelOf = xp => Math.floor(xp/500)+1;
export const levelProgress = xp => (xp%500)/500;
export function addRewards(coins, xp){
  const before = levelOf(S.xp); S.coins += coins; S.xp += xp; save();
  return levelOf(S.xp) > before;
}
export function effAttrs(){
  const a = { ...S.player.attrs };
  for(const id of Object.values(S.equipped)){
    const it = window.__items?.find(i=>i.id===id); if(!it) continue;
    for(const k in it.bonus) a[k] = Math.min(100, a[k] + it.bonus[k]);
  }
  return a;
}
