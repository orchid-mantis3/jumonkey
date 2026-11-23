const player = document.getElementById("player");
const world = document.getElementById("world");
const gameArea = document.getElementById("game-area");
const parallaxLayers = document.querySelectorAll(".parallax");

const startMessage = document.getElementById("start-message");
const startButton = document.getElementById("start-button");

const questionBox = document.getElementById("question-box");
const questionTitle = document.getElementById("question-title");
const questionText = document.getElementById("question-text");
const answerOptions = document.getElementById("answer-options");
const feedback = document.getElementById("feedback");
const continueButton = document.getElementById("continue-button");

const progress = document.getElementById("progress");
const bananaTotal = document.getElementById("banana-total");

// settings
const playerWidth = 180;
const playerSpeed = 250;
const playerHeight = 180;
const playerBottom = 100;   
const dialogueGap = 10;     
const dialogueMaxWidth = 780; // wide enough for a 2x2 grid of answers (kid-ui.css)
const worldWidth = 7500;
world.style.width = `${worldWidth}px`;

// player posit.
let playerX = 100;
let cameraX = 0;

// movements
let movingLeft = false;
let movingRight = false;

// game states
let gameStarted = false;
let gamePaused = false;
let gameFinished = false;

// prog.
let currentCheckpoint = 0;
let collectedBananas = 0;

// player name for intro
let playerName = "";
let sceneStep = null; 

// tracks answers
let playerChoices = [];   // playerChoices[questionIndex] = index of the answer picked
let activeQuestion = null; // the version of the question currently on screen

// typewriter effect
let typingTimer = null;
let typingState = null; // { element, text, onDone } while text is typing

// anim.
let lastTime = 0;
let walkFrame = 0;
let walkTimer = 0;

// where the monkey's feet touch the ground (raise to lift buildings, lower to sink them)
const groundLevel = 170;   // only used as a fallback now (see placeBuilding)

// The ground picture (4.Ground.png) is 180px tall and scales with the screen. These rows are where
// the grass starts and where a building's base should sit, so buildings stay flush at any window size.
const GROUND_IMG_H = 180;
const GROUND_BASE_ROW = 144;     // building bottoms sit here (hidden behind the grass tufts)
const GRASS_TOP_ROW = 128;       // the grass strip drawn in front of buildings starts here...
const GRASS_BOTTOM_ROW = 152;    // ...and ends here

// buildings are sized from their door: door height = this share of the monkey box, capped by screen share
const DOOR_TO_MONKEY = 0.9;
const MAX_BUILDING_FRAC = 0.78;
const interior = document.getElementById("interior");
const interiorPlayer = document.getElementById("interior-player");
const fade = document.getElementById("fade");

// interior scene
let inInterior = false;
// curr room (used to place the player)
let currentRoom = null;
let currentSpot = null;

// filler locations
const fillers = [
    { x: 2900, src: "assets/buildings/filler-building1.png", scale: 6 },
    { x: 3700, src: "assets/buildings/filler-building2.png", scale: 6 },
    { x: 6000, src: "assets/buildings/filler-building1.png", scale: 6 }
];


// locations of scenarios
const locations = [
    { x: 800, src: "assets/buildings/school.png", scale: 4,
        interior: "assets/buildings/interiors/class.png",
        interiorSpot: { x: 0.5, y: 0.618} },
    { x: 2080, src: "assets/buildings/bakery.png", scale: 1,
        characters: [
            { src: "assets/characters/friend1.png", dx: 130, flip: true, row: "back" },
            { src: "assets/characters/friend2.png", dx: 420, flip: true, row: "front" }
    ]},
    { x: 3300 },
    { x: 4200, src: "assets/buildings/school.png", scale: 4,
        interior: "assets/buildings/interiors/class.png",
        interiorSpot: { x: 0.5, y: 0.618} },
    { x: 5500, src: "assets/buildings/apt-building.png", scale: 5,
        interior: "assets/buildings/interiors/apt.png",
        interiorSpot: { x: 0.5, y: 0.58 } },
    { x: 6600, src: "assets/buildings/work.png", scale: 7,
        interior: "assets/buildings/interiors/work.png",
        interiorSpot: { x: 0.5, y: 0.6 } }
];

