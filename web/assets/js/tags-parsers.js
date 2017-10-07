// parse tags and marker popup

// convert a non-uppercase string to titlecase
function titleCase(str) {
	str = str.replace(/_/g, ' ');
	if (str === str.toUpperCase()) return str;
	else return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

// parse ISO 8601 dates
function date_parser(dtStr, style) {
	var dt, dtFrmt = dtStr.split('-').length - 1;
	if (style === 'long') {
		dt = new Date(dtStr);
		if (dtFrmt === 2) dt = dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
		else if (dtFrmt === 1) dt = dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
		else dt = dtStr;
		if (dt.indexOf('/') > -1) style = 'short';
	}
	if (style === 'short') {
		if (dtFrmt === 2) dt = dtStr.split('-')[2] + '/' + dtStr.split('-')[1] + '/' + dtStr.split('-')[0];
		else if (dtFrmt === 1) dt = dtStr.split('-')[1] + '/' + dtStr.split('-')[0];
		else dt = dtStr;
	}
	if (dt === 'Invalid Date' || dt === undefined) dt = dtStr;
	return dt;
}

// tag template
var tagTmpl = '<div class="popup-tagContainer"><i class="popup-tagIcon fa fa-{iconName} fa-fw"></i><span class="popup-tagValue"><strong>{tag}: </strong>{value}</span></div>';
function generic_tag_parser(tags, tag, tagName, iconName) {
	var markerPopup = '', result;
	if (tags[tag]) {
		if (tags[tag] === 'yes') result = '<i class="fa fa-check"></i>';
		else if (tags[tag] === 'no') result = '<i class="fa fa-remove"></i>';
		else if (tag.indexOf('_date') > -1 || tag.indexOf('date_') > -1) result = date_parser(tags[tag], 'long');
		else result = tags[tag].replace(/;/g, ', ');
		markerPopup = L.Util.template(tagTmpl, { tag: tagName, value: result, iconName: iconName });
	}
	return markerPopup;
}

// used if poi has no parser
function generic_poi_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[]
	);
}

function address_parser(tags) {
	var markerPopup = '';
	if (tags['addr:street'] || tags['addr:place']) {
		var value = '';
		if (tags['addr:housename']) value += tags['addr:housename'] + ', ';
		if (tags['addr:flats']) value += 'Flats:' + tags['addr:flats'] + ', ';
		if (tags['addr:housenumber']) value += tags['addr:housenumber'] + ' ';
		if (tags['addr:street']) value += tags['addr:street'];
		else if (tags['addr:place']) value += tags['addr:place'];
		if (tags['addr:postcode']) value += ', ' + tags['addr:postcode'];
		markerPopup = L.Util.template(tagTmpl, { tag: 'Address', value: value, iconName: 'map-marker' });
	}
	return markerPopup;
}

function website_parser(tags) {
	var markerPopup = '';
	var tagWebsite = tags.website ? tags.website : tags['contact:website'];
	if (tagWebsite) {
		var link = '<a class="popup-truncate" style="max-width:' + (imgSize - 100) + 'px" href="' + tagWebsite + '" title="' + tagWebsite + '" target="_blank">' + tagWebsite + '</a>';
		markerPopup += L.Util.template(tagTmpl, { tag: 'Website', value: link, iconName: 'globe' });
	}
	return markerPopup;
}

function phone_parser(tags) {
	var tagPhone = tags.phone ? tags.phone : tags['contact:phone'];
	var markerPopup = '';
	if (tagPhone) {
		tagPhone = tagPhone.replace('+44 ', '0');
		var link = '<a href="tel:' + tagPhone + '" title="Call now">' + tagPhone + '</a>';
		markerPopup = L.Util.template(tagTmpl, { tag: 'Phone', value: link, iconName: 'phone' });
	}
	return markerPopup;
}

function contact_parser(tags) {
	var markerPopup = '', tag = '';
	var tagMail = tags.email ? tags.email : tags['contact:email'];
	var tagFb = tags.facebook ? tags.facebook : tags['contact:facebook'];
	var tagTwit = tags.twitter ? tags.twitter : tags['contact:twitter'];
	if (tagMail) tag += '<a href="mailto:' + tagMail + '"><i class="fa fa-envelope fa-fw" title="E-mail: ' + tagMail + '"></i></a> ';
	if (tagFb) tag += '<a href="' + tagFb + '" target="_blank"><i class="fa fa-facebook-official fa-fw" title="Facebook: ' + tagFb + '" style="color:#3b5998;"></i></a> ';
	if (tagTwit) tag += '<a href="https://twitter.com/' + tagTwit + '" target="_blank"><i class="fa fa-twitter fa-fw" title="Twitter: @' + tagTwit + '" style="color:#1da1f2;"></i></a> ';
	if (tag) markerPopup = L.Util.template(tagTmpl, { tag: 'Contact', value: tag, iconName: 'user-circle' });
	return markerPopup;
}

function facility_parser(tags) {
	var markerPopup = '', tag = '';
	if (tags.wheelchair === 'yes') tag += '<i class="fa fa-wheelchair fa-fw" title="wheelchair access" style="color:darkgreen;"></i> ';
	else if (tags.wheelchair === 'limited') tag += '<i class="fa fa-wheelchair fa-fw" title="limited wheelchair access" style="color:gray;"></i> ';
	else if (tags.wheelchair === 'no') tag += '<i class="fa fa-wheelchair fa-fw" title="no wheelchair access" style="color:red;"></i> ';
	if (tags.dog === 'yes') tag += '<i class="fa fa-paw fa-fw" title="dog friendly" style="color:darkgreen;"></i> ';
	if (tags.internet_access === 'wlan') tag += '<i class="fa fa-wifi fa-fw" title="wireless internet access" style="color:darkgreen;"></i> ';
	else if (tags.internet_access === 'terminal') tag += '<i class="fa fa-desktop fa-fw" title="terminal internet access" style="color:darkgreen;"></i> ';
	if (tags.male === 'yes' || tags.unisex === 'yes') tag += '<i class="fa fa-male fa-fw" title="male" style="color:darkgreen;"></i> ';
	if (tags.female === 'yes' || tags.unisex === 'yes') tag += '<i class="fa fa-female fa-fw" title="female" style="color:darkgreen;"></i> ';
	if (tags.diaper === 'yes') tag += '<i class="fa fa-child fa-fw" title="baby changing" style="color:darkgreen;"></i> ';
	if (tag) markerPopup = L.Util.template(tagTmpl, { tag: 'Facilities', value: '<span class="popup-facilities">' + tag + '</span>', iconName: 'info-circle' });
	return markerPopup;
}

