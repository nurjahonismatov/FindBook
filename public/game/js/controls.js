// Pure keyboard/charge rules shared by input and tests.
export const CHARGE_SECONDS = 1.5, OVERPOWER = 0.92;
export const chargePower = seconds => Math.min(1, Math.max(0, seconds / CHARGE_SECONDS));
export function moveAim(aim, code, distance=0.24){
  const x=aim.x+(code==='ArrowLeft'?-distance:code==='ArrowRight'?distance:0);
  const y=aim.y+(code==='ArrowUp'?distance:code==='ArrowDown'?-distance:0);
  return {x:Math.max(-3.35,Math.min(3.35,x)),y:Math.max(0.2,Math.min(2.2,y))};
}
export const diveTarget = (col,row) => ({x:(col-1)*2.65,y:row===0?2.15:0.55});