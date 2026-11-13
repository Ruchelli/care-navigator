# Care Navigator · family pilot page (experiment cards 1 and 2)

A one-page, phone-first waitlist for NYC parents with employer insurance. It runs two experiments from Team 210's de-risking plan (TECH 5900, Cornell Tech):

- **Card 1 · Do families sign up? (#20, also #26).** Each visitor sees one price at random: **"Free through your employer"** or **"$12 a month for your family."** We count who taps **Reserve my spot** and leaves an email.
- **Card 2 · Do parents connect records? (#9).** Right after reserving, parents choose **Connect my child's records** or **Answer 5 questions instead.** Connect opens a consent screen, at random **plain** or **detailed**. We count who taps **Allow**. No records are collected; the page says linking opens with the pilot.

Parents who answer the 5 questions get a first plan by email within 48 hours, which the team builds by hand (concierge). The page never asks for names, medical records or payment.

## Setup (about 20 minutes)

### 1. Google Sheet (stores the data)
1. Create a Google Sheet named **Care Navigator pilot**.
2. **Extensions → Apps Script.** Delete what's in the editor, paste all of `apps-script/Code.gs`, and save.
3. In the toolbar, pick the function **setup** and press **Run**. Allow access when asked. This creates the **Responses** and **Experiments** tabs.
4. **Deploy → New deployment →** gear icon **→ Web app.** Execute as: **Me**. Who has access: **Anyone**. Press **Deploy** and copy the **Web app URL**.

### 2. Connect the page
Open `index.html`, find `ENDPOINT: ""` near the bottom, and paste the URL between the quotes. The orange "Preview mode" bar disappears once it is set.

### 3. Put the page online (GitHub Pages, free)
1. On GitHub, create a **public** repository (for example `care-navigator`).
2. **Add file → Upload files:** upload `index.html`, `README.md`, the `img` folder and the `apps-script` folder. Commit.
3. **Settings → Pages →** Source: **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
4. After a minute the page is live at `https://YOUR-USERNAME.github.io/care-navigator/`.

### 4. Test before sharing
Open the page with `?test=1` at the end and go through it once. A row should appear in **Responses** with `test = yes`. Test rows are left out of the **Experiments** tab automatically.

## Links

| Add to the URL | What it does |
|---|---|
| `?test=1` | Marks the visit as a team test (not counted) |
| `?src=NAME` | Records where the visitor came from, e.g. `?src=fb-parkslope`, `?src=nextdoor-astoria` |
| `?p=free` or `?p=12` | Forces a price version (for testing only) |
| `?c=plain` or `?c=detailed` | Forces a consent version (for testing only) |

Use a different `src` for every group you post in, so you can see which channel works. Never share `?p=` or `?c=` links publicly: the versions must stay random.

## Reading the results

The **Experiments** tab updates by itself:
- **Card 1:** eligible visitors and reservations per price version, and the reservation rate. Holds if the free version reaches 30% or more; breaks below 15%.
- **Card 2:** parents who reached the records step and who tapped Allow, per consent version. Holds at 60% or more in either version; breaks below 40% in both.

Two columns in **Responses** are filled by the team, with `yes`: **plan_sent** (you emailed the first plan) and **tapped_book_it** (the parent replied or clicked "Book it for me" in that email). These count #8 as behavior.

## Privacy rules for the team
- The page collects an email, the screening answers and five multiple-choice answers. No names, no records.
- Don't add fields that collect health records, dates of birth or insurance numbers: Google Sheets is not approved for health data.
- Share the Sheet only with the team and your coach. Delete it when the course ends.