function payment_parser(tags) {
	var markerPopup = '', tag = '';
	for (var key in tags) {
		if (key.indexOf('payment:') === 0 && (tags[key] === 'yes')) tag += key.split(':')[1] + ', ';
	}
	if (tag) {
		tag = tag.replace(/_/g, '-');
		tag = tag.substring(0, tag.length - 2);
		markerPopup = L.Util.template(tagTmpl, { tag: 'Payment options', value: tag, iconName: 'money' });
	}
	return markerPopup;
}

function wikipedia_parser(tags) {
	var wikipedia = tags.wikipedia ? tags.wikipedia : tags['site:wikipedia'];
	var markerPopup = '';
	if (wikipedia) {
		var s = wikipedia.split(':');
		var lang = s[0] + '.', subject = s[1];
		var href = 'https://' + lang + 'wikipedia.org/wiki/' + subject;
		var link = '<a class="popup-truncate" style="max-width:' + (imgSize - 100) + 'px" href="' + href + '" title="' + subject + '" target="_blank">' + subject + '</a>';
		markerPopup += L.Util.template(tagTmpl, { tag: 'Wikipedia', value: link, iconName: 'wikipedia-w' });
	}
	return markerPopup;
}

function listed_parser(tags) {
	var tag = '', label = '', markerPopup = '';
	if (tags.building) {
		label = 'Building';
		if (tags['building:architecture']) tag += titleCase(tags['building:architecture']) + '; ';
		if (tags.architect) tag += tags.architect + '; ';
		if (tags.start_date) tag += date_parser(tags.start_date, 'short') + '; ';
	}
	else {
		label = 'Listed';
		if (tags.start_date) markerPopup += L.Util.template(tagTmpl, { tag: 'Start date', value: date_parser(tags.start_date, 'long'), iconName: 'calendar' });
	}
	if (tags.HE_ref) {
		var listedStatus = tags.listed_status ? tags.listed_status : tags.HE_ref;
		tag += '<a href="https://historicengland.org.uk/listing/the-list/list-entry/' + tags.HE_ref + '" title="Historic England entry" target="_blank">' + listedStatus + '</a>';
	}
	if (tag) markerPopup = L.Util.template(tagTmpl, { tag: label + ' details', value: tag, iconName: 'file' }) + markerPopup;
	return markerPopup;
}

function hotel_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: hotelservices_parser},
			{callback: generic_tag_parser, tag: 'rooms', label: 'Rooms', iconName: 'bed'}
		]
	);
}
function hotelservices_parser(tags) {
	var markerPopup = '', tag = '';
	if (tags.stars) {
		var result = '<a href="https://www.visitengland.com/plan-your-visit/quality-assessment-and-star-ratings/visitengland-star-ratings" title="' + tags.stars + ' stars" target="_blank">';
		for (var c = 0; c < tags.stars; c++) {
			result += '<i class="fa fa-star-o"></i>';
		}
		result += '</a>';
		markerPopup += L.Util.template(tagTmpl, { tag: 'VisitEngland rating', value: result, iconName: 'star' });
	}
	if (tags.view) tag += tags.view + ' view; ';
	if (tags.balcony) tag += 'balcony; ';
	if (tags.cooking) tag += 'self-catering; ';
	if (tag) markerPopup += L.Util.template(tagTmpl, { tag: 'Accomodation', value: tag, iconName: 'bed' });
	// booking.com affiliate link
	if (tags['url:booking-com']) markerPopup += L.Util.template(tagTmpl, { tag: 'Check avalibility', value: '<a href="' + tags['url:booking-com'] + '?aid=1335159&no_rooms=1&group_adults=1" title="booking.com" target="_blank"><img class="popup-imgBooking" src="assets/img/booking-com.png"></a>', iconName: 'file' });
	return markerPopup;
}

function bikeshop_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: bikeservices_parser}
		]
	);
}
function bikeservices_parser(tags) {
	var markerPopup = '', tag = '';
	for (var key in tags) {
		if (key.indexOf('service:bicycle:') === 0 && (tags[key] === 'yes')) tag += key.split(':')[2] + ', ';
	}
	if (tag) {
		tag = tag.replace(/_/g, '-');
		tag = tag.substring(0, tag.length - 2);
		markerPopup = L.Util.template(tagTmpl, { tag: 'Bicycle services', value: tag, iconName: 'bicycle' });
	}
	return markerPopup;
}

function school_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: edubase_parser}
		]
	);
}
function edubase_parser(tags) {
	var tag = tags['ref:edubase'], markerPopup = '';
	if (tag) {
		var link = '<a href="https://www.education.gov.uk/edubase/establishment/summary.xhtml?urn=' + tag + '" title="Department for Education" target="_blank">' + tag + '</a> ' +
			'/ <a href="https://reports.ofsted.gov.uk/inspection-reports/find-inspection-report/provider/ELS/' + tag + '" title="Ofstead" target="_blank">Ofstead</a>';
		markerPopup += L.Util.template(tagTmpl, { tag: 'EduBase URN', value: link, iconName: 'file' });
	}
	return markerPopup;
}

function fhrs_parser(tags) {
	var fhrs = tags['fhrs:id'], markerPopup = '';
	if (fhrs) {
		var link = '<a href="http://ratings.food.gov.uk/business/en-GB/' + fhrs + '" title="Food Standards Agency" target="_blank"><span class="popup-fhrs">' + fhrs + '</span></a>';
		markerPopup = L.Util.template(tagTmpl, { tag: 'Food hygiene rating', value: link, iconName: 'file' });
	}
	return markerPopup;
}

function worship_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'denomination', label: 'Denomination', iconName: 'dot-circle-o'},
			{callback: generic_tag_parser, tag: 'service_times', label: 'Service times', iconName: 'clock-o'}
		]
	);
}

function socialf_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: socialfservices_parser},
			{callback: generic_tag_parser, tag: 'capacity', label: 'Capacity', iconName: 'users'}
		]
	);
}
function socialfservices_parser(tags) {
	var markerPopup = '', tag = '';
	if (tags['social_facility:for']) tag += tags['social_facility:for'] + ' ';
	if (tags.social_facility) tag += tags.social_facility;
	if (tag) {
		tag = tag.replace(/_/g, ' ');
		markerPopup += L.Util.template(tagTmpl, { tag: 'Facility', value: tag, iconName: 'users' });
	}
	return markerPopup;
}