// checkpoint starts at x, then moves to the building's door once the image loads
const checkpoints = locations.map((loc) => loc.x);

// every building placed so far (so they can be re-fitted when the window changes size)
const placedBuildings = [];

// px per row of the ground picture at the current screen height
function groundRowPx() {
    return (world.clientHeight || gameArea.clientHeight) / GROUND_IMG_H;
}

// sizes a building from its picture, sets it on the ground, and lays the grass tufts in front of its base
function fitBuilding(entry) {
    const { loc, img, grass } = entry;
    if (!img.naturalWidth) return;

    const row = groundRowPx();
    const screenH = world.clientHeight || gameArea.clientHeight;

    // height is a share of the screen so buildings look the same size next to the monkey on any window,
    // and they never poke out of the top of the screen
    let scale;
    if (loc.doorH) {
        // to scale: a door is about as tall as the monkey (so he fits through it), but never taller than the screen allows
        const monkeyH = (player.offsetHeight || 180) * DOOR_TO_MONKEY;
        scale = Math.min(monkeyH / loc.doorH, (MAX_BUILDING_FRAC * screenH) / img.naturalHeight);
    } else if (loc.heightFrac) {
        scale = (loc.heightFrac * screenH) / img.naturalHeight;
    } else {
        scale = loc.scale;
    }
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;

    img.style.setProperty("width", `${width}px`, "important");
    img.style.setProperty("height", `${height}px`, "important");
    img.style.setProperty("max-width", "none", "important");
    img.style.bottom = `${(GROUND_IMG_H - GROUND_BASE_ROW) * row + (loc.y || 0)}px`;

    // grass strip: the same grass as the ground layer, cut out and laid over the base of the building
    const margin = 24;
    grass.style.left = `${loc.x - margin}px`;
    grass.style.width = `${width + margin * 2}px`;
    grass.style.height = `${(GRASS_BOTTOM_ROW - GRASS_TOP_ROW) * row}px`;
    grass.style.bottom = `${(GROUND_IMG_H - GRASS_BOTTOM_ROW) * row}px`;
    grass.style.backgroundSize = `auto ${screenH}px`;
    grass.style.backgroundPosition = `${-(loc.x - margin)}px ${-GRASS_TOP_ROW * row}px`;

    if (entry.onSized) entry.onSized(width);
}

// puts a building in the world; onSized runs once its size is known
function placeBuilding(loc, onSized) {
    const img = new Image();
    const grass = document.createElement("div");

    img.className = "building";
    if (loc.tint) img.style.filter = loc.tint;
    img.style.left = `${loc.x}px`;
    img.style.bottom = `${groundLevel + (loc.y || 0)}px`;
    grass.className = "building-grass";

    const entry = { loc, img, grass, onSized };
    placedBuildings.push(entry);

    img.addEventListener("load", () => fitBuilding(entry));
    img.src = loc.src;

    // in case the image was already cached
    if (img.complete && img.naturalWidth) fitBuilding(entry);

    // building goes behind the player, grass tufts in front of the building
    world.insertBefore(img, player);
    world.insertBefore(grass, player);
}

window.addEventListener("resize", () => placedBuildings.forEach(fitBuilding));

// scenery
fillers.forEach((loc) => placeBuilding(loc));

// scenario buildings (checkpoint moves to the door once the image loads)
locations.forEach((loc, index) => {
    if (!loc.src) return;

    placeBuilding(loc, (width) => {
        checkpoints[index] = loc.x + width / 2 - playerWidth / 2;
    });
});

// characters, placed relative to their location's x
// row: "back" = higher up & behind the monkey (default), "front" = lower & in front of him
locations.forEach((loc) => {
    (loc.characters || []).forEach((ch) => {
        const img = new Image();
        const row = ch.row || "back";

        // depth: back row is higher, smaller and behind; front row is lower, bigger and in front
        const lift = ch.y !== undefined ? ch.y : (row === "back" ? 45 : -25);
        const size = ch.size || playerWidth * (row === "back" ? 0.9 : 1.05);

        img.className = "character";
        img.src = ch.src;
        img.style.left = `${loc.x + ch.dx}px`;
        img.style.bottom = `${playerBottom + lift}px`;
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;
        img.style.zIndex = row === "back" ? "2" : "4";   // the monkey is 3

        if (ch.flip) img.style.transform = "scaleX(-1)";
        if (ch.filter) img.style.filter = ch.filter;

        world.insertBefore(img, player);
    });
});

