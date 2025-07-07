/**
 * IDEAS
 * Complete Item list
 * FIX shop hover menu on pokemon portrait
 */

var synergiesToHighlight = [];
var pokemonMeta = [];
var settings = {
    highlightEnabled: false,
    metaEnabled: false,
    metaThreshold: 'LEVEL_BALL'
}

var evolutionLines = {};

var thresholdMapping = {
    LEVEL_BALL: 0,
    NET_BALL: 1,
    SAFARI_BALL: 2,
    LOVE_BALL: 3,
    PREMIER_BALL: 4,
    QUICK_BALL: 5,
    POKE_BALL: 6,
    SUPER_BALL: 7,
    ULTRA_BALL: 8,
    MASTER_BALL: 9,
    BEAST_BALL: 10
}

// Get settings once
chrome.storage.sync.get(['highlight', 'meta', 'metaThreshold'], function (data) {
    settings.highlightEnabled = data.highlight !== false; // default true
    settings.metaEnabled = data.meta !== false; // default true
    settings.metaThreshold = data.metaThreshold || 'LEVEL_BALL';
    getPokemonMeta(true);
});

// Listen for changes (optional)
chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'sync') {
        if (changes.highlight) {
            settings.highlightEnabled = changes.highlight.newValue;
        }
        if (changes.meta) {
            settings.metaEnabled = changes.meta.newValue;
        }
        if (changes.metaThreshold) {
            currentTeamBuilderPokemon = null;
            settings.metaThreshold = changes.metaThreshold.newValue;
            getPokemonMeta(true);
        }
    }
});

function parseSynergies(currentSynergies) {
    var highlights = [];
    currentSynergies.forEach(function (synergy) {
        var type;
        var typeElement = synergy.querySelector('.synergy-icon');

        if (typeElement) {
            type = typeElement.title;
        }
        highlights.push(type);
    });
    synergiesToHighlight = highlights;
}

function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function addSynergyShimmer(icon) {
    if (icon && synergiesToHighlight.includes(icon.title) && !icon.classList.contains('shimmer') && !icon.parentElement.classList.contains('image-shimmer-wrapper')) {
        if (icon.nextElementSibling && icon.nextElementSibling.matches('.shimmer-overlay')) {
            icon.nextElementSibling.remove();
        }
        var childRect = icon.getBoundingClientRect();
        var parentRect = icon.parentElement.getBoundingClientRect();
        var coordinates = {
            top: childRect.top - parentRect.top,
            left: childRect.left - parentRect.left,
            right: childRect.right - parentRect.left,
            bottom: childRect.bottom - parentRect.top,
            width: childRect.width,
            height: childRect.height
        }
        if (icon.parentElement.classList.length === 0) {
            icon.parentElement.classList.add('image-shimmer-wrapper');
        } else {
            var shimmerOverlay = document.createElement('div');
            shimmerOverlay.className = 'shimmer-overlay';
            icon.classList.add('shimmer');
            shimmerOverlay.style.right = coordinates.right > 0 ? (coordinates.right - coordinates.width) + 'px' : coordinates.right + 'px';
            if (icon.closest('#team-builder') || icon.closest('.game-pokemon-detail')) {
                shimmerOverlay.style.top = '0px';
            } else {
                shimmerOverlay.style.top = coordinates.bottom + 'px';
            }
            shimmerOverlay.style.width = coordinates.width + 'px';
            shimmerOverlay.style.height = coordinates.height + 'px';

            insertAfter(icon, shimmerOverlay)
        }
    }
};

function highlightSynergies(element) {
    var cardTypeElement = element.querySelectorAll('.synergy-icon');
    cardTypeElement.forEach(addSynergyShimmer);
}


function observePropositionList() {
    var propositionListNode = document.querySelector('.game-pokemons-proposition-list');
    if (propositionListNode && propositionListNode.childElementCount > 0) {
        Array.from(propositionListNode.children).forEach(highlightSynergies);
    }
}

function observeStoreList() {
    var storeBoxes = document.querySelectorAll('.game-pokemons-store .my-box.clickable.game-pokemon-portrait');
    storeBoxes.forEach(highlightSynergies);
}

let observedSynergyList = null;

function observeSynergyList() {
    var synergyContainer = document.querySelectorAll(`.synergies-container.my-container > div[style*=--border-thin]`);
    if (synergyContainer && (synergiesToHighlight.length === 0 || synergiesToHighlight.length !== synergyContainer.length)) {
        parseSynergies(synergyContainer);
    }
}

var synergyObserver = new MutationObserver((mutations) => { });

