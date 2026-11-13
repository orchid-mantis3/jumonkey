/* =====================================================================
   Jumonkey — pixel icons
   Small pixel-art pictures drawn as SVG, in the same style as the
   pixel flowers in script.js. Used by kid-ui.js and results-dashboard.js.

   Each sprite is a list of rows; each character is one pixel.
   "." = empty, any other character = a colour from PALETTE.
   Usage: JumonkeyPixels.svg("phone") -> "<svg ...>...</svg>"
===================================================================== */

window.JumonkeyPixels = (() => {
    const PALETTE = {
        K: "#49352B", // outline (dark brown)
        B: "#76543D", // brown
        C: "#B98250", // caramel
        c: "#F5E6C8", // cream
        W: "#FFF8E9", // light cream
        Y: "#F4C95D", // banana
        y: "#D9A93C", // dark banana
        G: "#2F7D22", // dark leaf
        g: "#58A838", // light leaf
        S: "#7EC8E3", // screen
        L: "#D6F1FB", // screen shine
        X: "#6E747D", // grey
        x: "#B9BEC6", // light grey
        R: "#D94F6E", // red
        P: "#F08CB4", // pink petal
        O: "#E8873A", // orange
        b: "#4FB3E0", // water
        l: "#B5E6F7", // water shine
        t: "#8FB3B4", // cloudy water
        T: "#C2D6D2", // cloudy shine
        M: "#8C7A5B", // muddy water
        m: "#A89773"  // muddy shine
    };

    // one pond shape, three kinds of water
    const POND = [
        "....KKKKKKKKKKKKKKKK....",
        "..KKbbbbbbbbbbbbbbbbKK..",
        ".KbbllllbbbbbbbbbbbbbbK.",
        "KbbbbbbbbbbbbllllbbbbbbK",
        "KbbbbbbbbbbbbbbbbbbbbbbK",
        ".KbbbbbllllbbbbbbbbbbbK.",
        "..KKbbbbbbbbbbbbbbbbKK..",
        "....KKKKKKKKKKKKKKKK...."
    ];
    const DROP = [
        "...K...",
        "..KbK..",
        ".KbbbK.",
        "KbbbbbK",
        "KblbbbK",
        "KbllbbK",
        ".KbbbK.",
        "..KKK.."
    ];
    const recolour = (rows, map) =>
        rows.map((row) => row.replace(/[bl]/g, (ch) => map[ch]));

    const PHONE_CRACKED = [
        "....KKKKKKKK....",
        "....KXXXXXXK....",
        "....KSSSSWSK....",
        "....KSSSWSSK....",
        "....KSSWWSSK....",
        "....KSWSSWSK....",
        "....KWSSSSWK....",
        "....KSSSSWSK....",
        "....KSSSWSSK....",
        "....KSSWSSSK....",
        "....KSSSSSSK....",
        "....KXXXXXXK....",
        "....KXXKKXXK....",
        "....KXXXXXXK....",
        "....KKKKKKKK....",
        "................"
    ];

    const SPRITES = {
        // ---------- scenario pictures (16 x 16) ----------
        laptop: [
            "................",
            "................",
            "..KKKKKKKKKKKK..",
            "..KSSSSSSSSSSK..",
            "..KSLSSSSSSSSK..",
            "..KSSLSSSSSSSK..",
            "..KSSSSSSSSSSK..",
            "..KSSSSSSSSSSK..",
            "..KSSSSSSSSSSK..",
            "..KKKKKKKKKKKK..",
            ".KxxxxxxxxxxxxK.",
            "KxXxXxXxXxXxXxxK",
            "KxxxxxXXXXxxxxxK",
            "KKKKKKKKKKKKKKKK",
            "................",
            "................"
        ],
        phoneNew: [
            ".Y..KKKKKKKK....",
            "YYY.KXXXXXXK..Y.",
            ".Y..KSSSSSSK.YYY",
            "....KSLSSSSK..Y.",
            "....KSSLSSSK....",
            "....KSSSSSSK....",
            "....KSSSSSSK....",
            "....KSSSSSSK....",
            "....KSSSSSSK.Y..",
            "....KSSSSSSKYYY.",
            "....KSSSSSSK.Y..",
            "....KXXXXXXK....",
            "....KXXKKXXK....",
            "....KXXXXXXK....",
            "....KKKKKKKK....",
            "................"
        ],
        phoneCracked: PHONE_CRACKED,
        // the same phone, fixed (crack removed)
        phone: PHONE_CRACKED.map((row) => row.replace(/W/g, "S")),
        gamepad: [
            "................",
            "................",
            "..KKKKKKKKKKKK..",
            ".KxxxxxxxxxxxxK.",
            "KxxKxxxxxxxRxxxK",
            "KxKKKxxxxxRxRxxK",
            "KxxKxxxxxxxRxxxK",
            "KxxxxxKKKKxxxxxK",
            ".KxxxK....KxxxK.",
            "..KKK......KKK..",
            "................",
            "................"
        ],
        tablet: [
            "................",
            ".KKKKKKKKKKKKK..",
            ".KXXXXXXXXXXXK..",
            ".KXSSSSSSSSSXK..",
            ".KXSPPSSSSSSXK..",
            ".KXSPPSSgSSSXK..",
            ".KXSSSSggSSSXK..",
            ".KXSSSSSSYYSXK..",
            ".KXSSSSSSYYSXKY.",
            ".KXSSSSSSSSSXKYy",
            ".KXXXXXXXXXXXKYy",
            ".KKKKKKKKKKKKKYy",
            ".............OO.",
            "..............K.",
            "................",
            "................"
        ],
        bulb: [
            "......KKKK......",
            "....KKYYYYKK....",
            "...KYYWWYYYYK...",
            "..KYYWYYYYYYYK..",
            "..KYWYYYYYYYYK..",
            "..KYYYYYYYYYYK..",
            "..KYYYYYYYYYYK..",
            "...KYYYYYYYYK...",
            "....KYYYYYYK....",
            ".....KYYYYK.....",
            ".....KxxxxK.....",
            ".....KXXXXK.....",
            ".....KxxxxK.....",
            ".....KXXXXK.....",
            "......KKKK......",
            "................"
        ],
        laptopCap: [
            ".....KKKKKK.....",
            "...KKKKKKKKKK...",
            ".KKKKKKKKKKKKKK.",
            "...KKKKKKKKKKY..",
            "....KKKKKKK..Y..",
            ".............Y..",
            "..KKKKKKKKKKKK..",
            "..KxxxxxxxxxxK..",
            "..KxXxxxxxxxxK..",
            "..KxxxxxxxxxxK..",
            "..KxxxxxxxxxxK..",
            "..KKKKKKKKKKKK..",
            ".KccccccccccccK.",
            "KcCcCcCcCcCcCccK",
            "KKKKKKKKKKKKKKKK",
            "................"
        ],

        // ---------- habit + action pictures (16 x 16) ----------
        bag: [
            "................",
            ".....KKKKKK.....",
            "....KK....KK....",
            "....K......K....",
            "..KKKKKKKKKKKK..",
            "..KCCCCCCCCCCK..",
            "..KCCCCCCCCCCK..",
            "..KCCCCCCCCCCK..",
            "..KCCWWWWWWCCK..",
            "..KCCWWWWWWCCK..",
            "..KCCCCCCCCCCK..",
            "..KCCCCCCCCCCK..",
            "..KCCCCCCCCCCK..",
            "..KKKKKKKKKKKK..",
            "................",
            "................"
        ],
        gift: [
            "................",
            "....KK....KK....",
            "...KRRK..KRRK...",
            "....KRRKKRRK....",
            ".KKKKKKKKKKKKKK.",
            ".KPPPPPRRPPPPPK.",
            ".KPPPPPRRPPPPPK.",
            ".KKKKKKKKKKKKKK.",
            "..KPPPPRRPPPPK..",
            "..KPPPPRRPPPPK..",
            "..KPPPPRRPPPPK..",
            "..KPPPPRRPPPPK..",
            "..KPPPPRRPPPPK..",
            "..KKKKKKKKKKKK..",
            "................",
            "................"
        ],
        wrench: [
            "................",
            "..........KKK...",
            ".........KxxK...",
            "........KxxK..K.",
            "........KxxK.KxK",
            ".......KxxxxKxxK",
            "......KxxxxxxxK.",
            ".....KxxxXXxxK..",
            "....KxxxXXKKK...",
            "...KxxxXXK......",
            "..KxxxXXK.......",
            ".KxxxXXK........",
            ".KxxXXK.........",
            ".KKXXK..........",
            "..KKK...........",
            "................"
        ],
        bin: [
            "................",
            "......KKKK......",
            "..KKKKKKKKKKKK..",
            "..KggggggggggK..",
            "..KKKKKKKKKKKK..",
            "...KggggggggK...",
            "...KgggWWgggK...",
            "...KggWggWggK...",
            "...KgWggggWgK...",
            "...KgWWWWWWgK...",
            "...KggggggggK...",
            "...KgGgGgGggK...",
            "...KggggggggK...",
            "...KKKKKKKKKK...",
            "................",
            "................"
        ],
        phoneHeart: [
            "....KKKKKKKK....",
            "....KXXXXXXK....",
            "....KSSSSSSK....",
            "....KSSSSSSK....",
            "....KSRSSRSK....",
            "....KRRRRRRK....",
            "....KRRRRRRK....",
            "....KSRRRRSK....",
            "....KSSRRSSK....",
            "....KSSSSSSK....",
            "....KSSSSSSK....",
            "....KXXXXXXK....",
            "....KXXKKXXK....",
            "....KXXXXXXK....",
            "....KKKKKKKK....",
            "................"
        ],

        // ---------- fun facts + promise ----------
        truck: [
            "........................",
            ".KKKKKKKKKKKKKKK........",
            ".KCCCCCCCCCCCCCK.KKKK...",
            ".KCCCCCCCCCCCCCK.KSSKK..",
            ".KCCCCCCCCCCCCCK.KSSSKK.",
            ".KCCCCCCCCCCCCCKKKKKKKKK",
            ".KCCCCCCCCCCCCCKRRRRRRRK",
            ".KKKKKKKKKKKKKKKRRRRRRRK",
            ".KXXXXXXXXXXXXXXXXXXXXXK",
            ".KKKXXKKKKKKKKKKKXXKKKKK",
            "...KXXK.........KXXK....",
            "....KK...........KK....."
        ],
        goldCoin: [
            "..KKKK..",
            ".KYYYYK.",
            "KYYWYYyK",
            "KYWYYYyK",
            "KYYYYYyK",
            "KYYYYyyK",
            ".KyyyyK.",
            "..KKKK.."
        ],
        silverBar: [
            "..KKKKKK..",
            ".KWWxxxxK.",
            "KxWxxxxxXK",
            "KxxxxxxXXK",
            "KXXXXXXXXK",
            "KKKKKKKKKK"
        ],
        copper: [
            "..KKK...",
            ".KOOOKK.",
            "KOWOOOOK",
            "KOOOOOCK",
            ".KOOOCCK",
            "..KCCKK.",
            "...KK..."
        ],
        phoneOpen: [
            "....KKKKKKKK....",
            "....KGGGGGGK....",
            "....KGYGGGgK....",
            "....KGGKKGGK....",
            "....KGgKKgGK....",
            "....KGGGGGGK....",
            "....KGXXXXGK....",
            "....KGXxxXGK....",
            "....KGXXXXGK....",
            "....KGGgGGGK....",
            "....KGYGGYGK....",
            "....KGGGGGGK....",
            "....KGGKKGGK....",
            "....KGGGGGGK....",
            "....KKKKKKKK....",
            "................"
        ],
        cap: [
            "...KKKKKK...",
            "..KRRRRRRK..",
            "..KRRRRRRK..",
            ".KKKKKKKKKKK"
        ],
        newBox: [
            "..............",
            ".KKKKKKKKKKKK.",
            ".KccccccccccK.",
            ".KccRRRRRRccK.",
            ".KccRWWWWRccK.",
            ".KccRRRRRRccK.",
            ".KccccccccccK.",
            ".KCCCCCCCCCCK.",
            ".KccccccccccK.",
            ".KccccccccccK.",
            ".KKKKKKKKKKKK.",
            ".............."
        ],

        // ---------- jungle scene pieces ----------
        pond: POND,
        pondCloudy: recolour(POND, { b: "t", l: "T" }),
        pondMuddy: recolour(POND, { b: "M", l: "m" }),
        drop: DROP,
        dropCloudy: recolour(DROP, { b: "t", l: "T" }),
        dropMuddy: recolour(DROP, { b: "M", l: "m" }),
        tree: [
            "..gggg..",
            ".gggggg.",
            "gggGgggg",
            "gggggGgg",
            ".gggggg.",
            "..gggg..",
            "...BB...",
            "...BB..."
        ],
        treeTired: [
            "..gggg..",
            ".ggCggg.",
            "gggGgCgg",
            "gCgggGgg",
            ".gggCgg.",
            "..gggg..",
            "...BB...",
            "...BB..."
        ],
        treeBare: [
            ".C...C..",
            "..C.CgC.",
            "C.CCC.C.",
            ".CCBCC..",
            "...BB...",
            "...BB...",
            "...BB...",
            "..BBBB.."
        ],
        // big outlined leaf (stem on the left), used by the Play Again jungle wipe
        jungleLeaf: [
            "..........KKKKK.........",
            "......KKKKgggggKKKK.....",
            "....KKggggggggggggKKK...",
            "..KKggGggggGggggGgggKK..",
            ".KgggggGggggGggggGgggKK.",
            "KBBBBBBBGGGGGGGGGGGGGGGK",
            ".KgggggGggggGggggGgggKK.",
            "..KKggGggggGggggGgggKK..",
            "....KKggggggggggggKKK...",
            "......KKKKgggggKKKK.....",
            "..........KKKKK........."
        ],
        jungleBush: [
            "......KKKK....KKK.......",
            "...KKKggggKKKKgggKK.....",
            "..KgggggGgggggggggKKKK..",
            ".KggGggggggGggggGggggggK",
            "KgggggggGgggggggggGggggK",
            "KggGggggggggGgggggggGggK",
            "KGGGGGGGGGGGGGGGGGGGGGGK",
            ".KKKKKKKKKKKKKKKKKKKKKK."
        ],
        leaf: [
            ".g.",
            "ggg",
            ".G."
        ],
        palmSmall: [
            "...gg..gg...",
            ".gggggggggg.",
            "gg.gGggGg.gg",
            "g...gBBg...g",
            ".....BB.....",
            ".....BB.....",
            ".....CB.....",
            ".....BC.....",
            ".....BB.....",
            "....BBBB...."
        ],
        palmBanana: [
            "....gg....gg....",
            "..gggggggggggg..",
            ".ggGggggggggGgg.",
            "gg..gGggggGg..gg",
            "g..gg.gBBg.gg..g",
            ".....YgBBgY.....",
            "....YYYBBYYY....",
            ".....YYBBYY.....",
            "......YBBY......",
            ".......BB.......",
            ".......CB.......",
            ".......BC.......",
            ".......CB.......",
            ".......BC.......",
            ".......BB.......",
            "......BBBB......"
        ],
        wateringCan: [
            ".....KKKK.......",
            "....K....K......",
            ".KKKKKKKKKK...KK",
            "KggggggggggK.KgK",
            "KgGGGGGGGGgKKggK",
            "KggggggggggKggK.",
            "KggggggggggggK..",
            "KggggggggggKK...",
            "KggggggggggK....",
            ".KKKKKKKKKK....."
        ],
        sprout: [
            "g...g",
            "gg.gg",
            ".ggg.",
            "..g..",
            "..G.."
        ],
        sun: [
            "....YY....",
            ".Y.YYYY.Y.",
            "..YYYYYY..",
            ".YYYYYYYY.",
            "YYYYYYYYYY",
            "YYYYYYYYYY",
            ".YYYYYYYY.",
            "..YYYYYY..",
            ".Y.YYYY.Y.",
            "....YY...."
        ],
        cloud: [
            "....WWWW....",
            "..WWWWWWWW..",
            ".WWWWWWWWWWW",
            "WWWWWWWWWWWW",
            "WWWWWWWWWWWW",
            ".xxxxxxxxxx."
        ],
        greyCloud: [
            "....xxxx....",
            "..xxxxxxxx..",
            ".xxxxxxxxxxx",
            "xxxxxxxxxxxx",
            "xxxxxxxxxxxx",
            ".XXXXXXXXXX."
        ],
        bird: [
            ".K...K.",
            "K.K.K.K",
            "...K..."
        ],
        butterfly: [
            "P.K.P",
            "PPKPP",
            ".PKP.",
            "P.K.P"
        ],
        flowerPink: [
            "..P..",
            ".PPP.",
            "PPYPP",
            ".PPP.",
            "..P..",
            "..g..",
            ".gg..",
            "..g.."
        ],
        flowerWhite: [
            "..W..",
            ".WWW.",
            "WWYWW",
            ".WWW.",
            "..W..",
            "..g..",
            "..gg.",
            "..g.."
        ],
        wilted: [
            "......",
            "..CC..",
            ".C..C.",
            ".C....",
            "..C...",
            "..C...",
            "..C...",
            ".CCC.."
        ],
        star: [
            "...Y...",
            "...Y...",
            "..YYY..",
            "YYYYYYY",
            ".YYYYY.",
            ".YY.YY.",
            "Y.....Y"
        ],
        heart: [
            ".RR.RR.",
            "RRRRRRR",
            "RRRRRRR",
            ".RRRRR.",
            "..RRR..",
            "...R..."
        ]
    };

    // Build an SVG string. Horizontal runs of one colour become one <rect>.
    function svg(name, className = "px") {
        const rows = SPRITES[name];
        if (!rows) return "";

        const height = rows.length;
        const width = Math.max(...rows.map((row) => row.length));
        let rects = "";

        rows.forEach((row, y) => {
            let x = 0;
            while (x < row.length) {
                const colour = PALETTE[row[x]];
                if (!colour) { x++; continue; }

                let run = 1;
                while (row[x + run] === row[x]) run++;

                rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${colour}"/>`;
                x += run;
            }
        });

        return `<svg class="${className}" viewBox="0 0 ${width} ${height}" ` +
               `shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
    }

    return { svg, has: (name) => name in SPRITES };
})();
