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
var uniqueNames = {
    'URSHIFU_RAPID': 'URSHIFU_RAPID_STRIKE',
    'URSHIFU_SINGLE': 'URSHIFU_SINGLE_STRIKE',
    'MELOETTA': 'MELOETTA_ARIA',
    'PIROUETTE_MELOETTA': 'MELOETTA_PIROUETTE',
    'ORIGIN_GIRATINA': 'GIRATINA_ORIGIN',
    'ZYGARDE_10': 'ZYGARDE_10_FORME',
    'ZYGARDE_50': 'ZYGARDE_50_FORME',
    'ZYGARDE_100': 'ZYGARDE_100_FORME',
    'AEGISLASH': 'AEGISLASH_SHIELD',
    'CASTFORM_HAIL': 'CASTFORM_SNOWY',
    'CASTFORM_RAIN': 'CASTFORM_RAINY',
    'CASTFORM_SUN': 'CASTFORM_SUNNY',
    'URSALUNA_BLOODMOON': 'BLOOD_MOON_URSALUNA',
    'FARFETCH_D': 'FARFETCHD',
    'GALARIAN_FARFETCH_D': 'GALARIAN_FARFETCHD',
    'DARMANITAN_ZEN': 'DARMANITAN',
    'GALAR_CORSOLA': 'GALARARIAN_CORSOLA',
    'SHADOW_LUGIA': 'XD001',
    'MINIOR_KERNEL_BLUE': 'MINIOR',
    'MINIOR_KERNEL_RED': 'MINIOR',
    'MINIOR_KERNEL_ORANGE': 'MINIOR',
    'MINIOR_KERNEL_GREEN': 'MINIOR',
    'MIMIKYU_BUSTED': 'MIMIKYU',
    'HISUI_ARCANINE': 'HISUIAN_ARCANINE',
    'HISUI_ELECTRODE': 'HISUIAN_ELECTRODE',
    'HISUI_GOODRA': 'HISUIAN_GOODRA',
    'HISUI_GROWLITHE': 'HISUIAN_GROWLITHE',
    'HISUI_SLIGGOO': 'HISUIAN_SLIGGOO',
    'HISUI_SNEASEL': 'HISUIAN_SNEASEL',
    'HISUI_VOLTORB': 'HISUIAN_VOLTORB',
    'HISUI_ZOROARK': 'HISUIAN_ZOROARK',
    'HISUI_ZORUA': 'HISUIAN_ZORUA',
    'PALDEA_WOOPER': 'PALDEAN_WOOPER',
    'PORYGON_2': 'PORYGON2',
    'MORPEKO_HANGRY': 'MORPEKO',
    'MAUSHOLD_THREE': 'MAUSHOLD_3',
    'MAUSHOLD_FOUR': 'MAUSHOLD_4',
    'NIDORANF': 'NIDORAN_F',
    'NIDORANM': 'NIDORAN_M',
}

async function getPokemonMeta(ignore) {
    var currentMeta = [];
    if (pokemonMeta.length === 0 || ignore) {
        var metaObj = await fetch('https://pokemon-auto-chess.com/meta/pokemons').then(response => response.json());
        if (metaObj) {
            var currentMetaThreshold = thresholdMapping[settings.metaThreshold];
            for (key in metaObj[currentMetaThreshold].pokemons) {
                var currentName = key;
                if (uniqueNames[key]) {
                    currentName = uniqueNames[key];
                }
                currentMeta[currentName] = metaObj[currentMetaThreshold].pokemons[key].items;
            }
        }
        pokemonMeta = currentMeta;
        pokemonMetaLoaded = true;
    } else {
        pokemonMetaLoaded = true;
    }
}

function getBasicPokemonName(regionalName) {
    // List of known regional prefixes
    const regionalPrefixes = [
        'ALOLAN_', 'GALARIAN_', 'HISUIAN_', 'PALDEAN_', 'GALAR_', 'HISUI_', 'PALDEA_'
    ];
    var usedPrefix;
    for (const prefix of regionalPrefixes) {
        if (regionalName.startsWith(prefix)) {
            usedPrefix = prefix;
            return {
                name: regionalName.replace(prefix, ''),
                prefix: usedPrefix
            };
        }
    }
    return {
        name: regionalName,
    };
}


function getHighestEvolution(pokemonName, evolutionLines) {
    if (!pokemonName || !evolutionLines) return null;
    return evolutionLines[pokemonName] || null;
}

var currentTeamBuilderPokemon = null;

async function observePokemonDetails(element) {
    if (!element) {
        return;
    }
    var isTeambuilder = element.closest('#team-builder');
    var nameElement = element.querySelector('.game-pokemon-detail-entry-name');
    var pokemonContainer = element.querySelector('.game-pokemon-detail.in-shop');
    if (!pokemonContainer) {
        pokemonContainer = element;
    }
    if (element.querySelector('.meta-container-pacc') && !isTeambuilder) {
        return; // Already processed this element
    }
    if (nameElement && pokemonContainer) {
        var pokemonName = nameElement.innerText
            .replace(/♂/g, 'M')                  // Replace male symbol with 'M'
            .replace(/♀/g, 'F')                  // Replace female symbol with 'F'
            .toUpperCase()
            .replace(/-/g, '_')                  // Replace dashes with underscores
            .replace(/[^A-Z0-9_\s]/g, '')        // Remove special characters except underscore
            .replace(/\s+/g, '_');               // Replace whitespace with underscore

        var basicPokemonName = getBasicPokemonName(pokemonName);
        var highestPokemon = getHighestEvolution(basicPokemonName.name, evolutionLines);
        if (highestPokemon) {
            pokemonName = basicPokemonName.prefix ? basicPokemonName.prefix + highestPokemon : highestPokemon;
        } else {
            if (currentTeamBuilderPokemon !== pokemonName || !isTeambuilder) {
                console.warn('No evolution found for:', pokemonName);
            }
        }

        if (currentTeamBuilderPokemon === pokemonName && isTeambuilder) {
            return;
        }

        if (isTeambuilder) {
            currentTeamBuilderPokemon = pokemonName;
        }

        var metaItems = pokemonMeta[pokemonName] || [];
        if (metaItems && metaItems.length !== 0) {
            var itemContainer = document.querySelector('.meta-container-pacc');
            var titleElement = document.createElement('div');
            titleElement.innerText = 'Meta Items';
            if (!itemContainer) {
                itemContainer = document.createElement('div');
                itemContainer.className = 'meta-container-pacc';
            } else {
                itemContainer.innerHTML = ''; // Clear previous items
            };
            itemContainer.appendChild(titleElement);
            metaItems.forEach(function (item) {
                var itemElement = document.createElement('img');
                itemElement.className = 'item';
                itemElement.dataset.tooltipId = 'item-detail'
                itemElement.src = `assets/item/${item}.png`;
                itemContainer.appendChild(itemElement);
            });
            pokemonContainer.appendChild(itemContainer);
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
