/* =====================================================================
   Jumonkey — "Play Again" jungle wipe

   Big pixel-art leaves and bushes sweep in from both sides, cover the
   screen, then part again to show the start screen.

   It does not reset anything itself. The caller passes its own reset
   (results-dashboard.js passes close() + initializeGame()), which runs
   while the screen is fully covered.

     JumonkeyJungleWipe.run(onCovered, onDone) -> false if one is already running

   Timing (about 1.45 s): sweep in 0.5 s, covered 0.3 s, sweep out 0.65 s.
   Reduced motion: a short green fade instead of moving leaves.
   While it runs, the game is inert (no clicks, keys or scrolling).
   Styles: jungle-wipe.css (classes start with "jw-").
===================================================================== */

window.JumonkeyJungleWipe = (() => {
    const px = (name) => window.JumonkeyPixels.svg(name, "px");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const TIMING = {
        full:    { in: 500, hold: 300, out: 650 },
        reduced: { in: 180, hold: 120, out: 220 }
    };

    // leaves along each layer's inner edge: [top %, width vmin]
    const LAYERS = {
        back:  [[-6, 36], [12, 30], [30, 38], [50, 32], [68, 36], [88, 34]],
        mid:   [[2, 32], [20, 38], [40, 30], [58, 36], [78, 32], [97, 30]],
        front: [[8, 26], [46, 30], [84, 26]]
    };

    let root = null;
    let running = false;
    let timers = [];
    let finishRun = null;

    function build() {
        root = document.createElement("div");
        root.className = "jw";
        root.setAttribute("aria-hidden", "true");

        const layer = (name) => `
            <div class="jw-layer jw-layer--${name}">
                ${LAYERS[name].map(([top, size], i) => `
                    <span class="jw-leaf${i % 2 ? " jw-leaf--flip" : ""}"
                          style="top:${top}%;--s:${size}vmin;--i:${i}">${px("jungleLeaf")}</span>`).join("")}
                ${name === "front"
                    ? `<span class="jw-bloom" style="top:30%">${px("flowerPink")}</span>
                       <span class="jw-bloom" style="top:70%">${px("flowerWhite")}</span>`
                    : `<span class="jw-bush" style="--x:4%">${px("jungleBush")}</span>
                       <span class="jw-bush" style="--x:48%">${px("jungleBush")}</span>`}
            </div>`;

        const side = (dir) => `
            <div class="jw-side jw-side--${dir}">
                ${layer("back")}${layer("mid")}${layer("front")}
            </div>`;

        root.innerHTML = side("left") + side("right");

        // faint tiled leaves inside the solid layers, so the covered screen reads as thick jungle
        const leafSvg = px("jungleLeaf").replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
        if (leafSvg) root.style.setProperty("--jw-tex", `url("data:image/svg+xml,${encodeURIComponent(leafSvg)}")`);

        document.body.appendChild(root);
    }

    const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

    // runs a step without letting an error leave the player stuck
    function safely(fn) {
        if (typeof fn !== "function") return;
        try { fn(); } catch (error) { console.error("[Jumonkey] Play Again:", error); }
    }

    function run(onCovered, onDone) {
        if (running) return false;
        running = true;
        if (!root) build();

        const reduced = motionQuery.matches;
        const t = reduced ? TIMING.reduced : TIMING.full;
        const game = document.getElementById("game-screen");

        // block the game underneath: no focus, clicks, keys or scrolling
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        if (game) game.inert = true;
        document.documentElement.classList.add("jw-lock");

        root.classList.toggle("is-reduced", reduced);
        void root.offsetWidth;                   // settle the idle look (no transitions while idle)
        root.classList.add("is-active");
        void root.offsetWidth;                   // start from off-screen / transparent
        root.classList.add("is-covering");

        let covered = false;
        const cover = () => {
            if (covered) return;
            covered = true;
            safely(onCovered);
        };

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            cover();                             // never skip the reset
            timers.forEach(clearTimeout);
            timers = [];
            root.classList.remove("is-active", "is-covering");
            document.documentElement.classList.remove("jw-lock");
            if (game) game.inert = false;
            running = false;
            finishRun = null;
            safely(onDone);
        };
        finishRun = finish;

        later(cover, t.in);
        later(() => root.classList.remove("is-covering"), t.in + t.hold);
        later(finish, t.in + t.hold + t.out);
        later(finish, t.in + t.hold + t.out + 1500);   // safety net

        return true;
    }

    return {
        run,
        isRunning: () => running,
        finishNow: () => { if (finishRun) finishRun(); }   // ends at once (tests, emergencies)
    };
})();
