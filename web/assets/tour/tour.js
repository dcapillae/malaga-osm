// links for tour pages
//file:///D:/My%20Documents/Archive/Mapping/Website/BexhillOSM/osm-pois/web/index.html?I=way_397637928#18/50.84328/0.46052
function tour(tourName) {
	switch(tourName) {
		case 'fossils':
			map.removeLayer(imageOverlay);
			var dinoIcon = L.icon({ 
				iconUrl: 'assets/tour/tour1/dinomarker.png',
				iconSize: [32, 37],
				iconAnchor: [16, 35],
				shadowUrl: 'assets/img/icons/000shadow.png',
				shadowAnchor: [16, 27],
				popupAnchor: [0, -27]
			});
			imageOverlay = L.marker([50.837617, 0.482517], { icon: dinoIcon }).addTo(map).bindPopup('<h3>Iguanadon Tracks</h3>View at low tide.  Walk directly out onto the beach infront of Sackville Apartments. The tracks are just to the south-east of the two large rocks a few hundred yards out from the East Parade.<br>One footprint is about 18-inches long.');
			// timeout hack to stop iframe breaking on ff
			setTimeout(function () { imageOverlay.openPopup(); }, 50);
			break;
		case 'shipwreck':
			rLookup = true;
			show_overpass_layer('node(3192282124)(' + mapBbox + ');');
			break;
		case 'smugglingPanels':
			map.setZoom(15);
			show_overpass_layer('node["ref"~"^TST"](' + mapBbox + ');');
			break;
		case 'smugglingGreen':
			rLookup = true;
			show_overpass_layer('way(263267372)(' + mapBbox + ');');
			break;
		case 'railwayBexhillstation':
			rLookup=true; 
			show_overpass_layer('way(397839677)(' + mapBbox + ');');
			break;
		case 'railwayWestbranch':
			map.removeLayer(imageOverlay);
			map.setZoom(15);
			imageOverlay = L.imageOverlay('assets/tour/tour4/westbranchline.png', [[50.8860, 0.4625], [50.8400, 0.5100]], { opacity: 1 }).addTo(map);
			break;
		case 'railwayWeststation':
			rLookup = true;
			show_overpass_layer('node(318219478)(' + mapBbox + ');');
			break;
		case 'railwaySidleystation':
			rLookup = true;
			show_overpass_layer('node(3615179880)(' + mapBbox + ');');
			break;
		case 'railwayGlynegap':
			rLookup = true;
			show_overpass_layer('node(4033104292)(' + mapBbox + ');');
			break;
		case 'tramway':
			map.removeLayer(imageOverlay);
			map.setZoom(15);
			imageOverlay = L.imageOverlay('assets/tour/tour5/tramway.png', [[50.8523, 0.4268], [50.8324, 0.5343]], { opacity: 1 }).addTo(map);
			break;
		case 'motorTrack':
			map.removeLayer(imageOverlay);
			map.flyTo([50.83958, 0.48503], 17);
			imageOverlay = L.imageOverlay('assets/tour/tour6/racetrack.png', [[50.84135, 0.47991], [50.83772, 0.49508]], { opacity: 1 }).addTo(map);
			break;
		case 'motorSerpollet':
			rLookup=true; 
			show_overpass_layer('node(3592525934)(' + mapBbox + ');');
			break;
		case 'motorTrail':
			suggWalk('tmt');
			break;
		case 'delawarr':
			rLookup = true;
			show_overpass_layer('way(247116304)(' + mapBbox + ');');
			break;
		case 'manor':
			rLookup = true;
			show_overpass_layer('way(364593716)(' + mapBbox + ');');
			break;
		case 'source':
			$('#tourList').val(99);
			$('#tourList').trigger('change');
			break;
	}
}