/* =====================================================================
   Jumonkey — results dashboard content (FOR TEAM REVIEW)

   Everything kid-facing that the dashboard adds lives in this one file,
   so it is easy to review and edit. It does NOT change the scenarios,
   answers, banana values or endings in script.js.

   scenarios[i] lines up with questions[i] in script.js.
   Each answer is found by a short piece of its text ("match"), so small
   wording edits in script.js keep working. If a match is ever not found,
   the dashboard falls back to the start of the original answer text and
   lists no habit for it (nothing breaks).

   habits: which of Reduce / Reuse / Repair / Recycle an answer clearly
   shows. Answers that don't clearly show one are left empty on purpose.
===================================================================== */

window.JumonkeyResultsData = {
    scenarios: [
        {
            name: "New school computer",
            icon: "laptop",
            takeaway: "A fixed-up computer can work great and makes less waste!",
            answers: [
                { match: "new laptop",         label: "New laptop",           habits: [] },
                { match: "refurbished laptop", label: "Fixed-up used laptop", habits: ["reuse"] },
                { match: "ipad",               label: "Tablet with keyboard", habits: [] },
                { match: "desktop",            label: "Desktop computer",     habits: [] }
            ]
        },
        {
            name: "Everyone has a new phone",
            icon: "phoneNew",
            takeaway: "If your phone still works, you don't need a new one.",
            answers: [
                { match: "trade in my current phone",  label: "Trade in for the newest", habits: [] },
                { match: "refurbished version",        label: "Fixed-up older phone",    habits: ["reuse"] },
                { match: "keep the old one for games", label: "Buy new, keep old one",   habits: [] },
                { match: "my phone is fine",           label: "Keep my phone",           habits: ["reduce"] }
            ]
        },
        {
            name: "Cracked phone",
            icon: "phoneCracked",
            takeaway: "A cracked screen can often be fixed!",
            answers: [
                { match: "bananaphone 4000",      label: "Buy new, trash old",   habits: [] },
                { match: "repair the phone",      label: "Repair it",            habits: ["repair"] },
                { match: "trade in the cracked",  label: "Trade it in",          habits: [] },
                { match: "gift it",               label: "Repair it and give it", habits: ["repair", "reuse"] }
            ]
        },
        {
            name: "Drawing homework",
            icon: "tablet",
            takeaway: "Borrow one, or use pen and paper. No new gadget needed!",
            answers: [
                { match: "ultracolor",         label: "Buy the newest tablet", habits: [] },
                { match: "borrow",             label: "Borrow a tablet",       habits: ["reduce"] },
                { match: "refurbished tablet", label: "Fixed-up tablet",       habits: ["reuse"] },
                { match: "pen and paper",      label: "Pen and paper",         habits: ["reduce"] }
            ]
        },
        {
            name: "Burnt-out light bulbs",
            icon: "bulb",
            takeaway: "Some light bulbs need a special drop-off. Never touch broken glass. Get a grown-up!",
            answers: [
                { match: "crush",           label: "Regular recycling bin", habits: [] },
                { match: "leave it out",    label: "Leave them for later",  habits: [] },
                { match: "hazardous waste", label: "Special drop-off",      habits: ["recycle"] },
                { match: "airtight",        label: "Seal and drop off",     habits: ["recycle"] }
            ]
        },
        {
            name: "Old laptop",
            icon: "laptopCap",
            takeaway: "Give old gadgets to someone who needs them, or recycle them safely.",
            answers: [
                { match: "landfill",            label: "Throw it away",         habits: [] },
                { match: "electronic recycler", label: "Electronics recycler",  habits: ["recycle"] },
                { match: "little brother",      label: "Give it to my brother", habits: ["reuse"] },
                { match: "closet",              label: "Keep it in a closet",   habits: [] }
            ]
        }
    ],

    // One per ending, matched by rank: the highest ending is "thriving",
    // the lowest is "needsCare", anything between is "growing".
    // badge replaces the game's ending title on the dashboard (always friendly).
    // {name} = player's name.
    tiers: {
        thriving: {
            badge: "Jungle Hero!",
            cheer: "Super choices, {name}!",
            headline: "Your jungle is thriving!",
            sees: [
                { icon: "tree",       text: "Tall, green trees" },
                { icon: "drop",       text: "Clean, sparkly water" },
                { icon: "flowerPink", text: "Happy birds and flowers" }
            ]
        },
        growing: {
            badge: "Jungle Helper!",
            cheer: "Nice work, {name}!",
            headline: "Your jungle is growing!",
            sees: [
                { icon: "treeTired",  text: "Lots of green trees" },
                { icon: "wilted",     text: "Some plants need help" },
                { icon: "dropCloudy", text: "The water is a little cloudy" }
            ]
        },
        needsCare: {
            badge: "Jungle Explorer!",
            cheer: "Good try, {name}! Every choice is a chance to learn.",
            headline: "Your jungle needs extra care.",
            sees: [
                { icon: "wilted",     text: "Thirsty plants" },
                { icon: "dropMuddy",  text: "Muddy water" },
                { icon: "sprout",     text: "Little sprouts ready to grow" }
            ]
        }
    },

    pretendNote: "This is a pretend picture, not a real prediction.",

    // what each jungle object says when tapped (by object, then by jungle state)
    jungleTaps: {
        tree: {
            thriving:  "Healthy trees give animals food and a home.",
            growing:   "Most trees are green. A little care helps them grow.",
            needsCare: "This tree needs care. Clean soil helps trees grow strong.",
            fact: "Trashed gadgets can leak yucky stuff into soil. Recycle safely!"
        },
        pond: {
            thriving:  "Sparkly clean water! Fish and frogs love it.",
            growing:   "The water is a little cloudy.",
            needsCare: "The water is muddy. Let's help clean it!",
            fact: "Never throw batteries or gadgets in water or the trash."
        },
        flower: "Flowers bloom in a healthy jungle.",
        wilted: "You cared for this plant. Look, it's blooming!",
        sprout: "A little sprout! Small things can grow big."
    },

    habits: [
        {
            id: "reduce",
            name: "Reduce",
            icon: "bag",
            short: "Use less",
            explain: "Reduce means buying less. Keep using what still works.",
            action: "Keep using it!",
            done: "It still works, so no new phone needed!"
        },
        {
            id: "reuse",
            name: "Reuse",
            icon: "gift",
            short: "Use again",
            explain: "Reuse means giving things a second life.",
            action: "Pass it on!",
            done: "Now your friend can use it too!"
        },
        {
            id: "repair",
            name: "Repair",
            icon: "wrench",
            short: "Fix it",
            explain: "Repair means fixing things instead of throwing them away.",
            action: "Fix it!",
            done: "Fixed! The phone works like new."
        },
        {
            id: "recycle",
            name: "Recycle",
            icon: "bin",
            short: "Safe drop-off",
            explain: "Recycle means taking old gadgets to a special drop-off place.",
            action: "Take it to drop-off",
            done: "Its parts can be used again! Go with a grown-up."
        }
    ],

    // "Did You Know?" page: one fact at a time, in three levels.
    //   1. main screen:   title + ask (one short question) + one button
    //   2. after the tap: stat + takeaway (one short sentence for kids)
    //   3. For Grown-Ups: exact numbers, limits and the source (collapsed by default)
    // Every number is from the source shown.
    facts: [
        {
            id: "trucks",
            title: "The Giant E-Waste Train",
            ask: "How many trucks could carry the world's e-waste?",
            action: "Send a truck!",
            stat: "1.55 million trucks!",
            takeaway: "All the e-waste from 2022 would fill 1.55 million giant trucks. We only showed a few!",
            grownUps: [
                "In 2022 the world generated 62 million tonnes of e-waste. This is a recorded figure.",
                "That amount would fill about 1.55 million 40-tonne trucks.",
                "The animation shows only a few trucks. It is an illustration, not the real number."
            ],
            source: "Global E-waste Monitor 2024 (ITU and UNITAR), data for 2022.",
            sourceUrl: "https://ewastemonitor.info/the-global-e-waste-monitor-2024/"
        },
        {
            id: "pile",
            title: "The Growing Gadget Pile",
            ask: "Tap a year to watch the gadget pile grow!",
            years: [
                {
                    year: 2022, tonnes: 62, tag: "Recorded",
                    stat: "62 million tonnes",
                    takeaway: "In 2022, the world made 62 million tonnes of e-waste!"
                },
                {
                    year: 2030, tonnes: 82, tag: "Prediction",
                    stat: "82 million tonnes?",
                    takeaway: "By 2030, it could grow to 82 million tonnes. That's a prediction, not real yet!"
                }
            ],
            grownUps: [
                "Each gadget picture stands for 1 million tonnes, so the pile is drawn to scale.",
                "2022: 62 million tonnes is a recorded figure.",
                "2030: 82 million tonnes is a projection (“on track to reach”). It has not been measured."
            ],
            source: "Global E-waste Monitor 2024 (ITU and UNITAR).",
            sourceUrl: "https://ewastemonitor.info/the-global-e-waste-monitor-2024/"
        },
        {
            id: "mystery",
            title: "The Recycling Mystery",
            ask: "Here are 100 old gadgets. How many were recycled safely?",
            percent: 22.3,
            action: "Find them!",
            again: "↺ Find them again",
            stat: "About 22 out of 100",
            takeaway: "Only about 22 in 100 were recycled the safe, official way. Nobody tracked the rest.",
            grownUps: [
                "In 2022, 22.3% of the world's e-waste was documented as formally collected and recycled. The picture rounds this to 22 out of 100.",
                "The rest was not documented. Some was stored in homes, and some was recycled unsafely, exported or dumped. It did not all go to landfill."
            ],
            source: "World Health Organization (WHO), “Electronic waste (e-waste)” fact sheet, 1 October 2024, data for 2022.",
            sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/electronic-waste-(e-waste)"
        },
        {
            id: "treasure",
            title: "Hidden Treasure",
            ask: "What is hiding inside an old phone?",
            action: "Open the phone!",
            stat: "Gold, silver and copper!",
            takeaway: "Old phones have hidden treasure inside, like gold, silver and copper!",
            safety: "Only trained grown-ups open old phones. Never open one yourself!",
            materials: [
                { icon: "copper",    name: "Copper" },
                { icon: "silverBar", name: "Silver" },
                { icon: "goldCoin",  name: "Gold" }
            ],
            grownUps: [
                "For every million cell phones recycled, about 35 thousand pounds of copper, 772 pounds of silver, 75 pounds of gold and 33 pounds of palladium can be recovered. This is a 2006 U.S. Geological Survey estimate.",
                "The safety note is our own advice: only trained recyclers should take devices apart."
            ],
            source: "U.S. EPA, “Electronics Donation and Recycling” (citing the U.S. Geological Survey, 2006).",
            sourceUrl: "https://www.epa.gov/recycle/electronics-donation-and-recycling"
        }
    ],

    // "My Jungle Promise" (last page). Every child gets the same happy finale.
    promises: [
        {
            id: "reduce",
            icon: "phoneHeart",
            habit: "Reduce",
            text: "Use my devices longer.",
            action: "Do it!",
            done: "My phone still works. No new one needed!"
        },
        {
            id: "repair",
            icon: "wrench",
            habit: "Repair",
            text: "Ask a grown-up about repairs.",
            action: "Do it!",
            done: "The repair helper fixed it!"
        },
        {
            id: "reuse",
            icon: "gift",
            habit: "Reuse",
            text: "Share working devices.",
            action: "Do it!",
            done: "Now a friend can use it too!"
        },
        {
            id: "recycle",
            icon: "bin",
            habit: "Recycle",
            text: "Recycle safely with a grown-up.",
            action: "Do it!",
            done: "Dropped off safely with a grown-up!"
        }
    ],

    promiseHint: "Pick your promise, then press Do it!",

    finale: {
        planet: "Small choices can help our planet!",
        grownUp: "Try your promise with a grown-up!",
        note: "Just for fun! Nothing is saved, and the tree is pretend."
    }
};