let pokemonMetaPromise = null;
let pokemonMetaLoaded = false;

async function getPokemonMeta(ignore) {
    var currentMeta = [];
    if (pokemonMeta.length === 0 || ignore) {
        var metaObj = await fetch('https://pokemon-auto-chess.com/meta/pokemons').then(response => response.json());
        if (metaObj) {
            var currentMetaThreshold = thresholdMapping[settings.metaThreshold];
            for (key in metaObj[currentMetaThreshold].pokemons) {
                var currentName = key;
                currentMeta[currentName] = metaObj[currentMetaThreshold].pokemons[key].items;
            }
        }
        pokemonMeta = currentMeta;
        pokemonMetaLoaded = true;
    } else {
        pokemonMetaLoaded = true;
    }
}

function getLastEvolution(pokemonName, showMultiple) {
    if (!showMultiple) showMultiple = 1;
    // Find the family root for the given Pokémon
    const familyRoot = window.PkmFamily[pokemonName];
    if (!familyRoot) return [pokemonName];

    // Get all Pokémon in the same family
    const familyMembers = Object.entries(window.PkmFamily)
        .filter(([name, root]) => root === familyRoot)
        .map(([name]) => name);

    // Return the last one (sorted by order of appearance in PkmFamily)
    var namesArray = [];
    for (let i = 0; i < showMultiple; i++) {
        namesArray.push(familyMembers[(familyMembers.length - 1) - i] || pokemonName);
    }
    return namesArray;
}

function extractNumbersFromUrl(url) {
    // Match up to three groups of digits in the URL path after 'portrait/'
    const match = url.match(/portrait\/(\d+)(?:\/(\d+))?(?:\/(\d+))?/);
    if (!match) return null;
    // If the second group is "0000" or missing, return only the first group
    if (!match[2] || match[2] === "0000") {
        return match[1];
    }
    // Otherwise, return first and second group joined with a dash
    return `${match[1]}-${match[2]}`;
}

function getPokemonNameByIndex(index) {
    return window.PkmByIndex[index] || null;
}

var multiFormPokemon = {
    "ROCKRUFF": 3,         // Midday, Midnight, Dusk
    "KUBFU": 2,          // Single Strike, Rapid Strike
    "CALYREX": 2,          // Ice Rider, Shadow Rider
    "RALTS": 2,         // Gardevoir, Gallade
    "KIRLIA": 2,       // Gardevoir, Gallade
    "CLAMPERL": 2,         // Huntail, Gorebyss
    "POLIWHIRL": 2,         // Poliwrath, Politoed
    "POLIWAG": 2,           // Poliwrath, Politoed
    "TYROGUE": 3,         // Hitmonlee, Hitmonchan, Hitmontop
    "WURMPLE": 3,         // Silcoon, Cascoon, Beautifly, Dustox
    "SILCOON": 2,         // Beautifly, Dustox
    "CASCOON": 2,         // Beautifly, Dustox
    "APPLIN": 3,           // Appletun, Flapple,
    "PICHU": 2,           // Raichu, Alolan Raichu
    "PIKACHU": 2,         // Raichu, Alolan Raichu
    "SCYTHER": 2,         // Scizor, Scyther
    "COSMOG": 2,         // Cosmoem, Solgaleo, Lunala
    "COSMOEM": 2,         // Solgaleo, Lunala
    "CUBONE": 2,         // Marowak, Alolan Marowak
    "SLIGOO": 2,         // Goodra, Hisuian Goodra
    "GOOMY": 2,         // Goodra, Hisuian Goodra
    "MORPEKO_HANGRY": 2,         // Morpeko, Hangry Morpeko
    "NECROZMA": 2,         // Dusk Mane, Dawn Wings, Ultra
    "MELOETTA": 2,         // Aria Forme, Pirouette Forme
    "PIROUETTE_MELOETTA": 2,         // Aria
    "LUGIA": 2,
    "MIMIKYU_BUSTED": 2,         // Mimikyu, Busted Mimikyu
    "DARUMAKA": 2,         // Darmanitan, Zen Mode Darmanitan
    "DARMANITAN_ZEN": 2,
    "CHARCADET": 2,
    "EXEGGCUTE": 2,         // Exeggutor, Alolan Exeggutor
    "CYNDAQUIL": 2,
    "QUILAVA": 2,         // Typhlosion, Hisuian Typhlosion
}

