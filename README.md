# Final Kick

salom menga shu loyihani davom ettirib ber man aprompti va qayerdan boshlashing va sungida serverga quy final-kick nomi bilan ortiqcha narsa qushmaSalom! Biz "Final Kick" nomli 3D penalti o'yinini yaratmoqdamiz.

Backend/Dvigatel qismi tayyor: Three.js 3D stadioni (scene.js), Web Audio ovoz generatori (audio.js), o'yin qoidalari va match-engine (match.js), do'kon/klub ma'lumotlari (data.js), ko'p tillilik (i18n.js) va xotira (store.js).

Sizdan o'yinni to'liq yakunlash uchun quyidagi 4 ta faylni yozib berish talab qilinadi:

1. `public/game/styles.css`:

   - Champions League / EA Sports uslubidagi neon va to'q yashil/ko'k glassmorphism dizayn.

   - Mobil va kompyuterga to'liq moslashuvchan (responsive).

   - Hisob tablosi, koptok belgilari (yashil/qizil doiralar), nishonga olish va zarba kuchi ko'rsatkichi.

2. `public/game/js/ui.js`:

   - Bosh menyu (O'ynash, Turnirlar, Karyera, Do'kon, Sozlamalar).

   - Match HUD (hisob, joriy zarba raqami, o'yinchi va darvozabon nomlari).

   - O'yin yakuni ekrani (G'alaba/Mag'lubiyat, berilgan tangalar va XP hisobi, qayta o'ynash tugmasi).

   - Do'kon va kiyim almashtirish interfeysi.

3. `public/game/js/input.js`:

   - Sensorli ekran (touch) va sichqoncha (mouse) orqali to'pni tepish mexanikasi (swipe tezligi = kuch, burchagi = yo'nalish, egriligi = buralib uchish).

   - Darvozabon rolida: darvozabonni kerakli burchakka sakratish uchun surish (swipe).

4. `public/game/js/main.js`:

   - Barcha modullarni (Scene, Match, UI, Input, Audio, Store) bir-biriga bog'lovchi boshqaruv sikli (game loop).

Iltimos, ushbu qolgan modullarni to'liq, xatosiz kod bilan yozib ber.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://final-kick.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f37bb188-a92b-4dfc-90ab-42f7f9bf1b63).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
