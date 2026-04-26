# Beit Avraham — Notification Setup

## ארכיטקטורה

```
[Browser] ──direct write──▶ [Supabase: beit_avraham.*]
                                   │ (DB trigger on submissions INSERT)
                                   ▼
                       [n8n /webhook/bv/notify]
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
                    [WhatsApp Avi]    [Email Avi]
```

האתר כותב ישירות ל-Supabase (anon key + RLS). אחרי INSERT לטבלת `submissions`, trigger ב-DB משתמש ב-pg_net כדי לשלוח POST ל-n8n עם ה-payload המועשר (כולל `link` lookup). n8n רק שולח התראות — אין לו יותר אחריות על כתיבה ל-DB.

---

## מצב נוכחי

✅ Supabase: schema `beit_avraham` נוצר. RLS מופעל. anon מקבל INSERT ל-`visits` ו-`submissions` בלבד. RPC `create_self_link` חשופה ל-anon.
✅ Supabase: trigger `notify_submission` שולח POST ל-`https://n8n.futureflow.co.il/webhook/bv/notify` על כל submission.
✅ n8n: workflow `Beit Avraham — Form Notifier` (id `6999e9e9253f4d95`) יובא — לא מופעל עדיין כי חסרים credentials.

---

## מה נשאר לאבי לעשות (פעם אחת)

### 1. ליצור 2 credentials ב-n8n UI

פתח את n8n: `https://n8n.futureflow.co.il`.

**א. GreenAPI credential**
- Settings → Credentials → New → "GreenAPI API"
- Name: `GreenAPI Avi`
- Instance: `1101880573`
- Token: (הtoken שלך מ-GreenAPI)

**ב. Gmail credential**
- Settings → Credentials → New → "Gmail OAuth2 API"
- לעקוב אחרי הזרימה של OAuth (מצריך Google Cloud OAuth client או להשתמש בקיים)

### 2. לחבר את ה-credentials ל-workflow

- פתח את ה-workflow `Beit Avraham — Form Notifier`.
- לחץ על node `WhatsApp: Send` → ב-Credential dropdown תבחר `GreenAPI Avi`.
- לחץ על node `Gmail: Send` → ב-Credential dropdown תבחר את ה-Gmail credential שיצרת.

### 3. להפעיל את ה-workflow

- בפינה הימנית עליונה: Toggle **Active** → On.
- שמור.

---

## בדיקה end-to-end

מהמסוף שלך:

```bash
curl -X POST "https://cofaavvzzszsltuwaagx.supabase.co/rest/v1/submissions" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: beit_avraham" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Prefer: return=minimal" \
  -d '{"type":"share","data":{"name":"בדיקה","email":"test@test.com","content":"זאת בדיקה"},"short_code":null,"session_id":"manual-test","user_agent":"curl"}'
```

צפי: HTTP 201, ותוך שניות תקבל וואטסאפ + מייל.

או — פשוט מלא טופס באתר אחרי שתפרוס.

---

## אם משהו לא עובד

**Trigger לא נורה** → בדוק ב-Supabase Studio:
```sql
select * from net.http_response order by created desc limit 5;
```

**n8n מקבל אבל לא שולח וואטסאפ** → בדוק ב-Executions של ה-workflow ב-n8n. השגיאה תהיה ברורה (credential חסר, instance שגוי וכו').

**שינוי ה-URL של n8n** — מעדכנים ב-DB:
```sql
create or replace function beit_avraham.notify_submission() ...
  v_url text := 'https://NEW-URL/webhook/bv/notify';
...
```
