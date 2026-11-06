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
const worldWidth = 3000;
const playerWidth = 180;
const playerSpeed = 250;
const playerHeight = 180;
const playerBottom = 100;   
const dialogueGap = 10;     
const dialogueMaxWidth = 640; 

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

// CHECKPOINT LOCATIONS
// One checkpoint per question (6 questions)
const checkpoints = [500, 1000, 1500, 2000, 2400, 2800];

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
            { text: "new laptop", bananas: 2, response: "[ADD TEXT]" },
            { text: "refurbished laptop", bananas: 4, response: "opting for a refurbished alternative rather than a brand new piece of technology also helps the environment more than you think" },
            { text: "iPad with a keyboard acessory", bananas: 3, response: "[ADD TEXT]" },
            { text: "desktop/pc", bananas: 1, response: "[ADD TEXT]" }
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
            { text: "My phone is fine. I don’t need to buy a new one", bananas: 4, response: "[ADD TEXT]" }
        ],
    },

    {
        title: ":(",
        question:
            "While swinging on the vine on my way to school, my phone falls out of my pocket and the screen cracks. What should I do?",

        answers: [
            { text: "Great timing, the new BananaPhone 4000 just dropped. Buy the newest smartphone and throw the cracked one in the trash.", bananas: 1, response: "[ADD TEXT]" },
            { text: "It’s just a small crack. All it needs is a quick fix. Repair the phone", bananas: 4, response: "[ADD TEXT]" },
            { text: "I’ve been due for an upgrade anyway! Trade in the cracked phone for some credit towards a new phone.", bananas: 4, response: "[ADD TEXT]" },
            { text: "My brother might be old enough to have a phone now. This can be his first! Repair it and gift it to your little brother and then get yourself a refurbished newer phone.", bananas: 3, response: "[ADD TEXT]" }
        ]
    },
    
    {
        title: "Assignments...",
        question:
            "I have a drawing assignment for my class due in a couple weeks! Having the newest ULTRAColor Display tablet would make this assignment so easy! ",

        answers: [
            { text: "It’s so colorful!! Buy the newest ULTRAColor display tablet. ", bananas: 1, response: "[ADD TEXT]" },
            { text: "My roommate has a pretty good tablet. I’m sure I could ask him to borrow it for a day. Borrow your friend’s tablet for a day.", bananas: 4, response: "[ADD TEXT]" },
            { text: "I don’t need the best of the best, but having a tablet would be nice. Buy a refurbished tablet that will last you for the rest of your time at college.", bananas: 2, response: "[ADD TEXT]" },
            { text: "The assignment never said it had to be digital… Use pen and paper.", bananas: 4, response: "[ADD TEXT]" }
        ]
    },

    {
        title: "Hm",
        question:
            "I just graduated and moved into my first apartment. However, while assembling my new lamp, I put the lightbulbs in wrong and now they’re all out. This is bananas! How do you dispose of these lightbulbs?",

        answers: [
            { text: "I’m sure they can just go in the regular recycling… Crush the light bulbs and throw them in your recycling.", bananas: 1, response: "[ADD TEXT]" },
            { text: "I’m too tired to deal with it right now. I’ll just leave it out for tomorrow.", bananas: 1, response: "[ADD TEXT]" },
            { text: "These are compact fluorescent lights, which means they could be releasing mercury!! Immediately take the lightbulbs to a nearby hazardous waste collection facility such as Home Depot, IKEA, or Lowes.", bananas: 4, response: "[ADD TEXT]" },
            { text: "I should contain any toxic chemicals coming from this broken bulb. Seal them in an airtight container and drop it off at a recycling site.", bananas: 3, response: "[ADD TEXT]" }
        ]
    },

    {
        title: "Graduation!",
        question:
            "I graduated college and got a job! The company provided me a brand new laptop to keep. What should I do with my old one that I used during college?",

        answers: [
            { text: "Who needs that junk anymore? I just got the newest Macnana laptop! Throw your old laptop in the landfill.", bananas: 1, response: "[ADD TEXT]" },
            { text: "This still has valuable resources in it! Take it to a certified electronic recycler.", bananas: 3, response: "[ADD TEXT]" },
            { text: "My brother will be going to college soon and will need to start shopping for laptops. I can give him this instead of him buying a new one. Give the laptop to your little brother.", bananas: 4, response: "[ADD TEXT]" },
            { text: "You never know when you’ll need this. Keep it in your closet as a backup. ", bananas: 2, response: "[ADD TEXT]" }
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
            "Wow, {name}! Your family lives on for multiple generations. Go into stats of goals to reduce e-waste and pollution and how that relates to global warming. The rainforests thrive because soil and runoff water stays uncontaminated. It's not too late to make a difference. Link to resources and infographic"
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
    player.src = "assets/default.png";
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

    player.src = "assets/default.png";
}

// player anim.
function updatePlayerAnimation(deltaTime) {
    const isMoving = movingLeft || movingRight;

    if (!isMoving) {
        player.src = "assets/default.png";

        walkTimer = 0;
        walkFrame = 0;

        return;
    }

    walkTimer += deltaTime;

    if (walkTimer >= 0.15) {
        walkFrame = walkFrame === 0 ? 1 : 0;

        if (walkFrame === 0) {
            player.src = "assets/walk1.png";
        } else {
            player.src = "assets/walk2.png";
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
    const areaWidth = gameArea.clientWidth;
    const boxWidth = Math.min(dialogueMaxWidth, areaWidth - 36);

    // player's horizontal center on screen
    const playerCenter = playerX - cameraX + playerWidth / 2;

    // centers box over player, but keep it on screen
    let left = playerCenter - boxWidth / 2;
    left = Math.max(18, Math.min(left, areaWidth - boxWidth - 18));

    questionBox.style.left = `${left}px`;
    questionBox.style.bottom = `${playerBottom + playerHeight + dialogueGap}px`;

    // pointer tail aims at the player
    const tailX = Math.max(36, Math.min(playerCenter - left, boxWidth - 36));
    questionBox.style.setProperty("--tail-x", `${tailX}px`);
}

window.addEventListener("resize", () => {
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


// display questions
function showQuestion(index) {
    gamePaused = true;
    stopPlayer();
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

    // replay
    if (gameFinished) {
        initializeGame();
        return;
    }

    // hides curr question
    questionBox.classList.add("hidden");
    currentCheckpoint++;
    progress.textContent =
        `ADVENTURE ${currentCheckpoint} / ${questions.length}`;

    // checks if all questions are complete
    if (currentCheckpoint >= questions.length) {
        finishGame();
    } else {
        gamePaused = false;
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

        continueButton.textContent = "Play Again";
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