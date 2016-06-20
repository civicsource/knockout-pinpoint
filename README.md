#Knockout Pinpoint

> Knockout component to get coordinates/address based on map location

##Installation

```
npm install knockout.pinpoint --save
```

##Usage

`require` the script and use it as a binding handler:

```html
<span data-bind="pinpoint: coordinates"></span>
```

where `coordinates` is an observable you want two-way bound to the component. the coordinates should be a [google.maps.LatLng](https://developers.google.com/maps/documentation/javascript/reference#LatLng) object

if you want to pass in empty coordinates, and let the pinpoint component figure out the coordinates based on an address, you can pass an additional binding handler (address) that the component will use to geocode the initial coordinates:

 ```html
<span data-bind="pinpoint: coordinates, address: address"></span>
```