function food_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: cuisine_parser},
			{callback: order_parser}
		]
	);
}
function cuisine_parser(tags) {
	var markerPopup = '', tag = '';
	if (tags.cuisine) tag += tags.cuisine + ', ';
	if (tags.fair_trade === 'yes') tag += 'fairtrade, ';
	if (tags.breakfast === 'yes') tag += 'breakfast, ';
	if (tags.lunch === 'yes') tag += 'lunch, ';
	if (tags.ice_cream === 'yes') tag += 'ice cream, ';
	if (tags.real_ale === 'yes') tag += 'real ale, ';
	if (tags.real_cider === 'yes') tag += 'real cider, ';
	for (var key in tags) {
		if (key.indexOf('diet:') === 0 && (tags[key] === 'yes')) tag += key.split(':')[1] + ' options, ';
	}
	if (tag) {
		tag = tag.replace(/_/g, '-');
		tag = tag.substring(0, tag.length - 2);
		markerPopup = L.Util.template(tagTmpl, { tag: 'Cuisine', value: tag, iconName: 'cutlery' });
	}
	return markerPopup;
}

function order_parser(tags) {
	var tag = '', markerPopup = '';
	if (tags.takeaway === 'yes') tag += 'takeaway, ';
	else if (tags.takeaway === 'only') tag += 'takeaway only, ';
	if (tags.delivery === 'yes') tag += 'delivery, ';
	if (tags.beer_garden === 'yes') tag += 'beer garden, ';
	else if (tags.outdoor_seating === 'yes') tag += 'outdoor seating, ';
	if (tags.reservation === 'yes') tag += 'takes reservation, ';
	else if (tags.reservation === 'required') tag += 'needs reservation, ';
	if (tags['url:just-eat']) tag += '<a href="' + tags['url:just-eat'] + '" title="just-eat.com" target="_blank">just-eat</a>, ';
	if (tag) markerPopup = L.Util.template(tagTmpl, { tag: 'Order options', value: tag.substring(0, tag.length - 2), iconName: 'shopping-bag' });
	return markerPopup;
}

function atm_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'brand', label: 'Brand'},
			{callback: generic_tag_parser, tag: 'indoor', label: 'Enter building to access', iconName: 'sign-in'},
			{callback: generic_tag_parser, tag: 'fee', label: 'Fee', iconName: 'money'}
		]
	);
}

function post_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'ref', label: 'Ref', iconName: 'archive'},
			{callback: generic_tag_parser, tag: 'post_box:type', label: 'Type', iconName: 'archive'},
			{callback: postcypher_parser},
			{callback: generic_tag_parser, tag: 'collection_times', label: 'Collection times', iconName: 'clock-o'}
		]
	);
}
function postcypher_parser(tags) {
	var royalcypher = tags.royal_cypher;
	var markerPopup = '';
	if (royalcypher) {
		switch (royalcypher) {
			case 'VR' : royalcypher += ': Victoria (1837-1901)'; break;
			case 'EVIIR' : royalcypher += ': Edward VII (1901-1910)'; break;
			case 'GR' : royalcypher += ': George V (1910-1936)'; break;
			case 'EVIIIR' : royalcypher += ': Edward VIII (1936)'; break;
			case 'GVIR' : royalcypher += ': George VI (1936-1952)'; break;
			case 'EIIR' : royalcypher += ': Elizabeth II (1952+)'; break;
		}
		markerPopup += L.Util.template(tagTmpl, { tag: 'Royal cypher', value: royalcypher, iconName: 'archive' });
	}
	return markerPopup;
}	
	

function taxi_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'capacity', label: 'Taxi rank capacity', iconName: 'taxi'}
		]
	);
}

function recyclecentre_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: recycle_parser}
		]
	);
}
function recycle_parser(tags) {
	var markerPopup = '', tag = '';
	for (var key in tags) {
		if (key.indexOf('recycling:') === 0 && (tags[key] === 'yes')) tag += key.split(':')[1] + ', ';
	}
	if (tag) {
		tag = tag.replace(/_/g, '-');
		tag = tag.substring(0, tag.length - 2);
		markerPopup = L.Util.template(tagTmpl, { tag: 'Recycling options', value: tag, iconName: 'recycle' });
	}
	return markerPopup;
}

function fuelstation_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'shop', label: 'Shop', iconName: 'shopping-basket'},
			{callback: fuel_parser}
		]
	);
}
function fuel_parser(tags) {
	var markerPopup = '', tag = '';
	for (var key in tags) {
		if (key.indexOf('fuel:') === 0 && (tags[key] === 'yes')) tag += key.split(':')[1] + ', ';
	}
	if (tag) {
		tag = tag.replace(/_/g, '-');
		tag = tag.substring(0, tag.length - 2);
		markerPopup = L.Util.template(tagTmpl, { tag: 'Fuel options', value: tag, iconName: 'tint' });
	}
	return markerPopup;
}

function carshop_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'service', label: 'Services', iconName: 'car'}
		]
	);
}

function carpark_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'capacity', label: 'Spaces', iconName: 'car'},
			{callback: generic_tag_parser, tag: 'capacity:disabled', label: 'Disabled spaces', iconName: 'wheelchair'},
			{callback: generic_tag_parser, tag: 'fee', label: 'Fee', iconName: 'money'},
			{callback: maxstay_parser}
		]
	);
}
function maxstay_parser(tags) {
	var maxstay = tags.maxstay, markerPopup = '';
	if (maxstay) {
		maxstay = (maxstay >= 60) ? maxstay / 60 + ' hour(s)' : maxstay + ' minutes';
		markerPopup = L.Util.template(tagTmpl, { tag: 'Max stay', value: maxstay, iconName: 'clock-o' });
	}
	return markerPopup;
}

function bikepark_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'bicycle_parking', label: 'Type', iconName: 'lock'},
			{callback: generic_tag_parser, tag: 'capacity', label: 'Capacity', iconName: 'bicycle'},
			{callback: generic_tag_parser, tag: 'covered', label: 'Covered', iconName: 'umbrella'}
		]
	);
}