/* ---------------------------------------------------------------------
   Read to me: every line the narrator can read, by a stable id.
   Built from the text above, so the words on screen and the words read
   aloud are always the same. Source citations are never read aloud.
   The audio clips in audio/narration/ are made from these lines by
   tools/make_narration.py (re-run it after changing any text here).
--------------------------------------------------------------------- */
window.JumonkeyResultsData.narration = (() => {
    const d = window.JumonkeyResultsData;
    const lines = {};

    d.facts.forEach((f) => {
        lines[`fact-${f.id}-ask`] = `${f.title}. ${f.ask}`;
        if (f.years) {
            f.years.forEach((y) => { lines[`fact-${f.id}-learn-${y.year}`] = y.takeaway; });
        } else {
            lines[`fact-${f.id}-learn`] = [f.takeaway, f.safety].filter(Boolean).join(" ");
        }
    });

    Object.keys(d.tiers).forEach((tier) => {
        lines[`jungle-${tier}`] = `${d.tiers[tier].headline} Tap the trees, the pond and the plants!`;
    });

    d.scenarios.forEach((s, i) => { lines[`choice-${i}`] = s.takeaway; });

    lines["promise-intro"] = `My Jungle Promise. ${d.promiseHint}`;
    lines["promise-finale"] = `${d.finale.planet} ${d.finale.grownUp}`;

    return lines;
})();
