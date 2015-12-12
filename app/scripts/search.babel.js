import mapData from './map-data.babel';
import { UI, fullNodes } from './UI.babel';

var timeout;

var search = {
    listener: function() {
        let query = document.querySelector('#sidebar-search input').value.toLowerCase(),
            html = '';

        search.blur();

        for (var key in mapData.categories) {
            mapData.categories[key].locations.forEach(location => {
                if (location.title.toLowerCase().includes(query)) {
                    document.querySelector(`[data-id="${location.id}"]`).parentNode.classList.add('searched');
                    html += '<div class="search-result"><a href="#location:' + location.id + '">' + location.title  + '</a></div>';
                }
            });
        }

        if (html.length == 0)
            html = '<div class="search-result">К сожалению, локация не найдена</div>';

        document.querySelector('#sidebar-content').innerHTML = html;
    },

    clearMarkers: function() {
        for (var el of document.querySelectorAll(`.searched`))
            el.classList.remove('searched');
    },

    restoreUI: function() {
        document.querySelector('#sidebar-content').innerHTML = fullNodes;
        UI.initListeners();
    },

    clear: function() {
        document.querySelector('#sidebar').classList.add('search-results');
        document.querySelector('#sidebar').classList.remove('clearable');
        document.querySelector('#sidebar-search input').value = '';
        search.clearMarkers();

        setTimeout(() => {
            search.restoreUI();
            search.blur();
        }, 300);
    },

    blur: function() {
        document.querySelector('#sidebar').classList.remove('search-results');
    },

    focus: function() {
        document.querySelector('#sidebar').classList.add('search-results');
    },

    input: function() {
        clearTimeout(timeout); // do not restore UI if typing fast or smth else
        search.clearMarkers();
        document.querySelector('#sidebar').classList.add('clearable');

        if (document.querySelector('#sidebar-search input').value.length > 2) {
            search.listener();
        } else {
            if (!document.querySelector('#sidebar-search input').value.length)
                document.querySelector('#sidebar').classList.remove('clearable');
            timeout = setTimeout(() => search.restoreUI(), 300);
            search.focus();
        }
    }
};

export default search;