var excludeLastEvolution = [
    "RAICHU",          // Alolan Raichu
    "GUARDEVOIR",
    "DARMANITAN",
    "GOODRA",
    "MORPEKO",
    "GALLADE",
    "POLIWRATH",
    "POLITOED",
    "HITMONLEE",
    "HITMONCHAN",
    "HITMONTOP",
    "ZYGARDE_10",
    "ZYGARDE_50",
    "URSHIFU_RAPID",
    "URSHIFU_SINGLE",
    "EEVEE",
    "VAPOREON",
    "JOLTEON",
    "FLAREON",
    "ESPEON",
    "UMBREON",
    "LEAFEON",
    "GLACEON",
    "SYLVEON",
    "MILCERY",
    "ALCREMIE_VANILLA",
    "ALCREMIE_RUBY",
    "ALCREMIE_MATCHA",
    "ALCREMIE_MINT",
    "ALCREMIE_LEMON",
    "ALCREMIE_SALTED",
    "ALCREMIE_RUBY_SWIRL",
    "ALCREMIE_CARAMEL_SWIRL",
    "ALCREMIE_RAINBOW_SWIRL",
    "CASTFORM_HAIL",
    "CASTFORM_RAIN",
    "CASTFORM_SUN",
    "CASTFORM",
    "MIMIKYU",
    "DEOXYS_ATTACK",
    "DEOXYS_DEFENSE",
    "DEOXYS_SPEED",
    "DEOXYS",
    "ORIGIN_GIRATINA",
    "GIRATINA",
    "ARMAROUGE",
    "CERULEDGE",
    "LYCANROC_DUSK", // Dusk Forme
    "LYCANROC_NIGHT", // Midnight Forme
    "LYCANROC_DAY", // Midday Forme
    "EXEGGUTOR",
    "ALOLAN_EXEGGUTOR", // Alolan Exeggutor
    "TYPHLOSION", // Hisuian Typhlosion
    "HISUIAN_TYPHLOSION",
];

var currentTeamBuilderPokemon = null;
var metaFound = false;

async function observePokemonDetails(element) {
    if (!element) {
        return;
    }
    var isTeambuilder = element.closest('#team-builder');
    var pokemonContainer = element.querySelector('.game-pokemon-detail.in-shop');
    var itemContainer = element.querySelector('.meta-container-pacc');
    if (!pokemonContainer) {
        pokemonContainer = element;
    }
    if (itemContainer && !isTeambuilder) {
        return; // Already processed this element
    }
    if (isTeambuilder && settings.highlightEnabled) {
        highlightSynergies(pokemonContainer);
    }

    var imageElement = pokemonContainer.querySelector('.game-pokemon-detail-portrait');

    var pokemonNameByID;
    var pokemonNames;
    if (imageElement && pokemonContainer) {
        var url = imageElement.src;
        var pokemonId = extractNumbersFromUrl(url);
        pokemonNameByID = getPokemonNameByIndex(pokemonId);

        if (itemContainer) {
            if (itemContainer.dataset.pokemonName === pokemonNameByID) {
                return; // Already processed this Pokémon
            } else {
                itemContainer.innerHTML = ''; // Clear previous items
            }
        }

        var amountToShow = multiFormPokemon[pokemonNameByID] ? multiFormPokemon[pokemonNameByID] : 1;
        var lastEvolutions = getLastEvolution(pokemonNameByID, amountToShow);
        pokemonNames = [pokemonNameByID];
        if (!excludeLastEvolution.includes(pokemonNameByID)) {
            pokemonNames = lastEvolutions;
        }

        function createMetaElement(itemContainer, pokemonContainer, pokemonName) {
            metaFound = false;

            var metaItems = pokemonMeta[pokemonName] || [];
            var currentWrapper = document.createElement('div');
            if (!itemContainer) {
                itemContainer = document.createElement('div');
                itemContainer.className = 'meta-container-pacc';
                itemContainer.dataset.pokemonName = pokemonNameByID;
            }
            if (metaItems && metaItems.length !== 0) {
                metaFound = true;
                var prettyName = pokemonName
                    .toLowerCase()
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());
                var titleElement = document.createElement('div');
                titleElement.innerText = 'Meta Items - ' + prettyName;
                currentWrapper.appendChild(titleElement);
                metaItems.forEach(function (item) {
                    var itemElement = document.createElement('img');
                    itemElement.className = 'item';
                    itemElement.dataset.tooltipId = 'item-detail'
                    itemElement.src = `assets/item/${item}.png`;
                    currentWrapper.appendChild(itemElement);
                });
                itemContainer.appendChild(currentWrapper);
                pokemonContainer.appendChild(itemContainer);
            }
        }

        pokemonNames.forEach(function (pokemonName) {
            createMetaElement(itemContainer, pokemonContainer, pokemonName);
        });
        if (!metaFound) {
            createMetaElement(itemContainer, pokemonContainer, pokemonNameByID);
        }
        if (itemContainer) {
            itemContainer.dataset.pokemonName = pokemonNameByID;
        }
    }
}

