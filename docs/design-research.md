# MartIT — Design Research (Step 0)

Researched 2026-10-09. Principles only; nothing copied.

## Access log
| Site | Status |
|---|---|
| zepto.com | Opened in browser (rendered page + text). |
| blinkit.com | Plain fetch returned 403; opened in browser, but the location-picker overlay covered the page. Notes below combine what was visible with prior knowledge. |
| 21st.dev | Opened. Category-level content only, no individual components named. |
| magicui.design | Opened component index (77 components). Behaviour notes are from prior knowledge of the library. |
| threeui.com/browse | Opened (first ~60% of the catalogue). |
| jitter.video UI templates | Opened. Template names only; no easing/timing data published. |
| dribbble.com/tags/ui-elements | Shell rendered; only the first shots were visible. Trend notes partly from prior knowledge. |

## Zepto
- Header is three things only: location + delivery promise ("Delivery in minutes", "Select Location"), one wide search bar with a rotating placeholder ("Search for 'kurkure'"), and Login/Cart icons. The promise sits next to the location, not in the hero.
- A horizontal category tab rail (icon + label) directly under the header acts as primary navigation; the active tab gets an underline and a tint.
- "Shop by Category" is a dense 10-column grid of cutout tiles with 2-line labels. Tiles have no borders, so the product art makes the grid.
- Product card anatomy, top to bottom: image, outlined **ADD** button overlapping the image corner, price with struck-through MRP, title (2-line clamp), pack size ("1 pack (2 kg)"). Price comes before name, so price is scanned first.
- Rows are horizontal shelves ("Cleaning Essentials", "Rice", each with "See All"). Dense rows are separated by plain section titles rather than decorative dividers.
- Two wide promo banners at the top, side by side, each with one CTA. Banners carry the brand colour; the rest of the page stays neutral.

## Blinkit
- The delivery-time promise is the biggest text in the header ("Delivery in 9 minutes"), with the location below it. Time works as the brand.
- Categories are grouped under section headings ("Grocery & Kitchen", "Snacks & Drinks") in a 4-up mobile grid. Tiles have a soft tinted background, a product-cluster image, and a label below.
- Card: weight chip, image, 2-line name, price at bottom-left, green outlined ADD at bottom-right that turns into a solid green − n + stepper.
- The sticky cart bar appears only once the cart has items: item count and total on the left, "View Cart →" on the right. It is the strongest CTA on screen.
- Location is required up front (modal on first visit). For MartIT this becomes "pick your hostel/block". That is a short list rather than a map, so it is much lighter.

## 21st.dev
- It positions itself as "designed, not generated": many authors each give the same component type a different treatment. Takeaway: give each section its own layout and don't reuse one card grid everywhere.
- Everything uses shadcn tokens and is copied into the project, so components inherit our theme. Adapted components should read from our CSS variables only.
- Heroes and pricing are its largest categories. Hero variety comes from layout (split, offset, bento hero) rather than from effects.
- Shaders and gradients are a separate category. Effects are treated as optional extras, not as structure.

## Magic UI
- Relevant pieces: **Number Ticker** (cart total, live counters), **Border Beam / Shine Border** (active order card, selected payment method), **Bento Grid + Magic Card** (feature section with cursor spotlight), **Marquee** (category strip or "what's in stock" ticker), **Animated Beam** (an inspiration for the Store → Runner → You route line), **Blur Fade / Text Animate** (headline reveal), **Confetti** (OTP success), **Animated Circular Progress** (UPI countdown ring), **Dock** (an idea for the desktop runner toolbar), **Noise Texture** (grain).
- Lesson: each effect should mean something, and one hero effect per viewport is enough. The library is easy to overuse.
- Most effects are CSS transform/opacity or small SVG, so they can live with reduced motion if each one checks the media query.

## ThreeUI
- Strong 3D pieces have one subject, pointer response, and keyboard access (drag *or* arrow keys on carousels). For us: one 3D object (e.g. a delivery tote or bag) that tilts toward the pointer, nothing more.
- Depth-scaled carousels on an arc could later suit a "popular this week" shelf. For now this is noted only (out of scope, too heavy).
- Several heroes use a single bloom/lighting pass on a calm background. Restraint is what makes them look premium.
- Particle and point-cloud backgrounds are visually loud and heavy on performance. Not a fit for a utility commerce app.

## Jitter UI templates
- Recurring motion types: **state morph** (button → success, icon → icon), **trace** (outline drawn around a button), **progress ring/donut counters**, **cart-button splits** ("View Cart Button: Split"), **payment notifications**.
- "View Cart: Split" maps to our Add → stepper morph and our sticky cart bar entrance.
- "Loading Spinner: Success Animation" maps to the UPI states: pending spinner → processing → check-mark draw.
- Easing/timing aren't published. Our defaults: enter 240–320ms `cubic-bezier(.2,.8,.2,1)`, exit 160–200ms, springs `stiffness 500 / damping 30` for steppers and badges, 1 frame stagger = 40ms.

## Dribbble (UI Elements)
- Visible shots: a split auth card (form + photo panel) and a dark fintech bento of balance cards with one hot accent tile (orange/red) on a near-black grid.
- Trends: bento dashboards with **one saturated tile**, large tabular numerals as the hero of a card, soft 20–28px radii, pill chips, warm off-white backgrounds, monochrome UI with one accent colour.
- Things to avoid: glassmorphism on everything, purple-blue blob gradients, illegible low-contrast grey on grey.

## Principles carried into MartIT
1. The delivery promise sits next to the location (campus/hostel block). Because we can't claim a delivery time, it shows **status** and not a minute count.
2. Card: image → price (tabular, ₹) → name → pack size. The ADD button becomes a stepper in place, with the same footprint so the layout doesn't shift.
3. The sticky cart bar exists only when the cart has items, and it is the dominant CTA.
4. Neutral surfaces with one saturated accent tile per view.
5. One effect per viewport. Effects show state (status, progress, success) rather than decorating.
