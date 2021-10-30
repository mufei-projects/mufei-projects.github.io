// ===================== Winter 2021 EECS 493 Assignment 2 =====================
// This starter code provides a structure and helper functions for implementing
// the game functionality. It is a suggestion meant to help you, and you are not
// required to use all parts of it. You can (and should) add additional functions
// as needed or change existing functions.

// ==============================================
// ============ Page Scoped Globals Here ========
// ==============================================

// Counters
let throwingItemIdx = 1;
let throwingCandyIdx = 1;
let throwingBeadsIdx = 1;

// Size Constants
const FLOAT_1_WIDTH = 149;
const FLOAT_2_WIDTH = 101;
const FLOAT_SPEED = 2;
const PERSON_SPEED = 25;
const OBJECT_REFRESH_RATE = 50;  //ms
const SCORE_UNIT = 100;  // scoring is in 100-point units


// Size vars
let maxPersonPosX, maxPersonPosY;
let maxItemPosX;
let maxItemPosY;

// Global Window Handles (gwh__)
let gwhGame, gwhStatus, gwhScore, gwhLoading, gwhSettingsBtn, gwhSettingsPanel, gwhCandyCounter, gwhBeadsCounter,
    gwhThrowingFrequency, gwhSaveSettings, gwhDiscardSettings, gwhStartScreen, gwhStartGameBtn, gwhResumeGameBtn,
    gwhPauseGameBtn, gwhGamePaused;

// Global Object Handles
let player;
let paradeRoute;
let paradeFloat1;
let paradeFloat2;
let paradeTimer;

let openSettingsPanel = false;
let gamePaused = false;
/*
 * This is a handy little container trick: use objects as constants to collect
 * vals for easier (and more understandable) reference to later.
 */
const KEYS = {
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    shift: 16,
    spacebar: 32
};

let createThrowingItemIntervalHandle;
let currentThrowingFrequency = 2000;

let numCandyPickedUp = 0;
let numBeadsPickedUp = 0;
let itemCollected = {};
// ==============================================
// ============ Functional Code Here ============
// ==============================================

// Main
$(document).ready(function () {
    console.log("Ready!");

    // TODO: Event handlers for the settings panel
    gwhStartScreen = $('#welcomeMessage');
    gwhStartGameBtn = $('#startGame');
    gwhLoading = $('#loadingScreen');

    // Set global handles (now that the page is loaded)
    // Allows us to quickly access parts of the DOM tree later
    gwhGame = $('#actualGame');
    gwhStatus = $('.status-window');
    gwhScore = $('#score-box');
    gwhCandyCounter = $('#candyCounter');
    gwhBeadsCounter = $('#beadsCounter');
    player = $('#player');  // set the global player handle
    paradeRoute = $("#paradeRoute");
    paradeFloat1 = $("#paradeFloat1");
    paradeFloat2 = $("#paradeFloat2");


    gwhSettingsBtn = $('#settingsButton');
    gwhSettingsPanel = $('#settingsPanel');
    gwhThrowingFrequency = $('#throwingInput');
    gwhSaveSettings = $('#saveInfo');
    gwhDiscardSettings = $('#discardInfo');
    gwhResumeGameBtn = $('#resumeGame');
    gwhGamePaused = $('#gamePaused');
    gwhPauseGameBtn = $('#pauseGameBtn');

    // Set global positions for thrown items
    maxItemPosX = $('.game-window').width() - 50;
    maxItemPosY = $('.game-window').height() - 40;

    // Set global positions for the player
    maxPersonPosX = $('.game-window').width() - player.width();
    maxPersonPosY = $('.game-window').height() - player.height();

    // Keypress event handler
    $(window).keydown(keydownRouter);

    // TODO: Add a splash screen and delay starting the game

    player.hide();
    paradeRoute.hide();
    gwhSettingsPanel.hide();
    gwhStatus.hide();
    $('.game-window').hide();
    gwhLoading.hide();
    gwhGamePaused.hide();


    // Periodically check for collisions with thrown items (instead of checking every position-update)
    setInterval(function () {
        checkCollisions();//remove elements if there are collisions
    }, 100);

    gwhSettingsBtn.click(function () {
        settingsButtonClick();
    });

    gwhSaveSettings.click(function () {
        saveSettingsClick();
    });

    gwhDiscardSettings.click(function () {
        discardSettingsClick();
    });

    gwhStartGameBtn.click(function () {
        startGameClick();
    });

    gwhPauseGameBtn.click(function () {
        pauseGame();
    });

    gwhResumeGameBtn.click(function () {
        resumeGame();
    })
    // $(window).focusout( function(){
    //     pauseGame();
    // })

});//ready

