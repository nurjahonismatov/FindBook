// Orchestrator: wires Store, Scene, Match rules, UI, Input and Audio together and runs the shootout loop.
import { load, save, S, addRewards, effAttrs } from "./store.js";
import { setLang, t } from "./i18n.js";
import { ITEMS, itemById, clubById, OPP_NAMES, KEEPER_NAMES, SKINS, HAIR_COLORS, TOURNAMENTS, CAREER } from "./data.js";
import * as Scene from "./scene.js";
import * as M from "./match.js";
import * as UI from "./ui.js";
import * as Input from "./input.js";
import * as Audio from "./audio.js";

window.__items = ITEMS;
load(); setLang(S.lang);

const wait = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[(Math.random()*a.length)|0];
const DMULT = { easy:1, normal:1.4, hard:1.9, pro:2.6 };
let game = null, token = 0;

/* ---------- appearance ---------- */
function userLook(asKeeper){
  const c = clubById(S.club), p = S.player, kit = itemById(S.equipped.kits), gl = itemById(S.equipped.gloves);
  const kitCol = kit.col === "#club" ? c.c1 : kit.col;
  return {
    kit: asKeeper ? "#1d2633" : kitCol, shorts: asKeeper ? "#11161f" : c.c2, socks: asKeeper ? "#1d2633" : kitCol,
    skin: SKINS[p.skin] || SKINS[0], hair: p.hair, hairColor: HAIR_COLORS[p.hairColor] || HAIR_COLORS[0],
    boots: itemById(S.equipped.boots).col, gloves: asKeeper ? gl.col : null,
    band: S.equipped.acc === "acc_band" ? "#ffffff" : null, armband: S.equipped.acc === "acc_captain",
  };
}
function oppLook(club, asKeeper){
  return {
    kit: asKeeper ? "#f2c14e" : club.c1, shorts: asKeeper ? "#222" : club.c2, socks: asKeeper ? "#f2c14e" : club.c1,
    skin: pick(SKINS), hair: (Math.random()*4)|0, hairColor: pick(HAIR_COLORS), boots: "#222", gloves: asKeeper ? "#ffffff" : null,
  };
}
function applyTheme(){ Scene.setTheme({ stadium: itemById(S.equipped.stadium).col, ball: itemById(S.equipped.balls).col }); }
function applySettings(){
  Scene.setQuality(S.settings.quality); Scene.setCamMode(S.settings.camera);
  Input.setSensitivity(S.settings.sens); Audio.apply();
}

/* ---------- match flow ---------- */
function startMatch(cfg){
  Audio.unlock();
  const my = token = token + 1;
  const opp = clubById(cfg.opp);
  game = { cfg, opp, m: M.newShootout(), sideHist: [], keepHist: [], oppShooters: [...OPP_NAMES].sort(()=>Math.random()-0.5), oppKeeper: pick(KEEPER_NAMES) };
  Scene.setMode("play"); Audio.sfx.whistle();
  run(my);
}

function hudState(turn){
  const g = game, m = g.m, userShoots = turn === "home";
  const idx = m.away.length;
  return { home: m.home, away: m.away, homeClub: clubById(S.club), awayClub: g.opp, turn,
    round: Math.max(m.home.length, m.away.length) + (turn === "home" ? 1 : 0),
    sudden: Math.max(m.home.length, m.away.length) + (turn === "home" ? 1 : 0) > 5,
    shooter: userShoots ? S.player.name : g.oppShooters[idx % g.oppShooters.length],
    keeper: userShoots ? g.oppKeeper : S.player.name, userShoots };
}

async function run(my){
  const alive = () => my === token && game;
  while(alive()){
    const w = M.winner(game.m);
    if(w){ await wait(600); if(alive()) finish(w === "home"); return; }
    const turn = M.nextShooter(game.m);
    const hs = hudState(turn);
    Scene.setupKick(turn === "home" ? userLook(false) : oppLook(game.opp, false), turn === "home" ? oppLook(game.opp, true) : userLook(true));
    UI.hud(hs);
    UI.banner(turn === "home" ? t("yourShot") : t("youKeep"));
    await wait(900); if(!alive()) return;
    const outcome = turn === "home" ? await userShoots() : await userKeeps();
    if(!alive()) return;
    const scored = outcome === "goal";
    game.m[turn].push(scored);
    if(turn === "home"){ if(scored) S.stats.goals++; }
    else { if(scored) S.stats.conceded++; else if(outcome === "save") S.stats.saves++; }
    save();
    UI.hud(hudState(M.nextShooter(game.m)));
    await wait(700);
  }
}

function userShoots(){
  return new Promise(resolve => {
    const my = token;
    Input.setMode("shoot", async shot => {
      if(my !== token) return;
      UI.hideHelp();
      const attrs = effAttrs();
      const r = M.resolveUserShot({ ...shot, attrs, diff: game.cfg.diff, sideHistory: game.sideHist });
      game.sideHist.push(Math.sign(shot.aim.x) || 0); if(game.sideHist.length > 6) game.sideHist.shift();
      const outcome = await Scene.playKick({ ...r, onKick(){ Audio.sfx.kick(); }, onArrive(){ react(r.outcome, true); } });
      resolve(outcome);
    });
  });
}