function cctv_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'highway', label: 'Type', iconName: 'eye'},
			{callback: generic_tag_parser, tag: 'maxspeed', label: 'Max speed', iconName: 'video-camera'},
			{callback: generic_tag_parser, tag: 'surveillance:type', label: 'Type', iconName: 'eye'},
			{callback: generic_tag_parser, tag: 'surveillance:zone', label: 'Zone', iconName: 'eye'},
			{callback: generic_tag_parser, tag: 'camera:mount', label: 'Camera mount', iconName: 'video-camera'},
			{callback: generic_tag_parser, tag: 'camera:type', label: 'Camera type', iconName: 'video-camera'}
		]
	);
}

function hospital_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'emergency', label: 'Emergency', iconName: 'ambulance'}
		]
	);
}

function healthcare_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'healthcare', label: 'Healthcare type', iconName: 'user-md'},
			{callback: generic_tag_parser, tag: 'healthcare:speciality', label: 'Healthcare speciality', iconName: 'user-md'}
		]
	);
}

function defib_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'defibrillator:location', label: 'Location', iconName: 'location-arrow'},
			{callback: generic_tag_parser, tag: 'indoor', label: 'Enter building to access', iconName: 'sign-in'}
		]
	);
}

function toilet_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'indoor', label: 'Enter building to access', iconName: 'sign-in'}
		]
	);
}

function club_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'club', label: 'Club type', iconName: 'comments'},
			{callback: generic_tag_parser, tag: 'sport', label: 'Sport type', iconName: 'trophy'}
		]
	);
}

function clothes_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'clothes', label: 'Clothes type', iconName: 'shopping-bag'},
			{callback: generic_tag_parser, tag: 'second_hand', label: 'Second hand', iconName: 'shopping-bag'}
		]
	);
}

function craft_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'craft', label: 'Craft type', iconName: 'shopping-bag'}
		]
	);
}

function artwork_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'artwork_type', label: 'Artwork type', iconName: 'paint-brush'},
			{callback: generic_tag_parser, tag: 'artist_name', label: 'Artist', iconName: 'user'},
			{callback: generic_tag_parser, tag: 'material', label: 'Material', iconName: 'cube'}
		]
	);
}

function info_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'board_type', label: 'Board type', iconName: 'map-signs'},
			{callback: generic_tag_parser, tag: 'map_size', label: 'Map size', iconName: 'map-signs'},
			{callback: generic_tag_parser, tag: 'ref', label: 'Reference', iconName: 'slack'}
		]
	);
}

function historic_parser(tags, titlePopup) {
	return parse_tags(
		tags,
		titlePopup,
		[
			{callback: generic_tag_parser, tag: 'historic', label: 'Historic type', iconName: 'bank'},
			{callback: generic_tag_parser, tag: 'bunker_type', label: 'Military bunker type', iconName: 'fighter-jet'},
			{callback: generic_tag_parser, tag: 'artist_name', label: 'Artist', iconName: 'user'},
			{callback: generic_tag_parser, tag: 'inscription', label: 'Inscription', iconName: 'pencil-square-o'},
			{callback: generic_tag_parser, tag: 'wreck:date_sunk', label: 'Date sunk', iconName: 'ship'},
			{callback: generic_tag_parser, tag: 'wreck:visible_at_low_tide', label: 'Visible at low tide', iconName: 'ship'}
		]
	);
}

// get bexhill street history through xml file lookup
function street_parser(tags) {
	var markerPopup = '';
	if (tags.highway && tags.name) {
		$.ajax({
			async: false,
			url: 'assets/xml/streetnames.xml',
			dataType: 'xml',
			success: function (xml) {
				var street = $(xml).find('name').filter(function () {
					return $(this).text() === tags.name;
				}).closest('street');
				var streetDate = $('date', street).text();
				var streetDesc = $('desc', street).text();
				if (streetDate && !tags.start_date) markerPopup += L.Util.template(tagTmpl, { tag: 'Start date', value: streetDate, iconName: 'calendar' });
				if (streetDesc) markerPopup += '<span class="popup-longDesc">' + L.Util.template(tagTmpl, { tag: 'Street history', value: streetDesc, iconName: 'road' }) + '</span>';
				if (markerPopup) {
					var sourceLink = $(xml).find('source').text();
					var sourceAuthor = $(xml).find('author').text();
					markerPopup += '<span class="popup-streetSource"><a href="' + sourceLink + '" target="_blank" title="' + sourceLink + '">&copy; ' + sourceAuthor + '</a></span>';
				}
			}
		});
	}
	return markerPopup;
}

function historytrail_parser(tags) {
	var markerPopup = '';
	var tagHistoryTrail = tags['url:bexhillhistorytrail'];
	if (tagHistoryTrail) {
		var link = '<a href="' + tagHistoryTrail + '" title="' + tagHistoryTrail + '" target="_blank">TheBexhillHistoryTrail</a>';
		markerPopup += L.Util.template(tagTmpl, { tag: 'Futher reading', value: link, iconName: 'book' });
	}
	return markerPopup;
}

// https://github.com/ypid/opening_hours.js
var state = '';
function opening_hours_parser(tags) {
	var openhrsState = [], openhrs = '', comment = '';
	state = 'unknown';
	try {
		var opening_hours = require('opening_hours');
		var oh = new opening_hours(tags.opening_hours);
		var strNextChange;
		if (oh.getNextChange()) {
			var dateTomorrow = new Date(), dateWeek = new Date();
			dateTomorrow.setDate(new Date().getDate() + 1);
			dateWeek.setDate(new Date().getDate() + 7);
			// display 'today'
			if (oh.getNextChange().toLocaleDateString('en-GB') === new Date().toLocaleDateString('en-GB')) {
				strNextChange = 'Today ' + oh.getNextChange().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
			}
			// display 'tomorrow'
			else if (oh.getNextChange().toLocaleDateString('en-GB') === dateTomorrow.toLocaleDateString('en-GB')) {
				strNextChange = 'Tomorrow ' + oh.getNextChange().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
			}
			// display day name if within a week
			else if (oh.getNextChange().getTime() > dateTomorrow.getTime() && oh.getNextChange().getTime() < dateWeek.getTime()) {
				strNextChange = oh.getNextChange().toLocaleDateString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
			}
			// otherwise display date
			else strNextChange = date_parser(oh.getNextChange().toLocaleDateString('en-GB'), 'short');
		}
		else strNextChange = oh.prettifyValue();
		if (oh.getComment()) {
			if (strNextChange === tags.opening_hours) state = 'depends';
			else {
				comment = ' (' + oh.getComment() + ')';
				state = true;
			}
		}
		else state = oh.getState();
		// create readable table
		var ohTable = oh.prettifyValue({ conf: { rule_sep_string: '<br>', print_semicolon: false } });
		// show tag and collapsible accordion
		if (state === true) openhrsState = [ 'green', 'Open until' ];
		else if (state === false) openhrsState = [ 'red', 'Closed until' ];
		else if (state === 'depends') openhrsState = [ 'grey', 'Depends on' ];
		if (openhrsState) {	openhrs =
			'<div class="popup-ohContainer">' +
				'<span class="popup-tagContainer">' +
					'<i style="color:' + openhrsState[0] + ';" class="popup-tagIcon fa fa-circle fa-fw"></i>' +
					'<span class="popup-tagValue"><strong>' + openhrsState[1] + ':</strong> ' + strNextChange + comment + '&nbsp; </span>' +
					'<i style="color:#b05000;" title="See full opening hours" class="fa fa-caret-down fa-fw"></i>' +
				'</span>' +
				'<div class="popup-ohTable">' + ohTable + '</div>' +
			'</div>';
		}
	}
	catch(err) {
		if (tags.opening_hours && $('#inputDebug').is(':checked')) console.debug('ERROR: Object "' + tags.name + '" cannot parse hours: ' + tags.opening_hours + '. ' + err);
	}
	return openhrs;
}

