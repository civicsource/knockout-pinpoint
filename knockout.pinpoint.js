(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(["jquery", "knockout", "async!google-maps"], factory);
	} else {
		// Browser globals
		factory(jQuery, ko, 'google.maps');
	}
}(this, function ($, ko) {

	ko.bindingHandlers.pinpoint = {
		init: function (el, valueAccessor, allBindings) {
			el.coordinates = valueAccessor();
			//two way bindings
			el.address = getObservable(allBindings.get('address')).extend({ rateLimit: { timeout: 1000, method: "notifyWhenChangesStop" } });
			el.map = getObservable(allBindings.get('map'));
			el.marker = getObservable(allBindings.get('marker'));
			el.hasBeenDragged = getObservable(allBindings.get('hasBeenDragged'));
			el.hasBeenDragged(false);
			el.newAddress = getObservable(allBindings.get('newAddress'));

			//one way, non observables
			el.mapOptions = ko.utils.unwrapObservable(allBindings.get('mapOptions'));
			el.markerOptions = ko.utils.unwrapObservable(allBindings.get('markerOptions'));


			//internal
			el.coordinatesAreValid = ko.computed(function () {
				return (el.coordinates() && el.coordinates().lat() && el.coordinates().lng());
			}, this);

			//if coordinates are provided on the init
			el.coordinatesProvided = ko.observable(el.coordinatesAreValid());

			configureOptions(el);

			//if the marker has been dragged or the coordinates were originally provided, render based on coordinates
			if (el.coordinatesProvided()) {
				render(el, el.coordinates());
			} else {
				codeAddress(el, el.address());
			}

			el.address.subscribe(function () {
				if (!el.hasBeenDragged()) {
					codeAddress(el, el.address());
				} else {
					//reset
					el.hasBeenDragged(false);
				}
			}, this);

			el.map(new google.maps.Map(el, el.mapOptions));

			return { controlsDescendantBindings: true };
		},
		update: function (el, valueAccessor, allBindings) {

			//if it has been dragged, dont move when coordinates change
			if (!el.hasBeenDragged()) {
				render(el, el.coordinates());
			}
			reverseCodeAddress(el, el.coordinates());
		}
	}

	function codeAddress(el, address) {
		if (!address) return;
		geocoder = new google.maps.Geocoder();
		geocoder.geocode({
			'address': address
		}, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				el.coordinates(results[0].geometry.location);
			}
		});
	}
	function render(el, coordinates) {
		if ((!coordinates || !coordinates.lat() || !coordinates.lng())) return;
		var mapOptions = $.extend({}, el.mapOptions, { center: coordinates, zoom: 18 });
		if (!el.map()) {
			el.map(new google.maps.Map(el, mapOptions));
		} else {
			el.map().setZoom(mapOptions.zoom);
		}
		var markerOptions = $.extend({}, el.markerOptions, { map: el.map(), position: coordinates, draggable: true });
		if (!el.marker()) {
			el.marker(new google.maps.Marker(markerOptions));

			google.maps.event.addListener(el.marker(), 'dragend', function (ev) {
				window.setTimeout(function () {
					el.hasBeenDragged(true);
					el.coordinates(el.marker().getPosition())
					el.map().panTo(el.marker().getPosition());
				}, 500);
			});
			el.marker().setPosition(coordinates);
			el.map().panTo(coordinates);
		} else {
			el.marker().setPosition(coordinates);
			el.map().panTo(coordinates);
		}
	}

	function reverseCodeAddress(el, coordinates) {
		geocoder = new google.maps.Geocoder();
		geocoder.geocode({
			'latLng': coordinates
		}, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK && results[0]) {
				el.newAddress({ formatted: results[0].formatted_address, object: addressFromComponents(results[0].address_components), components: results[0].address_components });
			} else {
				el.newAddress(null);
			}
		});
	}

	function addressFromComponents(components) {
		var address = {
			address1: "",
			address2: "",
			city: "",
			state: "",
			postalCode: "",
			county: "",
			country: "",
		}
		components.forEach(function (component) {
			var val = getComponentValue(component);

			if (~$.inArray("street_number", component.types)) {
				address.address1 = val;
			}
			if (~$.inArray("route", component.types)) {
				if (address.address1) address.address1 += " ";
				address.address1 += val;
			}
			if (~$.inArray("locality", component.types)) {
				address.city = val;
			}
			if (~$.inArray("administrative_area_level_1", component.types)) {
				address.state = component.short_name;
			}
			if (~$.inArray("country", component.types)) {
				address.country = component.short_name;
			}
			if (~$.inArray("postal_code", component.types)) {
				address.postalCode = val;
			}
			if (~$.inArray("administrative_area_level_2", component.types)) {
				address.county = val;
			}
		});

		return address;
	}
	function getComponentValue(component) {
		return component.long_name || component.short_name;
	}

	function configureOptions(el) {
		if (!el.mapOptions) {
			el.mapOptions = {};
		}
		el.mapOptions.zoom = (el.mapOptions.zoom || 4);
		el.mapOptions.center = (el.mapOptions.center || { lat: 39.50, lng: -98.35 });
		el.mapOptions.disableDefaultUI = (el.mapOptions.disableDefaultUI === false ? false : true);
		if (!el.markerOptions) {
			el.markerOptions = {};
		}
		el.markerOptions.title = el.markerOptions.title || "Drag me to select the proper location";
		el.markerOptions.animation = el.markerOptions.animation || google.maps.Animation.DROP;
	}

	function getObservable(obj) {
		if (ko.isObservable(obj)) {
			return obj;
		} else {
			if (obj) {
				return ko.observable(obj);
			} else {
				return ko.observable("");
			}
		}
	}

}));