function startGameClick() {
    gwhStartScreen.hide();
    gwhStatus.show("slow");
    $('.game-window').show("slow");
    gwhLoading.show("slow");
    // gwhSettingsPanel.show("slow");
    setTimeout(function () {
        gwhLoading.hide();
        player.show();
        paradeRoute.show();
        startParade();// Move the parade floats
        // Throw items onto the route at the specified frequency
        createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);
    }, 3000);
}

function pauseGame() {
    gwhGamePaused.show();
    gwhStatus.hide();
    $('.game-window').hide();
    gwhSettingsPanel.hide();
    gamePaused = true;
}

function resumeGame() {
    gamePaused = false;
    gwhGamePaused.hide();
    gwhStatus.show();
    $('.game-window').show();
    // gwhLoading.show();
    // gwhSettingsPanel.show();
}

setInterval (function () {
    if (document.visibilityState === "hidden") {
        pauseGame();
    }
}, 100);

// Key down event handler
// Check which key is pressed and call the associated function
function keydownRouter(e) {
    switch (e.which) {
        case KEYS.shift:
            break;
        case KEYS.spacebar:
            break;
        case KEYS.left:
        case KEYS.right:
        case KEYS.up:
        case KEYS.down:
            movePerson(e.which);
            e.preventDefault();
            break;
        default:
            console.log("Invalid input!");
    }
}

// Handle player movement events
// TODO: Stop the player from moving into the parade float. Only update if
// there won't be a collision


function movePerson(arrow) {
    let person_xChange = 0;
    let person_yChange = 0;
    if(gamePaused === false){
        switch (arrow) {
            case KEYS.left: {
                person_xChange = -PERSON_SPEED;
                person_yChange = 0;
                break;
            }
            case KEYS.right: {
                person_xChange = PERSON_SPEED;
                person_yChange = 0;
                break;
            }
            case KEYS.up: {
                person_xChange = 0;
                person_yChange = -PERSON_SPEED;
                break;
            }
            case KEYS.down: {
                person_xChange = 0;
                person_yChange = PERSON_SPEED;
                break;
            }
        }

        if (willCollide(player, paradeFloat1, person_xChange, person_yChange) ||
            willCollide(player, paradeFloat2, person_xChange, person_yChange)) {
            return;
        }

        switch (arrow) {
            case KEYS.left: { // left arrow
                let newPos = parseInt(player.css('left')) - PERSON_SPEED;
                if (newPos < 0) {
                    newPos = 0;
                }
                player.css('left', newPos);
                break;
            }
            case KEYS.right: { // right arrow
                let newPos = parseInt(player.css('left')) + PERSON_SPEED;
                if (newPos > maxPersonPosX) {
                    newPos = maxPersonPosX;
                }
                player.css('left', newPos);
                break;
            }
            case KEYS.up: { // up arrow
                let newPos = parseInt(player.css('top')) - PERSON_SPEED;
                if (newPos < 0) {
                    newPos = 0;
                }
                player.css('top', newPos);
                break;
            }
            case KEYS.down: { // down arrow
                let newPos = parseInt(player.css('top')) + PERSON_SPEED;
                if (newPos > maxPersonPosY) {
                    newPos = maxPersonPosY;
                }
                player.css('top', newPos);
                break;
            }
        }
    }
}


