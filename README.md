# نتيجة الثانوية العامة — Thanwya Amma Results

A lightweight, static website for searching Egyptian Thanawya Amma (high school) exam results by student name or seat number.

## Features

- **Arabic RTL layout** with modern glassmorphism design
- **Two systems**: النظام الحديث (Modern) and النظام القديم (Old)
- **Search by full name** — normalized Arabic matching (أ إ آ → ا, ة → ه, ى → ي)
- **Search by seat number** — exact match
- **Dark mode toggle** with localStorage persistence
- **Responsive** — works on mobile, tablet, and desktop
- **Fast** — lazy-loads only the selected dataset, caches in memory
- **No frameworks** — pure HTML, CSS, and vanilla JavaScript

## Project Structure

```
Thanwya/
├── index.html        # Main page
├── style.css         # Styles (glassmorphism, RTL, dark mode)
├── script.js         # Search logic, data loading, rendering
├── README.md         # This file
└── data/
    ├── modern.json   # Modern system results
    └── old.json      # Old system results
```

## Usage

1. Open `index.html` in any browser, or serve with a local server:
   - **VS Code**: Use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
   - **Python**: `python -m http.server 8000`
2. Select a system (Modern or Old)
3. Choose search type (Name or Seat Number)
4. Enter your query and press **بحث** or hit **Enter**

## Hosting

Deploy to **GitHub Pages**:

1. Push to a GitHub repository
2. Go to Settings → Pages → Source: main branch
3. The site will be available at `https://<username>.github.io/<repo>/`

## Notes

- JSON data files are **not modified** by this project
- For personal use and sharing with friends only
- No backend, no database, no authentication required