// fades into an interior, then runs onReady
// fades into an interior, then runs onReady
function enterInterior(src, spot, onReady) {
    fade.classList.add("on");

    currentRoom = new Image();
    currentRoom.src = src;
    currentSpot = spot || { x: 0.5, y: 0.6 };

    setTimeout(() => {
        interior.style.backgroundImage = `url("${src}")`;
        interior.classList.remove("hidden");
        inInterior = true;

        placeInteriorPlayer();

        // in case the room picture hasn't finished loading yet
        if (!currentRoom.complete) {
            currentRoom.onload = placeInteriorPlayer;
        }

        fade.classList.remove("on");
        setTimeout(onReady, 400);
    }, 400);
}

// puts the monkey at the spot (x, y) on the room picture
// x = horizontal center, y = where his feet are (0 to 1 across the picture)
function placeInteriorPlayer() {
    if (!currentRoom || !currentRoom.naturalWidth) return;

    const boxW = interior.clientWidth;
    const boxH = interior.clientHeight;

    // the room picture is shown with "contain", so work out its real size on screen
    const scale = Math.min(boxW / currentRoom.naturalWidth, boxH / currentRoom.naturalHeight);
    const roomW = currentRoom.naturalWidth * scale;
    const roomH = currentRoom.naturalHeight * scale;
    const roomLeft = (boxW - roomW) / 2;
    const roomTop = (boxH - roomH) / 2;

    const feetX = roomLeft + roomW * currentSpot.x;
    const feetY = roomTop + roomH * currentSpot.y;

    interiorPlayer.style.transform = "none";
    interiorPlayer.style.bottom = "auto";
    interiorPlayer.style.left = `${feetX - interiorPlayer.offsetWidth / 2}px`;
    interiorPlayer.style.top = `${feetY - interiorPlayer.offsetHeight}px`;
}

// fades back out to the world, then runs onDone
function exitInterior(onDone) {
    fade.classList.add("on");

    setTimeout(() => {
        interior.classList.add("hidden");
        inInterior = false;

        fade.classList.remove("on");
        setTimeout(onDone, 400);
    }, 400);
}

// =====================================
// QUESTIONS
// =====================================

// Each answer gives a different number of bananas 
// The total at the end decides which ending the player gets.
//

