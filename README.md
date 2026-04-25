# בית אברהם — אתר אינטרנט

אתר אינטרנט סטטי בעברית (RTL) מוכן לפריסה. נכתב ב-HTML/CSS טהור עם JavaScript מינימלי לטפסים, FAQ accordion, וטאבים.

## מבנה העמודים

| עמוד | קובץ | תפקיד |
|---|---|---|
| בית | `index.html` | Hero, סיפור, רעיון, ייחודיות, מודלים, מייסד, 3 דלתות |
| הרעיון | `model.html` | המבנה המלא — 4 מסלולי חיים, אברכים, יום בכפר, זהות |
| מי אנחנו | `about.html` | מייסד, צוות, ועדת יועצים, roadmap של 5 שלבים |
| שאלות ותשובות | `faq.html` | 6 קטגוריות, accordion |
| מקורות ומחקר | `sources.html` | מודלים בעולם, מחקרים, citations |
| צור קשר | `contact.html` | 3 טפסים בטאבים: איש מקצוע / חיבור / שותפות |
| שתפו אותנו | `share.html` | טופס ציבורי לשאלה / רעיון / מחשבה |

## איך להריץ מקומית

לחיצה כפולה על `index.html` או גרירה לדפדפן. אין צורך בשרת.

## קבצים נדרשים

```
beit-avraham-site/
├── index.html
├── model.html
├── about.html
├── faq.html
├── sources.html
├── contact.html
├── share.html
├── style.css
├── forms.js
└── images/
    ├── hero.png
    ├── origin-story.png
    ├── card-children.png
    ├── card-women.png
    ├── card-elderly.png
    ├── village-aerial.png
    ├── founder.png
    └── open-door.png
```

## הגדרת טפסים — Supabase

הטפסים בעמודי `share.html` ו-`contact.html` שולחים נתונים ישירות לטבלה ב-Supabase. לפני העלאה לאוויר, יש לבצע את השלבים הבאים:

### שלב 1 — יצירת טבלה ב-Supabase

הריצו את ה-SQL הבא ב-SQL Editor של Supabase:

```sql
CREATE TABLE beit_avraham_submissions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  reviewed BOOLEAN DEFAULT FALSE,
  published_to_faq BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- אינדקסים לחיפוש
CREATE INDEX idx_submissions_type ON beit_avraham_submissions(type);
CREATE INDEX idx_submissions_reviewed ON beit_avraham_submissions(reviewed);
CREATE INDEX idx_submissions_created ON beit_avraham_submissions(created_at DESC);

-- אבטחה: anon יכול להוסיף, אבל לא לקרוא
ALTER TABLE beit_avraham_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON beit_avraham_submissions FOR INSERT
  TO anon
  WITH CHECK (true);
```

### שלב 2 — עדכון `forms.js`

פתחו את `forms.js` והחליפו שתי שורות:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
```

עם ה-URL וה-anon key של פרויקט Supabase שלכם. אפשר למצוא אותם ב:
**Supabase Dashboard → Project Settings → API**

⚠️ השתמשו רק ב-`anon public` key, לא ב-`service_role` (שהוא סוד).

### שלב 3 — שדה `type` בטבלה

כל הגשת טופס נכנסת לטבלה עם שדה `type` שמסמן את מקור הפנייה:

| ערך | משמעות |
|---|---|
| `share` | טופס "שתפו אותנו" (share.html) |
| `professional` | פנייה מאיש מקצוע (contact.html) |
| `connection` | הצעה לחיבור (contact.html) |
| `partnership` | התעניינות בשותפות מימון (contact.html) |

תוכל לסנן בטבלה לפי `type` כדי לראות רק את הסוג שמעניין אותך באותו רגע.

## שאלות ותשובות (FAQ)

עמוד `faq.html` מכיל מבנה accordion של 6 קטגוריות. הוספת/עריכת/מחיקת שאלות נעשית ידנית בקובץ `faq.html`. כל שאלה היא בלוק `<div class="faq-item">` עם trigger ו-content.

**זרימת עבודה:**
1. מבקרים שולחים שאלות דרך `share.html`
2. השאלות נכנסות לטבלה ב-Supabase עם `type='share'` ו-`category='question'` בשדה `data`
3. סינון: `SELECT * FROM beit_avraham_submissions WHERE type='share' AND data->>'category' = 'question' AND published_to_faq = FALSE`
4. שאלה שאתה מאשר לפרסום — מוסיפים אותה ידנית ל-`faq.html` בקטגוריה המתאימה
5. בטבלה: `UPDATE beit_avraham_submissions SET published_to_faq = TRUE WHERE id = X`

## פלטת צבעים (לעקביות אם תוסיפו תוכן)

```
רקע ראשי:      #FAF7F0  (קרם חם)
רקע משני:       #F0E8D5  (שמנת)
רקע כהה:        #2A1F18  (חום-שחור עמוק)
טקסט עיקרי:     #2A1F18
טקסט משני:      #4A3D32
מבטא ראשי:      #9B7B3D  (זהב-זית)
מבטא בהיר:      #C9A55F
שגיאה / חשוב:   #A8523A  (טרקוטה, נדיר)
```

## טיפוגרפיה

- **כותרות**: Frank Ruhl Libre (Bold/Black)
- **טקסט גוף**: Heebo (Regular/Medium)
- שניהם נטענים מ-Google Fonts.

## פריסה לאוויר (Production)

האתר מוכן לפריסה ב:

**Vercel** (מומלץ):
1. הירשם ל-vercel.com
2. צור פרויקט חדש מ-GitHub repo או העלה את התיקייה ישירות
3. הוסף את הדומיין שלך (אם רכשת)
4. סיום

**Netlify**: זהה.

**GitHub Pages**: דורש העלאה ל-GitHub, אז `Settings → Pages → Deploy from main`.

זמן ההתקנה: כ-10 דקות.

## הוספת תמונות חדשות

אם הוספת עמוד חדש ורוצה תמונה:
1. צור או הוסף את התמונה ל-`images/`
2. השתמש בפורמט PNG עבור איכות, או JPG לתמונות גדולות (יותר קל)
3. הוסף `<img src="images/NAME.png" alt="תיאור" />` בקובץ ה-HTML
4. רצוי לוודא שהתמונה ממוטבת לאינטרנט (פחות מ-500KB אם אפשר)

## שינויים נפוצים

**להחליף שאלה ב-FAQ**: ערוך ידנית ב-`faq.html`. כל שאלה היא בלוק `.faq-item`.

**להוסיף שדה לטופס**: ערוך את ה-HTML של הטופס ב-`contact.html` או `share.html`. שדות נשלחים אוטומטית ל-Supabase ללא שינוי קוד JS.

**להחליף תמונה**: שמור את החדשה באותו שם בתיקיית `images/`, או שנה את ה-`src` ב-HTML.

**להוסיף עמוד חדש**: העתק את `about.html` כתבנית. שמור את הניווט (topbar) זהה בכל העמודים.
