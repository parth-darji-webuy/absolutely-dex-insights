# Insights, explained very simply

*(Think of this as the story for a 5-year-old. The grown-up details are in [PROJECT.md](PROJECT.md), and the steps to switch it on are in [SETUP.md](SETUP.md).)*

---

## 1. The big idea: a lemonade stand

Imagine you have a **lemonade stand**. People walk up. Some buy lemonade. Some just look.

You want to know:

- How many people came today?
- Which sign works better: **"Lemonade 50p"** or **"Cold Lemonade 50p"**?
- What did people do, one by one?

**Insights is your report card for the stand.** It is a screen that answers those questions. It only *looks*. It never changes anything.

## 2. The words, one at a time

| Big word | Simple word |
| --- | --- |
| **The shop** | The lemonade stand. |
| **A visitor** | One person who walked up. They get a secret name tag like `kT9x…` so we can count them without knowing who they are. |
| **An event** | One thing a person did: *looked at a sign*, *picked up a cup*, *bought one*. |
| **Tracking tables** | Notebooks. Every time something happens, the shop writes one line in a notebook. There are six notebooks. |
| **The database (Neon)** | The cupboard where all the notebooks live. |
| **An A/B test (experiment)** | Two signs, A and B. Half the people see sign A, half see sign B. Then we count who buys more. |
| **Control and treatment** | Sign A is the *old* sign (control). Sign B is the *new* sign (treatment). |
| **A conversion** | A person who did the thing we hoped for, like buying. |
| **GrowthBook** | The helper who decides *which* signs are out today. Insights asks it, "Which tests are running?" |
| **Groq** | A clever robot friend who is good at words (see part 5). |
| **SQL** | A way of asking the notebooks a question, like "How many people picked up a cup yesterday?" |

## 3. What is on the screen

Insights has pages, like pages in a picture book:

1. **Overview**: "How are we doing this week?" Big numbers and little pictures.
2. **Experiments**: "Which sign is winning?" with a little race between sign A and sign B.
3. **Events**: "What did everyone do?" A list that keeps counting "5 seconds ago, 6 seconds ago…". Click a line to see that person's whole day.
4. **Products**: "Which things did people look at and put in the basket?"
5. **Reports**: "Give me the results as a spreadsheet." A button downloads a file.
6. **Ask your data**: "Just ask me a question in normal words."

Where there is nothing to show, you see **zeros** or **"Not tracked yet"**. That is not broken. It means: *nobody did that yet*, or *the shop doesn't write that down*.

## 4. How a number gets to the screen

```
  a person at the shop      the shop writes a line       Insights looks        you see it
  does something      →     in a notebook (Neon)    →    through a window  →   on the screen
                                                          (it can't touch!)
```

The window is important. Insights has a special key that **only lets it look**. It can't write, erase or change a single word in the notebooks. Even if someone tried to trick it, the cupboard says **"No!"**

## 5. The robot friend (Groq) and "Ask your data"

You type: *"Which product was added the most yesterday?"*

1. **The robot** reads your question and writes a **question for the notebooks** (that is the SQL). It only knows the names of eight notebooks. It can't open the cupboard itself.
2. **A strict guard** (our own code) reads the robot's question. The guard says **"No!"** to anything that tries to *erase* or *change* or *peek where it shouldn't*. If you type *"delete every row"*, the guard says: *"I can only answer questions about the tracked data."*
3. If the guard says **yes**, the question goes to the notebooks, but only to look.
4. **The robot** looks at the answer and says it in a short sentence.
5. You see the sentence, little bars, and the **exact question that was asked**, so you can check.

What the robot gets to see: your question and the answers it needs, with the secret name tags **shortened**. What it never sees: your passwords.

If you don't want a robot involved at all, set `AI_PROVIDER=none` and it is switched off.

## 6. The secret notes (`.env`)

Some things must stay secret, like the key to the cupboard. We keep them in one little file called **`.env`**. It is **never** put on the internet and **never** shown on the screen.