const questions = [
    {
        title: "First Day At School",
        question:
            "I am an incoming monkeyman (freshman) at a banaology institute. What device should I buy for school?",

        answers: [
            { text: "new laptop", bananas: 2, response: "Producing just one computer consumes 239kg of fossil fuel, 22kg of chemicals, and 1.5 tons of water." },
            { text: "refurbished laptop", bananas: 4, response: "Opting for a refurbished alternative rather than a brand new piece of technology also helps the environment more than you think" },
            { text: "iPad with a keyboard acessory", bananas: 3, response: "Opting for a devices that can serve you multiple purposes for school work is a good choice!" },
            { text: "desktop/pc", bananas: 1, response: "Producing just one computer consumes 239kg of fossil fuel, 22kg of chemicals, and 1.5 tons of water." }
        ]
    },
    // have this only show if the player bought a laptop
    {
        title: "Help me decide",
        question:
            "I’m the only monkey in my friend group that doesn’t have the newest phone… My phone works fine, but I want to get the new one because everyone else has it. What should I do?",

        answers: [
            { text: "I need it! Trade in my current phone to buy the newest phone ", bananas: 2, response: "Just because everyone has a new device doesn't mean you need one. Making the most of what you already own can reduce the environmental impact of electronics." },
            { text: "I deserve at least a small upgrade! Buy a refurbished version of last year’s phone model and properly dispose of the old phone", bananas: 1, response: "Just because everyone has a new device doesn't mean you need one. Making the most of what you already own can reduce the environmental impact of electronics." },
            { text: "I can afford it. Buy the newest phone for personal use and keep the old one for games", bananas: 1, response: "Just because everyone has a new device doesn't mean you need one. Making the most of what you already own can reduce the environmental impact of electronics." },
            { text: "My phone is fine. I don’t need to buy a new one", bananas: 4, response: "Right on! There's no need to replace your phone if it works fine." }
        ],
    },

    {
        title: ":(",
        question:
            "While swinging on the vine on my way to school, my phone falls out of my pocket and the screen cracks. What should I do?",

        answers: [
            { text: "Great timing, the new BananaPhone 4000 just dropped. Buy the newest smartphone and throw the cracked one in the trash.", bananas: 1, response: "Even though a new phone may be tempting, a cracked screen does not make the phone unusable. Next time, consider the effects of replacing a device too soon may have on the environment. Did you know that Americans throw away 151 million cell phones in a single year, or roughly 416,000 phones per day?" },
            { text: "It’s just a small crack. All it needs is a quick fix. Repair the phone", bananas: 4, response: "Great choice! Just because your phone is cracked does not mean it doesn’t work. Repairing the phone instead of buying a new one limits your environmental footprint!" },
            { text: "I’ve been due for an upgrade anyway! Trade in the cracked phone for some credit towards a new phone.", bananas: 4, response: "A cracked screen doesn't always mean you need a new phone! Repairing your device can help extend its lifespan and avoid the environmental cost of producing a replacement." },
            { text: "My brother might be old enough to have a phone now. This can be his first! Repair it and gift it to your little brother and then get yourself a refurbished newer phone.", bananas: 3, response: "Great job at finding a way to extend your phone's lifepsan and opting for a refurbished phone over a new one. This reduces a lot more e-waste in the longrun than you think, with this mindset." }
        ]
    },
    
    {
        title: "Assignments...",
        question:
            "I have a drawing assignment for my class due in a couple weeks! Having the newest ULTRAColor Display tablet would make this assignment so easy! ",

        answers: [
            { text: "It’s so colorful!! Buy the newest ULTRAColor display tablet. ", bananas: 1, response: "If you buy this tablet and it is uneeded for any other assignments, you are increasing the amount of e-waste you are outputting. Instead, consider borrowing your roommate's tablet instead of buying a new one." },
            { text: "My roommate has a pretty good tablet. I’m sure I could ask him to borrow it for a day. Borrow your friend’s tablet for a day.", bananas: 4, response: "Great way to reduce the amount of e-waste in the world! Who knows how often you will need that tablet in the future if you were to buy a new tablet!" },
            { text: "I don’t need the best of the best, but having a tablet would be nice. Buy a refurbished tablet that will last you for the rest of your time at college.", bananas: 2, response: "This is a better alternative to just buying a brand new tablet but next time instead consider borrowing your roommate's tablet instead of buying a new one." },
            { text: "The assignment never said it had to be digital… Use pen and paper.", bananas: 4, response: "Nice! There's no need for a brand new device just for one assignment." }
        ]
    },

    {
        title: "Hm",
        question:
            "I just graduated and moved into my first apartment. However, while assembling my new lamp, I put the lightbulbs in wrong and now they’re all out. This is bananas! How do you dispose of these lightbulbs?",

        answers: [
            { text: "I’m sure they can just go in the regular recycling… Crush the light bulbs and throw them in your recycling.", bananas: 1, response: "NO! Certain lightbulbs contain dangerous chemicals that need to be disposed of properly. Ensure you research what type of lightbulbs you have and how to dispose of them properly!" },
            { text: "I’m too tired to deal with it right now. I’ll just leave it out for tomorrow.", bananas: 1, response: "Not bad! This doesn’t harm the environment in any way, however, you will still have to dispose of them in the future." },
            { text: "These are compact fluorescent lights, which means they could be releasing mercury!! Immediately take the lightbulbs to a nearby hazardous waste collection facility such as Home Depot, IKEA, or Lowes.", bananas: 4, response: "Amazing choice! This allows the lightbulbs to be properly disposed of." },
            { text: "I should contain any toxic chemicals coming from this broken bulb. Seal them in an airtight container and drop it off at a recycling site.", bananas: 3, response: "Great choice! Disposing of lightbulbs properly is essential to limiting bad materials infecting our environment!" }
        ]
    },

    {
        title: "Graduation!",
        question:
            "I graduated college and got a job! The company provided me a brand new laptop to keep. What should I do with my old one that I used during college?",

        answers: [
            { text: "Who needs that junk anymore? I just got the newest Macnana laptop! Throw your old laptop in the landfill.", bananas: 1, response: "Your broken laptop still contains valuable materials. Taking it to a certified electronics recycler helps recover resources and prevents improper disposal." },
            { text: "This still has valuable resources in it! Take it to a certified electronic recycler.", bananas: 3, response: "This is a great way at repurposing the materials in your laptop!" },
            { text: "My brother will be going to college soon and will need to start shopping for laptops. I can give him this instead of him buying a new one. Give the laptop to your little brother.", bananas: 4, response: "This is a great way to extend this laptop's lifespan and reducing overall e-waste!" },
            { text: "You never know when you’ll need this. Keep it in your closet as a backup. ", bananas: 2, response: "Not bad! This doesn’t harm the environment in any way, however, you will still have to dispose of them in the future." }
        ]
    }

];

