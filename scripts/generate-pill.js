const fs = require("fs");

const fallbackPills = [
  {
    id: "pill-fallback-rich-1-" + Date.now(),
    title: "Dlaczego po kawie chce Ci się do toalety?",
    desc: "To nie tylko kwestia ciepłego płynu. Kofeina wchodzi w reakcję z Twoim układem pokarmowym na poziomie hormonalnym!",
    category: "ciało",
    date: new Date().toISOString().split("T")[0],
    timeToRead: "4 min",
    icon: "sparkles",
    slides: [
      {
        title: "☕ Poranna kofeina a układ trawienny",
        content: "Zauważyłeś, że poranna kawa często wymaga szybkiej wizyty w łazience? Nie chodzi tylko o fakt wypicia ciepłego napoju. Kofeina to potężny stymulant, który błyskawicznie pobudza <strong>fale peristaltyczne</strong> (skurcze mięśni) w Twoim jelicie grubym."
      },
      {
        title: "🧬 Hormonalny impuls: Gastryna i Cholecystokinina",
        content: "Kawa stymuluje wydzielanie <strong>gastryny</strong> – hormonu wyzwalanego przez żołądek, który przyspiesza aktywność jelita grubego. Dodatkowo zwiększa poziom <strong>cholecystokininy (CCK)</strong>, co daje sygnał układowi pokarmowemu do intensywnej pracy."
      },
      {
        title: "🧪 Dekofeina też działa!",
        content: "Co ciekawe, nawet kawa bezkofeinowa wywołuje ten efekt! Oznacza to, że za reakcję odpowiada nie tylko kofeina, ale również kwasy chlorogenowe zawarte w ziarnach."
      },
      {
        title: "📌 ZAPAMIĘTAJ NA DZIŚ",
        content: "Efekt przeczyszczający po kawie to normalna reakcja hormonalna i nerwowa organizmu. Jeśli chcesz zredukować ten wpływ, zjedz najpierw coś przed wypiciem kawy."
      }
    ],
    quiz: {
      question: "Jaki hormon jest stymulowany po wypiciu kawy?",
      options: ["Gastryna", "Melatonina", "Insulina"],
      correct: 0
    }
  }
];

async function generate() {
  const today = new Date().toISOString().split("T")[0];
  const timestamp = Date.now();
  
  const prompt = `Jesteś autorem popularnonaukowych pigułek wiedzy w aplikacji ASTRA. Wygeneruj 1 bardzo interesującą, obszerną i bogatą w fakty pigułkę wiedzy z dziedziny biologii, medycyny, psychologii, neurobiologii lub kosmosu.

WYMAGANIA DOTYCZĄCE TREŚCI I STYLU:
1. Język: Luźny, wciągający, młodzieżowy, ale BEZ BANAŁÓW – musi zawierać konkretne nazwy naukowe, pojęcia, mechanizmy biologiczne/fizyczne oraz practicale wnioski.
2. Długość: Pigułka MUSI składać się z dokładnie 4 lub 5 slajdów.
3. Każdy slajd musi zawierać pełnowartościowy, szczegółowy akapit (3-5 zdań), używaj pogrubień <strong>dla kluczowych pojęć</strong>.
4. Struktura slajdów:
   - Slajd 1: Haczyk, obalenie mitu lub ciekawe pytanie z życia.
   - Slajd 2: Mechanizm naukowy / Co dokładnie dzieje się od kulis.
   - Slajd 3: Kontekst ewolucyjny, psychologiczny lub ciekawostka.
   - Slajd 4: Wpływ na codzienne życie / Jak wykorzystać tę wiedzę.
   - Slajd 5: Sekcja "📌 ZAPAMIĘTAJ NA DZIŚ" z podsumowaniem.
5. Quiz: 1 pytanie sprawdzające faktyczną wiedzę z pigułki, 3 opcje odpowiedzi.

ODPOWIEDZ WYŁĄCZNIE W FORMATOWANIU CZYSTEGO JSON (bez znaczników markdown i bez wstępów).

Format JSON:
{
  "id": "pill-${timestamp}",
  "title": "Tytuł",
  "desc": "Opis pigułki...",
  "category": "ciało",
  "date": "${today}",
  "timeToRead": "4 min",
  "icon": "sparkles",
  "slides": [
    { "title": "Slajd 1", "content": "Treść z <strong>pogrubieniami</strong>..." },
    { "title": "Slajd 2", "content": "Treść..." },
    { "title": "Slajd 3", "content": "Treść..." },
    { "title": "Slajd 4", "content": "Treść..." },
    { "title": "📌 ZAPAMIĘTAJ NA DZIŚ", "content": "Podsumowanie..." }
  ],
  "quiz": {
    "question": "Pytanie?",
    "options": ["Opcja A", "Opcja B", "Opcja C"],
    "correct": 0
  }
}
Kategorie do wyboru: "ciało", "świat", "kosmos".`;

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];

  let newPill = null;

  if (process.env.GEMINI_API_KEY) {
    for (const model of models) {
      if (newPill) break;
      console.log(`Próba generowania z modelem: ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(20000)
          });

          const data = await res.json();
          if (res.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            let rawText = data.candidates[0].content.parts[0].text;
            rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            newPill = JSON.parse(rawText);
            console.log(`Sukces przy użyciu modelu ${model}!`);
            break;
          } else {
            console.warn(`Błąd zwrotny z API dla ${model}...`);
          }
        } catch (err) {
          console.warn(`Błąd połączenia z ${model} (próba ${attempt}):`, err.message);
        }
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }

  if (!newPill) {
    console.warn("Używam pigułki z bazy rezerwowej.");
    const randomIndex = Math.floor(Math.random() * fallbackPills.length);
    newPill = fallbackPills[randomIndex];
  }

  let html = fs.readFileSync("index.html", "utf8");
  html = html.replace("const defaultPills = [", "const defaultPills = [\n      " + JSON.stringify(newPill, null, 2) + ",");
  fs.writeFileSync("index.html", html);
  console.log("Pomyślnie dodano pigułkę wiedzy:", newPill.title);
}

generate();
