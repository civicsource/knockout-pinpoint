(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(["jquery", "knockout", "google-maps"], factory);
	} else {
		// Browser globals
		factory(jQuery, ko, 'google.maps');
	}
}(this, function ($, ko) {

	ko.bindingHandlers.pinpoint = {
		init: function (el, valueAccessor, allBindings) {
			$(el).attr('id', 'knockout-pinpoint__container')
			el.coordinates = getObservable(allBindings.get('coordinates')).extend({ throttle: 500 });
			el.newAddress = getObservable(allBindings.get('newAddress'));
			el.map = getObservable(allBindings.get('map'));
			el.marker = getObservable(allBindings.get('marker'));
			el.mapOptions = ko.utils.unwrapObservable(allBindings.get('mapOptions'));
			el.markerOptions = ko.utils.unwrapObservable(allBindings.get('markerOptions'));
			configureOptions(el);

			el.coordinates.subscribe(function (newVal) {
				render(el, newVal);
				reverseCodeAddress(el, newVal);
			}, this);

			return { controlsDescendantBindings: true };
		},
		update: function (el, valueAccessor, allBindings) {
			var address = valueAccessor();
			codeAddress(el, address());
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
			el.map(new google.maps.Map(document.getElementById($(el).attr('id')), mapOptions));
		}
		var markerOptions = $.extend({}, el.markerOptions, { map: el.map(), position: coordinates, draggable: true });
		if (!el.marker()) {
			el.marker(new google.maps.Marker(markerOptions));
		}
		google.maps.event.addListener(el.marker(), 'dragend', function (ev) {
			window.setTimeout(function () {
				el.coordinates(el.marker().getPosition())
				el.map().panTo(el.marker().getPosition());
			}, 500);
		});
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
			if (status == google.maps.GeocoderStatus.OK) {
				if (results[0]) {
					el.newAddress(results[0].formatted_address);
				} else {
					el.newAddress(null);
				}
			}
		});
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