function userKeeps(){
  return new Promise(resolve => {
    const my = token, attrs = effAttrs();
    const plan = M.planAIShot({ diff: game.cfg.diff, keeperHistory: game.keepHist });
    let anim = null, dive = null, pending = null;
    const applyDive = d => {
      if(!anim){ pending = d; return; }
      const delay = Math.max(0, anim.t - 0.9);
      dive = { x: d.x, y: d.y, delay };
      anim.kx = d.x; anim.ky = d.y; anim.kdelay = delay;
    };
    Input.setMode("keep", d => { if(my !== token) return; UI.hideHelp(); game.keepHist.push(Math.sign(d.x)); if(game.keepHist.length > 6) game.keepHist.shift(); applyDive(d); });
    // give the keeper a moment to read the run-up
    setTimeout(async () => {
      if(my !== token) return;
      const out = await Scene.playKick({ tx: plan.tx, ty: plan.ty, T: plan.T, arc: plan.arc, curve: plan.curve, kx: null, ky: 1, kdelay: 0, outcome: plan.kind === "in" ? "goal" : plan.kind,
        onKick(){ anim = this; Audio.sfx.kick(); if(pending){ const p = pending; pending = null; applyDive(p); } },
        outcomeFn(){ if(Input.getMode() === "keep") Input.setMode(null); return M.resolveUserSave(plan, dive, attrs); },
        onArrive(){ react(this.outcome, false); } });
      Input.setMode(null);
      resolve(out);
    }, 700);
  });
}

function react(outcome, userShot){
  const good = userShot ? outcome === "goal" : outcome !== "goal";
  const label = { goal: t("goal"), save: t("saved"), miss: t("miss"), post: t("post") }[outcome] || outcome;
  UI.banner(label, good ? "goal" : outcome);
  if(outcome === "goal"){ Audio.sfx.goal(); Scene.setHype(userShot ? 1 : 0.3); }
  else Audio.sfx[outcome]?.();
}

function finish(win){
  const g = game, cfg = g.cfg, gh = M.goalsOf(g.m.home), ga = M.goalsOf(g.m.away), st = S.stats;
  Input.setMode(null);
  st.matches++; if(win){ st.wins++; st.streak++; if(st.streak > st.bestStreak) st.bestStreak = st.streak; if(st.streak % 5 === 0) st.streak5s = (st.streak5s||0) + 1; }
  else { st.losses++; st.streak = 0; }
  st.history.unshift({ opp: cfg.opp, gh, ga, win }); st.history = st.history.slice(0, 10);
  const mult = DMULT[cfg.diff] || 1;
  let coins = win ? Math.round(120*mult) + gh*15 : 30 + gh*10, xp = win ? Math.round(100*mult) : 40;
  let nextLabel = null, title = null;
  if(cfg.kind === "career" && win){ S.career.stage++; coins += 200; if(S.career.stage < CAREER.length) nextLabel = `${t("stage")} ${S.career.stage + 1}`; else title = t("champion"); }
  if(cfg.kind === "tour" && S.tour){
    const T = TOURNAMENTS.find(x => x.id === S.tour.id);
    if(win){ S.tour.round++; if(S.tour.round >= 3){ coins += T.prize; xp += T.xp; st.tours++; S.tour = null; title = t("champion"); } else nextLabel = t(["qf","sf","final"][S.tour.round]); }
    else { S.tour = null; title = t("eliminated"); }
  }
  save();
  const levelUp = addRewards(coins, xp);
  win ? Audio.sfx.victory() : Audio.sfx.defeat();
  if(win) Scene.setHype(1);
  UI.result({ win, gh, ga, homeClub: clubById(S.club), awayClub: g.opp, coins, xp, levelUp, nextLabel, title });
}

function toMenu(){ token++; game = null; Input.setMode(null); Scene.setMode("menu"); Scene.setHype(0); UI.show("menu"); }

/* ---------- boot ---------- */
async function boot(){
  await Scene.initScene(document.getElementById("scene"));
  applySettings(); applyTheme(); Scene.setMode("menu");
  Input.init({ onPower: UI.setPower, onCurve: UI.setCurve, onDive:UI.setDive });
  UI.init({
    startMatch,
    reward: (c, x) => addRewards(c, x),
    quitMatch: toMenu,
    toMenu,
    rematch: () => game && startMatch(game.cfg),
    next: () => {
      if(!game) return toMenu();
      if(game.cfg.kind === "career"){ const c = CAREER[S.career.stage]; if(!c) return toMenu(); let opp = c.opp === S.club ? "rma" : c.opp; if(opp === S.club) opp = "bar"; startMatch({ kind:"career", opp, diff:c.diff }); }
      else if(game.cfg.kind === "tour" && S.tour){ const T = TOURNAMENTS.find(x => x.id === S.tour.id); startMatch({ kind:"tour", opp:S.tour.opps[S.tour.round], diff:T.diff }); }
      else toMenu();
    },
    onSettings: k => { if(k.startsWith("settings") || k === "reset") applySettings(); if(k === "equip" || k === "reset") applyTheme(); },
  });
  UI.show("menu");
  const unlockOnce = () => { Audio.unlock(); removeEventListener("pointerdown", unlockOnce); };
  addEventListener("pointerdown", unlockOnce);
  requestAnimationFrame(() => setTimeout(() => document.getElementById("loader")?.classList.add("hide"), 400));
}
if(location.hostname==='localhost')window.__game={get state(){return {match:game?.m,mode:Input.getMode(),scene:Scene.snapshot()};},sim:Scene.sim};
boot().catch(e=>{console.error(e);const l=document.querySelector('#loader .ld-tip');if(l)l.textContent='O‘yin yuklanmadi. Sahifani yangilang.';});
