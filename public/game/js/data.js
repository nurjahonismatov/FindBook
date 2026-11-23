// Club data (fan-made placeholder emblems; no official affiliation)
export const CLUBS = [
  { id:"bar", name:"FC Barcelona", short:"BAR", c1:"#a50044", c2:"#004d98", rating:88, unlock:1 },
  { id:"mun", name:"Manchester United", short:"MUN", c1:"#da291c", c2:"#fbe122", rating:84, unlock:1 },
  { id:"che", name:"Chelsea FC", short:"CHE", c1:"#034694", c2:"#ffffff", rating:83, unlock:1 },
  { id:"rma", name:"Real Madrid", short:"RMA", c1:"#f5f5f5", c2:"#febe10", rating:90, unlock:1 },
  { id:"mci", name:"Manchester City", short:"MCI", c1:"#6cabdd", c2:"#1c2c5b", rating:89, unlock:1 },
  { id:"liv", name:"Liverpool FC", short:"LIV", c1:"#c8102e", c2:"#00b2a9", rating:87, unlock:1 },
  { id:"ars", name:"Arsenal FC", short:"ARS", c1:"#ef0107", c2:"#ffffff", rating:86, unlock:1 },
  { id:"psg", name:"Paris Saint-Germain", short:"PSG", c1:"#004170", c2:"#da291c", rating:86, unlock:2 },
  { id:"bay", name:"Bayern Munich", short:"BAY", c1:"#dc052d", c2:"#0066b2", rating:88, unlock:3 },
  { id:"juv", name:"Juventus", short:"JUV", c1:"#f2f2f2", c2:"#111111", rating:83, unlock:4 },
  { id:"int", name:"Inter Milan", short:"INT", c1:"#0068a8", c2:"#111111", rating:85, unlock:5 },
  { id:"acm", name:"AC Milan", short:"ACM", c1:"#fb090b", c2:"#111111", rating:82, unlock:6 },
  { id:"bvb", name:"Borussia Dortmund", short:"BVB", c1:"#fde100", c2:"#111111", rating:82, unlock:7 },
  { id:"atm", name:"Atletico Madrid", short:"ATM", c1:"#cb3524", c2:"#272e61", rating:84, unlock:8 },
];
export const clubById = id => CLUBS.find(c=>c.id===id) || CLUBS[0];
export function badge(c, size=56){
  return `<div class="badge" style="--c1:${c.c1};--c2:${c.c2};width:${size}px;height:${size*1.15}px"><span style="font-size:${size*0.3}px">${c.short}</span></div>`;
}

export const OPP_NAMES = ["M. Duarte","L. Kovač","J. Albrecht","S. Okafor","R. Lindqvist","T. Moreau","A. Rahimov","D. Petrenko","K. Yamada","E. Castillo","N. Bergström","F. Oliveira","I. Haddad","B. Novak"];
export const KEEPER_NAMES = ["V. Strand","O. Mendes","P. Kowalski","G. Rossi","H. Tanaka","C. Ivanov","Y. Diallo","M. Fischer"];

export const DIFF = {
  easy:   { read:0.25, react:0.55, reach:1.05, acc:0.55, mind:0.0 },
  normal: { read:0.45, react:0.40, reach:1.25, acc:0.72, mind:0.2 },
  hard:   { read:0.60, react:0.28, reach:1.42, acc:0.85, mind:0.45 },
  pro:    { read:0.72, react:0.18, reach:1.55, acc:0.93, mind:0.7 },
};

export const SKINS = ["#f1d2b6","#d9a77f","#b47b54","#8a5a3b","#5c3a24"];
export const HAIRS = ["h_short","h_buzz","h_long","h_mohawk"];
export const HAIR_COLORS = ["#1b1410","#4a2e1a","#9a6a3a","#d8b25c","#c7c7c7","#b23a2a"];
export const POSITIONS = ["pos_fw","pos_mf","pos_df","pos_gk"];

