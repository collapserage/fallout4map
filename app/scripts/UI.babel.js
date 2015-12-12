import mapData from './map-data.babel';
import { map } from './map.babel';
import { createNote } from './marker.babel';
import search from './search.babel';

function launchIntoFullscreen(element) {
    if(element.requestFullscreen) {
        element.requestFullscreen();
    } else if(element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if(element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if(element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function toggleCategory(el) {
    var id = el.getAttribute('data-id');

    map.getPane(id).classList.toggle('hidden');
    el.classList.toggle('disabled');

    UI.categories[id].isShown = !UI.categories[id].isShown; // invert value
    UI.save();
}

function initCategories() {
    for (let category of mapData.allCategories) {
        var prefix = UI.categories[category.id].hiddenMarkers.length ? UI.categories[category.id].hiddenMarkers.length + '/' : '',
            amount = prefix + mapData.categories[category.id].locations.length,
            classes = (UI.categories[category.id].isShown) ? 'category' : 'category disabled';

        document.querySelector(`[data-group=${category.group}]`)
            .insertAdjacentHTML('beforeend', `<div class="${classes}" data-id="${category.id}"><span class="category-title">${category.title}</span><span class="category-amount">${amount}</span></div>`);

        fullNodes = document.querySelector('#sidebar-content').innerHTML;
    }
}

function toggleHelp() {
    document.getElementById('sidebar').classList.toggle('help-shown');
    document.getElementById('sidebar-back').classList.toggle('shown');
}

function toggleSidebar(notSave) {
    for (let el of document.querySelectorAll('#sidebar-pane, #sidebar-open, #sidebar, #map'))
        el.classList.toggle('pulled')

    document.querySelector('#sidebar-open').classList.toggle('opened');

    if (document.querySelector('#sidebar-back').classList.contains('shown'))
        document.querySelector('#sidebar-back').classList.remove('shown');
    else if (document.querySelector('#sidebar').classList.contains('help-shown'))
        document.querySelector('#sidebar-back').classList.add('shown');

    if (notSave !== false) {
        UI.sidebarPulled = !UI.sidebarPulled; // invert value
        UI.save();
    }
}

export var fullNodes;

export var UI = {
    sidebarPulled: 0,
    categories: {},
    notes: {},
    notesLatest: 1000,
    init: function() {
        let self = this;
        try {
            let cache = JSON.parse(localStorage.getItem('UI'));
            if (!cache)
                throw new Error();
            Object.assign(this, cache);
            if (this.sidebarPulled)
                toggleSidebar(false);

            for (let id in UI.notes)
                createNote(UI.notes[id], false);
        } catch(e) {
            for (let category of mapData.allCategories) {
                self.categories[category.id] = {
                    isShown: (category.group == 'location') ? 1 : 0,
                    hiddenMarkers: []
                }
            }
        }
        initCategories();
    },

    save: function() {
        localStorage.setItem('UI', JSON.stringify(this));
    },

    toggleSidebar: () => {toggleSidebar()},

    initListeners: function() {
        document.getElementById('sidebar-pane').addEventListener('mouseenter', toggleSidebar);
        document.getElementById('sidebar-open').addEventListener('click', toggleSidebar);

        document.getElementById('sidebar-back').addEventListener('click', toggleHelp);
        document.getElementById('button-help').addEventListener('click', toggleHelp);

        document.querySelector('#sidebar-search button').addEventListener('click', search.clear);
        document.querySelector('#sidebar-search input').addEventListener('keyup', search.input);
        document.querySelector('#sidebar-search input').addEventListener('focus', search.focus);
        document.querySelector('#sidebar-search input').addEventListener('blur', search.blur);

        for (var el of document.querySelectorAll('header')) {
            el.addEventListener('click', function() {
                for (var cat of this.parentNode.querySelectorAll('div'))
                    toggleCategory(cat)
            })
        }

        for (var cat of document.querySelectorAll('.category')) {
            cat.addEventListener('click', function() {
                toggleCategory(this)
            })
        }

        window.onkeyup = function(e) {
            let key = e.keyCode || e.which;
            if (key == 70 && e.target.tagName.toLowerCase() != 'input') // f key
                launchIntoFullscreen(document.documentElement);
        }
    }
};