// ENDINGS (checked from the highest minimum down)
// Use {name} to insert the player's name.
// Total possible bananas: 6 (all worst) to 24 (all best)

const endings = [
    {
        minBananas: 19,
        title: "Good Ending",
        text:
            "Wow, {name}! Your family lives on for multiple generations, learning from your e-waste disposal habits, leading to a great global decrease in e-waste!! Click 'See My Jungle' to read more about your impact!"
    },
    {
        minBananas: 13,
        title: "Normal Ending",
        text:
            "Nice work, {name}!  Still have to adapt to changing climate “insert motivational quote” stats about meeting e-waste goals and how that can mitigate climate change etc. It's not too late to make a difference. Link to resources and infographic"
    },
    {
        minBananas: 0,
        title: "Bad Ending",
        text:
            "Good try, {name}! Your family has to adapt to the changing climate and sees a reduction in standard of living. Go into stats on how not reducing e-waste and pollution and how that relates to global warming. Rainforests are not thriving because soil and runoff water is contaminated with toxic materials. Try again and see how many bananas you can collect! It's not too late to make a difference. Link to resources and infographic"
    }
];

// handles keyboard ctrls

document.addEventListener("keydown", (event) => {
    if (event.target.tagName === "INPUT") return;

    const key = event.key.toLowerCase();

    if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === " "
    ) {
        event.preventDefault();
    }

    if (key === "arrowleft" || key === "a") {
        movingLeft = true;
    }

    if (key === "arrowright" || key === "d") {
        movingRight = true;
    }
});

document.addEventListener("keyup", (event) => {
    if (event.target.tagName === "INPUT") return;

    const key = event.key.toLowerCase();

    if (key === "arrowleft" || key === "a") {
        movingLeft = false;
    }

    if (key === "arrowright" || key === "d") {
        movingRight = false;
    }
});

// stops movement when browser tab switches
window.addEventListener("blur", () => {
    movingLeft = false;
    movingRight = false;
});

// starts game
startButton.addEventListener("click", () => {
    startMessage.classList.add("hidden");
    gameStarted = true;

    // scene 1 for player name
    startIntro();
});

// init/restart game
function initializeGame() {
    // resets player posit.
    playerX = 100;
    cameraX = 0;

    // resets movement
    movingLeft = false;
    movingRight = false;

    // reset game state
    gameStarted = false;
    gamePaused = false;
    gameFinished = false;

    // reset progress
    currentCheckpoint = 0;
    collectedBananas = 0;

    // reset animation
    walkFrame = 0;
    walkTimer = 0;

    // reset player sprite
    player.src = "assets/characters/default.png";
    player.style.left = `${playerX}px`;
    player.style.transform = "scaleX(1)";

    // reset camera
    world.style.transform = "translateX(0px)";
    parallaxLayers.forEach((layer) => {
        layer.style.backgroundPositionX = "0px";
    });

    // reset HUD
    progress.textContent = `ADVENTURE 0 / ${questions.length}`;
    bananaTotal.textContent = collectedBananas;

    // restores start screen
    startMessage.classList.remove("hidden");

    // hides question box
    questionBox.classList.add("hidden");

    //resets answer tracking
    playerChoices = [];
    activeQuestion = null;

    // resets name/intro scene
    playerName = "";
    sceneStep = null;

    // resets dialogue
    clearInterval(typingTimer);
    typingTimer = null;
    typingState = null;

        // resets interior
    interior.classList.add("hidden");
    inInterior = false;

    questionTitle.textContent = "E-Waste Challenge!";
    questionText.textContent = "";
    answerOptions.innerHTML = "";
    feedback.textContent = "";

    // Reset continue button
    continueButton.classList.add("hidden");
    continueButton.textContent = "Continue Adventure →";
}