// Move the parade floats (Unless they are about to collide with the player)
function startParade() {
    console.log("Starting parade...");

    paradeTimer = setInterval(function () {
        if (gamePaused === false) {
            if (willCollide(paradeFloat2, player, FLOAT_SPEED, 0)) {
                return;
            }
            paradeFloat1.css('left', parseInt(paradeFloat1.css('left')) + FLOAT_SPEED)
            paradeFloat2.css('left', parseInt(paradeFloat2.css('left')) + FLOAT_SPEED)
            // TODO: (Depending on current position) update left value for each
            if (parseInt(paradeFloat1.css('left')) > $('.game-window').width()) {
                paradeFloat1.css('left', -300);
                paradeFloat2.css('left', -150);
            }
            // parade float, check for collision with player, etc.
        }
    }, OBJECT_REFRESH_RATE);
}

// Check for any collisions with thrown items
// If needed, score and remove the appropriate item
function checkCollisions() {
    if (gamePaused === false) {
        $('.throwingItemCandy').each(function () {
            let curCandy = $(this);
            console.log(curCandy[0].id);
            if (isColliding(curCandy, player) && (!itemCollected[curCandy[0].id])) {
                itemCollected[curCandy[0].id] = true;
                curCandy.append(`<img class = 'yellowCircle' src = 'img/yellow_circle.png'/>`)
                setTimeout(function () {
                    curCandy.remove();
                }, 1000)

                numCandyPickedUp++;

                gwhCandyCounter.html(numCandyPickedUp);
                gwhScore.html(parseInt($('#score-box').html()) + SCORE_UNIT);
            }
        });

        $('.throwingItemBeads').each(function () {
            let curBeads = $(this);
            console.log(curBeads);
            if (isColliding(curBeads, player) && (!itemCollected[curBeads[0].id])) {
                itemCollected[curBeads[0].id] = true;
                curBeads.append(`<img class = 'yellowCircle' src = 'img/yellow_circle.png'/>`)
                setTimeout(function () {
                    curBeads.remove();
                }, 1000)
                numBeadsPickedUp++;

                gwhBeadsCounter.html(numBeadsPickedUp);
                gwhScore.html(parseInt($('#score-box').html()) + SCORE_UNIT);
            }
        });
    }
    //$('.throwingItem').each( function() {
    //var curItem = $(this);//a local handle for this candy
    //var itemPickedUp = false;

    // TODO
}

// Get random position to throw object to, create the item, begin throwing
function createThrowingItem() {
    if (gamePaused === false) {
        console.log('Throwing candies and beads...');
        let itemObject;

        if (Math.random() <= 2 / 3) {
            let beadsThrowing = createItemDivString(throwingBeadsIdx, 'Beads', 'beads.png');
            gwhGame.append(beadsThrowing);
            let curBeads = $('#i-' + 'Beads' + throwingBeadsIdx);
            throwingBeadsIdx++;
            curBeads.css('width', 40);
            curBeads.css('height', 40);
            curBeads.css('position', 'absolute');
            itemObject = curBeads;
        } else {
            let candyThrowing = createItemDivString(throwingCandyIdx, 'Candy', 'candy.png');
            gwhGame.append(candyThrowing);
            let curCandy = $('#i-' + 'Candy' + throwingCandyIdx);
            throwingCandyIdx++;
            curCandy.css('width', 46);
            curCandy.css('height', 40);
            curCandy.css('position', 'absolute');
            itemObject = curCandy;
        }

        let startingTop = 210;
        let startingLeft = parseFloat(paradeFloat2.css('left')) + 25;
        itemObject.css('top', startingTop);
        itemObject.css('left', startingLeft);

        let finalTop = Math.random() * maxItemPosY + 10;
        while (finalTop >= 200 && finalTop <= 300) {
            finalTop = Math.random() * maxItemPosY + 10;
        }

        let finalLeft = Math.random() * maxItemPosX + 10;
        console.log(finalLeft);

        const throwingSpeed = 10;
        let distance = Math.sqrt(Math.pow(finalTop - startingTop, 2) + Math.pow(finalLeft - startingLeft, 2));
        let numIterations = distance / throwingSpeed;
        let xChange = (finalLeft - startingLeft) / numIterations;
        let yChange = (finalTop - startingTop) / numIterations;
        numIterations = Math.floor(distance / throwingSpeed);
        updateThrownItemPosition(itemObject, xChange, yChange, numIterations);
        // TODO
    }
}

