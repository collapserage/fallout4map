import { initMap } from './map.babel';
import { initMarkers } from './marker.babel';
import { UI } from './UI.babel';

NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator]; // for chrome & co.

initMap();
UI.init();
initMarkers();
UI.initListeners();