var newPokemon = [];

chrome.storage.sync.get(['newPokemon'], function (data) {
    if (Array.isArray(data.newPokemon)) {
        newPokemon = data.newPokemon;
    }
});

function updateNewPokemonStorage() {
    // Check if chrome and chrome.storage.sync are available
    if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.sync &&
        typeof chrome.storage.sync.set === "function"
    ) {
        try {
            chrome.storage.sync.set({ newPokemon });
        } catch (e) {
            // do nothing
        }
    } else {
        // Not in extension context, do nothing
    }
}

function observeBoosters() {
    var boosterCards = document.querySelectorAll('.booster-card.flipped');
    if (boosterCards && boosterCards.length === 10) {
        boosterCards.forEach(function (boosterCard) {
            if (!boosterCard.classList.contains('pacc_updated') && boosterCard.querySelector('.new')) {
                imageElement = boosterCard.querySelector('.front img');
                if (imageElement) {
                    var pokemonId = extractNumbersFromUrl(imageElement.src);
                    if (pokemonId && !newPokemon.includes(pokemonId)) {
                        newPokemon.push(pokemonId.replace('-', '/'));
                        updateNewPokemonStorage(); // <-- update storage
                    }
                }
                boosterCard.classList.add('pacc_updated');
            }
        });
    } else {
        return; // Already processed this element
    }
}

function observeCollectionList() {
    var collectionList = document.querySelector('.pokemon-collection-list');
    if (collectionList && !collectionList.classList.contains('pacc_updated')) {
        newPokemon.forEach(function (pokemonId) {
            var collectionPokemonElement = collectionList.querySelector(`img[src*="${pokemonId}"]`);
            if (collectionPokemonElement) {
                collectionPokemonElement.parentElement.classList.add('image-shimmer-wrapper');
            }
        });
        collectionList.classList.add('pacc_updated');
    }
    var clickedPokemon = document.querySelector('.pokemon-emotions-modal .pokemon-portrait.unlocked')
    if (clickedPokemon && !clickedPokemon.classList.contains('pacc_updated')) {
        var pokemonId = extractNumbersFromUrl(clickedPokemon.src).replace('-', '/');
        newPokemon = newPokemon.filter(key => key !== pokemonId);
        updateNewPokemonStorage(); // <-- update storage

        var collectionPokemonElement = collectionList.querySelector(`img[src*="${pokemonId}"]`);
        if (collectionPokemonElement) {
            collectionPokemonElement.parentElement.classList.remove('image-shimmer-wrapper');
        }
        clickedPokemon.classList.add('pacc_updated');
    }
}

function observeBrokenImages() {
    var brokenImages = document.querySelectorAll('img[src="/assets/ui/missing-portrait.png"]');
    if (brokenImages && brokenImages.length > 0) {
        brokenImages.forEach(function (brokenImage) {
            var avatarData = brokenImage.getAttribute('avatar');
            if (avatarData) {
                var urlData = avatarData.slice(0, avatarData.lastIndexOf('/'));
                brokenImage.src = "https://raw.githubusercontent.com/keldaanCommunity/SpriteCollab/master/portrait/" + urlData + '/Normal.png'
            }
        });
    }
}

function pollForObservers() {
    if (settings.highlightEnabled) {
        observeSynergyList();
        observeStoreList();
        observePropositionList();
    }
    if (window.location.href.includes('/lobby')) {
        observeBrokenImages();
        observeBoosters();
        observeCollectionList();
    }
}

// Start fetching meta data once
if (!pokemonMetaPromise) {
    pokemonMetaPromise = getPokemonMeta(false);
    const evoUrl = chrome.runtime.getURL('scripts/evolutionlines.json');
    fetch(evoUrl)
        .then(res => res.json())
        .then(data => { evolutionLines = data; });
}

setInterval(pollForObservers, 500);
setInterval(function () {
    if (pokemonMetaLoaded && settings.metaEnabled) {
        observePokemonDetails(document.querySelector('#team-builder .game-pokemon-detail.in-shop'));
        observePokemonDetails(document.querySelector('.game-pokemon-detail.in-battle'));
        observePokemonDetails(document.querySelector('.game-pokemon-detail.in-board'));
    }
}, 250);