// Helper function for creating items
// throwingItemIdx - index of the item (a unique identifier)
// type - beads or candy
// imageString - beads.png or candy.png
function createItemDivString(itemIndex, type, imageString) {
    return "<div id='i-" + type + itemIndex + "' class='throwingItem" + type + "'><img class = 'throwingItemImg'  " +
        "src='img/" + imageString + "'/></div>";
}

// Throw the item. Meant to be run recursively using setTimeout, decreasing the
// number of iterationsLeft each time. You can also use your own implementation.
// If the item is at it's final postion, start removing it.
function updateThrownItemPosition(elementObj, xChange, yChange, iterationsLeft) {
    elementObj.css('left', parseInt(elementObj.css('left')) + xChange)
    elementObj.css('top', parseInt(elementObj.css('top')) + yChange)
    if (iterationsLeft > 0) {
        setTimeout(function () {
            updateThrownItemPosition(elementObj, xChange, yChange, iterationsLeft - 1);
        }, 50)
    } else {
        setTimeout(function () {
            elementObj.fadeOut(2000);
        }, 5000)
        setTimeout(function () {
            elementObj.remove();
        }, 7010)//remove disappeared items
    }
    // TODO
}

function graduallyFadeAndRemoveElement(elementObj) {
    // Fade to 0 opacity over 2 seconds
    elementObj.fadeTo(2000, 0, function () {
        $(this).remove();
    });
}


function settingsButtonClick() {
    if (openSettingsPanel === false) {
        gamePaused = true;
        gwhSettingsBtn.html('Close Settings Panel')
        gwhSettingsPanel.show("slow");
        gwhThrowingFrequency.val(currentThrowingFrequency);
        openSettingsPanel = true;
    } else {
        gamePaused = false;
        gwhSettingsBtn.html('Open Settings Panel')
        gwhSettingsPanel.hide("slow");
        openSettingsPanel = false;
    }
}


function saveSettingsClick() {
    gamePaused = false;
    if (!(gwhThrowingFrequency.val() === '')) {
        let frequencyInput;
        frequencyInput = parseFloat(gwhThrowingFrequency.val());
        if (frequencyInput >= 100) {
            currentThrowingFrequency = frequencyInput;
            clearInterval(createThrowingItemIntervalHandle);
            createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);
        } else {
            alert('Frequency must be a number greater than or equal to 100');
            return;
        }
    }
    gwhSettingsBtn.html('Open Settings Panel')
    gwhSettingsPanel.hide("slow");
    openSettingsPanel = false;
}

function discardSettingsClick() {
    gamePaused = false;
    gwhSettingsBtn.html('Open Settings Panel')
    gwhSettingsPanel.hide("slow");
    openSettingsPanel = false;
    gwhThrowingFrequency.html(currentThrowingFrequency);
}

// ==============================================
// =========== Utility Functions Here ===========
// ==============================================

// Are two elements currently colliding?
function isColliding(o1, o2) {
    return isOrWillCollide(o1, o2, 0, 0);
}

// Will two elements collide soon?
// Input: Two elements, upcoming change in position for the moving element
function willCollide(o1, o2, o1_xChange, o1_yChange) {
    return isOrWillCollide(o1, o2, o1_xChange, o1_yChange);
}

// Are two elements colliding or will they collide soon?
// Input: Two elements, upcoming change in position for the moving element
// Use example: isOrWillCollide(paradeFloat2, person, FLOAT_SPEED, 0)
function isOrWillCollide(o1, o2, o1_xChange, o1_yChange) {
    const o1D = {
        'left': o1.offset().left + o1_xChange,
        'right': o1.offset().left + o1.width() + o1_xChange,
        'top': o1.offset().top + o1_yChange,
        'bottom': o1.offset().top + o1.height() + o1_yChange
    };
    const o2D = {
        'left': o2.offset().left,
        'right': o2.offset().left + o2.width(),
        'top': o2.offset().top,
        'bottom': o2.offset().top + o2.height()
    };
    // Adapted from https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
    if (o1D.left < o2D.right &&
        o1D.right > o2D.left &&
        o1D.top < o2D.bottom &&
        o1D.bottom > o2D.top) {
        // collision detected!
        return true;
    }
    return false;
}

// Get random number between min and max integer
function getRandomNumber(min, max) {
    return (Math.random() * (max - min)) + min;
}
