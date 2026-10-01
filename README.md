# 🎄 Weihnachtslotterie 2026

Eine kleine mobile Weihnachts-Landingpage für eure Familienziehung.

## Teilnehmer

Alexander · Nicolina · Anna · Jan · Iwona · Dariusz · Magda · Livan

## Funktionen

- Jeder wählt seinen eigenen Namen und zieht genau einmal.
- Niemand kann sich selbst ziehen.
- Jeder Empfänger kommt genau einmal vor.
- Bereits gezogene Teilnehmer werden deaktiviert.
- Der gemeinsame Status funktioniert auf allen Geräten.
- Die eigentlichen Zuordnungen bleiben geheim.
- Das Frontend ist statisch und kann über GitHub Pages, Vercel oder Netlify laufen.

## Einrichtung

### 1. Supabase-Projekt erstellen

Erstelle auf https://supabase.com ein kostenloses Projekt.

### 2. Datenbank einrichten

Öffne im Supabase Dashboard den **SQL Editor**, füge den kompletten Inhalt von `supabase.sql` ein und führe ihn einmal aus.

### 3. Zugangsdaten eintragen

Unter **Project Settings → API** findest du Project URL und anon/public key.

Trage beide Werte oben in `app.js` ein:

```js
const SUPABASE_URL = "https://DEIN-PROJEKT.supabase.co";
const SUPABASE_ANON_KEY = "DEIN_ANON_KEY";
```

### 4. GitHub Pages aktivieren

Im Repository: **Settings → Pages → Deploy from a branch → main / root**.

Danach ist die Seite über deine GitHub-Pages-Adresse erreichbar.

## Neue Runde starten

Im Supabase SQL Editor:

```sql
delete from public.lottery_assignments;
```

Beim nächsten Ziehen wird automatisch eine neue gültige Zuordnung erzeugt.

## Technische Logik

Beim ersten Ziehen erzeugt die Datenbank transaktional eine komplette zufällige Zuordnung für alle acht Personen. Dabei gilt:

- Geber != Empfänger
- jeder Geber genau einmal
- jeder Empfänger genau einmal

Durch einen Datenbank-Lock können auch zwei Personen, die fast gleichzeitig ziehen, keine inkonsistente Runde erzeugen.