function popup_buttons(element) {
	// edit in osm
	var elementLatLon = (element.type === 'node') ? element.lat + '/' + element.lon : element.center.lat + '/' + element.center.lon;
	var markerPopup = L.Util.template(
		'<a id="{type}_{id}" class="popup-edit" href="https://www.openstreetmap.org/edit?editor=id&{type}={id}#map=19/{latlon}" title="Edit with OpenStreetMap" target="_blank"><i class="fa fa-pencil"></i></a>',
		{type: element.type, id: element.id, latlon: elementLatLon}
	);
	// walking direction button
	markerPopup += '<a class="popup-direct" title="Walking directions"><i class="fa fa-location-arrow"></i></a>';
	return markerPopup;
}

// get images
function image_parser(tags) {
	var markerPopup = '', lID;
	if (tags.image && !$('#inputImage').is(':checked')) {
		var displayImage = function (img, id, display) {
			// check if wikimedia image
			if (img.indexOf('File') === 0) {
				var url = 'https://commons.wikimedia.org/w/thumb.php?f=' + encodeURIComponent(img.split(':')[1]) + '&w=' + imgSize;
				markerPopup +=
					'<div id="img' + id + '" class="popup-imgContainer" style="display:' + display + ';">' +
						'<img data-url="' + img + '" alt="Loading image..." style="max-height:' + (imgSize - 50) + 'px;" src="' + url + '"><br>' +
						'<div class="popup-imgAttrib">Loading attribution...</div>' +
					'</div>';
			}
			else if (img.indexOf('http') === 0) {
				markerPopup +=
					'<div id="img' + id + '" class="popup-imgContainer">' +
						'<img alt="Loading image..." style="max-width:' + imgSize + 'px; max-height:' + (imgSize - 50) + 'px;" src="' + img + '">' +
					'</div>';
			}
			return markerPopup;
		};
		displayImage(tags.image, 0, 'inherit');
		// support up to 5 additional images
		if (tags.image_1) {
			for (x = 1; x <= 5; x++) {
				if (tags['image_' + x]) {
					lID = x;
					displayImage(tags['image_' + x], x, 'none');
				}
			}
			// show navigation controls
			markerPopup += '<div class="navigateItem">' +
				'<span class="theme navigateItemPrev"><a title="Previous image" onclick="navImg(0);"><i class="fa fa-caret-square-o-left"></i></a></span>' +
				'<i class="fa fa-picture-o" title="1 of ' + parseInt(lID+1) + '"></i>' +
				'<span class="theme navigateItemNext"><a title="Next image" onclick="navImg(1);"><i class="fa fa-caret-square-o-right"></i></a></span>' +
			'</div>';
		}
	}
	return markerPopup;
}
// navigate through multiple images. 0 = previous, 1 = next
function navImg(direction) {
	// get the current and last image
	var cID = parseInt($('.popup-imgContainer:visible').attr('id').split('img')[1]);
	var lID = parseInt($('.popup-imgContainer:last').attr('id').split('img')[1]);
	// get the next image
	var swapImg = function(nID) {
		// empty array adds default animation
		$('.popup-imgContainer').hide([]).filter('.popup-imgContainer#img' + nID).show([]);
		getWikiAttrib(nID);
		$('.navigateItem > i').attr('title', parseInt(nID+1) + ' of ' + parseInt(lID+1));
	};
	if (direction === 0 && cID > 0) swapImg(cID - 1);
	else if (direction === 1 && cID < lID) swapImg(cID + 1);
	else if (direction === 0 && cID === 0 && cID !== lID) swapImg(lID);
	else if (direction === 1 && cID === lID && cID !== 0) swapImg(0);
}
// wikimedia api for image attribution
function getWikiAttrib(id) {
	if ($('#img' + id).html() && $('#img' + id).html().indexOf('wikimedia.org') !== -1) {
		var img = $('#img' + id + ' img').attr('data-url');
		$.ajax({
			url: 'https://commons.wikimedia.org/w/api.php',
			data: { action: 'query', prop: 'imageinfo', iiprop: 'extmetadata', titles: img, format: 'json' },
			dataType: 'jsonp',
			success: function (result) {
				var imgAttrib = result.query.pages[Object.keys(result.query.pages)[0]].imageinfo['0'].extmetadata;
				var imgDate = imgAttrib.DateTimeOriginal.value ? imgAttrib.DateTimeOriginal.value : imgAttrib.DateTime.value;
				if ($('#inputDebug').is(':checked')) console.debug(imgAttrib);
				$('#img' + id + ' .popup-imgAttrib').html(
					'&copy; ' + imgAttrib.Artist.value + ', ' + new Date(imgDate).getFullYear() +
					' | <a href="' + imgAttrib.LicenseUrl.value + '" title="Licence" target="_blank">' + imgAttrib.LicenseShortName.value + '</a>' +
					' | <a href="https://commons.wikimedia.org/wiki/' + img + '" title="Wikimedia Commons" target="_blank">Full image</a>'
				);
				$('.popup-imgAttrib a').filter(':first').attr('target', '_blank').attr('title', 'Artist');
				if ($('#img1').length) $('.popup-imgAttrib').css('text-align', 'left');
			}
		});
	}
}

