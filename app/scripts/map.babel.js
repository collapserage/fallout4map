import { UI } from './UI.babel';
import { createNote } from './marker.babel';

const w = 4158,
       h = 4155,
       mapUrl = 'http://falloutinside.me/map/images/map-color.jpg';

function zoomAction() {
    switch (map._zoom) {
        case 1:
            document.body.classList.add('tiny');
            document.body.classList.remove('little');
            break;
        case 2:
            document.body.classList.add('little');
            document.body.classList.remove('tiny', 'small');
            break;
        case 3:
            document.body.classList.add('small');
            document.body.classList.remove('little');
            break;
        default:
            document.body.classList.remove('small');
    }
}

function clickAction() {
    if (UI.sidebarPulled)
        UI.toggleSidebar();
}

export var map;

export function initMap() {
    map = L.map('map', {
        zoom: 3,
        minZoom: window.matchMedia('(max-width: 600px)').matches ? 1 : 2,
        maxZoom: 5,
        center: [w/2, h/2],
        maxBoundsViscosity: 1 // restrict dragging out of view
    });

    var southWest = map.unproject([0, h], 4),
        northEast = map.unproject([w, 0], 4),
        bounds = new L.LatLngBounds(southWest, northEast),
        image = L.imageOverlay(mapUrl, bounds);

    image.addTo(map);
    map.zoomControl.setPosition('bottomright');
    map.setMaxBounds(bounds);

    zoomAction();
    map.on('zoomend', () => zoomAction())
       .on('click', () => clickAction())
       .on('contextmenu', event => createNote({
           latlng: new L.LatLng(event.latlng.lat, event.latlng.lng),
           id: UI.notesLatest,
           title: 'Заметка',
           description: 'Описание'
       }, true));

    window.addEventListener('load', () => { // image.on('load', () => {
        document.querySelector('.preload').remove();
        document.querySelector('.loader').classList.add('hide');
        setTimeout(() => document.querySelector('.loader').remove(), 300);
    })
}