// sets sprite to default & stops walking
function stopPlayer() {
    movingLeft = false;
    movingRight = false;

    walkTimer = 0;
    walkFrame = 0;

    player.src = "assets/characters/default.png";
}

// player anim.
function updatePlayerAnimation(deltaTime) {
    const isMoving = movingLeft || movingRight;

    if (!isMoving) {
        player.src = "assets/characters/default.png";

        walkTimer = 0;
        walkFrame = 0;

        return;
    }

    walkTimer += deltaTime;

    if (walkTimer >= 0.15) {
        walkFrame = walkFrame === 0 ? 1 : 0;

        if (walkFrame === 0) {
            player.src = "assets/characters/walk1.png";
        } else {
            player.src = "assets/characters/walk2.png";
        }

        walkTimer = 0;
    }
}

// handles player movement & camera
function updateMovement(deltaTime) {
    const movement = playerSpeed * deltaTime;

    if (movingRight) {
        playerX += movement;
        player.style.transform = "scaleX(1)";
    }

    if (movingLeft) {
        playerX -= movement;
        player.style.transform = "scaleX(-1)";
    }

    // keeps player inside world
    playerX = Math.max(
        0,
        Math.min(playerX, worldWidth - playerWidth)
    );

    // upd player position
    player.style.left = `${playerX}px`;

    // Camera follows player
    const screenWidth = gameArea.clientWidth;

    cameraX = playerX - screenWidth / 2 + playerWidth / 2;

    // Keep camera inside world boundaries
    cameraX = Math.max(
        0,
        Math.min(cameraX, worldWidth - screenWidth)
    );

    world.style.transform = `translateX(-${cameraX}px)`;

    // scrolls each background layer at its own speed (parallax)
    parallaxLayers.forEach((layer) => {
        layer.style.backgroundPositionX = `${-cameraX * layer.dataset.speed}px`;
    });
}

function checkCheckpoints() {
    if (currentCheckpoint >= checkpoints.length) {
        return;
    }

    if (playerX >= checkpoints[currentCheckpoint]) {
        showQuestion(currentCheckpoint);
    }
}

// positions textbox
function positionQuestionBox() {
    const areaRect = gameArea.getBoundingClientRect();
    const areaWidth = gameArea.clientWidth;
    const boxWidth = Math.min(dialogueMaxWidth, areaWidth - 36);

    let playerCenter;
    let boxBottom;

    if (inInterior) {
        // box goes over the monkey inside the room
        const rect = interiorPlayer.getBoundingClientRect();

        playerCenter = rect.left - areaRect.left + rect.width / 2;
        boxBottom = areaRect.bottom - rect.top + dialogueGap;
    } else {
        // player's horizontal center on screen
        playerCenter = playerX - cameraX + playerWidth / 2;
        boxBottom = playerBottom + playerHeight + dialogueGap;
    }

    // centers box over player, but keep it on screen
    let left = playerCenter - boxWidth / 2;
    left = Math.max(18, Math.min(left, areaWidth - boxWidth - 18));

    questionBox.style.left = `${left}px`;
    questionBox.style.bottom = `${boxBottom}px`;

    // ptr tail aims at the player
    const tailX = Math.max(36, Math.min(playerCenter - left, boxWidth - 36));
    questionBox.style.setProperty("--tail-x", `${tailX}px`);
}

window.addEventListener("resize", () => {
    if (inInterior) placeInteriorPlayer();

    if (!questionBox.classList.contains("hidden")) {
        positionQuestionBox();
    }
});

