/**
 * IDEAS
 * Synergy highlight
 * Easier Meta Item Display?
 * Complete Item list
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
            settings.highlightEnable = changes.highlight.newValue;
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

function parseSynergies() {
    var currentSynergies = document.querySelectorAll('.synergies-container.my-container > div');
    var highlights = [];
    currentSynergies.forEach(function (synergy) {
        var type;
        var currentValue;

        var typeElement = synergy.querySelector('.synergy-icon');
        if (typeElement) {
            type = typeElement.title;
        }

        var valueElement = synergy.querySelector('span');
        if (valueElement) {
            currentValue = parseInt(valueElement.innerText);
        }

        if (currentValue >= 2) {
            highlights.push(type);
        }
    });
    synergiesToHighlight = highlights;
}

function highlightSynergies(element) {
    var cardTypeElement = element.querySelectorAll('.synergy-icon');
    cardTypeElement.forEach(function (icon) {
        if (icon && synergiesToHighlight.includes(icon.title)) {
            if (icon && icon.classList) {
                icon.classList.add('synergy-icon_flashing');
                console.log('synergy icon flashing for', icon.title);
            }
        };
    });
}

var synergyObserver = new MutationObserver((mutations) => {
    for (var mutation of mutations) {
        // If a new article was added.
        for (var node of mutation.addedNodes) {
            if (node instanceof Element) {
                // Render the reading time for this particular article.
                highlightSynergies(node);
            }
        }
    }
});

let observedPropositionList = null;

function observePropositionList() {
    var propositionListNode = document.querySelector('.game-pokemons-proposition-list');
    if (propositionListNode && propositionListNode !== observedPropositionList) {
        synergyObserver.observe(propositionListNode, { childList: true });
        highlightSynergies(propositionListNode);
        observedPropositionList = propositionListNode;
        console.log('Observer attached to .game-pokemons-proposition-list');
    } else if (!propositionListNode) {
        observedPropositionList = null; // Reset if element is gone
    }
}

let observedStoreList = [];

function observeStoreList() {
    var propositionListNode = document.querySelectorAll('.game-pokemons-store .my-box.clickable.game-pokemon-portrait');
    for (var i = 0; i < propositionListNode.length; i++) {
        if (propositionListNode[i] && propositionListNode[i] !== observedStoreList[i]) {
            synergyObserver.observe(propositionListNode[i], { childList: true });
            highlightSynergies(propositionListNode[i]);
            observedStoreList[i] = propositionListNode[i];
            console.log('Observer attached to .game-pokemons-store');
        } else if (!propositionListNode) {
            observedStoreList[i] = null; // Reset if element is gone
        }
    }
}

let observedSynergyList = null;

function observeSynergyList() {
    var propositionListNode = document.querySelector('.synergies-container.my-container');
    if (propositionListNode && propositionListNode !== observedSynergyList) {
        synergyObserver.observe(propositionListNode, { childList: true });
        parseSynergies(propositionListNode);
        observedSynergyList = propositionListNode;
        console.log('Observer attached to .synergies-container.my-container');
    } else if (!propositionListNode) {
        observedSynergyList = null; // Reset if element is gone
    }
}

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
            if (!metaFound) {
                createMetaElement(itemContainer, pokemonContainer, pokemonNameByID);
            }
        });
        if (itemContainer) {
            itemContainer.dataset.pokemonName = pokemonNameByID;
        }
    }
}

function pollForObservers() {
    if (settings.highlightEnabled) {
        observeSynergyList();
        observeStoreList();
        observePropositionList();
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

console.log('loaded pacc');
