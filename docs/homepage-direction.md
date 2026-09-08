# Homepage direction — September 2026

The site is a personal field guide to building a stronger life. Money is the most developed entry point; health is a companion subject that is still taking shape. Construction and technology projects establish the author's perspective. AI research is a separate, clearly labelled place for deeper exploration.

The previous homepage presented these subjects with similar visual weight. The new homepage prioritizes a visitor's next action: understand their money, build a foundation, or learn to invest. Three selected reading and tool links follow. A personal note introduces the connection to Tui's construction background before the research preview.

The visual direction uses warm paper, olive ink, large Instrument Serif headings, compact sans-serif interface text, and original architectural photography. The shared palette and navigation treatment carry through every section. Money is a guided decision path; Health is a calm journal; Work is a workshop and portfolio; Research is a labelled desk and archive; About is a personal profile. Article layouts and tools retain their existing functionality while gaining a clearer reading rhythm and progress indicator.

Implementation: `resources/css/components/field-chrome.css` provides the shared palette and chrome overrides; `resources/css/sections/field-guide.css` owns the homepage; `resources/css/components/editorial.css` extends the hubs, articles, section navigation, and motion; `resources/js/experience.mjs` owns progressive enhancement; and `resources/images/` contains local WebP editorial assets. These extend the existing design system. Light and dark modes, mobile navigation, search, reduced motion, and existing URLs remain available.

Next editorial priorities: make the money hub's situation picker the central navigation pattern within that section; review the lesson-to-lesson experience; develop a small, substantive health starting path before presenting health as a complete library. Do not fill the homepage with more research or more equivalent cards merely to make the site feel larger.

Preview: `python3 -m http.server 3000 --bind 127.0.0.1`, then visit http://localhost:3000. No build step is required.