// scene to enter player name
function startIntro() {
    gamePaused = true;
    stopPlayer();
    sceneStep = "name";

    questionTitle.textContent = "Who's There?";
    answerOptions.innerHTML = "";
    feedback.textContent = "";
    continueButton.classList.add("hidden");

    questionBox.classList.remove("hidden");
    positionQuestionBox();

    typeText(questionText, "Welcome to the jungle! What's your name?", () => {
        const input = document.createElement("input");

        input.id = "name-input";
        input.type = "text";
        input.maxLength = 12;
        input.placeholder = "Type your name...";
        input.autocomplete = "off";

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                confirmName();
            }
        });

        answerOptions.appendChild(input);

        continueButton.textContent = "That's me! →";
        continueButton.classList.remove("hidden");

        input.focus();
    });
}

function confirmName() {
    const input = document.getElementById("name-input");
    const name = input ? input.value.trim() : "";

    if (!name) {
        feedback.textContent = "Please type your name first!";
        if (input) input.focus();
        return;
    }
    playerName = name;
    sceneStep = "greeting";

    questionTitle.textContent = "Hello!";
    answerOptions.innerHTML = "";
    feedback.textContent = "";
    continueButton.classList.add("hidden");

    typeText(questionText, `Hi, I'm ${playerName}!`, () => {
        continueButton.textContent = "Let's go! →";
        continueButton.classList.remove("hidden");
    });
}

function endIntro() {
    sceneStep = null;
    questionBox.classList.add("hidden");
    gamePaused = false;
}

// typewriter effect
function typeText(element, text, onDone, speed = 28) {
    clearInterval(typingTimer);

    element.textContent = "";
    typingState = { element, text, onDone };

    let charIndex = 0;

    typingTimer = setInterval(() => {
        charIndex++;
        element.textContent = text.slice(0, charIndex);

        if (charIndex >= text.length) {
            finishTyping();
        }
    }, speed);
}

function finishTyping() {
    if (!typingState) return;

    clearInterval(typingTimer);
    typingTimer = null;

    const { element, text, onDone } = typingState;
    typingState = null;

    element.textContent = text;

    if (onDone) onDone();
}

// add func to click box to skip the typing
questionBox.addEventListener("click", finishTyping);

function getActiveQuestion(index) {
    const base = questions[index];

    if (base.variants) {
        const match = base.variants.find(
            (variant) =>
                playerChoices[variant.when.question] === variant.when.answer
        );

        if (match) {
            return { ...base, ...match };
        }
    }

    return base;
}

// display questions (enters the interior first if the location has one)
function showQuestion(index) {
    gamePaused = true;
    stopPlayer();

    const loc = locations[index];

    if (loc.interior) {
        enterInterior(loc.interior, loc.interiorSpot, () => openQuestion(index));
    } else {
        openQuestion(index);
    }
}

// display questions
function openQuestion(index) {
    const question = getActiveQuestion(index);
    activeQuestion = question;

    questionTitle.textContent = question.title;

    // clears prev answers and feedback
    answerOptions.innerHTML = "";
    feedback.textContent = "";

    continueButton.classList.add("hidden");

    questionBox.classList.remove("hidden");
    positionQuestionBox();

    // types out the question, then show the answer buttons
    typeText(questionText, question.question, () => {
        question.answers.forEach((answer, answerIndex) => {
            const button = document.createElement("button");

            button.textContent = answer.text;

            button.addEventListener("click", () => {
                checkAnswer(answerIndex, index);
            });

            answerOptions.appendChild(button);
        });
    });
}

// checks answer
function checkAnswer(selectedAnswer, questionIndex) {
    const question = activeQuestion;

    // remembers what the player picked (later questions can react to it)
    playerChoices[questionIndex] = selectedAnswer;
    const choice = question.answers[selectedAnswer];

    const buttons = answerOptions.querySelectorAll("button");

    // prevents selecting multiple answers and highlights the one picked
    buttons.forEach((button, index) => {
        button.disabled = true;

        if (index === selectedAnswer) {
            button.classList.add("chosen");
        }
    });

    // add answer's banana val
    collectedBananas += choice.bananas;
    bananaTotal.textContent = collectedBananas;

    const reward = `🍌 +${choice.bananas} ${choice.bananas === 1 ? 
                    "banana" : "bananas"}!`;

    feedback.textContent = `${reward} ${choice.response}`;

    // shows continue button
    continueButton.classList.remove("hidden");
}

