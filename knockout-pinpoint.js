(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(["jquery", "knockout", "google-maps"], factory);
	} else {
		// Browser globals
		factory(jQuery, ko, 'google.maps');
	}
}(this, function ($, ko) {

	var defaults = {
		zoom: 17
	};

	ko.bindingHandlers.pinpoint = {
		init: function (el, valueAccessor, allBindings) {
			$(el).attr('id', 'knockout-pinpoint__container')
			el.coordinates = (ko.isObservable(allBindings.get('coordinates')) ? allBindings.get('coordinates') : ko.observable());
			el.coordinates.subscribe(function (newVal) {
				render(el, el.coordinates())
			}, this);
			el.map = new google.maps.Map(document.getElementById($(el).attr('id')), { zoom: defaults.zoom, center: new google.maps.LatLng(-25.363882, 131.044922) });
			return { controlsDescendantBindings: true };
		},
		update: function (el, valueAccessor, allBindingsAccessor) {
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
		var myOptions = {
			zoom: defaults.zoom,
			center: coordinates
		}
		el.map = new google.maps.Map(document.getElementById($(el).attr('id')), myOptions);
		var marker = new google.maps.Marker({
			map: el.map,
			draggable: true,
			title: "Drag me!",
			position: coordinates
		});
	}
}));