// parse all tags into one variable
function parse_tags(element, titlePopup, functions) {
	var tags = element.tags;
	var markerPopup = L.Util.template('<div class="popup-header"><h3>{title}</h3>', { title: titlePopup });
	if (tags.name) markerPopup += L.Util.template('<span class="popup-header-tagName">{tagName}</span>', { tagName: tags.name });
	else if (tags.ref) markerPopup += L.Util.template('<span class="popup-header-tagName">{tagName}</span>', { tagName: tags.ref });
	markerPopup += '</div>';
	functions = [
		{callback: generic_tag_parser, tag: 'official_name', label: 'Official name'},
		{callback: generic_tag_parser, tag: 'loc_name', label: 'Local name'},
		{callback: generic_tag_parser, tag: 'alt_name', label: 'Alternative name'},
		{callback: generic_tag_parser, tag: 'old_name', label: 'Old name'},
		{callback: generic_tag_parser, tag: 'operator', label: 'Operator', iconName: 'building-o'},
		{callback: address_parser},
		{callback: phone_parser},
		{callback: website_parser},
		{callback: contact_parser},
		{callback: wikipedia_parser},
		{callback: listed_parser},
		{callback: generic_tag_parser, tag: 'opening_date', label: 'Opening date', iconName: 'calendar'},
		{callback: generic_tag_parser, tag: 'end_date', label: 'End date', iconName: 'calendar'},
		{callback: fhrs_parser},
		{callback: generic_tag_parser, tag: 'access', label: 'Access', iconName: 'sign-in'},
		{callback: generic_tag_parser, tag: 'description', label: 'Description', iconName: 'pencil-square-o'},
		{callback: facility_parser},
		{callback: payment_parser},
		{callback: street_parser},
		{callback: historytrail_parser}
	].concat(functions);
	for (var c = 0; c < functions.length; c++) {
		var data = functions[c];
		if (data.tag && data.label) {
			var iconName = data.iconName ? data.iconName : 'tag';
			markerPopup += data.callback(tags, data.tag, data.label, iconName);
		}
		else markerPopup += data.callback(tags);
	}
	markerPopup += opening_hours_parser(tags);
	markerPopup += image_parser(tags);
	markerPopup += popup_buttons(element);
	return markerPopup;
}

