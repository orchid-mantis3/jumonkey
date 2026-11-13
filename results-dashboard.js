/* =====================================================================
   Jumonkey — end-of-game results dashboard ("bonus level")

   Shown after the ending, when the player presses "See my jungle!".
   Six short pages:
     Score -> Jungle -> Choices -> What you learned -> Did you know? -> Help
   Play Again restarts the game.

   It only READS the game state from script.js (questions, endings,
   playerChoices, playerName, getActiveQuestion) and calls
   initializeGame() for Play Again. Scenarios and scoring are untouched.
   Nothing is saved or sent anywhere.

   Content (labels, kid text, facts) lives in results-data.js.
   Styles: results-dashboard.css (all classes start with "jd-").
===================================================================== */

window.JumonkeyResults = (() => {
    const DATA = window.JumonkeyResultsData;
    const px = (name, cls) => window.JumonkeyPixels.svg(name, cls);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = () => motionQuery.matches;

    // =================================================================
    // RESULTS LOGIC (small pure helpers, all derived from game data)
    // =================================================================

    function bestBananas(question) {
        return Math.max(...question.answers.map((answer) => answer.bananas));
    }

    function shorten(text, words = 5) {
        const parts = text.trim().split(/\s+/);
        return parts.length <= words ? text.trim() : `${parts.slice(0, words).join(" ")}…`;
    }

    // finds the label + habits for an answer in results-data.js
    function answerMeta(questionIndex, answer) {
        const scenario = DATA.scenarios[questionIndex];
        const text = answer.text.toLowerCase();
        const meta = scenario && scenario.answers.find((m) => text.includes(m.match));
        return meta || { label: shorten(answer.text), habits: [] };
    }

    // one entry per scenario, using the answer the player actually picked
    function getDecisions() {
        return questions.map((_, index) => {
            const question = getActiveQuestion(index);
            const scenario = DATA.scenarios[index] || {};
            const answerIndex = playerChoices[index];
            const answer = question.answers[answerIndex];
            const meta = answer ? answerMeta(index, answer) : { label: "", habits: [] };
            const best = bestBananas(question);

            return {
                index,
                name: scenario.name || question.title,
                icon: scenario.icon || "sprout",
                takeaway: scenario.takeaway || "",
                answered: Boolean(answer),
                answerText: answer ? answer.text.trim() : "",
                response: answer ? answer.response : "",
                label: meta.label,
                habits: meta.habits,
                bananas: answer ? answer.bananas : 0,
                best,
                bestLabels: question.answers
                    .filter((a) => a.bananas === best)
                    .map((a) => answerMeta(index, a).label)
            };
        });
    }

    // same rule as finishGame() in script.js: highest minimum first
    function getEnding(total) {
        const sorted = [...endings].sort((a, b) => b.minBananas - a.minBananas);
        const ending = sorted.find((e) => total >= e.minBananas) || sorted[sorted.length - 1];
        const rank = sorted.indexOf(ending);
        const tier =
            rank === 0 ? "thriving" :
            rank === sorted.length - 1 ? "needsCare" : "growing";

        return { ending, tier, sorted };
    }

    function getHabits(decisions) {
        return DATA.habits.map((habit) => ({
            ...habit,
            practicedIn: decisions.filter((d) => d.habits.includes(habit.id)),
            inGame: DATA.scenarios.some((s) => s.answers.some((a) => a.habits.includes(habit.id)))
        }));
    }

    function getResults() {
        const decisions = getDecisions();
        const total = decisions.reduce((sum, d) => sum + d.bananas, 0);
        const max = decisions.reduce((sum, d) => sum + d.best, 0);
        const { ending, tier, sorted } = getEnding(total);

        return {
            name: playerName || "Eco Explorer",
            total,
            max,
            completed: decisions.filter((d) => d.answered).length,
            count: decisions.length,
            decisions,
            ending,
            tier,
            badge: DATA.tiers[tier].badge,
            endingsByRank: sorted,
            habits: getHabits(decisions)
        };
    }

    // "about 22 of 100" from the WHO percentage
    function recycledOutOf100() {
        return Math.round(DATA.facts.find((f) => f.id === "mystery").percent);
    }

    // =================================================================
    // SHARED HELPERS
    // =================================================================

    const STEPS = [
        { id: "score",   nav: "Score",   icon: "banana",     next: "See my jungle" },
        { id: "jungle",  nav: "Jungle",  icon: "tree",       next: "See my choices" },
        { id: "choices", nav: "Choices", icon: "laptop",     next: "What did I learn?" },
        { id: "learned", nav: "Learned", icon: "gift",       next: "Did you know?" },
        { id: "facts",   nav: "Facts",   icon: "bulb",       next: "Make my promise" },
        { id: "change",  nav: "Promise", icon: "heart",      next: null }
    ];

    let overlay = null;
    let body = null;
    let stepNav = null;
    let backButton = null;
    let nextButton = null;
    let playButton = null;
    let results = null;
    let step = 0;

    // timers + animation frames for the current page, cleared when it changes
    let timers = [];
    let frame = 0;
    const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
    function clearTimers() {
        timers.forEach(clearTimeout);
        timers = [];
        cancelAnimationFrame(frame);
    }

    const esc = (text) => String(text).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));

    const withName = (text) => esc(text.replace("{name}", results.name));

    function bananaRow(count) {
        return Array.from({ length: count },
            () => '<img src="assets/banana.png" alt="">').join("");
    }

    // restart a CSS animation class
    function replay(el, className) {
        el.classList.remove(className);
        void el.offsetWidth;
        el.classList.add(className);
    }

    // small decorations (leaves, ripples, drops) that remove themselves
    function burst(parent, className, html, count, life = 1400) {
        return Array.from({ length: count }, (_, i) => {
            const bit = document.createElement("span");
            bit.className = className;
            bit.style.setProperty("--n", i);
            bit.setAttribute("aria-hidden", "true");
            bit.innerHTML = html;
            parent.appendChild(bit);
            later(() => bit.remove(), life);
            return bit;
        });
    }

    // =================================================================
    // SHELL
    // =================================================================

    function build() {
        overlay = document.createElement("div");
        overlay.id = "jd-overlay";
        overlay.className = "jd hidden";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "jd-heading");

        overlay.innerHTML = `
            <div class="jd-panel">
                <nav class="jd-steps" aria-label="Results pages">
                    ${STEPS.map((s, i) => `
                        <button type="button" class="jd-step" data-step="${i}"
                                aria-label="Page ${i + 1}: ${s.nav}">
                            <span class="jd-step-icon">${s.icon === "banana"
                                ? '<img src="assets/banana.png" alt="">' : px(s.icon)}</span>
                            <span class="jd-step-label">${s.nav}</span>
                        </button>`).join("")}
                </nav>
                <div class="jd-body"></div>
                <div class="jd-footer">
                    <button type="button" class="jd-btn jd-btn--back"></button>
                    <button type="button" class="jd-btn jd-btn--next"></button>
                    <button type="button" class="jd-btn jd-btn--play hidden">Play Again</button>
                </div>
                <i class="spr tl" data-s="flowerPink"></i>
                <i class="spr tr" data-s="flowerWhite"></i>
                <i class="spr bl" data-s="flowerWhite"></i>
                <i class="spr br" data-s="flowerPink"></i>
            </div>`;

        // same pixel flowers as the game's other panels
        overlay.querySelectorAll(".spr").forEach((el) => {
            el.innerHTML = px(el.dataset.s, "px jd-corner");
        });

        body = overlay.querySelector(".jd-body");
        stepNav = overlay.querySelector(".jd-steps");
        backButton = overlay.querySelector(".jd-btn--back");
        nextButton = overlay.querySelector(".jd-btn--next");
        playButton = overlay.querySelector(".jd-btn--play");

        stepNav.addEventListener("click", (event) => {
            const button = event.target.closest(".jd-step");
            if (button) goTo(Number(button.dataset.step));
        });

        backButton.addEventListener("click", () => {
            if (step === 0) backToEnding();
            else goTo(step - 1);
        });

        nextButton.addEventListener("click", () => goTo(step + 1));
        playButton.addEventListener("click", playAgain);

        // Escape closes an open card first
        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                const close = body.querySelector(".jd-pop:not(.hidden) .jd-pop-close");
                if (close) { event.preventDefault(); close.click(); }
            }
        });

        document.getElementById("game-area").appendChild(overlay);
        loadClips();
    }

    // =================================================================
    // PAGE 1: SCORE
    // =================================================================

    function renderScore() {
        const r = results;
        const tier = DATA.tiers[r.tier];
        const pct = r.max ? (r.total / r.max) * 100 : 0;

        // markers for each ending threshold above zero (e.g. 13 and 19)
        const markers = r.endingsByRank
            .filter((e) => e.minBananas > 0 && e.minBananas <= r.max)
            .map((e, i) => `
                <span class="jd-mark" style="left:${(e.minBananas / r.max) * 100}%">
                    <span class="jd-mark-icon">${px(i === 0 ? "tree" : "sprout")}</span>
                    <span class="jd-mark-num">${e.minBananas}</span>
                </span>`).join("");

        return `
            <h2 id="jd-heading" class="jd-title" tabindex="-1">Your Jungle Score</h2>
            <p class="jd-sr">You earned ${r.total} of ${r.max} bananas. ${esc(tier.badge)}</p>
            <div class="jd-hero" aria-hidden="true">
                <img class="jd-monkey jd-score-monkey jd-anim-watch" src="assets/default.png" alt="">
                <div class="jd-confetti">${bananaRow(8)}</div>
                <div class="jd-sparkles">${px("star").repeat(4)}</div>
            </div>
            <p class="jd-big">${withName(tier.cheer)}</p>
            <div class="jd-meter" aria-hidden="true">
                <div class="jd-meter-track">
                    <div class="jd-meter-fill" data-pct="${pct}">
                        <img class="jd-meter-banana" src="assets/banana.png" alt="">
                    </div>
                    <span class="jd-meter-shine"></span>
                </div>
                <div class="jd-marks">${markers}</div>
            </div>
            <p class="jd-count" aria-hidden="true">
                <span class="jd-count-num" data-total="${r.total}">0</span>
                <span class="jd-count-of">of ${r.max} bananas</span>
            </p>
            <p class="jd-sub">
                <span class="jd-badge jd-score-badge">${esc(tier.badge)}</span>
                You finished ${r.completed} of ${r.count} adventures!
            </p>`;
    }

    function wireScore() {
        const page = body.querySelector(".jd-page");
        const fill = body.querySelector(".jd-meter-fill");
        const num = body.querySelector(".jd-count-num");
        const monkey = body.querySelector(".jd-score-monkey");
        const pct = Number(fill.dataset.pct);
        const total = Number(num.dataset.total);

        const celebrate = () => {
            fill.style.width = `${pct}%`;
            num.textContent = String(total);
            monkey.classList.remove("jd-anim-watch");
            monkey.classList.add(`jd-react-${results.tier}`);
            page.classList.add("is-done");
        };

        if (reduced()) { celebrate(); return; }

        // the bar and the number move together, easing out (about 1.6s)
        const duration = 1600;
        let start = 0;
        const tick = (now) => {
            if (!start) start = now;
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            fill.style.width = `${pct * eased}%`;
            num.textContent = String(Math.round(total * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
            else celebrate();
        };
        later(() => { frame = requestAnimationFrame(tick); }, 250);
    }

    // =================================================================
    // PAGE 2: JUNGLE (tap the trees, pond and plants)
    // =================================================================

    // x / y / w are % of the scene, so everything scales with it.
    // "tap" makes the piece a button.
    const JUNGLE = {
        thriving: [
            { s: "sun", x: 80, y: 6, w: 10 }, { s: "cloud", x: 8, y: 8, w: 11 },
            { s: "bird", x: 30, y: 14, w: 5 }, { s: "bird", x: 40, y: 9, w: 4 },
            { s: "butterfly", x: 56, y: 50, w: 3.5 },
            { s: "pond", x: 34, y: 80, w: 28, tap: "pond", label: "Pond" },
            { s: "tree", x: 64, y: 55, w: 13, tap: "tree", label: "Tree" },
            { s: "tree", x: 82, y: 53, w: 14, tap: "tree", label: "Tree" },
            { s: "flowerPink", x: 22, y: 72, w: 3.5, tap: "flower", label: "Flower" },
            { s: "flowerWhite", x: 92, y: 74, w: 3.5, tap: "flower", label: "Flower" }
        ],
        growing: [
            { s: "sun", x: 78, y: 6, w: 9 }, { s: "cloud", x: 66, y: 10, w: 13 },
            { s: "cloud", x: 12, y: 7, w: 11 }, { s: "bird", x: 34, y: 12, w: 4 },
            { s: "pondCloudy", x: 34, y: 80, w: 28, tap: "pond", label: "Pond" },
            { s: "tree", x: 64, y: 55, w: 13, tap: "tree", label: "Tree" },
            { s: "treeTired", x: 82, y: 53, w: 14, tap: "tree", label: "Tree" },
            { s: "flowerPink", x: 22, y: 72, w: 3.5, tap: "flower", label: "Flower" },
            { s: "wilted", x: 92, y: 71, w: 4, tap: "wilted", label: "Thirsty plant" }
        ],
        needsCare: [
            { s: "greyCloud", x: 10, y: 6, w: 14 }, { s: "greyCloud", x: 62, y: 9, w: 16 },
            { s: "greyCloud", x: 38, y: 4, w: 10 },
            { s: "pondMuddy", x: 34, y: 80, w: 28, tap: "pond", label: "Pond" },
            { s: "treeTired", x: 64, y: 55, w: 13, tap: "tree", label: "Tree" },
            { s: "treeBare", x: 82, y: 53, w: 14, tap: "tree", label: "Tree" },
            { s: "wilted", x: 22, y: 71, w: 4, tap: "wilted", label: "Thirsty plant" },
            { s: "wilted", x: 92, y: 71, w: 4, tap: "wilted", label: "Thirsty plant" },
            { s: "sprout", x: 62, y: 79, w: 3, tap: "sprout", label: "Sprout" }
        ]
    };

    function renderJungle() {
        const r = results;
        const tier = DATA.tiers[r.tier];
        const pieces = JUNGLE[r.tier].map((p, i) => {
            const style = `left:${p.x}%;top:${p.y}%;width:${p.w}%;--i:${i}`;
            return p.tap
                ? `<button type="button" class="jd-piece jd-tap jd-piece--${p.s}" data-tap="${p.tap}" data-s="${p.s}"
                           style="${style}" aria-label="${p.label}">${px(p.s)}</button>`
                : `<span class="jd-piece jd-piece--${p.s}" style="${style}" aria-hidden="true">${px(p.s)}</span>`;
        }).join("");

        return `
            <h2 id="jd-heading" class="jd-title" tabindex="-1">Your Jungle's Future</h2>
            <p class="jd-hint jd-hint--read">Tap the trees, the pond and the plants! ${READ_BUTTON}</p>
            <div class="jd-jungle jd-jungle--${r.tier}"
                 aria-label="${esc(tier.headline)} ${esc(tier.sees.map((s) => s.text).join(". "))}." role="group">
                <div class="jd-layer jd-layer--sky"></div>
                <div class="jd-layer jd-layer--back"></div>
                <div class="jd-layer jd-layer--front"></div>
                <div class="jd-layer jd-layer--ground"></div>
                ${pieces}
                <div class="jd-haze"></div>
                <img class="jd-jungle-monkey jd-anim-bob" src="assets/default.png" alt="">
            </div>
            <div class="jd-jungle-info" aria-live="polite">
                <span class="jd-info-icon">${px("sprout")}</span>
                <span class="jd-info-text"><b>${esc(tier.headline)}</b></span>
            </div>
            <ul class="jd-sees">
                ${tier.sees.map((s) => `<li><span class="jd-sees-icon">${px(s.icon)}</span>${esc(s.text)}</li>`).join("")}
            </ul>
            <p class="jd-note">${esc(DATA.pretendNote)}</p>`;
    }

    function wireJungle() {
        const read = body.querySelector(".jd-read");
        read.addEventListener("click", () => narrate([line(`jungle-${results.tier}`)], read));
        const scene = body.querySelector(".jd-jungle");
        const info = body.querySelector(".jd-jungle-info");
        const taps = DATA.jungleTaps;
        const tier = results.tier;

        const say = (icon, text, fact) => {
            info.innerHTML = `
                <span class="jd-info-icon">${px(icon)}</span>
                <span class="jd-info-text">${esc(text)}${fact ? `<small>${esc(fact)}</small>` : ""}</span>`;
            replay(info, "jd-anim-pop");
        };

        scene.querySelectorAll(".jd-tap").forEach((piece) => {
            piece.addEventListener("click", () => {
                const kind = piece.dataset.tap;
                const box = piece.getBoundingClientRect();
                const sceneBox = scene.getBoundingClientRect();
                const spot = (bit) => {
                    bit.style.left = `${box.left - sceneBox.left + box.width / 2}px`;
                    bit.style.top = `${box.top - sceneBox.top + box.height * 0.3}px`;
                };

                if (kind === "tree") {
                    replay(piece, "jd-anim-sway");
                    burst(scene, "jd-leaf", px("leaf"), 4).forEach(spot);
                    say(piece.dataset.s, taps.tree[tier], taps.tree.fact);
                } else if (kind === "pond") {
                    replay(piece, "jd-anim-splash");
                    burst(piece, "jd-ripple", "", 2, 1200);
                    say("drop", taps.pond[tier], taps.pond.fact);
                } else if (kind === "wilted") {
                    // a little care: the thirsty plant blooms (and stays a flower)
                    piece.innerHTML = px("flowerPink");
                    piece.dataset.tap = "flower";
                    piece.setAttribute("aria-label", "Flower");
                    replay(piece, "jd-anim-grow");
                    say("flowerPink", taps.wilted);
                } else if (kind === "sprout") {
                    replay(piece, "jd-anim-grow");
                    say("sprout", taps.sprout);
                } else {
                    replay(piece, "jd-anim-bounce");
                    say("flowerPink", taps.flower);
                }
            });
        });
    }

    // =================================================================
    // PAGE 3: CHOICES (cards open into a big card)
    // =================================================================

    function renderChoices() {
        const cards = results.decisions.map((d) => {
            const isBest = d.answered && d.bananas === d.best;
            return `
                <li class="jd-card-item">
                    <button type="button" class="jd-card" data-index="${d.index}" aria-expanded="false"
                            aria-controls="jd-pop">
                        <span class="jd-card-num">${d.index + 1}</span>
                        ${isBest ? `<span class="jd-card-star" title="Most bananas!">${px("star")}</span>` : ""}
                        <span class="jd-card-icon">${px(d.icon)}</span>
                        <span class="jd-card-name">${esc(d.name)}</span>
                        <span class="jd-card-pick">${d.answered ? esc(d.label) : "Not answered"}</span>
                        <span class="jd-card-bananas">
                            <span class="jd-card-row">${bananaRow(d.bananas)}</span>
                            <b>+${d.bananas}</b>
                            <span class="jd-sr">${d.bananas === 1 ? "banana" : "bananas"}</span>
                        </span>
                        <span class="jd-card-more" aria-hidden="true">Tap to open</span>
                    </button>
                </li>`;
        }).join("");

        return `
            <h2 id="jd-heading" class="jd-title" tabindex="-1">Your Choices Matter</h2>
            <p class="jd-hint">Tap a card to open it!</p>
            <div class="jd-cards-wrap">
                <ol class="jd-cards">${cards}</ol>
                <div class="jd-pop hidden" id="jd-pop" role="region" aria-labelledby="jd-pop-title">
                    <button type="button" class="jd-pop-close" aria-label="Close card">✕</button>
                    <div class="jd-pop-inner">
                        <div class="jd-pop-icon"></div>
                        <div class="jd-pop-text">
                            <p class="jd-pop-num"></p>
                            <h3 id="jd-pop-title" class="jd-pop-title" tabindex="-1"></h3>
                            <p class="jd-pop-pick"></p>
                            <p class="jd-pop-bananas"></p>
                        </div>
                    </div>
                    <p class="jd-says jd-pop-takeaway">
                        <img src="assets/default.png" alt="">
                        <span></span>
                    </p>
                    ${READ_BUTTON}
                    <details class="jd-pop-more">
                        <summary>Read the monkey's full note</summary>
                        <p class="jd-pop-response"></p>
                        <p class="jd-pop-best"></p>
                    </details>
                    <button type="button" class="jd-btn jd-pop-back">← Back to all cards</button>
                </div>
            </div>`;
    }

    function wireChoices() {
        const wrap = body.querySelector(".jd-cards-wrap");
        const grid = wrap.querySelector(".jd-cards");
        const pop = wrap.querySelector(".jd-pop");
        const cards = [...grid.querySelectorAll(".jd-card")];
        const popRead = pop.querySelector(".jd-read");
        let openCard = null;

        const fill = (d) => {
            const isBest = d.bananas === d.best;
            pop.querySelector(".jd-pop-icon").innerHTML = px(d.icon);
            pop.querySelector(".jd-pop-num").textContent = `Adventure ${d.index + 1}`;
            pop.querySelector(".jd-pop-title").textContent = d.name;
            pop.querySelector(".jd-pop-pick").innerHTML = `You picked: <b>${esc(d.label)}</b>`;
            pop.querySelector(".jd-pop-bananas").innerHTML =
                `<span class="jd-card-row">${bananaRow(d.bananas)}</span> <b>+${d.bananas}</b>` +
                (isBest ? ` <span class="jd-pop-star">${px("star")} Most bananas!</span>` : "");
            pop.querySelector(".jd-pop-takeaway span").textContent = d.takeaway || d.response;
            pop.querySelector(".jd-pop-response").innerHTML =
                `<b>You picked:</b> ${esc(d.answerText)}<br><b>Monkey says:</b> ${esc(d.response)}`;
            pop.querySelector(".jd-pop-best").innerHTML =
                isBest ? "" : `<b>Most bananas:</b> ${d.bestLabels.map(esc).join(" or ")}`;
            pop.querySelector(".jd-pop-more").open = false;
        };

        const open = (card) => {
            const d = results.decisions[Number(card.dataset.index)];
            fill(d);

            // grow out of the tapped card
            const from = card.getBoundingClientRect();
            const box = wrap.getBoundingClientRect();
            pop.style.setProperty("--ox", `${from.left - box.left + from.width / 2}px`);
            pop.style.setProperty("--oy", `${from.top - box.top + from.height / 2}px`);

            cards.forEach((c) => c.setAttribute("aria-expanded", String(c === card)));
            openCard = card;
            popRead.onclick = () => narrate([line(`choice-${d.index}`)], popRead);
            grid.inert = true;
            grid.classList.add("is-behind");
            pop.classList.remove("hidden", "is-closing");
            replay(pop, "is-opening");
            pop.scrollTop = 0;
            pop.querySelector(".jd-pop-title").focus({ preventScroll: true });
        };

        const close = () => {
            if (!openCard) return;
            stopNarration();
            const card = openCard;
            openCard = null;
            cards.forEach((c) => c.setAttribute("aria-expanded", "false"));
            grid.inert = false;
            grid.classList.remove("is-behind");
            const done = () => { pop.classList.add("hidden"); pop.classList.remove("is-closing"); };
            if (reduced()) done();
            else { pop.classList.add("is-closing"); later(done, 200); }
            card.focus({ preventScroll: true });
        };

        cards.forEach((card) => card.addEventListener("click", () => open(card)));
        pop.querySelector(".jd-pop-close").addEventListener("click", close);
        pop.querySelector(".jd-pop-back").addEventListener("click", close);
    }

    // =================================================================
    // PAGE 4: WHAT YOU LEARNED (try each habit)
    // =================================================================

    const tried = new Set();

    // the little scene for each habit; "done" state comes from CSS (.is-done)
    const LAB_SCENES = {
        reduce: () => `
            <img class="jd-actor jd-lab-monkey" src="assets/default.png" alt="">
            <span class="jd-actor jd-a-phone">${px("phone")}</span>
            <span class="jd-actor jd-a-hearts">${px("heart").repeat(3)}</span>
            <span class="jd-actor jd-a-shop">${px("bag")}<span class="jd-a-label">New phone?</span>
                <span class="jd-a-no" aria-hidden="true">✕</span></span>`,
        reuse: () => `
            <img class="jd-actor jd-lab-monkey" src="assets/default.png" alt="">
            <img class="jd-actor jd-lab-friend" src="assets/default.png" alt="">
            <span class="jd-actor jd-a-tablet">${px("tablet")}</span>
            <span class="jd-actor jd-a-hearts jd-a-hearts--right">${px("heart").repeat(3)}</span>`,
        repair: () => `
            <img class="jd-actor jd-lab-monkey" src="assets/default.png" alt="">
            <span class="jd-actor jd-a-phone jd-a-phone--center">${px("phoneCracked")}</span>
            <span class="jd-actor jd-a-wrench">${px("wrench")}</span>
            <span class="jd-actor jd-a-sparkle">${px("star").repeat(3)}</span>`,
        recycle: () => `
            <img class="jd-actor jd-lab-monkey" src="assets/default.png" alt="">
            <span class="jd-actor jd-a-laptop">${px("laptopCap")}</span>
            <span class="jd-actor jd-a-bin">${px("bin")}<span class="jd-a-label">E-waste drop-off</span></span>
            <span class="jd-actor jd-a-sparkle jd-a-sparkle--bin">${px("star").repeat(3)}</span>`
    };

    function renderLearned() {
        const tiles = results.habits.map((h, i) => {
            const did = h.practicedIn.length > 0;
            return `
                <li>
                    <button type="button" class="jd-habit ${did ? "is-done" : ""}" data-habit="${h.id}"
                            aria-pressed="${i === 0}" aria-controls="jd-lab">
                        <span class="jd-habit-icon">${px(h.icon)}</span>
                        <span class="jd-habit-name">${esc(h.name)}</span>
                        <span class="jd-habit-status">${did ? "✓ You did it!" : "Try it next time"}</span>
                        <span class="jd-habit-tried" aria-hidden="true">${px("star")}</span>
                    </button>
                </li>`;
        }).join("");

        return `
            <h2 id="jd-heading" class="jd-title" tabindex="-1">What You Learned</h2>
            <p class="jd-hint">Pick a habit, then try it!</p>
            <ul class="jd-habits">${tiles}</ul>
            <div class="jd-lab" id="jd-lab" aria-live="polite">
                <p class="jd-lab-explain"></p>
                <div class="jd-lab-stage"></div>
                <div class="jd-lab-row">
                    <button type="button" class="jd-btn jd-btn--try"></button>
                    <p class="jd-lab-result"></p>
                </div>
                <p class="jd-lab-game"></p>
            </div>`;
    }

    function wireLearned() {
        const tiles = [...body.querySelectorAll(".jd-habit")];
        const explain = body.querySelector(".jd-lab-explain");
        const stage = body.querySelector(".jd-lab-stage");
        const tryButton = body.querySelector(".jd-btn--try");
        const result = body.querySelector(".jd-lab-result");
        const game = body.querySelector(".jd-lab-game");
        let habit = null;
        let busy = false;

        const show = (id) => {
            habit = results.habits.find((h) => h.id === id);
            tiles.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.habit === id)));
            explain.innerHTML = `<b>${esc(habit.name)}:</b> ${esc(habit.explain)}`;
            stage.className = `jd-lab-stage jd-lab--${id}`;
            stage.innerHTML = LAB_SCENES[id]();
            tryButton.textContent = habit.action;
            result.textContent = "";
            busy = false;
            game.innerHTML = habit.practicedIn.length
                ? `In your game, you did this in: <b>${habit.practicedIn.map((d) => esc(d.name)).join(", ")}</b>`
                : habit.inGame ? "In your game: try it next time!"
                : `This game doesn't have a ${esc(habit.name)} choice yet.`;
            replay(stage, "jd-anim-fade");
        };

        const act = () => {
            if (busy) return;
            if (stage.classList.contains("is-done")) { show(habit.id); return; } // "Try again"
            busy = true;
            stage.classList.add("is-doing");

            const finish = () => {
                if (habit.id === "repair") {
                    stage.querySelector(".jd-a-phone").innerHTML = px("phone");
                }
                stage.classList.add("is-done");
                result.textContent = habit.done;
                tryButton.textContent = "↺ Try again";
                tried.add(habit.id);
                tiles.find((t) => t.dataset.habit === habit.id).classList.add("is-tried");
                busy = false;
            };

            if (reduced()) finish();
            else later(finish, habit.id === "repair" ? 700 : 900);
        };

        tiles.forEach((t) => {
            if (tried.has(t.dataset.habit)) t.classList.add("is-tried");
            t.addEventListener("click", () => show(t.dataset.habit));
        });
        tryButton.addEventListener("click", act);
        show(results.habits[0].id);
    }

    // =================================================================
    // PAGE 5: DID YOU KNOW? (one fun fact at a time)
    // =================================================================

    const GADGETS = ["phone", "laptop", "tablet", "gamepad"];
    const gadgetIcon = (i) => px(GADGETS[(i * 7 + Math.floor(i / 10)) % GADGETS.length]);
    const factById = (id) => DATA.facts.find((f) => f.id === id);
    let factIndex = 0;

    // -----------------------------------------------------------------
    // READ TO ME
    // 1st choice: a recorded clip from audio/narration/ (one warm narrator,
    //    made on a developer's computer; see tools/make_narration.py).
    //    A clip is only used if it was made from exactly the words now on
    //    screen, so audio and text can never drift apart.
    // Fallback: the best voice already on this device (speechSynthesis).
    // Nothing is sent anywhere, nothing autoplays, and only one thing
    // ever plays at a time.
    // -----------------------------------------------------------------
    const CLIP_DIR = "audio/narration/";
    const canSpeak = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
    const line = (id) => ({ id, text: (DATA.narration && DATA.narration[id]) || "" });
    const READ_BUTTON = '<button type="button" class="jd-btn jd-read" aria-pressed="false">🔊 Read to me</button>';

    let clipList = null;            // id -> { file, text }, set by audio/narration/clips.js
    let clipsRequested = false;

    function loadClips() {
        if (clipsRequested) return;
        clipsRequested = true;
        const tag = document.createElement("script");
        tag.src = `${CLIP_DIR}clips.js`;
        tag.onload = () => { clipList = window.JumonkeyNarrationClips || {}; };
        tag.onerror = () => { clipList = {}; };      // no clips: the device voice is used
        document.head.appendChild(tag);
    }

    // ---- fallback voice: pick the most natural local English voice ----
    // (voices load late in some browsers, so the list is re-read each time)
    const GOOD_VOICE = [/natural/i, /neural/i, /premium/i, /enhanced/i, /siri/i,
        /\b(ava|allison|samantha|zoe|serena|karen|moira|tessa|aria|jenny|libby|sonia)\b/i];
    const NOVELTY_VOICE = /bad news|bahh|bells|boing|bubbles|cellos|wobble|good news|jester|organ|superstar|trinoids|whisper|zarvox|albert|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;

    function voiceScore(voice) {
        let score = 0;
        GOOD_VOICE.forEach((hint, i) => { if (hint.test(voice.name)) score += (GOOD_VOICE.length - i) * 10; });
        if (/^en[-_]US/i.test(voice.lang)) score += 3;
        if (NOVELTY_VOICE.test(voice.name)) score -= 100;
        return score;
    }

    function pickVoice() {
        if (!canSpeak) return null;
        // local voices only, so no text is sent to an online speech service
        const english = window.speechSynthesis.getVoices()
            .filter((v) => /^en([-_]|$)/i.test(v.lang) && v.localService !== false);
        return english.sort((x, y) => voiceScore(y) - voiceScore(x))[0] || null;
    }

    if (canSpeak) window.speechSynthesis.getVoices();   // asks the browser to start loading voices

    function speakLine(text, done) {
        if (!canSpeak) { done(); return; }
        const talk = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) { talk.voice = voice; talk.lang = voice.lang; }
        talk.rate = 0.95;
        talk.pitch = 1.05;
        talk.onend = done;
        talk.onerror = done;
        window.speechSynthesis.speak(talk);
    }

    const narration = { run: 0, button: null, audio: null };

    function stopNarration() {
        narration.run++;                                  // cancels anything still queued
        if (narration.audio) { narration.audio.pause(); narration.audio = null; }
        if (canSpeak) window.speechSynthesis.cancel();
        if (narration.button) narration.button.setAttribute("aria-pressed", "false");
        narration.button = null;
    }

    // items: [{ id, text }] read one after another. Pressing the same button again stops.
    function narrate(items, button) {
        const wasPlaying = narration.button === button;
        stopNarration();
        if (wasPlaying) return;

        const run = narration.run;
        const queue = items.filter((item) => item && item.text);
        narration.button = button;
        button.setAttribute("aria-pressed", "true");

        const next = () => {
            if (run !== narration.run) return;            // stopped or replaced meanwhile
            const item = queue.shift();
            if (!item) { stopNarration(); return; }

            const clip = clipList && clipList[item.id];
            if (!clip || clip.text !== item.text) { speakLine(item.text, next); return; }

            const audio = new Audio(CLIP_DIR + clip.file);
            let failed = false;
            const useVoice = () => {                      // missing / broken file: device voice instead
                if (failed || run !== narration.run) return;
                failed = true;
                narration.audio = null;
                speakLine(item.text, next);
            };
            narration.audio = audio;
            audio.onended = () => { narration.audio = null; setTimeout(next, 250); };
            audio.onerror = useVoice;
            const playing = audio.play();
            if (playing && playing.catch) playing.catch(useVoice);
        };
        next();
    }

    // the big picture for each fact
    const FACT_STAGES = {
        trucks: () => `
            <div class="jd-fact-stage jd-stage--trucks">
                <span class="jd-road"></span>
                <img class="jd-fact-monkey" src="assets/default.png" alt="">
                <span class="jd-wow" aria-hidden="true">!</span>
                <div class="jd-trucks"></div>
                <div class="jd-stage-count"><b class="jd-truck-n">0</b> trucks sent</div>
            </div>`,
        pile: (f) => {
            const most = Math.max(...f.years.map((y) => y.tonnes));
            const icons = Array.from({ length: most }, (_, i) =>
                `<span class="jd-pile-bit${i >= f.years[0].tonnes ? " is-predicted" : ""}">${gadgetIcon(i)}</span>`).join("");
            return `
                <div class="jd-fact-stage jd-stage--pile">
                    <div class="jd-pile" aria-hidden="true">${icons}</div>
                    <div class="jd-pile-side">
                        <div class="jd-stage-count"><b class="jd-pile-n">${f.years[0].tonnes}</b> million tonnes</div>
                        <span class="jd-pile-tag">${esc(f.years[0].tag)}</span>
                        <span class="jd-pile-key">${gadgetIcon(0)} = 1 million tonnes</span>
                    </div>
                </div>`;
        },
        mystery: () => `
            <div class="jd-fact-stage jd-stage--mystery">
                <div class="jd-hundred" role="img" aria-label="100 gadget pictures">
                    ${Array.from({ length: 100 }, (_, i) => `<span class="jd-gadget">${gadgetIcon(i)}</span>`).join("")}
                </div>
                <div class="jd-stage-count"><b class="jd-fact-n">?</b> of 100</div>
            </div>`,
        treasure: (f) => `
            <div class="jd-fact-stage jd-stage--treasure">
                <button type="button" class="jd-phone-btn" aria-label="Open the old phone">${px("phoneCracked")}</button>
                ${f.materials.map((m, i) => `
                    <span class="jd-gem jd-gem--${i}" aria-hidden="true">
                        ${px(m.icon)}<span class="jd-gem-name">${esc(m.name)}</span>
                    </span>`).join("")}
                <span class="jd-actor jd-a-sparkle jd-treasure-sparkle">${px("star").repeat(3)}</span>
            </div>`
    };

    function renderFacts() {
        return `
            <h2 id="jd-heading" class="jd-title" tabindex="-1">Did You Know?</h2>
            <div class="jd-facts-top">
                <button type="button" class="jd-btn jd-slide-prev" aria-label="Previous fact">◀</button>
                <div class="jd-fact-dots" role="group" aria-label="Fun facts">
                    ${DATA.facts.map((f, i) => `
                        <button type="button" class="jd-fact-dot" data-fact="${i}"
                                aria-label="Fact ${i + 1}: ${esc(f.title)}">${i + 1}</button>`).join("")}
                </div>
                <button type="button" class="jd-btn jd-slide-next" aria-label="Next fact">▶</button>
            </div>
            <div class="jd-slide"></div>`;
    }

    // Three levels: (1) title + question + picture + one button, (2) the takeaway
    // after the child's tap, (3) "For Grown-Ups" with exact numbers and the source.
    function renderSlide(f) {
        const main = f.years
            ? `<div class="jd-years" role="group" aria-label="Pick a year">
                ${f.years.map((y, i) => `
                    <button type="button" class="jd-year" data-year="${i}" aria-pressed="${i === 0}">
                        ${y.year}<small>${esc(y.tag)}</small></button>`).join("")}
               </div>`
            : `<button type="button" class="jd-btn jd-btn--try jd-fact-go">${esc(f.action)}</button>`;

        return `
            <h3 class="jd-slide-title" tabindex="-1">${esc(f.title)}</h3>
            <p class="jd-slide-ask">${esc(f.ask)}</p>
            ${FACT_STAGES[f.id](f)}
            <div class="jd-slide-tools">
                ${main}
                <button type="button" class="jd-btn jd-fact-replay" aria-label="Start again">↺</button>
                ${READ_BUTTON}
            </div>
            <div class="jd-slide-after" aria-live="polite"></div>
            ${f.safety ? `<p class="jd-safety">⚠ ${esc(f.safety)}</p>` : ""}
            <details class="jd-grownups">
                <summary>For Grown-Ups</summary>
                <ul>${f.grownUps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
                <p class="jd-source">Source: ${esc(f.source)}
                    <a href="${esc(f.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the source</a></p>
            </details>`;
    }

    // ---- per-fact interactions; each returns a reset() used by the ↺ button ----
    const FACT_WIRING = {
        trucks(slide, f, learn, unlearn) {
            const lane = slide.querySelector(".jd-trucks");
            const count = slide.querySelector(".jd-truck-n");
            const monkey = slide.querySelector(".jd-fact-monkey");
            const wow = slide.querySelector(".jd-wow");
            let sent = 0;

            slide.querySelector(".jd-fact-go").addEventListener("click", () => {
                sent++;
                count.textContent = String(sent);
                replay(count, "jd-anim-bounce");
                replay(monkey, "jd-anim-surprise");
                replay(wow, "jd-anim-pop");

                const truck = document.createElement("span");
                truck.className = `jd-truck jd-truck--lane${sent % 2}`;
                truck.innerHTML = px("truck");
                if (reduced()) {
                    // no driving: trucks line up instead (only the last few are shown)
                    truck.classList.add("is-parked");
                    lane.appendChild(truck);
                    while (lane.children.length > 6) lane.firstChild.remove();
                } else {
                    lane.appendChild(truck);
                    while (lane.children.length > 8) lane.firstChild.remove();
                    later(() => truck.remove(), 2600);
                }
                learn(`fact-${f.id}-learn`, f.stat, f.takeaway);
            });

            return () => {
                sent = 0;
                count.textContent = "0";
                lane.innerHTML = "";
                unlearn();
            };
        },

        pile(slide, f, learn, unlearn) {
            const bits = [...slide.querySelectorAll(".jd-pile-bit")];
            const count = slide.querySelector(".jd-pile-n");
            const tag = slide.querySelector(".jd-pile-tag");
            const yearButtons = [...slide.querySelectorAll(".jd-year")];
            let shown = 0;

            const showYear = (i, animate = true, tell = true) => {
                const y = f.years[i];
                yearButtons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
                tag.textContent = y.tag;
                tag.classList.toggle("is-prediction", y.tag === "Prediction");
                const from = shown;
                shown = y.tonnes;
                bits.forEach((b, k) => {
                    const on = k < y.tonnes;
                    if (on && !b.classList.contains("is-on") && animate && !reduced()) {
                        b.style.setProperty("--d", `${(k - from) * 35}ms`);
                        replay(b, "jd-anim-drop");
                    }
                    b.classList.toggle("is-on", on);
                });
                // count from the old number to the new one
                if (reduced() || !animate) count.textContent = String(y.tonnes);
                else {
                    const steps = Math.abs(y.tonnes - from);
                    for (let s = 1; s <= steps; s++) {
                        later(() => { count.textContent = String(from + Math.sign(y.tonnes - from) * s); }, s * 35);
                    }
                }
                if (tell) learn(`fact-${f.id}-learn-${y.year}`, y.stat, y.takeaway);
                else unlearn();
            };

            yearButtons.forEach((b, i) => b.addEventListener("click", () => showYear(i)));
            showYear(0, false, false);      // start at 2022; the takeaway waits for a tap

            // replay: back to 2022, then grow to 2030
            return () => {
                clearTimers();
                showYear(0, false, false);
                later(() => showYear(1), 350);
            };
        },

        mystery(slide, f, learn, unlearn) {
            const gadgets = [...slide.querySelectorAll(".jd-gadget")];
            const grid = slide.querySelector(".jd-hundred");
            const count = slide.querySelector(".jd-fact-n");
            const button = slide.querySelector(".jd-fact-go");
            const target = recycledOutOf100();
            let running = false;

            const reset = () => {
                clearTimers();
                running = false;
                gadgets.forEach((g) => g.classList.remove("is-on"));
                count.textContent = "?";
                unlearn();
                button.textContent = f.action;
                grid.setAttribute("aria-label", "100 gadget pictures");
            };

            const reveal = () => {
                if (running) return;
                reset();
                running = true;
                count.textContent = "0";

                // a different random set each time, always exactly `target` of them
                const order = gadgets.map((_, i) => i);
                for (let i = order.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [order[i], order[j]] = [order[j], order[i]];
                }
                const picked = order.slice(0, target);

                const end = () => {
                    count.textContent = String(target);
                    learn(`fact-${f.id}-learn`, f.stat, f.takeaway);
                    grid.setAttribute("aria-label",
                        `100 gadget pictures. ${target} are highlighted as recycled the safe, official way.`);
                    button.textContent = f.again;
                    running = false;
                };

                if (reduced()) {
                    picked.forEach((i) => gadgets[i].classList.add("is-on"));
                    end();
                    return;
                }
                picked.forEach((i, k) => later(() => {
                    gadgets[i].classList.add("is-on");
                    count.textContent = String(k + 1);
                }, 120 + k * 70));
                later(end, 120 + target * 70 + 150);
            };

            button.addEventListener("click", reveal);
            return () => { reset(); reveal(); };
        },

        treasure(slide, f, learn, unlearn) {
            const stage = slide.querySelector(".jd-stage--treasure");
            const phone = slide.querySelector(".jd-phone-btn");
            const go = slide.querySelector(".jd-fact-go");

            const open = () => {
                if (stage.classList.contains("is-open")) return;
                phone.innerHTML = px("phoneOpen");
                phone.setAttribute("aria-label", "The old phone is open");
                replay(phone, "jd-anim-wobble");
                stage.classList.add("is-open");
                learn(`fact-${f.id}-learn`, f.stat, f.takeaway);
            };

            phone.addEventListener("click", open);
            go.addEventListener("click", open);
            return () => {
                stage.classList.remove("is-open");
                phone.innerHTML = px("phoneCracked");
                phone.setAttribute("aria-label", "Open the old phone");
                unlearn();
            };
        }
    };

    function wireFacts() {
        const slide = body.querySelector(".jd-slide");
        const dots = [...body.querySelectorAll(".jd-fact-dot")];
        const prev = body.querySelector(".jd-slide-prev");
        const next = body.querySelector(".jd-slide-next");

        const show = (i, direction = 0, focus = false) => {
            clearTimers();
            stopNarration();
            factIndex = Math.max(0, Math.min(i, DATA.facts.length - 1));
            const f = DATA.facts[factIndex];

            slide.innerHTML = renderSlide(f);
            slide.dataset.fact = f.id;
            slide.classList.remove("jd-slide--left", "jd-slide--right");
            if (direction) replay(slide, direction > 0 ? "jd-slide--right" : "jd-slide--left");

            dots.forEach((d, k) => {
                d.classList.toggle("is-current", k === factIndex);
                if (k === factIndex) d.setAttribute("aria-current", "true");
                else d.removeAttribute("aria-current");
            });
            prev.disabled = factIndex === 0;
            next.disabled = factIndex === DATA.facts.length - 1;

            // level 2: the takeaway shown after the child's tap (also what "Read to me" adds)
            const afterBox = slide.querySelector(".jd-slide-after");
            let learned = null;
            const learn = (id, stat, takeaway) => {
                if (learned && learned.id === id) return;
                afterBox.innerHTML = `
                    <p class="jd-slide-stat">${esc(stat)}</p>
                    <p class="jd-slide-text">${esc(takeaway)}</p>`;
                learned = line(id);
            };
            const unlearn = () => { afterBox.innerHTML = ""; learned = null; stopNarration(); };

            const reset = FACT_WIRING[f.id](slide, f, learn, unlearn);
            slide.querySelector(".jd-fact-replay").addEventListener("click", reset);

            const read = slide.querySelector(".jd-read");
            read.addEventListener("click", () => narrate([line(`fact-${f.id}-ask`), learned], read));

            if (focus) slide.querySelector(".jd-slide-title").focus({ preventScroll: true });
        };

        dots.forEach((d, k) => d.addEventListener("click", () => show(k, Math.sign(k - factIndex), true)));
        prev.addEventListener("click", () => show(factIndex - 1, -1, true));
        next.addEventListener("click", () => show(factIndex + 1, 1, true));

        show(factIndex);
    }

    // =================================================================
    // PAGE 6: MY JUNGLE PROMISE (pick a habit, see it, grow a tree)
    // =================================================================

    const adult = (label, extra = "") => `
        <span class="jd-actor jd-adult ${extra}">
            <span class="jd-adult-cap">${px("cap")}</span>
            <img src="assets/default.png" alt="">
            <span class="jd-a-label">${label}</span>
        </span>`;

    const PROMISE_SCENES = {
        reduce: () => `
            <span class="jd-p-sign jd-p-sign--shop">Shop</span>
            <img class="jd-actor jd-lab-monkey" src="assets/default.png" alt="">
            <span class="jd-actor jd-a-phone jd-p-phone">${px("phone")}</span>
            <span class="jd-actor jd-a-hearts">${px("heart").repeat(3)}</span>
            <span class="jd-actor jd-p-box">${px("newBox")}<span class="jd-a-label">New phone!</span></span>
            <span class="jd-actor jd-p-bubble">No thanks!</span>`,
        reuse: () => LAB_SCENES.reuse(),
        repair: () => `
            <span class="jd-p-sign">Repair Shop</span>
            <img class="jd-actor jd-lab-monkey" src="assets/default.png" alt="">
            ${adult("Repair helper", "jd-adult--shop")}
            <span class="jd-actor jd-p-counter"></span>
            <span class="jd-actor jd-a-phone jd-p-fixphone">${px("phoneCracked")}</span>
            <span class="jd-actor jd-a-wrench jd-p-wrench">${px("wrench")}</span>
            <span class="jd-actor jd-a-sparkle jd-p-sparkle">${px("star").repeat(3)}</span>`,
        recycle: () => `
            <span class="jd-p-sign jd-p-sign--recycle">Electronics Recycling Drop-off</span>
            <span class="jd-actor jd-a-bin jd-p-bin">${px("bin")}</span>
            <span class="jd-actor jd-p-walk">
                <img class="jd-p-kid" src="assets/default.png" alt="">
                ${adult("Grown-up", "jd-adult--walk")}
                <span class="jd-p-carry">${px("laptopCap")}</span>
            </span>
            <span class="jd-actor jd-a-sparkle jd-a-sparkle--bin">${px("star").repeat(3)}</span>`
    };

    // banana tree stages: sprite + height (% of the stage)
    const GROWTH = [
        { s: "sprout", h: 12 }, { s: "palmSmall", h: 44 }, { s: "palmBanana", h: 72 }
    ];

    function renderChange() {
        const buttons = DATA.promises.map((p) => `
            <button type="button" class="jd-promise" data-promise="${p.id}" aria-pressed="false">
                <span class="jd-action-icon">${px(p.icon)}</span>
                <span class="jd-promise-text">${esc(p.text)}</span>
                <span class="jd-promise-habit">${esc(p.habit)}</span>
            </button>`).join("");

        return `
            <h2 id="jd-heading" class="jd-title" tabindex="-1">My Jungle Promise</h2>
            <p class="jd-hint jd-hint--read">${esc(DATA.promiseHint)} ${READ_BUTTON}</p>
            <div class="jd-promises" role="group" aria-label="Pick one promise">${buttons}</div>
            <div class="jd-lab-stage jd-promise-stage">
                <div class="jd-p-scene">
                    <img class="jd-actor jd-lab-monkey jd-anim-bob" src="assets/default.png" alt="">
                    <span class="jd-p-wait">Pick a promise above!</span>
                </div>
                <div class="jd-p-garden" aria-hidden="true">
                    <span class="jd-p-soil"></span>
                    <span class="jd-plant">${px(GROWTH[0].s)}</span>
                    <span class="jd-p-flower jd-p-flower--0">${px("flowerPink")}</span>
                    <span class="jd-p-flower jd-p-flower--1">${px("flowerWhite")}</span>
                    <span class="jd-p-flower jd-p-flower--2">${px("flowerPink")}</span>
                    <img class="jd-p-hero" src="assets/default.png" alt="">
                    <div class="jd-confetti">${bananaRow(8)}</div>
                </div>
            </div>
            <div class="jd-lab-row">
                <button type="button" class="jd-btn jd-btn--try jd-promise-go" disabled>Do it!</button>
                <p class="jd-lab-result" aria-live="polite"></p>
            </div>
            <div class="jd-finale" aria-live="polite">
                <p class="jd-finale-planet">${esc(DATA.finale.planet)}</p>
                <p class="jd-finale-grownup">${esc(DATA.finale.grownUp)}</p>
                <button type="button" class="jd-btn jd-btn--play jd-finale-play" tabindex="-1">Play Again</button>
            </div>
            <p class="jd-note">${esc(DATA.finale.note)}</p>`;
    }

    function wireChange() {
        const buttons = [...body.querySelectorAll(".jd-promise")];
        const stage = body.querySelector(".jd-promise-stage");
        const scene = stage.querySelector(".jd-p-scene");
        const garden = stage.querySelector(".jd-p-garden");
        const plant = garden.querySelector(".jd-plant");
        const go = body.querySelector(".jd-promise-go");
        const result = body.querySelector(".jd-lab-result");
        const finale = body.querySelector(".jd-finale");
        const finalePlay = finale.querySelector(".jd-finale-play");
        let promise = null;
        let busy = false;

        const setPlant = (n) => {
            plant.innerHTML = px(GROWTH[n].s);
            plant.style.height = `${GROWTH[n].h}%`;
        };

        const pick = (id) => {
            clearTimers();
            stopNarration();
            promise = DATA.promises.find((p) => p.id === id);
            buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.promise === id)));
            stage.className = `jd-lab-stage jd-promise-stage jd-promise--${id}`;
            scene.innerHTML = PROMISE_SCENES[id]();
            replay(scene, "jd-anim-fade");
            setPlant(0);
            go.disabled = false;
            go.textContent = promise.action;
            result.textContent = "";
            busy = false;
        };

        // 1. monkey celebrates, 2-4. tree grows in three stages and blooms, 5-7. messages + Play Again
        const finaleSteps = () => {
            stage.classList.add("is-finale");
            garden.removeAttribute("aria-hidden");
            const hero = garden.querySelector(".jd-p-hero");
            const grow = (n) => { setPlant(n); replay(plant, "jd-anim-grow"); };
            const show = () => {
                stage.classList.add("is-bloom");
                finale.classList.add("is-on");
                finalePlay.tabIndex = 0;
                playButton.classList.remove("hidden");
                busy = false;
            };

            if (reduced()) { setPlant(GROWTH.length - 1); show(); return; }
            replay(hero, "jd-anim-hop");
            grow(0);
            later(() => grow(1), 700);
            later(() => grow(2), 1400);
            later(show, 2000);
        };

        const act = () => {
            if (!promise || busy) return;
            if (stage.classList.contains("is-finale")) { pick(promise.id); return; } // do it again
            busy = true;
            stage.classList.add("is-doing");
            go.disabled = true;

            const done = () => {
                if (promise.id === "repair") stage.querySelector(".jd-p-fixphone").innerHTML = px("phone");
                stage.classList.add("is-done");
                result.textContent = promise.done;
                go.disabled = false;
                go.textContent = "↺ Do it again";
                if (reduced()) finaleSteps();
                else later(finaleSteps, 900);
            };
            if (reduced()) done();
            else later(done, promise.id === "recycle" ? 1300 : 1000);
        };

        buttons.forEach((b) => b.addEventListener("click", () => pick(b.dataset.promise)));
        go.addEventListener("click", act);
        finalePlay.addEventListener("click", playAgain);

        // reads the invitation, or the closing message once the tree has grown
        const read = body.querySelector(".jd-read");
        read.addEventListener("click", () => narrate(
            [line(finale.classList.contains("is-on") ? "promise-finale" : "promise-intro")], read));
    }

    // =================================================================
    // NAVIGATION
    // =================================================================

    const PAGES = {
        score:   [renderScore, wireScore],
        jungle:  [renderJungle, wireJungle],
        choices: [renderChoices, wireChoices],
        learned: [renderLearned, wireLearned],
        facts:   [renderFacts, wireFacts],
        change:  [renderChange, wireChange]
    };

    function goTo(index) {
        step = Math.max(0, Math.min(index, STEPS.length - 1));
        const current = STEPS[step];
        const [render, wire] = PAGES[current.id];

        clearTimers();
        stopNarration();
        body.innerHTML = `<section class="jd-page jd-page--${current.id}">${render()}</section>`;
        body.scrollTop = 0;

        stepNav.querySelectorAll(".jd-step").forEach((button, i) => {
            button.classList.toggle("is-current", i === step);
            button.classList.toggle("is-seen", i < step);
            if (i === step) button.setAttribute("aria-current", "step");
            else button.removeAttribute("aria-current");
        });

        backButton.textContent = step === 0 ? "← Back to ending" : "← Back";
        nextButton.classList.toggle("hidden", !current.next);
        nextButton.textContent = current.next ? `${current.next} →` : "";
        // on the last page, Play Again appears after the jungle promise finale
        playButton.classList.toggle("hidden", Boolean(current.next) || current.id === "change");

        wire();
        body.querySelector("#jd-heading").focus({ preventScroll: true });
    }

    // =================================================================
    // PUBLIC: open / close
    // =================================================================

    function open() {
        if (!overlay) build();
        results = getResults();
        tried.clear();
        factIndex = 0;
        document.getElementById("question-box").classList.add("hidden");
        overlay.classList.remove("hidden");
        goTo(0);
    }

    function close() {
        clearTimers();
        stopNarration();
        if (overlay) overlay.classList.add("hidden");
    }

    // returns to the ending text box; "See my jungle!" opens the results again
    function backToEnding() {
        close();
        document.getElementById("question-box").classList.remove("hidden");
        document.getElementById("continue-button").focus();
    }

    // Leaves cover the screen (jungle-wipe.js), the game resets underneath
    // with the game's own initializeGame(), then the leaves part on the start screen.
    function playAgain() {
        const wipe = window.JumonkeyJungleWipe;
        if (wipe && wipe.isRunning()) return;          // already on its way
        stopNarration();                               // silence Read-to-Me right away

        const reset = () => { close(); initializeGame(); };
        const focusStart = () => document.getElementById("start-button").focus({ preventScroll: true });

        if (wipe && wipe.run(reset, focusStart)) return;
        reset();                                       // no wipe available: restart at once
        focusStart();
    }

    return {
        open,
        close,
        getResults,
        recycledOutOf100,
        isOpen: () => Boolean(overlay) && !overlay.classList.contains("hidden")
    };
})();
