# אישים

מאגר ישראלי של **אישים** והפקות — דיבוב, מחזמר, קולנוע, סדרות וקלטות.

## מה כבר עובד

- דף בית עריכתי־ארכיוני + „נולדו היום”
- דפי אישים והפקות עם קישוריות דו־כיוונית
- חיפוש
- הרשמה/התחברות (Firebase Auth או מצב מקומי)
- הוספה ועריכה של אישים והפקות + עורך קרדיטים
- Seed ראשוני של אישים והפקות ישראליים

## הרצה מקומית

```bash
npm install
npm run dev
```

פתחו [http://localhost:3000](http://localhost:3000).

בלי Firebase — האתר רץ במצב מקומי (localStorage) עם כניסת עורך פשוטה.

## פרסום לאינטרנט (Vercel)

הדרך המומלצת לאתר Next.js:

1. צרו חשבון ב־[vercel.com](https://vercel.com) (אפשר עם Google/GitHub).
2. במחשב, מתוך תיקיית הפרויקט:

```bash
npx vercel login
npx vercel
```

3. בפעם הראשונה ענו על השאלות (קישור לפרויקט חדש). בסיום תקבלו כתובת כמו `https://haarchion.vercel.app`.
4. לפריסת ייצור:

```bash
npx vercel --prod
```

5. הוסיפו את משתני הסביבה מ־`.env.local` ב־Vercel → Project → Settings → Environment Variables (כל `NEXT_PUBLIC_FIREBASE_*`), ואז פרסו מחדש.
6. ב־Firebase Console → Authentication → Settings → Authorized domains — הוסיפו את הדומיין של Vercel (למשל `haarchion.vercel.app`).

לחלופין: העלו את הקוד ל־GitHub וחברו את הריפו ב־[vercel.com/new](https://vercel.com/new) — כל push יפרסם אוטומטית.

## חיבור Firebase

1. צרו פרויקט ב-[Firebase Console](https://console.firebase.google.com/)
2. הפעילו **Authentication → Sign-in method → Google** (Enable) — חובה להתחברות ולכתיבה לענן
3. צרו **Firestore Database** ו־**Storage**
4. פרסמו את ה־rules מהפרויקט:

```bash
npx firebase login
npx firebase use tamir-web
npx firebase deploy --only firestore:rules,storage
```

5. העתיקו `.env.local.example` ל־`.env.local` ומלאו את המפתחות
6. ב־Vercel הוסיפו את אותם `NEXT_PUBLIC_FIREBASE_*` ופרסמו מחדש
7. ב־Authentication → Settings → Authorized domains הוסיפו את דומיין Vercel

הארכיון נשמר ב־**Firestore** (מקור האמת). `localStorage` הוא מטמון בלבד. תמונות מועלות ל־**Storage**.

## מבנה נתונים

- `people` — אישים
- `productions` — הפקות
- `credits` — קישורים (personId + productionId + role)

## בהמשך

- העלאת תמונות ל־Storage
- פאנל אישור אדמין
- דפי ערוצים / אולפנים / ז׳אנרים
- פילטרים מתקדמים
