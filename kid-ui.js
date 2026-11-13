/* =====================================================================
   Jumonkey — small kid-friendly helpers for the existing game

   Adds, without changing script.js:
   - on-screen walk buttons (hold to walk; touch, mouse or keyboard)
   - progress dots under "ADVENTURE n / 6"
   - a picture for each scenario next to its title
   - a "+N" pop on the banana counter
   - after picking an answer, keyboard focus moves to Continue

   Reads the game's state from script.js (gameStarted, gamePaused,
   gameFinished, currentCheckpoint, sceneStep, activeQuestion, questions)
   and only sets movingLeft / movingRight, the same as the arrow keys.
   Styles: kid-ui.css (classes start with "ku-").
===================================================================== */

(() => {
    const px = (name) => window.JumonkeyPixels.svg(name);
    const scenarios = (window.JumonkeyResultsData || {}).scenarios || [];

    const gameArea = document.getElementById("game-area");
    const questionBox = document.getElementById("question-box");
    const heading = questionBox.querySelector(".dialogue-heading");
    const continueBtn = document.getElementById("continue-button");
    const feedbackEl = document.getElementById("feedback");
    const bananaCount = document.getElementById("banana-count");
    const bananaTotalEl = document.getElementById("banana-total");
    const progressChip = document.querySelector(".game-progress");

    const canWalk = () => gameStarted && !gamePaused && !gameFinished;

    // Space should press the focused button. script.js blocks Space on the whole page
    // (its keydown handler on document), so stop Space from reaching document while a
    // button has focus. This runs on <body>, after the button's own handlers.
    document.body.addEventListener("keydown", (event) => {
        if (event.key === " " && event.target instanceof HTMLButtonElement) {
            event.stopPropagation();
        }
    });

    // ---------- walk buttons ----------
    const controls = document.createElement("div");
    controls.className = "ku-controls hidden";
    controls.innerHTML = `
        <button type="button" class="ku-walk ku-walk--left" aria-label="Walk left">
            <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M7 1 L2 5 L7 9 Z"/></svg>
        </button>
        <button type="button" class="ku-walk ku-walk--right" aria-label="Walk right">
            <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1 L8 5 L3 9 Z"/></svg>
            <span class="ku-walk-hint">Hold to walk!</span>
        </button>`;
    gameArea.appendChild(controls);

    const leftBtn = controls.querySelector(".ku-walk--left");
    const rightBtn = controls.querySelector(".ku-walk--right");

    function holdToWalk(button, direction) {
        const set = (on) => {
            if (direction < 0) movingLeft = on;
            else movingRight = on;
            button.classList.toggle("is-down", on);
        };

        button.addEventListener("pointerdown", (event) => {
            if (!canWalk()) return;
            event.preventDefault();
            if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
            set(true);
        });
        ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
            button.addEventListener(type, () => set(false)));
        button.addEventListener("contextmenu", (event) => event.preventDefault());

        // keyboard: hold Enter or Space on the focused button
        button.addEventListener("keydown", (event) => {
            if ((event.key === "Enter" || event.key === " ") && canWalk()) {
                event.preventDefault();
                set(true);
            }
        });
        button.addEventListener("keyup", (event) => {
            if (event.key === "Enter" || event.key === " ") set(false);
        });
        button.addEventListener("blur", () => set(false));

        return set;
    }

    const releaseLeft = holdToWalk(leftBtn, -1);
    const releaseRight = holdToWalk(rightBtn, 1);

    // ---------- progress dots ----------
    const dots = document.createElement("div");
    dots.className = "ku-dots";
    dots.setAttribute("aria-hidden", "true");
    progressChip.appendChild(dots);

    // ---------- scenario picture ----------
    const sceneIcon = document.createElement("span");
    sceneIcon.className = "ku-scene-icon hidden";
    sceneIcon.setAttribute("aria-hidden", "true");
    heading.insertBefore(sceneIcon, heading.firstChild);

    // ---------- "+N" banana pop ----------
    let lastBananas = Number(bananaTotalEl.textContent) || 0;

    new MutationObserver(() => {
        const now = Number(bananaTotalEl.textContent) || 0;
        const gained = now - lastBananas;
        lastBananas = now;
        if (gained <= 0) return;

        const pop = document.createElement("span");
        pop.className = "ku-pop";
        pop.setAttribute("aria-hidden", "true");
        pop.textContent = `+${gained}`;
        bananaCount.appendChild(pop);
        setTimeout(() => pop.remove(), 1300);

        bananaCount.classList.remove("ku-bump");
        void bananaCount.offsetWidth;
        bananaCount.classList.add("ku-bump");
    }).observe(bananaTotalEl, { childList: true, characterData: true, subtree: true });

    // ---------- keep everything in sync with the game each frame ----------
    let lastDots = "";
    let lastIcon = "";
    let continueWasShown = false;
    let lastFeedback = "";

    function sync() {
        // walk buttons only while the player can walk
        const walking = canWalk();
        controls.classList.toggle("hidden", !walking);
        if (!walking && (movingLeft || movingRight)) {
            if (leftBtn.classList.contains("is-down")) releaseLeft(false);
            if (rightBtn.classList.contains("is-down")) releaseRight(false);
        }
        // nudge until the monkey has walked a little
        rightBtn.classList.toggle("ku-nudge", walking && playerX < 160);

        // dots
        const dotKey = `${currentCheckpoint}/${questions.length}`;
        if (dotKey !== lastDots) {
            lastDots = dotKey;
            dots.innerHTML = questions
                .map((_, i) => `<i class="${i < currentCheckpoint ? "is-done" : ""}"></i>`)
                .join("");
        }

        // scenario picture: only while a scenario question is on screen
        const showingScenario =
            !questionBox.classList.contains("hidden") &&
            sceneStep === null && !gameFinished && activeQuestion;
        const scenario = showingScenario ? scenarios[currentCheckpoint] : null;
        const iconKey = scenario ? scenario.icon : "";
        if (iconKey !== lastIcon) {
            lastIcon = iconKey;
            sceneIcon.innerHTML = iconKey ? px(iconKey) : "";
            sceneIcon.classList.toggle("hidden", !iconKey);
        }

        // after an answer: keep the reply in view, and move keyboard focus to Continue
        const feedbackNow = feedbackEl.textContent;
        if (feedbackNow && feedbackNow !== lastFeedback) {
            const content = questionBox.querySelector(".dialogue-content");
            content.scrollTop = content.scrollHeight;
        }
        lastFeedback = feedbackNow;

        const continueShown = !continueBtn.classList.contains("hidden") &&
                              !questionBox.classList.contains("hidden");
        if (continueShown && !continueWasShown) {
            const focused = document.activeElement;
            if (!focused || focused === document.body || questionBox.contains(focused)) {
                if (!(focused && focused.id === "name-input")) {
                    continueBtn.focus({ preventScroll: true });
                }
            }
        }
        continueWasShown = continueShown;

        // "More ▼" cue while there's still something below
        const content = questionBox.querySelector(".dialogue-content");
        const more = !questionBox.classList.contains("hidden") &&
                     content.scrollTop + content.clientHeight < content.scrollHeight - 2;
        questionBox.classList.toggle("ku-more", more);

        requestAnimationFrame(sync);
    }

    requestAnimationFrame(sync);
})();