// marker popup
var spinner = 0, markerId, poiList = [];
function callback(data) {
	var type, name, iconName, markerPopup;
	var customOptions = {
		maxWidth: imgSize,
		autoPanPaddingBottomRight: [5, 50]
	};
	// padding so popup is not obfuscated by map controls
	customOptions.autoPanPaddingTopLeft = ($(window).width() < 768 || !rQuery) ? [20, 40] : [sidebar.width() + 50, 5];
	if (spinner > 0) spinner--;
	if (spinner === 0) {
		$('#spinner').hide();
		$('.poi-checkbox').removeClass('poi-loading');
	}
	// push data to results list
	var setPoiList = function () {
		// get list of markers with openhrs state
		marker.state = state;
		// get distance if location on
		if (lc._active) marker.distance = map.distance(lc._event.latlng, marker._origLatlng);
		// get facilities from popup
		marker.facilities = ($('.popup-facilities', $(markerPopup))[0]) ? $('.popup-facilities', $(markerPopup))[0].innerHTML : '';
		poiList.push(marker);
	};
	for (var c in data.elements) {
		var e = data.elements[c];
		// check tags exist and limit number of results
		if (!e.tags || e.id in this.instance._ids || c >= maxOpResults) continue;
		this.instance._ids[e.id] = true;
		var pos = (e.type === 'node') ? new L.LatLng(e.lat, e.lon) : new L.LatLng(e.center.lat, e.center.lon);
		name = type = iconName = undefined;
		if ($('#inputDebug').is(':checked')) console.debug(e);
		if (e.tags.amenity) {
			type = name = e.tags.amenity;
			switch (e.tags.amenity) {
				case 'animal_boarding' : type = 'animal_shelter'; break;
				case 'arts_centre' : type = 'attraction'; iconName = 'theater'; break;
				case 'cafe' :
				case 'fast_food' :
				case 'restaurant' :
					if (e.tags.cuisine) {
						name = e.tags.cuisine;
						if (e.tags.amenity === 'restaurant' && e.tags.takeaway === 'only') name += ' takeaway';
						else name += ' ' + e.tags.amenity;
						switch (e.tags.cuisine) {
							case 'chinese' : iconName = 'restaurant_chinese'; break;
							case 'fish_and_chips' : iconName = 'fishchips'; break;
							case 'indian' : iconName = 'restaurant_indian'; break;
							case 'italian' : iconName = 'restaurant_italian'; break;
							case 'kebab' : iconName = 'kebab'; break;
							case 'pizza' : iconName = 'pizzaria'; break;
							case 'seafood' : iconName = 'restaurant_fish'; break;
							case 'spanish' : iconName = 'restaurant_tapas'; break;
							case 'steak_house' : iconName = 'restaurant_steakhouse'; break;
							case 'thai' : iconName = 'restaurant_thai'; break;
							case 'vegetarian' : iconName = 'restaurant_vegetarian'; break;
						}
					}
					break;
				case 'clock' : type = name = undefined; iconName = 'clock'; break;
				case 'club' : if (e.tags.club) name = e.tags.club + ' ' + e.tags.amenity; break;
				case 'college' : type = (e.tags.name === undefined) ? undefined : 'school'; break;
				case 'fire_station' : type = 'police'; iconName = 'firetruck'; break;
				case 'place_of_worship' : if (e.tags.religion) name = e.tags.religion; break;
				case 'nightclub' : type = 'bar'; break;
				case 'parking' : if (e.tags.access !== 'yes') type = undefined; break;
				case 'post_office' : type = 'post_box'; iconName = 'postoffice'; break;
				case 'recycling' :
					if (e.tags.recycling_type) {
						name = e.tags.amenity + ' ' + e.tags.recycling_type;
						if (e.tags.recycling_type === 'container') iconName = 'recyclecon';
					}
					break;
				case 'retirement_home' : type = 'social_facility'; break;
				case 'school' : if (e.tags.name === undefined) type = undefined; break;
				case 'taxi' : if (e.tags.capacity) name = e.tags.amenity + ' rank'; break;
				case 'waste_basket' : if (e.tags.waste === 'dog_excrement') { name = 'Dog Waste-Bin'; type = 'dog_excrement'; } break;
			}
		}
		if (e.tags.historic) {
			if (!name) name = 'historic ' + e.tags.historic;
			if (!type) type = 'historic';
			if (e.tags.ruins) iconName = 'ruins-2';
			if (e.tags.military) iconName = 'war';
			switch (e.tags.historic) {
				case 'beacon' : iconName = 'landmark'; break;
				case 'memorial' :
					if (e.tags.memorial) {
						name = 'historic ' + e.tags.memorial;
						if (!iconName) {
							switch (e.tags.memorial) {
								case 'blue_plaque' :
								case 'plaque' : iconName = 'plaque'; break;
								case 'statue' : iconName = 'statue-2'; break;
								case 'war_memorial' : iconName = 'war_memorial'; break;
							}
						}
					}
					if (!iconName) iconName = 'memorial';
					break;
				case 'moat' : iconName = 'lake2'; break;
				case 'railway_station' : iconName = 'steamtrain'; break;
				case 'wreck' : iconName = 'shipwreck'; break;
			}
		}
		if (e.tags.highway) {
			iconName = 'roadtype_tar';
			switch (e.tags.highway) {
				case 'bus_stop' : iconName = 'busstop'; break;
				case 'construction' : iconName = 'construction'; break;
				case 'footway' :
				case 'path' :
				case 'track' :
				case 'pedestrian' : iconName = 'roadtype_track'; break;
				case 'speed_camera' : type = 'surveillance'; break;
			}
		}
		if (e.tags.man_made) {
			if (!name) name = e.tags.man_made;
			if (!type) type = e.tags.man_made;
		}
		if (e.tags.natural) {
			if (!name) name = e.tags.natural;
			if (!type) type = e.tags.natural;
			if (type === 'peak') iconName = 'hill';
		}
		if (e.tags.shop) {
			if (!name) name = e.tags.shop;
			if (!type) type = e.tags.shop;
			switch (e.tags.shop) {
				case 'beauty' : if (e.tags.beauty) name = e.tags.beauty + ' ' + e.tags.shop; break;
				case 'bathroom_furnishing' :
				case 'interior_decoration' :
				case 'kitchen' : type = 'houseware'; break;
				case 'butcher' : type = 'deli'; iconName = 'butcher-2'; break;
				case 'boutique' : type = 'clothes'; break;
				case 'craft' : if (e.tags.craft) name = e.tags.craft; break;
				case 'department_store' : type = 'clothes'; iconName = 'departmentstore'; break;
				case 'e-cigarette' : type = 'tobacco'; break;
				case 'garden_centre' : type = 'florist'; break;
				case 'hairdresser' :
					if (e.tags.male === 'yes') name = 'male barber';
					else if (e.tags.female === 'yes') name = 'female hairdresser';
					else if (e.tags.unisex === 'yes') name = 'unisex hairdresser';
					break;
				case 'hardware' : type = 'doityourself'; break;
				case 'hearing_aids' : type = 'mobility'; iconName = 'hoergeraeteakustiker_22px'; break;
				case 'laundry' : type = 'dry_cleaning'; break;
				case 'signs' : type = 'copyshop'; break;
				case 'trade' : if (e.tags.trade) name = e.tags.trade + ' ' + e.tags.shop; break;
				case 'window_blind' : type = 'curtain'; break;
			}
		}
		if (e.tags.tourism) {
			if (!name) name = e.tags.tourism;
			if (!type) type = e.tags.tourism;
			switch (e.tags.tourism) {
				case 'artwork' : if (e.tags.artwork_type) name = e.tags.artwork_type + ' ' + e.tags.tourism; break;
				case 'gallery' : type = 'artwork'; iconName = 'museum_paintings'; break;
				case 'hotel' : type = 'guest_house'; iconName = 'hotel_0star'; break;
				case 'information' :
					if (e.tags.information) {
						if (!e.tags.name && !e.tags.ref) type = undefined;
						else {
							name = e.tags.tourism + ' ' + e.tags.information;
							switch (e.tags.information) {
								case 'guidepost' : iconName = 'signpost-3'; break;
								case 'board' : iconName = 'board'; break;
								case 'map' : iconName = 'map'; break;
							}
						}
					}
					break;
			}
		}
		if (e.tags.landuse) {
			if (!name) name = e.tags.landuse;
			if (!type) type = e.tags.landuse;
			// hide non-public grounds
			if (type === 'recreation_ground' && e.tags.access === 'private') type = undefined;
		}
		if (e.tags.leisure) {
			if (!name) name = e.tags.leisure;
			if (!type) type = e.tags.leisure;
			switch (type) {
				case 'common' :
				case 'nature_reserve' : type = 'park'; break;
				case 'fitness_station' : type = 'fitness_centre'; break;
				case 'garden' : iconName = 'urbanpark'; break;
				case 'sport' : if (e.tags.sport) name = e.tags.sport + ' ' + e.tags.leisure; break;
				case 'swimming_pool' : if (e.tags.access === 'private') type = undefined; break;
				case 'golf_course': type = 'recreation_ground'; iconName = 'golfing'; break;
			}
		}
		if (e.tags.emergency) {
			if (!name) name = e.tags.emergency;
			if (!type) type = e.tags.emergency;
			if (type === 'ambulance_station') { type = 'police'; iconName = 'ambulance'; }
		}
		if (e.tags.office) {
			if (!name) name = e.tags.office + ' office';
			if (!type) type = e.tags.office;
			// group similar pois
			if (type === 'financial') type = 'accountant';
		}
		if (e.tags.healthcare) {
			if (!name && e.tags['healthcare:speciality']) name = e.tags['healthcare:speciality'];
			else if (!name) name = e.tags.healthcare;
			if (!type) type = 'healthcare';
		}
		if (e.tags.listed_status) {
			if (!type || type === 'shelter' || type === 'company') type = 'listed_status';
		}
		if (e.tags.route === 'bus') {
			type = e.tags.route;
			name = e.tags.route + ' route';
			// show public transport basemap
			if (actBaseTileLayer !== 'trnsprt') {
				map.removeLayer(tileBaseLayers[tileBaseLayer[actBaseTileLayer].name]);
				actBaseTileLayer = 'trnsprt';
				map.addLayer(tileBaseLayers[tileBaseLayer[actBaseTileLayer].name]);
			}
		}
		// set marker options
		customOptions.minWidth = e.tags.image ? imgSize : '';
		var poi = pois[type];
		if (!iconName) {
			if (poi) iconName = poi.iconName;
			else if (e.tags.construction) iconName = 'construction';
			else if (e.tags.building) {
				if (e.tags.building === 'house' || e.tags.building === 'bungalow') iconName = 'bighouse';
				else if (e.tags.building === 'service') iconName = 'powersubstation';
				else iconName = 'apartment-3';
			}
			else iconName = '000blank';
		}
		var markerIcon = L.icon({
			iconUrl: 'assets/img/icons/' + iconName + '.png',
			iconSize: [32, 37],
			iconAnchor: [16, 35],
			shadowUrl: 'assets/img/icons/000shadow.png',
			shadowAnchor: [16, 27],
			popupAnchor: [0, -27]
		});
		var marker = L.marker(pos, {
			bounceOnAdd: !rQuery,
			bounceOnAddOptions: {duration: 500, height: 200},
			icon: markerIcon,
			keyboard: false,
			riseOnHover: true
		});
		// find alternative poi name
		if (!name || (poi && name === poi.name.toLowerCase())) {
			if (poi) name = poi.name;
			else if (e.tags.highway) name = (e.tags.highway === 'bus_stop') ? e.tags.highway : e.tags.highway + ' highway';
			else if (e.tags.railway) name = 'railway ' + e.tags.railway;
			else if (e.tags.ref) name = e.tags.ref;
			else if (e.tags.building && e.tags.building !== 'yes') name = e.tags.building;
			else if (e.tags['addr:housename']) name = e.tags['addr:housename'];
			else name = '&hellip;';
		}
		if (name != '&hellip;') name = titleCase(name);
		// show a tooltip on mouse hover
		if (name) {
			var toolTip = '<b>' + name + '</b>';
			if (e.tags.name) toolTip += '<br><i>' + e.tags.name + '</i>';
			else if (e.tags['addr:housename'] && e.tags['addr:street']) toolTip += '<br><i>' + e.tags['addr:housename'] + ', ' + e.tags['addr:street'] + '</i>';
			else if (e.tags['addr:housenumber'] && e.tags['addr:street']) toolTip += '<br><i>' + e.tags['addr:housenumber'] + ' ' + e.tags['addr:street'] + '</i>';
			else if (e.tags.ref) toolTip += '<br><i>' + e.tags.ref + '</i>';
			else if (e.tags.operator) toolTip += '<br><i>' + e.tags.operator + '</i>';
			if (e.tags.image) toolTip += ' <i style="color:#808080;" class="fa fa-picture-o fa-fw"></i>';
			marker.bindTooltip(toolTip, { direction: 'left', offset: [-15, -2] });
		}
		// check if already defined poi
		if (poi) {
			// create pop-up
			markerPopup = poi.tagParser ? poi.tagParser(e, name) : generic_poi_parser(e, name);
			// show pop-up
			marker.bindPopup(markerPopup, customOptions);
			// check if coming from reverseQuery
			if (rQuery) {
				marker.addTo(this.instance).openPopup();
				markerId = e.type.slice(0, 1) + e.id;
			}
			// marker from group poi
			else {
				marker.addTo(this.instance);
				setPoiList();
			}
		}
		else if (rQuery) {
			// single generic marker
			markerPopup = generic_poi_parser(e, name);
			marker.bindPopup(markerPopup, customOptions);
			marker.addTo(this.instance).openPopup();
			markerId = e.type.slice(0, 1) + e.id;
		}
		else if ($('#inputDebug').is(':checked')) {
			// custom overpass query
			markerPopup = generic_poi_parser(e, name);
			marker.bindPopup(markerPopup, customOptions);
			marker.addTo(this.instance);
			setPoiList();
		}
		rQuery = false;
	}
	// output list of pois in sidebar
	if (poiList.length) {
		// sort by distance or name
		poiList.sort(function(a, b) {
			if (a.distance) return (a.distance > b.distance) ? 1 : -1;
			else return (a._tooltip._content > b._tooltip._content) ? 1 : -1;
		});
		$('.poi-results, .poi-icons').css('height', 'calc(50% - 25px)');
		if ($(window).width() < 768) $('#btnPoiResultsClear').show();
		var openColour, poiResultsList = '<table>';
		for (c = 0; c < poiList.length; c++) {
			if (poiList[c].state === true) openColour = 'background-color: rgba(0,128,0,0.5);';
			else if (poiList[c].state === false) openColour = 'background-color: rgba(255,0,0,0.5);';
			else if (poiList[c].state === 'depends') openColour = 'background-color: rgba(128,128,128,0.5);';
			else openColour = '';
			poiResultsList += '<tr id="poi-result-' + c + '">' +
				'<td style="' + openColour + '"><img src="' + poiList[c]._icon.src + '"></td>' +
				'<td>' + poiList[c]._tooltip._content + '</td>' +
				'<td>' + poiList[c].facilities + '</td>';
			if (poiList[c].distance) {
				if ($('#inputUnit').is(':checked')) {
					if (poiList[c].distance < 1000) poiResultsList += '<td>' + Math.round(poiList[c].distance) + ' m</td>';
					else poiResultsList += '<td>' + Math.round((poiList[c].distance / 1000) * 100) / 100 + ' km</td>';
				}
				else {
					if (poiList[c].distance < 800) poiResultsList += '<td>' + Math.round(poiList[c].distance / 0.9144) + ' yd</td>';
					else poiResultsList += '<td>' + Math.round((poiList[c].distance / 1609.34) * 100) / 100 + ' mi</td>';
				}
			}
			poiResultsList += '</tr>';
		}
		poiResultsList += '</table>';
		$('.poi-results-list').html(poiResultsList);
		// interact with map
		$('.poi-results-list tr').hover(
			function () { poiList[this.id.split('poi-result-')[1]].openTooltip(); },
			function () { poiList[this.id.split('poi-result-')[1]].closeTooltip(); }
		);
		$('.poi-results-list tr').click(function () {
			if ($(window).width() < 768) sidebar.close();
			else map.flyTo(poiList[this.id.split('poi-result-')[1]]._latlng);
			poiList[this.id.split('poi-result-')[1]].closePopup().openPopup();
		});
		if (poiList[0].distance) $('.poi-results h3').html($('.leaflet-marker-icon').length + ' results by distance');
		else $('.poi-results h3').html($('.leaflet-marker-icon').length + ' results by name');
		if (poiList.length === maxOpResults) $('.poi-results h3').append('<br>(too many results to show)');
	}
}
