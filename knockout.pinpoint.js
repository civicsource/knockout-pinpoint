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

			//getObservable(valueAccessor()).extend({ throttle: 500 });
			el.address = getObservable(allBindings.get('address'));
			el.newAddress = getObservable(allBindings.get('newAddress'));
			el.map = getObservable(allBindings.get('map'));
			el.marker = getObservable(allBindings.get('marker'));
			el.mapOptions = ko.utils.unwrapObservable(allBindings.get('mapOptions'));
			el.markerOptions = ko.utils.unwrapObservable(allBindings.get('markerOptions'));
			configureOptions(el);

			return { controlsDescendantBindings: true };
		},
		update: function (el, valueAccessor, allBindings) {
			el.coordinates = valueAccessor();
			//if coordinates are valid, use them, else use the address if it is passed in
			if (el.coordinates() && el.coordinates().lat() && el.coordinates().lng()) {
				render(el, el.coordinates());
			} else {
				codeAddress(el, el.address());
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
		if (!coordinates) return;
		var mapOptions = $.extend({}, el.mapOptions, { center: coordinates });
		if (!el.map()) {
			el.map(new google.maps.Map(el, mapOptions));
		}
		var markerOptions = $.extend({}, el.markerOptions, { map: el.map(), position: coordinates, draggable: true });
		if (!el.marker()) {
			el.marker(new google.maps.Marker(markerOptions));

			google.maps.event.addListener(el.marker(), 'dragend', function (ev) {
				window.setTimeout(function () {
					el.coordinates(el.marker().getPosition())
					el.map().panTo(el.marker().getPosition());
				}, 500);
			});
		}
	}

	function reverseCodeAddress(el, coordinates) {
		if (!coordinates) {
			el.newAddress(null);
			return;
		}
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
		el.mapOptions.zoom = (el.mapOptions.zoom || 17);
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