// Shop: cat, rarity, price, color (preview), bonus
const I = (id,cat,rar,price,col,name,desc,bonus={})=>({id,cat,rar,price,col,name,desc,bonus});
export const ITEMS = [
  I("boots_basic","boots","common",0,"#e8e8e8",["Street Classic","Ko‘cha klassikasi","Уличная классика"],["Reliable everyday boots.","Ishonchli kundalik butsa.","Надёжные бутсы на каждый день."]),
  I("boots_volt","boots","rare",600,"#c6ff3d",["Volt Strike","Volt Strike","Volt Strike"],["+3 shooting power.","+3 zarba kuchi.","+3 к силе удара."],{power:3}),
  I("boots_phantom","boots","epic",1500,"#2f7bff",["Phantom Edge","Phantom Edge","Phantom Edge"],["+5 accuracy.","+5 aniqlik.","+5 к точности."],{acc:5}),
  I("boots_aurum","boots","legendary",4000,"#f2c14e",["Aurum Elite","Aurum Elite","Aurum Elite"],["+6 power, +6 curve.","+6 kuch, +6 burama.","+6 сила, +6 подкрутка."],{power:6,curve:6}),
  I("kit_home","kits","common",0,"#club",["Club Home Kit","Klub uy formasi","Домашняя форма"],["Your club colors.","Klubingiz ranglari.","Цвета вашего клуба."]),
  I("kit_midnight","kits","rare",500,"#18223f",["Midnight Away","Tungi forma","Полночная выездная"],["Deep navy away kit.","To‘q ko‘k forma.","Тёмно-синяя форма."]),
  I("kit_carbon","kits","epic",1400,"#2a2d33",["Carbon Third","Karbon forma","Карбоновая третья"],["Matte carbon finish.","Mat karbon.","Матовый карбон."]),
  I("kit_white","kits","legendary",3500,"#f4f1e8",["Heritage White","Meros oq","Наследие"],["A legend's shirt.","Afsona formasi.","Форма легенды."]),
  I("gloves_basic","gloves","common",0,"#dddddd",["Training Gloves","Mashq qo‘lqoplari","Тренировочные перчатки"],["Standard grip.","Oddiy ushlash.","Стандартный хват."]),
  I("gloves_grip","gloves","rare",700,"#18c2a4",["Grip Pro","Grip Pro","Grip Pro"],["+4 diving reach.","+4 sakrash.","+4 к прыжку."],{dive:4}),
  I("gloves_titan","gloves","legendary",3800,"#ff5a1f",["Titan Wall","Titan Wall","Titan Wall"],["+7 reflex, +5 diving.","+7 refleks, +5 sakrash.","+7 реакция, +5 прыжок."],{reflex:7,dive:5}),
  I("ball_classic","balls","common",0,"#ffffff",["Match Ball","O‘yin to‘pi","Матчевый мяч"],["Official-weight classic.","Klassik to‘p.","Классический мяч."]),
  I("ball_night","balls","rare",450,"#3aa0ff",["Night Glow","Tungi nur","Ночное сияние"],["Electric blue panels.","Elektr ko‘k.","Электрик-синие панели."]),
  I("ball_gold","balls","legendary",3000,"#f2c14e",["Golden Final","Oltin final","Золотой финал"],["For final nights only.","Faqat finallar uchun.","Только для финалов."]),
  I("stad_default","stadium","common",0,"#ffffff",["White Floodlights","Oq projektorlar","Белые прожекторы"],["Classic night lighting.","Klassik tungi yorug‘lik.","Классический свет."]),
  I("stad_blue","stadium","rare",800,"#3d8bff",["Electric Night","Elektr kecha","Электрическая ночь"],["Blue-tinted floodlights.","Ko‘k projektorlar.","Синие прожекторы."]),
  I("stad_gold","stadium","epic",2000,"#ffb347",["Golden Hour","Oltin soat","Золотой час"],["Warm cinematic glow.","Iliq yorug‘lik.","Тёплое сияние."]),
  I("acc_none","acc","common",0,"#888888",["None","Yo‘q","Нет"],["Clean look.","Toza ko‘rinish.","Чистый образ."]),
  I("acc_band","acc","rare",300,"#ffffff",["Headband","Bosh bog‘ich","Повязка"],["Keep focused.","Diqqatni jamlang.","Фокус."]),
  I("acc_captain","acc","epic",1200,"#f2c14e",["Captain Armband","Sardor bog‘ichi","Капитанская повязка"],["Lead from the spot.","Yetakchi bo‘ling.","Веди команду."]),
  I("cel_fist","celeb","common",0,"#ffffff",["Fist Pump","Musht","Кулак"],["Simple and strong.","Oddiy va kuchli.","Просто и мощно."]),
  I("cel_knee","celeb","rare",600,"#3d8bff",["Knee Slide","Tizza sirpanishi","Скольжение"],["Across the turf.","Maysa bo‘ylab.","По газону."]),
  I("cel_fire","celeb","legendary",2500,"#ff5a1f",["Firestorm","Olov bo‘roni","Огненный шторм"],["Pyro behind the goal.","Darvoza ortida olov.","Пиро за воротами."]),
];
export const CATS = ["boots","kits","gloves","balls","stadium","acc","celeb"];
export const CAT_KEY = { boots:"c_boots", kits:"c_kits", gloves:"c_gloves", balls:"c_balls", stadium:"c_stadium", acc:"c_acc", celeb:"c_celeb" };
export const itemById = id => ITEMS.find(i=>i.id===id);

export const CAREER = [
  { opp:"juv", diff:"easy" },{ opp:"bvb", diff:"easy" },{ opp:"acm", diff:"normal" },{ opp:"che", diff:"normal" },
  { opp:"mun", diff:"normal" },{ opp:"atm", diff:"hard" },{ opp:"int", diff:"hard" },{ opp:"psg", diff:"hard" },
  { opp:"bay", diff:"pro" },{ opp:"rma", diff:"pro" },
];
export const TOURNAMENTS = [
  { id:"local", key:"t_local", diff:"easy", prize:600, xp:300, minLevel:1, icon:"🥉" },
  { id:"champ", key:"t_champ", diff:"normal", prize:1200, xp:600, minLevel:2, icon:"🥈" },
  { id:"euro", key:"t_euro", diff:"hard", prize:2200, xp:1000, minLevel:4, icon:"🏆" },
  { id:"world", key:"t_world", diff:"pro", prize:4000, xp:1800, minLevel:6, icon:"🌍" },
];
export const MISSIONS = [
  { id:"score3", key:"m_score3", stat:"goals", goal:3, coins:150, xp:80 },
  { id:"win2", key:"m_win2", stat:"wins", goal:2, coins:250, xp:120 },
  { id:"save3", key:"m_save3", stat:"saves", goal:3, coins:200, xp:100 },
  { id:"tour", key:"m_tour", stat:"tours", goal:1, coins:600, xp:300 },
  { id:"streak5", key:"m_streak5", stat:"streak5s", goal:1, coins:400, xp:200 },
];