You fill in 12 lines. Here is what they are, in kid words:

| The line | In kid words |
| --- | --- |
| `STORE_DATABASE_URL` | The address of the cupboard, and the "look only" key. |
| `STORE_DATABASE_URL_UNPOOLED` | The same, a second way in (used when getting ready). |
| `SESSION_SECRET` | A made-up secret word the screen uses to remember you are you. Long and random. |
| `ADMIN_PASSWORD` | Your password. At least 12 letters. |
| `GROWTHBOOK_API_HOST` | The address of the helper who knows which signs are out. |
| `GROWTHBOOK_CLIENT_KEY` | The helper's "visitor pass". It starts with `sdk-`. |
| `AI_PROVIDER` | `groq` = robot on. `none` = robot off. |
| `GROQ_API_KEY` | The robot's pass. Starts with `gsk_`. |
| `GROQ_MODEL` | Which robot brain to use. |
| `INSIGHTS_TIMEZONE` | Where you live (like `Asia/Kolkata`), so "today" starts at the right time. |
| `TRACKING_START` | The first day we wrote in the notebooks. |
| `STORE_REFRESH_MINUTES` | How often the "right now" box updates (5 to 120 minutes). |

If you forget one, Insights stops and tells you **which one** (never the secret itself).

## 7. How to switch it on (the recipe)

You need: a computer with **Node 22**, the project, and your Neon / GrowthBook / Groq details.

1. **Get the project:** `git clone …` (or `git pull` if you already have it).
2. **Pick the right Node:** `nvm use`.
3. **Install the parts:** `npm install`.
4. **Make the "look only" key** in Neon: open the Neon SQL Editor and run **`docs/sql/01-create-read-only-role.sql`** (after changing the password in it). Then run **`02`** to check it.
5. **Make your secret notes:** copy `.env.example` to `.env`, fill in the 12 lines.
6. **Build the cupboard helper:** `npm run db:generate`.
7. **Turn it on:** `npm run dev`, then open **http://localhost:3000**.
8. **Sign in** with `designerexchange9@gmail.com` and your `ADMIN_PASSWORD`.

To stop it: press `Ctrl` and `C`.

## 8. "Is the number real?" (checking)

Open the Neon SQL Editor and run **`docs/sql/03-check-the-numbers.sql`**. It counts the same things by hand. The numbers should match the screen.

If a page is full of zeros, run **`docs/sql/04-is-there-data.sql`**. If the newest line in the notebooks is more than 7 days old, then zeros are the **right** answer: nobody came this week.

## 9. Pretend visitors (for practice)

If the stand is quiet, you can add **pretend visitors** so the screen has something to show. They all have a name tag that starts with `demo_`.

- Do this **only on a copy** (a Neon *branch*), never on the real shop.
- Run **`docs/demo-data.sql`** to add them. Run **`docs/demo-data-remove.sql`** to take them away.

## 10. Rules that keep everyone safe

- **Insights only looks. It never writes.**
- **Never share your `.env`.** It is like the key to the house.
- **Only you can get in:** one account, on one computer.
- **The robot can't be tricked into deleting**, because the guard checks everything first.
- If you change a password or a key, **stop and start Insights again**.

## 11. If something goes wrong

| What you see | What it means | What to do |
| --- | --- | --- |
| "Environment problem: …" | You forgot a line in `.env` | Fill that line in. Start again. |
| "Cannot find module … generated" | The cupboard helper isn't built | Run `npm run db:generate`. |
| "Ask your data is switched off" | The robot is off | Change `AI_PROVIDER` to `groq`. Start again. |
| "The AI is busy" | The robot needs a rest | Wait one minute. |
| Lots of zeros | Nobody came lately | Run `04-is-there-data.sql`. |
| It is a little slow | The cupboard is far away | That's normal. |

---

**The one-sentence version:** *Insights is a safe, look-only report card that counts what happened at the shop, shows which new idea is winning, and lets you ask questions in normal words.*
