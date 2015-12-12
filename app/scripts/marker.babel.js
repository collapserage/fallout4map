import mapData from './map-data.babel';
import { map } from './map.babel';
import { UI } from './UI.babel';

var mouseDelta,
    popupOptions = {
        offset: L.point(0, -20),
        autoPanPadding: window.matchMedia('(max-width: 600px)').matches ? L.point(0, 0) : L.point(30, 30),
        minWidth: 400
    };

L.CustomMarker = L.Marker.extend({ // leaflet has extend, amazing
    options: {
        _title: 'title',
        _description: 'description',
        _id: 1,
        _categoryId: 1
    },
    initialize: function(latlng, options) {
        L.setOptions(this, options);
        this._latlng = L.latLng(latlng);
    },
    getTitle: function() {
        return this.options._title
    },
    getDescription: function() {
        return this.options._description
    },
    getId: function() {
        return this.options._id
    },
    getCategoryId: function() {
        return this.options._categoryId
    }
});

function markerAdd(marker) {
    if (UI.categories[marker.getCategoryId()].hiddenMarkers.includes(marker.getId()))
        marker.getElement().classList.toggle('found')
}

function markerClick(marker) {
    if (!marker.getElement().classList.contains('found')) {
        let desc = '';

        if (typeof marker.getDescription() === 'object')
            for (let key in marker.getDescription())
                desc += `<p><i>${key}: </i>${marker.getDescription()[key]}</p>`;
        else
            desc = marker.getDescription();

        let content = '<h2><a href="#location:' + marker.getId() + '">' + marker.getTitle()  + '</a></h2><div class="description">' + desc + '</div>';

        marker.unbindPopup();
        marker.bindPopup(content, popupOptions);
        marker.openPopup();
        marker.getElement().classList.remove('hovered');
    } else
        marker.closePopup();
}

function markerContextmenu(marker) {
    if (!mapData.trackableCategories.includes(marker.getCategoryId()))
        return;

    var hiddenMarkers = UI.categories[marker.getCategoryId()].hiddenMarkers,
        foundOld = hiddenMarkers.length;

    if (hiddenMarkers.includes(marker.getId()))
        hiddenMarkers.splice(hiddenMarkers.indexOf(marker.getId()), 1); // remove marker from hidden array
    else
        hiddenMarkers.push(marker.getId());

    marker.getElement().classList.toggle('found');
    marker.closePopup();
    UI.save();

    let title = marker.getTitle(),
        found = hiddenMarkers.length,
        amount = mapData.categories[marker.getCategoryId()].locations.length,
        w1 = foundOld / amount * 100 + '%',
        w2 = found / amount * 100 + '%';

    document.querySelector(`[data-id="${marker.getCategoryId()}"] .category-amount`).textContent = `${found}/${amount}`;

    if (!document.querySelector('.notice'))
        document.body.insertAdjacentHTML('beforeend', `<div class="notice"><strong>${title}</strong><span class="float-right">всего ${found}/${amount}</span><div class="progress" style="width: ${w1}"></div></div>`);
    let el = document.querySelector('.notice');
    setTimeout(() => el.querySelector('.progress').style.width = w2, 1000);
    setTimeout(() => el.classList.add('hide'), 4000);
    setTimeout(() => el.remove(), 4500);
}

function markerMouseover(marker) {
    marker.getElement().setAttribute('data-name', marker.getTitle());
    marker.getElement().classList.add('hovered');
    mouseDelta = Date.now();
}

function markerMouseout(marker) {
    var self = marker.getElement(); // getElement() is undocumented, maybe use _icon
    self.classList.remove('hovered');

    if (Date.now() - mouseDelta > 300) { // fix unneeded tooltips
        self.classList.add('finishAnimation');

        window.setTimeout(function () {
            self.classList.remove('finishAnimation');
            self.classList.remove('hovered');
            self.removeAttribute('data-name');
        }, 300); // maybe listen to onanimationend
    }
}

function noteContextmenu(marker, isEmpty) {
    marker.bindPopup(
        `<h2>Редактирование заметки</h2><div class="group"><input class="inputMaterial input-title" value="${isEmpty ? '' : marker.options._title}" required><label>Название</label></div><div class="group"><input class="inputMaterial input-description" value="${isEmpty ? '' : marker.options._description}" required><label>Описание</label></div>`,
        popupOptions
    );
    marker.openPopup();
}

function notePopupclose(marker) {
    try {
        if (document.querySelector('.input-title').value.length)
            marker.options._title = document.querySelector('.input-title').value; // maybe some setters instead, eh?

        if (document.querySelector('.input-description').value.length)
            marker.options._description = document.querySelector('.input-description').value;

        UI.notes[marker.getId()] = {
            id: marker.getId(),
            latlng: marker.getLatLng(),
            title: marker.getTitle(),
            description: marker.getDescription()
        };

        UI.save();
    } catch(e) {}
}

function noteDragstart(marker) {
    document.body.insertAdjacentHTML('afterbegin', `<div class="trash-can drop"><div class="icon drop"><div class="lid drop"></div><div class="lidcap drop"></div><div class="bin drop"></div></div></div>`);
}

function noteDragend(marker, event) {
    var latlng = marker.getLatLng(),
        coords = map.latLngToContainerPoint(latlng),
        target = document.elementFromPoint(coords.x, coords.y);

    if (target.classList.contains('drop')) {
        map.removeLayer(marker);
        delete UI.notes[marker.getId()];
    } else {
        UI.notes[marker.getId()].latlng = event.target.getLatLng();
    }

    let el = document.querySelector('.trash-can');
    el.classList.add('hide');
    setTimeout(() => el.remove(), 500);

    UI.save();
}

export function createNote(data, editNow) {
    let marker = createMarker({
        latitude: data.latlng.lat,
        longitude: data.latlng.lng,
        icon: 'note',
        id: data.id,
        title: data.title,
        description: data.description,
        draggable: true
    }, {id: 'notes'}, 'markerPane');

    marker.on('contextmenu', () => noteContextmenu(marker))
          .on('popupclose', () => notePopupclose(marker))
          .on('dragstart', () => noteDragstart(marker))
          .on('dragend', event => noteDragend(marker, event));

    map.addLayer(marker);

    if (editNow) {
        UI.notesLatest++;
        noteContextmenu(marker, true);
    }
}

export function createMarker(location, category, pane) {
    var marker = new L.CustomMarker([location.latitude, location.longitude], {
        icon: L.divIcon({
            html: `<div class="map-icon svg-images-markers-${location.icon || category.icon}" data-id="${location.id}"></div>`,
            className: 'map-marker',
            iconSize: null,
            iconAnchor: null
        }),
        pane: pane,
        draggable: location.draggable ? true : false, // only for notes
        _title: location.title,
        _description: location.description,
        _id: location.id,
        _categoryId: category.id
    });

    marker.on('click', () => markerClick(marker))
          .on('contextmenu', () => markerContextmenu(marker))
          .on('mouseover', () => markerMouseover(marker))
          .on('mouseout', () => markerMouseout(marker))
          .on('add', () => markerAdd(marker));

    return marker;
}

export function initMarkers() {
    for (let key in mapData.categories) {
        let category = mapData.categories[key],
            pane = map.createPane(category.id), // fresh from 1.0 release, yay
            layerGroup = L.layerGroup([]);

        category.locations.forEach(loc => layerGroup.addLayer(createMarker(loc, category, pane))); // oh no :(
        map.addLayer(layerGroup);

        pane.classList.add('custom-pane', category.group + '-pane');
        if (!UI.categories[category.id].isShown)
            pane.classList.add('hidden');
    }
}
