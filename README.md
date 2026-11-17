# Md Kamruzzaman: portfolio

A one-page portfolio with a 3D particle field, a terminal, and a bug-hunt game.
Plain HTML, CSS and JavaScript (ES modules). No build step, and nothing is
loaded from another server: fonts and libraries are all in `assets/`.

## Run it

The page loads its content from a JSON file, which browsers only allow over
HTTP. Open it through any static server:

- VS Code: right-click `index.html` → **Open with Live Server**
- or in this folder: `npx serve`

Opening `index.html` straight from disk shows a short message instead.
To publish, upload the whole folder to any static host (Vercel, Netlify,
GitHub Pages).

## Change the content

**Everything the site says is in [`assets/data/content.json`](assets/data/content.json).**
Edit it and reload. No code changes needed.

| Section in the JSON | What it controls |
|---|---|
| `meta` | Page title and description |
| `profile` | Name, email, phone, links, city, time zone |
| `resume` | The PDF path, the saved file name, the button text |
| `nav` | Header links, the mobile menu, the chapter dots |
| `hero` | First screen: tagline, intro, buttons, hint |
| `about` | About text, the four numbers, the "Now" box |
| `marquee` | The two scrolling rows of stack names |
| `work.projects` | The project list (add, remove or reorder items here) |
| `caseStudy` | The case study; `project` is the id of a project in `work.projects` |
| `services` | Services; `proof` lists project ids |
| `career` | Jobs, education, award |
| `skills` | Skill groups and soft skills |
| `github` | Code section heading (numbers come live from GitHub) |
| `voices` | Testimonials; the section stays hidden while `items` is empty |
| `contact` | Contact heading, buttons, details |
| `shortcuts` | The keyboard shortcuts list; write keys as `[Ctrl][K]` |
| `loader` | The loading screen lines |
| `terminal` | The terminal's own answers, suggestions and the resume text |

Notes:
- Text fields may contain simple HTML such as `<b>` or `<br>`.
- Projects are referred to by their `id` (for example `"school"`).
  In a career "Built" list, `"@hr"` links to the project with id `hr`.
- Two copies of the title and description also sit in the `<head>` of
  `index.html`, for search engines and link previews. Update them too.

Other files you might replace:
- The resume PDF: `assets/files/` (then update `resume.file`)
- The portrait: `assets/data/portrait.js` (points + photo, generated data)

## SEO

Search engines and link previews read the `<head>` of `index.html` directly,
so the SEO tags live there, not in content.json:

- title, description, canonical URL, robots
- Open Graph and Twitter card tags, with `assets/images/og-image.jpg` (1200×630)
- JSON-LD structured data (WebSite, ProfilePage, Person)
- icons and `site.webmanifest`

Root files: `robots.txt` and `sitemap.xml`.

The site address is `https://xplorekamrul.vercel.app/`. If it changes,
replace it in the `<head>` of `index.html`, in `robots.txt` and in `sitemap.xml`.
When the content changes, update `<lastmod>` in `sitemap.xml`. If the job
or the summary changes, update the description tags and the JSON-LD `Person` too.

## Folder structure

```
index.html                 the page shell: <head>, panels and dialogs, empty <main>
assets/
  data/
    content.json           ALL the content (edit this)
    portrait.js            portrait points and photo for the 3D bust (generated)
  files/                   the resume PDF
  fonts/                   Bricolage Grotesque, Instrument Sans (woff2, variable)
  vendor/                  three.js, GSAP, ScrollTrigger
  css/
    main.css               imports every file below, in order
    base/                  fonts, tokens (colours, sizes), reset, scrollbar, theme switch
    layout/                header, shared section layout
    components/            loader, cursor, terminal, shortcuts, bug game panels...
    sections/              one file per section: hero, about, work, career...
  js/
    main.js                entry point: load content → render → start features
    core/                  env.js (helpers), content.js (loads the JSON), toast, ui hooks
    render/                turns content.json into HTML
      sections.js          one function per section, using .map() over the data
      chrome.js            header nav, menu, dots, shortcuts, footer
      helpers.js           list(), extLink(), bug()...
      index.js             puts it all on the page
    features/              behaviour, one file each: terminal, field (3D),
                           game, theme, work list, career, skills, github...
```

## How it starts

1. `index.html` loads the CSS, GSAP (deferred) and `assets/js/main.js` (module).
2. `main.js` fetches `content.json`, renders every section, then starts each feature.
3. After the first paint, `features/lazy-3d.js` loads three.js and the portrait
   data, and the particle field takes over the hero. Until then the name shows
   as plain text, so the page is usable immediately.