// continues adventure
continueButton.addEventListener("click", () => {

    // intro
    if (sceneStep === "name") {
        confirmName();
        return;
    }

    if (sceneStep === "greeting") {
        endIntro();
        return;
    }

    // results dashboard (results-dashboard.js); it has its own Play Again
    if (gameFinished && window.JumonkeyResults) {
        window.JumonkeyResults.open();
        return;
    }

    // replay
    if (gameFinished) {
        initializeGame();
        return;
    }

        // hides curr question
    questionBox.classList.add("hidden");

    const next = () => {
        currentCheckpoint++;
        progress.textContent =
            `ADVENTURE ${currentCheckpoint} / ${questions.length}`;

        // checks if all questions are complete
        if (currentCheckpoint >= questions.length) {
            finishGame();
        } else {
            gamePaused = false;
        }
    };

    // walks back out of the building first if inside
    if (inInterior) {
        exitInterior(next);
    } else {
        next();
    }
});

// finishes game
function finishGame() {
    gamePaused = true;
    stopPlayer();
    gameFinished = true;

    // picks ending that matches banana total
    const ending = endings.find((e) => collectedBananas >= e.minBananas);
    const who = playerName || "Eco Explorer";

    const maxBananas = questions.reduce(
        (total, q) => total + Math.max(...q.answers.map((a) => a.bananas)),
        0
    );

    questionTitle.textContent = ending.title;

    answerOptions.innerHTML = "";
    feedback.textContent = "";
    continueButton.classList.add("hidden");

    questionBox.classList.remove("hidden");
    positionQuestionBox();

    typeText(questionText, ending.text.replace("{name}", who), () => {
        feedback.textContent =
            `🍌 You collected ${collectedBananas} of ${maxBananas} bananas!`;

        continueButton.textContent = window.JumonkeyResults ? "See my jungle! →" : "Play Again";
        continueButton.classList.remove("hidden");
    });

    progress.textContent = "ADVENTURE COMPLETE!";
}

// loop main game
function gameLoop(timestamp) {
    const deltaTime = lastTime
        ? Math.min((timestamp - lastTime) / 1000, 0.05)
        : 0;

    lastTime = timestamp;

    if (gameStarted && !gamePaused && !gameFinished) {
        updateMovement(deltaTime);
        updatePlayerAnimation(deltaTime);
        checkCheckpoints();
    }

    requestAnimationFrame(gameLoop);
}

// init game
initializeGame();
requestAnimationFrame(gameLoop);

// pixelated flowers & leaves (textbox decorations)
const PIXEL_PALETTE = {
    P: "#F08CB4", // pink petal
    W: "#FFF6EC", // white petal
    Y: "#F5C542", // flower centre
    G: "#2F7D22", // dark leaf
    g: "#58A838"  // light leaf
};

const PIXEL_SPRITES = {
    flowerPink:  ["..P..", ".PPP.", "PPYPP", ".PPP.", "..P.."],
    flowerWhite: ["..W..", ".WWW.", "WWYWW", ".WWW.", "..W.."],
    leaf:        ["..gg.", ".ggG.", "gggG.", ".gG..", "G...."]
};
const PIXEL_SIZE = 5;

document.querySelectorAll(".spr").forEach((el) => {
    const map = PIXEL_SPRITES[el.dataset.s];
    if (!map) return;

    const shadows = [];
    map.forEach((row, y) => {
        [...row].forEach((char, x) => {
            if (PIXEL_PALETTE[char]) {
                shadows.push(`${x * PIXEL_SIZE}px ${y * PIXEL_SIZE}px 0 ${PIXEL_PALETTE[char]}`);
            }
        });
    });

    el.style.width = `${PIXEL_SIZE}px`;
    el.style.height = `${PIXEL_SIZE}px`;
    el.style.boxShadow = shadows.join(",");
});