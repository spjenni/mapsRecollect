/**
 * LSHTM Google maps functionality has 2 functions to control adding markers to
 * the bounding box recollect metadata field
 * One function to add all eprint markers to a view on the main page.
 */

jQuery.noConflict();

/**
 * jQuery function required to stop form submission when enter is pressed in the
 * google maps search box
 */
jQuery(document).on('keyup keypress', 'form input[type="text"]', function(e) {
  if(e.keyCode == 13) {
    e.preventDefault();
    return false;
  }
});

function select_map(){
	
	if(document.getElementById("ep_map_frame")){
		map_draw();
	}
}

/**
 * function map_draw
 * 
 * main deposit map driver. Set up all interface panels
 * and draws current locations on the map from the EPrint form fields
 */
function map_draw(){

	var mapOptions = {
		center: { lat: 51.520614, lng: -0.13002},
		zoom: 2,
		mapTypeControl: false,
    };
    
	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
    //////////////////////////////////////////////////////////
    //switch to decide if an eprints interface for input boxes 
    //or a map interface. The drawing menu will still added
    var eprintsInterface = true;
    //////////////////////////////////////////////////////////
   
    var numRectangles = 0;
	var markers = [];
	var sMarkers = [];
 
    var dm = create_draw_manager(map);
	
	//call to all functions needed to add the menu to the map.
    setInterface(getNumFields(), eprintsInterface);
	
	function setInterface(numFields, eprintsInterface)
	{
		addBoxesMap(map, numFields, eprintsInterface);
		set_menu(dm, numFields, map); 
	}
	
	//set up the initial latlng for setting the global latlng
	if(LocationsObject.getLocationEmpty(0) == false){
		
		var location = LocationsObject.getLocation(0);
		
		var ne = location.getBounds().getNorthEast();
		var sw = location.getBounds().getSouthWest();
		
		LocationsObject.setNewWorkingLatLng(ne.lat(), ne.lng(), sw.lat(), sw.lng());
	}
	
	/* search box functionality */
	var input = (document.getElementById('pac-input'));
	
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

	var searchBox = new google.maps.places.SearchBox((input));

	google.maps.event.addListener(searchBox, 'places_changed', function() {
		var places = searchBox.getPlaces();

		if (places.length == 0)
		{
			return;
		}
		for (var i = 0, marker; marker = markers[i]; i++)
		{
			marker.setMap(null);
		}

		// For each place, get the icon, place name, and location.
		var bounds = new google.maps.LatLngBounds();
		
		for (var i = 0, place; place = places[i]; i++)
		{
			var image = {
				url: place.icon,
				size: new google.maps.Size(171, 171),
				origin: new google.maps.Point(0, 0),
				anchor: new google.maps.Point(17, 34),
				scaledSize: new google.maps.Size(25, 25)
			};

			// Create a marker for each place.
			var markerSearch = new google.maps.Marker({
				 map: map,
				 icon: image,
				 title: place.name,
				 position: place.geometry.location
			 });

			sMarkers.push(markerSearch);
			bounds.extend(place.geometry.location);
		}
		map.fitBounds(bounds);
	});
	
	//End of search box functionality
	google.maps.event.addListener(map, 'bounds_changed', function() {
		var bounds = map.getBounds();
		searchBox.setBounds(bounds);
	});
}

//Module pattern used to create a location object which holds
//all of the data and methods to draw and edit location rectangles
//on the map
var LocationsObject = function(){
	
	var locations = [];
	var tags = [];
	var numLocations = 0;
	var workingLocation = 0;
	var workingLatLng = [];
	var fullMapLatLngBounds = new google.maps.LatLngBounds();
	var showEprintsInterface = true;
	var msg = [
		'Status: drawing location ', //needs loc attachment
		'Status: editing location ', //needs loc attachment
		'Status: showing all current locations >',
		'Status: all locations deleted',
		'Menu: add, edit, or delete a location >',  
	];
	
	init = function(fields, eprintsInt, map)
	{
		for(var i = 0; i<fields; i++)
		{
			locations.push({
				empty:true,
				location: null,
				locationId:'locationTag_'+(i+1),
			});
			tags[i] = null;
		}
		showEprintsInterface = eprintsInt;
	}
	
	getLocationsLength = function(){
		return locations.length;
	}
	
	getNumLocations = function(){
		return numLocations;
	}
	
	setLocationEmpty = function(loc){
		locations[loc].empty = true;
		locations[loc].location = null;
		tags[loc].hide();
		resetFarthest();
		numLocations = numLocations - 1;
	}
	
	getLocationEmpty = function(loc){
		return locations[loc].empty;
	}
	
	setLocation = function(locNum, rectangle, map){
		locations[locNum].location = rectangle;
		if(tags[locNum] == null)
		{
			tags[locNum] = createLocationTag(locNum, map, rectangle);
		}
		else
		{
			tags[locNum].move(getNewTagLocation(rectangle)); 
		}
		addToMapBounds(rectangle);
		locations[locNum].empty = false;
		numLocations = numLocations + 1;
	}
	
	addToMapBounds = function(rectangle){
		
		var ne = rectangle.getBounds().getNorthEast();
		var sw = rectangle.getBounds().getSouthWest();
		
		fullMapLatLngBounds.extend(new google.maps.LatLng(ne.lat(), ne.lng()));
        fullMapLatLngBounds.extend(new google.maps.LatLng(sw.lat(), sw.lng()));
	}
	
	getFarthest = function(){
		
		return fullMapLatLngBounds;
	}
	
	resetFarthest = function(){
		
		fullMapLatLngBounds = null;
		fullMapLatLngBounds = new google.maps.LatLngBounds();
		
		for(var i = 0; i<locations.length; i++){
			if(locations[i].empty == false){
	
				var tempLoc = locations[i].location;
				var ne = tempLoc.getBounds().getNorthEast();
				var sw = tempLoc.getBounds().getSouthWest();
		
				fullMapLatLngBounds.extend(new google.maps.LatLng(ne.lat(), ne.lng()));
				fullMapLatLngBounds.extend(new google.maps.LatLng(sw.lat(), sw.lng()));
			}
		}
		fullMapLatLngBounds  
	}
	
	getLocation = function(loc){
		return locations[loc].location;
	}
	
	getLocationValues = function(loc){
		var thisLoc = locations[loc].location;
		var ne = thisLoc.getBounds().getNorthEast();
		var sw = thisLoc.getBounds().getSouthWest();
		
		return [ne.lat(), ne.lng(), sw.lat(), sw.lng()];
	}
	
	setWorkingLatLng = function(){
		workingLatLng[0] = document.getElementsByClassName("ep_eprint_bounding_box_north_edge")[workingLocation].value;
		workingLatLng[1] = document.getElementsByClassName("ep_eprint_bounding_box_east_edge")[workingLocation].value;
						
		workingLatLng[2] = document.getElementsByClassName("ep_eprint_bounding_box_south_edge")[workingLocation].value;
		workingLatLng[3] = document.getElementsByClassName("ep_eprint_bounding_box_west_edge")[workingLocation].value;
	}
	
	setNewWorkingLatLng = function(neLat, neLng, swLat, swLng){
		workingLatLng[0] = neLat;
		workingLatLng[1] = neLng;
		workingLatLng[2] = swLat;
		workingLatLng[3] = swLng;
	}
	
	getWorkingLatLngBounds = function(){
		var current_bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(workingLatLng[2], workingLatLng[3]),
				new google.maps.LatLng(workingLatLng[0], workingLatLng[1])
			);
		return current_bounds;
	}
	
	setWorkingLocation = function(locNum){
		workingLocation = locNum;
	}
	
	getWorkingLocation = function(){
		return workingLocation;
	}
	getLocationTag = function(loc){
			return locations[loc].locationTag;
	}
	
	getEprintsInterface = function(){
		return showEprintsInterface;
	}
	
	/*methods for the tag array*/
	getTag = function(loc){
		return tags[loc];
	}
	
	resetTag = function(loc, map, newPos){
		tags[loc].move(newPos);
	}
	
	getNewTagLocation = function(rectangle){
		var ne = rectangle.getBounds().getNorthEast();
		var sw = rectangle.getBounds().getSouthWest();
		var position = new google.maps.LatLng(ne.lat(), sw.lng());
	
		return position;
	}
	
	/*methods for the msg array*/
	getMsg = function(ms){
		return msg[ms];
	}
	
	return{
		init:init,
		getLocationsLength:getLocationsLength,
		getNumLocations:getNumLocations,
		setLocationEmpty:setLocationEmpty,
		getLocationEmpty:getLocationEmpty,
		setLocation:setLocation,
		getFarthest:getFarthest,
		getLocation:getLocation,
		getLocationValues:getLocationValues,
		setWorkingLatLng:setWorkingLatLng,
		setNewWorkingLatLng:setNewWorkingLatLng,
		getWorkingLatLngBounds:getWorkingLatLngBounds,
		setWorkingLocation:setWorkingLocation,
		getWorkingLocation:getWorkingLocation,
		getLocationTag:getLocationTag,
		getEprintsInterface:getEprintsInterface,
		//setTag:setTag,
		getTag:getTag,
		resetTag:resetTag,
		getMsg:getMsg
	}
}();

/**
 * function getNumFields
 * 
 * Helper function to count the number of location form box groups
 * on EPrints deposit menu
 */
function getNumFields()
{
	return document.getElementsByClassName("ep_eprint_bounding_box_north_edge").length;
}

/**
 * function set_menu
 * 
 * Create all the map controls:
 * 		msg_panel - for all messages
 * 		save_panel for the yes or canel selection
 */
function set_menu(dm, no_fields, map, eprintsInterface) {
	
	var ctrl_panel = document.createElement('div');
	//allow eprints bounding box fields to be hidden
	if(LocationsObject.getEprintsInterface() == false){
		
		//switch off the input fields in the eprints deposit form
		var table = jQuery( "input[id$='north_edge']").closest( "table" ).hide();
		
		var locBoxes = document.createElement('div');
		locBoxes.setAttribute('id','locBoxes');
		
		var boxLocInput = document.createElement('input');
		boxLocInput.setAttribute('type','text');
		boxLocInput.setAttribute('id','mapInput');
		boxLocInput.classList.add("locInput");
		locBoxes.appendChild(boxLocInput);
		
		var boxNe = document.createElement('input');
		boxNe.setAttribute('type','text');
		boxNe.setAttribute('id','mapNe');
		boxNe.classList.add("mapBoxes");
		locBoxes.appendChild(boxNe);
		
		var boxNw = document.createElement('input');
		boxNw.setAttribute('type','text');
		boxNw.setAttribute('id','mapNw');
		boxNw.classList.add("mapBoxes");
		locBoxes.appendChild(boxNw);
		
		var boxSe = document.createElement('input');
		boxSe.setAttribute('type','text');
		boxSe.setAttribute('id','mapSe');
		boxSe.classList.add("mapBoxes");
		locBoxes.appendChild(boxSe);
		
		var boxSw = document.createElement('input');
		boxSw.setAttribute('type','text');
		boxSw.setAttribute('id','mapSw');
		boxSw.classList.add("mapBoxes");
		locBoxes.appendChild(boxSw);
		
		map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locBoxes);
	}
 
	//set up a control panel to swap the menu and save_panel in the same postion
	ctrl_panel.classList.add("ctrl_panel");
	ctrl_panel.setAttribute('id', 'ctrl_panel');
	
	//set up a current status panel
	var msg_panel = document.createElement('div');
	msg_panel.classList.add("msg_panel");
	msg_panel.setAttribute('id','msg_panel');
	msg_panel.appendChild(document.createTextNode(LocationsObject.getMsg(4)));

	//set up a hidden save panel with listeners
	var save_panel = document.createElement('div');
	save_panel.setAttribute('id','save_panel');
	save_panel.classList.add("hide_panel");

	var save_text = document.createElement('div');
	save_text.appendChild(document.createTextNode('Save the location?'));
	
	var yes_save_button = document.createElement('div');
	var no_save_button = document.createElement('div');
	
	var yes_save_a = document.createElement('a');
	var no_save_a = document.createElement('a');
	yes_save_a.appendChild(document.createTextNode('Save'));
	no_save_a.appendChild(document.createTextNode('Cancel'));
	yes_save_a.setAttribute('id','yes_save_a');
	no_save_a.setAttribute('id','no_save_a');
	yes_save_button.appendChild(yes_save_a);
	no_save_button.appendChild(no_save_a);
	
	save_panel.appendChild(save_text);
	save_panel.appendChild(yes_save_button);
	save_panel.appendChild(no_save_button);
	
	//save listener
	yes_save_a.addEventListener('click', function(){
		visibility_primary_nav(true);
		resetShape(map, true);
		set_msg_panel(4, 0, false);
	});
	
	//cancel listener
	no_save_a.addEventListener('click', function(){
		visibility_primary_nav(true);
		resetShape(map, false);
		set_msg_panel(4, 0, false);
		clearInputs();
	});
	
	//set up the canel_panel with listeners
	//this mimics a map drawing control button
	var cancel_panel = document.createElement('div');
	cancel_panel.classList.add("hide_panel");
	cancel_panel.setAttribute('id','cancel_panel');

	var cancel_a = document.createElement('a');
	cancel_a.appendChild(document.createTextNode('X'));
	cancel_a.setAttribute('id','cancel_a');

	//add listener to canel a location drawing
	cancel_panel.addEventListener('click', function(){
		resetAll();
		clearInputs();
		set_msg_panel(4, 0, false);
		map.setCenter({ lat: 51.520614, lng: -0.13002});
		map.setZoom(2);
		visibility_primary_nav(true);
		set_cancel_panel(false);
		dm.setOptions({
			drawingControl: false,
		});
	});
	
	cancel_panel.appendChild(cancel_a);

	//set up the main menu (lsit)
	var main_menu_div = document.createElement('div');
	main_menu_div.setAttribute('id','primary_nav_wrap');

	var list = document.createElement('ul');
	var list_h1 = document.createElement('li');
	list_h1.setAttribute('class','current_menu_item');
	
	var list_h1_a = document.createElement('a');
	var list_h1a_title = document.createTextNode('Edit locations');
	list_h1_a.appendChild(list_h1a_title);
	list_h1.appendChild(list_h1_a);
	
	list.appendChild(list_h1);
	
	//set up the first deep menu item
	var list_inner_2 = document.createElement('ul');
	
	var list_h2 = document.createElement('li');
	var inner_a_1 = document.createElement('a');
	inner_a_1.appendChild(document.createTextNode('View locations'));
	inner_a_1.setAttribute('id','show_all');
	
	//add first menu item
	list_h2.appendChild(inner_a_1);
	list_inner_2.appendChild(list_h2);
	
	//add show all boxes listener
	inner_a_1.addEventListener('click', function(){
		resetAll();
		set_msg_panel(2, 0, false);
		clearInputs();
		
		if(LocationsObject.getNumLocations() > 0){
			map.fitBounds(LocationsObject.getFarthest());
		}else{
			map.setCenter({ lat: 51.520614, lng: -0.13002});
			map.setZoom(2);
		}
	});

	//set up the rest of the menu items
	for(var i = 0; i < no_fields;i++)
	{	
		var list_h2_next = document.createElement('li');
		list_h2_next.setAttribute('id', 'iList_'+i);
		
		list_h2_next.style.cursor = 'pointer';	
		
		var inner_next = document.createElement('a');
		
		//highlight function
		(function (_i) {
			inner_next.addEventListener('click', function(){
				if(LocationsObject.getLocationEmpty(_i) == false){
					resetAll();
					map.fitBounds(LocationsObject.getFarthest());
					LocationsObject.getLocation(_i).setOptions({fillColor: '#FFFF00'});
					document.getElementById('loc_box_' + _i).style.backgroundColor = '#000';
					fillInputs(_i);
				}
				else
				{
					clearInputs();
					resetAll();
				}
			});
		})(i);
	
		if(LocationsObject.getLocationEmpty(i) == false)
		{
			inner_next.appendChild(document.createTextNode('Location '+(i+1)+ ': set'));
			list_h2_next.classList.add('list_set');
		}
		else
		{
			inner_next.appendChild(document.createTextNode('Location '+(i+1)));
			list_h2_next.classList.add('list_not_set');
		}
		
		var id_string = 'list_2_'+i;
		inner_next.setAttribute('id',id_string);
		
		list_h2_next.appendChild(inner_next);
		
		var inner_inner_list = document.createElement('ul');

		var inner_inner_h1 = document.createElement('li');
		var inner_inner_h2 = document.createElement('li');
		var inner_inner_h3 = document.createElement('li');
			
		var inner_inner_a1 = document.createElement('a');
		var inner_inner_a2 = document.createElement('a');
		var inner_inner_a3 = document.createElement('a');
			
		inner_inner_a1.appendChild(document.createTextNode('draw'));
		inner_inner_a2.appendChild(document.createTextNode('edit'));
		inner_inner_a3.appendChild(document.createTextNode('delete'));
		
		inner_inner_a1.setAttribute('id','act_2_'+i+'n');
		inner_inner_a2.setAttribute('id','act_2_'+i+'e');
		inner_inner_a3.setAttribute('id','act_2_'+i+'d');
		
		inner_inner_a1.classList.add('btn_link');
		inner_inner_a2.classList.add('btn_link');
		inner_inner_a3.classList.add('btn_link');
		
		//draw button function
		(function (_i) {
			inner_inner_h1.addEventListener('click', function(){
				LocationsObject.setWorkingLocation(_i);
				clearAll();
				clearInputs();
				visibility_primary_nav();
				set_msg_panel(0, _i, true);
				set_cancel_panel(true);
				
				dm.setOptions({
					drawingControl: true,
				});
				dm.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
			});
		})(i);
		
		//edit_button_function
		(function (_i) {
			inner_inner_h2.addEventListener('click', function(){
				set_options_edit(_i, map);
				fillInputs(_i);
				visibility_primary_nav(false);
				set_msg_panel(1, _i, true);
			});
		})(i);
		
		//delete button function
		(function (_i) {
			inner_inner_h3.addEventListener('click', function(){
				
				//alert for delete confirm
				var r = confirm("Are you sure you want to delete location " + (_i+1) + "?");
				if (r == true) {
					deleteShape(LocationsObject.getLocation(_i), _i);
					clearInputs();
					dm.setDrawingMode(null);
					LocationsObject.getTag(_i).hide();
					list_h2_next.style.cursor = 'default';	
					
				}
			});
		})(i);

		//append all of the required buttons
		inner_inner_h1.appendChild(inner_inner_a1);
		inner_inner_h2.appendChild(inner_inner_a2);
		inner_inner_h3.appendChild(inner_inner_a3);
		
		//set buttons to show or hide
		if(LocationsObject.getLocationEmpty(i) == false)
		{
			inner_inner_h1.classList.add('hide_btn');
		}
		else
		{
			inner_inner_h2.classList.add('hide_btn');
			inner_inner_h3.classList.add('hide_btn');
		}
		
		inner_inner_list.appendChild(inner_inner_h1);
		inner_inner_list.appendChild(inner_inner_h2);
		inner_inner_list.appendChild(inner_inner_h3);
		
		list_h2_next.appendChild(inner_inner_list);
		list_inner_2.appendChild(list_h2_next);
	}
	list_h1.appendChild(list_inner_2);
	
	var list_h3 = document.createElement('li');
	var inner_a_3 = document.createElement('a');
	inner_a_3.appendChild(document.createTextNode('Delete all'));
	inner_a_3.setAttribute('id','show_all');
	
	//add first menu item
	list_h3.appendChild(inner_a_3);
	list_inner_2.appendChild(list_h3);
	
	//delete all boxes listener
	inner_a_3.addEventListener('click', function(){
		deleteAll();
		map.setCenter({ lat: 51.520614, lng: -0.13002});
		map.setZoom(2);
	});

	//add the menu and the other panels to the ctrl_panel
	main_menu_div.appendChild(list);
	ctrl_panel.appendChild(main_menu_div);
	ctrl_panel.appendChild(save_panel);
	ctrl_panel.appendChild(cancel_panel);

	//add the controls to the TOP_RIGHT control positon of the map
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(ctrl_panel);
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(msg_panel);
}

/**
 * function create_draw_manager
 * 
 * Function to create the draw manager tha will be used to
 * draw the location boxes onto the map
 */
function create_draw_manager(map){
	
	//create a universal drawing manager
	var dm = new google.maps.drawing.DrawingManager({
			drawingControl: false,
			drawingControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT,
				drawingModes: [google.maps.drawing.OverlayType.RECTANGLE],
			},
		
		rectangleOptions:{
			fillColor: 'blue',
			fillOpacity: 0.3,
			strokeColor: '#000000',
			strokeWeight: 0.5,
			clickable: true,
			editable: false,
			zIndex: 1
		},
	});
	dm.setMap(map);

	google.maps.event.addListener(dm,'rectanglecomplete',function(rectangle)
	{
		var ne = rectangle.getBounds().getNorthEast();
		var sw = rectangle.getBounds().getSouthWest();
		var confirm_string = 'Do you want to save this bounding box as a new location?';
		
		var current_box = LocationsObject.getWorkingLocation();
		
		var r = confirm(confirm_string);
		if (r == true) 
		{
			x = "Save";
			
			LocationsObject.setLocation(current_box, rectangle, map); //add the rectangle to the array
		
			attach_listeners(map, current_box);
			dm.setDrawingMode(null);
			
			document.getElementsByClassName("ep_eprint_bounding_box_north_edge")[current_box].value = ne.lat();
			document.getElementsByClassName("ep_eprint_bounding_box_east_edge")[current_box].value = ne.lng();
			
			document.getElementsByClassName("ep_eprint_bounding_box_south_edge")[current_box].value = sw.lat();
			document.getElementsByClassName("ep_eprint_bounding_box_west_edge")[current_box].value = sw.lng();

			rectangle.setMap(map);
			
			//reset the menu
			set_class_box(current_box, true);
			LocationsObject.setWorkingLocation(current_box);
			//LocationsObject.getTag(current_box).show();
			visibility_primary_nav(true);
			set_msg_panel(4, 0, false); 
			fillInputs(current_box);
			resetAll();
			dm.setOptions({
				drawingControl: false //hide the drawing controls
			});
			set_cancel_panel(false); //hide cancel_panel
		}
		else 
		{
			rectangle.setMap(null); //if cancelled don't add the rectangle
		}
	});
	return dm;

}

/**
 * function addBoxesMap
 * 
 * Function to extract location values form the EPrints deposit form
 * and plot the current boxes onto the map
 */
function addBoxesMap(map, numNewRectangles, eprintsInterface){
    
	LocationsObject.init(numNewRectangles, eprintsInterface, map);
	
	for(var i=0; i < numNewRectangles; i++)
	{
		var neLat = document.getElementsByClassName("ep_eprint_bounding_box_north_edge")[i].value;
		
		if(neLat != "")
		{
			var neLng = document.getElementsByClassName("ep_eprint_bounding_box_east_edge")[i].value;
			
			var swLat = document.getElementsByClassName("ep_eprint_bounding_box_south_edge")[i].value;
			var swLng = document.getElementsByClassName("ep_eprint_bounding_box_west_edge")[i].value;

			/* create bounds object */
			var current_bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(swLat, swLng),
				new google.maps.LatLng(neLat, neLng)
			);

			/* use the bounds to draw the rectangle */
			var rectangle = new google.maps.Rectangle({
				strokeColor: '#000000',
				editable: false,
				clickable: true,
				strokeWeight: 0.3,
				fillColor: 'blue',
				fillOpacity: 0.3,
				bounds: current_bounds,
			});
			
			LocationsObject.setLocation(i, rectangle, map);
			//LocationsObject.setTag(i, map);
			rectangle.setMap(map);
			attach_listeners(map, i);
			
		}
	}
	//can be used to zoom map to one location if only one is present
	//if(LocationsObject.getNumLocations() == 0)
	//{
	//	map.fitBounds(LocationsObject.getFarthest());
	//}

	//resetAll();
}

/**
 * function attach_listeners
 * 
 * function to attach the required listeners to each location box on the map
 */
function attach_listeners(map, loc)
{
	google.maps.event.addListener(LocationsObject.getLocation(loc),'click',function(){
		if(LocationsObject.getLocationEmpty(loc) == false){
			resetAll();
			map.fitBounds(LocationsObject.getFarthest());
			LocationsObject.getLocation(loc).setOptions({fillColor: '#FFFF00'});
			document.getElementById('loc_box_' + loc).style.backgroundColor = '#000';
			fillInputs(loc);
		}
		else
		{
			clearInputs();
			resetAll();
		}
		
		/*use this code if you wish a box click to enter edit mode/*
		/*
		LocationsObject.setWorkingLocation(loc);
		fillInputs(loc);
		set_options_edit(loc, map);
		visibility_primary_nav(false);
		set_msg_panel(1, loc, true);
		*/
	});
	
	google.maps.event.addListener(LocationsObject.getLocation(loc), 'bounds_changed', function(event){
		fillInputs(loc);
	});
}

/**
 * function createLocationTag
 * 
 * function to set the location panel which attaches to each box
 * and gives the location number.
 */
 function createLocationTag(box, map, rectangle){
		
	var theTag;
	var ne;
	var sw;
	var position;
	
	var main_loc = document.createElement('div');
	main_loc.setAttribute('id','loc_box_' + box);
	main_loc.classList.add('show_data_panel');
	
	var loc_txt_p = document.createElement('p');
	var loc_txt = document.createTextNode(box+1);
	loc_txt_p.appendChild(loc_txt);
	
	main_loc.appendChild(loc_txt_p);
	
	main_loc.addEventListener('click', function(){
		if(LocationsObject.getLocationEmpty(box) == false){
			resetAll();
			map.fitBounds(LocationsObject.getFarthest());
			LocationsObject.getLocation(box).setOptions({fillColor: '#FFFF00'});
			document.getElementById('loc_box_' + box).style.backgroundColor = '#000';
			fillInputs(box);
		}
		else
		{
			clearInputs();
			resetAll();
		}
	});
	ne = rectangle.getBounds().getNorthEast();
	sw = rectangle.getBounds().getSouthWest();
	position = new google.maps.LatLng(ne.lat(), sw.lng());	
	
	theTag = new TxtOverlay(position, main_loc, "locationTag", map);
	
	return theTag;	
}

/**
 * function set_save_message
 * 
 * function to show the save/cancel panel when needed
 */
function set_save_message(loc){
		
		if(LocationsObject.getLocationEmpty(loc) == false)
		{
			document.getElementById('loc_box_' + loc).className = 'show_data_panel';
		}
}

/**
 * function set_options_edit
 * 
 * function to set one shape as the editable shape, fades other locations
 */
function set_options_edit(loc, map)
{
	var thisLocation = LocationsObject.getLocation(loc);
	LocationsObject.setWorkingLocation(loc);
	clearAll();

	//set the global latlng
	LocationsObject.setWorkingLatLng(loc);
	
	LocationsObject.getTag(loc).hide();
	
	if(LocationsObject.getLocationEmpty(loc) == false)
	{
		thisLocation.setOptions({fillColor: 'green'});
		thisLocation.setOptions({fillOpacity: 0.2});
		thisLocation.setOptions({strokeWeight: 0.5});
		thisLocation.setOptions({clickable: false});
		thisLocation.setOptions({editable: true});
		thisLocation.setOptions({zIndex: 1});
		
		var current_bounds = new google.maps.LatLngBounds(
				thisLocation.getBounds().getSouthWest(),
				thisLocation.getBounds().getNorthEast()
		);
		map.fitBounds(current_bounds);
	}
}

/**
 * function resetAll
 * 
 * function to set all the boxes as unediable
 */
function resetAll(){
	
	var locationsNum = LocationsObject.getLocationsLength();
	
	for(var i=0; i < locationsNum; i++)
	{	
		var thisLocation = LocationsObject.getLocation(i);
		if(LocationsObject.getLocationEmpty(i) == false)
		{
			thisLocation.setEditable(false);
			thisLocation.setOptions({strokeColor: '#000000'});
			thisLocation.setOptions({clickable: true});
			thisLocation.setOptions({editable: false});
			thisLocation.setOptions({strokeWeight: 0.3});
			thisLocation.setOptions({fillColor: 'blue'});
			thisLocation.setOptions({fillOpacity: 0.3});
	
			LocationsObject.getTag(i).show();
			if(document.getElementById('loc_box_'+ i) != null){
				document.getElementById('loc_box_'+ i).style.backgroundColor = '#3385FF';
			}
			
		}
	}	
}

/**
 * function resetShape
 *
 * funstion to set 1 single box as uneditable
 */
function resetShape(map, new_box){

	var current_bounds;
	var i = LocationsObject.getWorkingLocation();
	
	if(LocationsObject.getLocationEmpty(i) == false)
	{
		if(new_box == false)
		{
			LocationsObject.getLocation(i).set("bounds",LocationsObject.getWorkingLatLngBounds());
		}
		else
		{
			var ne = LocationsObject.getLocation(i).getBounds().getNorthEast();
			var sw = LocationsObject.getLocation(i).getBounds().getSouthWest();
		
			current_bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(sw.lat(), sw.lng()),
				new google.maps.LatLng(ne.lat(), ne.lng())
			);
			document.getElementsByClassName("ep_eprint_bounding_box_north_edge")[i].value = ne.lat();
			document.getElementsByClassName("ep_eprint_bounding_box_east_edge")[i].value = ne.lng();
			
			document.getElementsByClassName("ep_eprint_bounding_box_south_edge")[i].value = sw.lat();
			document.getElementsByClassName("ep_eprint_bounding_box_west_edge")[i].value = sw.lng();
			
			var newPos = new google.maps.LatLng(ne.lat(), sw.lng());
			LocationsObject.resetTag(i, map, newPos);
		}
		LocationsObject.getLocation(i).map_changed();
		
		LocationsObject.getLocation(i).setEditable(false);
		LocationsObject.getLocation(i).setOptions({strokeColor: '#000000'});
		LocationsObject.getLocation(i).setOptions({clickable: true});
		LocationsObject.getLocation(i).setOptions({editable: false});
		LocationsObject.getLocation(i).setOptions({strokeWeight: 0.3});
		LocationsObject.getLocation(i).setOptions({fillColor: 'blue'});
		LocationsObject.getLocation(i).setOptions({fillOpacity: 0.3});

		//LocationsObject.getTag(i).show();
		resetAll();
	}
}

/**
 * function clearAll
 * 
 * Will set all of the boxes as unediable on the map
 */
function clearAll()
{
	for(var i=0; i < LocationsObject.getLocationsLength(); i++)
	{
		
		if(LocationsObject.getLocationEmpty(i) == false)
		{
			var thisLocation = LocationsObject.getLocation(i);
			
			thisLocation.setEditable(false);
			thisLocation.setOptions({clickable: false});
			thisLocation.setOptions({editable: false});
			thisLocation.setOptions({fillColor: 'red'});
			thisLocation.setOptions({strokeWeight: 0.3});
			thisLocation.setOptions({fillOpacity: 0.1});
			
			LocationsObject.getTag(i).hide();
		}
	}
}

/**
 * function deleteShape
 * 
 * Deletes the current location box from the map and the 
 * deposit form
 */
function deleteShape(box, id)
{
	box.setMap(null);
	LocationsObject.setLocationEmpty(id);
	document.getElementsByClassName("ep_eprint_bounding_box_north_edge")[id].value = "";
	document.getElementsByClassName("ep_eprint_bounding_box_east_edge")[id].value = "";
	document.getElementsByClassName("ep_eprint_bounding_box_south_edge")[id].value = "";
	document.getElementsByClassName("ep_eprint_bounding_box_west_edge")[id].value = "";
	
	//update the menu item to refect current deleted state
	set_class_box(id, false);
	LocationsObject.getTag(id).hide();
}

/**
 * function deleteAll_shapes
 * 
 * function to remove all of the boxes from the map. Has alert check.
 */
function deleteAll()
{
	//alert for delete confirm
	var r = confirm("Are you sure you want to delete all of the locations?");
	if (r == true) {
		set_msg_panel(3, 0, false);					
		
		for(var i=0; i < LocationsObject.getLocationsLength(); i++)
		{	
			if(LocationsObject.getLocationEmpty(i) == false)
			{	
				deleteShape(LocationsObject.getLocation(i), i);
			}
		}
		clearInputs();
	}	
}

/**
 * function visibility_primary_nav
 * 
 * function to show or hide the main menu as required
 */
function visibility_primary_nav(vis)
{
	if(vis==false){
		document.getElementById('primary_nav_wrap').className = 'primary_nav_wrap_hide';
		document.getElementById('save_panel').className = 'show_save_panel';
		
	}
	else if(vis==true){
		document.getElementById('save_panel').className = 'hide_panel';
		document.getElementById('primary_nav_wrap').className = 'primary_nav_wrap_show';
	}
	else{
		document.getElementById('primary_nav_wrap').className = 'primary_nav_wrap_hide';
		document.getElementById('save_panel').className = 'hide_panel';
	}
}

/**
 * function set_class_box
 * 
 * This function sets the menu buttons to the correct show/hide
 * settings depeding upon the presence of a location box for each
 * of the locations
 */
function set_class_box(box, present)
{
	var identity_box = "act_2_" + box;
	var identity_loc = "list_2_" + box;
	
	if(present == true){
		document.getElementById(identity_box + "n" ).parentNode.className = "hide_btn";
		document.getElementById(identity_box + "e" ).parentNode.className = "show_btn";
		document.getElementById(identity_box + "d" ).parentNode.className = "show_btn";
		
		document.getElementById(identity_loc).className = "list_set";
		document.getElementById(identity_loc).innerHTML = "Location " + (box+1) + ": set";
	}
	else
	{
		document.getElementById(identity_box + "n" ).parentNode.className = "show_btn";
		document.getElementById(identity_box + "e" ).parentNode.className = "hide_btn";
		document.getElementById(identity_box + "d" ).parentNode.className = "hide_btn";
	
		document.getElementById(identity_loc).className = "list_not_set";
		document.getElementById(identity_loc).innerHTML = "Location " + (box+1)
	}
}

/**
 * function set_msg_panel
 * 
 * Helper function to set the messages shown in the message
 * panel to support user interactions
 */
function set_msg_panel(m, i, attachLoc){
		if(attachLoc == false)
		{
			document.getElementById('msg_panel').innerHTML = LocationsObject.getMsg(m);
		}
		else{
			document.getElementById('msg_panel').innerHTML = LocationsObject.getMsg(m)+(i+1);
		}
}

/**
 * function set_cancel_panel
 * 
 * Helper function to switch the cancel button which mimicks
 * part of the maps drawing control buttons
 */
function set_cancel_panel(state){
	if(state == true){
		document.getElementById('cancel_panel').className = 'cancel_panel';
	}
	else{
		document.getElementById('cancel_panel').className = 'hide_panel';
	}
}

/**
 * functions fillInputs and clearInputs 
 * 
 *2 functions to show or hide the location values at the bottom of the map
 */
function fillInputs(loc){
	
	if(LocationsObject.getEprintsInterface() == false && LocationsObject.getLocationEmpty(loc) == false)
	{
		var tempValues = LocationsObject.getLocationValues(loc);
		
		document.getElementById('mapNe').value = tempValues[0];
		document.getElementById('mapNw').value = tempValues[1];
		document.getElementById('mapSe').value = tempValues[2];
		document.getElementById('mapSw').value = tempValues[3];
		document.getElementById('mapInput').value = loc+1;
		document.getElementById('locBoxes').style.display = 'block';
	}
}
function clearInputs(){

	if(LocationsObject.getEprintsInterface() == false)
	{	
		document.getElementById('locBoxes').style.display = 'none';
	}
}

/**
 * function map_show
 * 
 * Front page map which show markers plus info window, if multiple used
 * will group related location and animate on click
 */
function map_show(eprints){
	

	var mapOptions = {
		center: { lat: 10, lng: 0},
		zoom:2,
		minZoom: 2,
    };
    
	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);	
	var map_locs = document.getElementsByClassName("map_loc");
	var marker_id;

	var info_window = new google.maps.InfoWindow({
		content: "Data map",
		shadowStyle: 1, 
		disableAutoPan: false,
		boxStyle: 
		{
			opacity: 0.4,
        }, 
	});
	
	//CHECK IF ANY EPRINTS EXIST
    //loop through each eprint and create a marker and short citation 
    //for the infowindow
    if(eprints.length > 0)
    {
		var multi_marker = [];
		var current_bounce = null;
		var last_bounce = null;
		
		for(var i=0; i<eprints.length; i++)
		{     
				var current_eprint = eprints[i];
				var info_window_array = [];
				
				
				//check the eprint has bounding box metatdata
				if(current_eprint.hasOwnProperty('bounding_box'))
				{
					var ep_title = current_eprint.title;
					var new_location = [];
					
					//check for multi field
					if(typeof current_eprint.bounding_box[0] != "undefined")
					{
						for(var k=0; k<current_eprint.bounding_box.length; k++)
						{
							var ep_ne = current_eprint.bounding_box[k]["north_edge"];
							var ep_ee = current_eprint.bounding_box[k]["east_edge"];
							var ep_se = current_eprint.bounding_box[k]["south_edge"];
							var ep_we = current_eprint.bounding_box[k]["west_edge"];
							
							//get the bounds for the marker
						   // get the bounds for centering			
							var current_bounds = new google.maps.LatLngBounds(				
								new google.maps.LatLng(ep_se, ep_we),
								new google.maps.LatLng(ep_ne, ep_ee)
							);
							
							new_location.push(current_bounds);
						}
					}
					else
					{
						//get required eprint metadata, will be set by perl in the future
						var ep_ne = current_eprint.bounding_box["north_edge"];
						var ep_ee = current_eprint.bounding_box["east_edge"];
						var ep_se = current_eprint.bounding_box["south_edge"];
						var ep_we = current_eprint.bounding_box["west_edge"];
						
						//get the bounds for the marker
						   // get the bounds for centering			
							var current_bounds = new google.maps.LatLngBounds(				
								new google.maps.LatLng(ep_se, ep_we),
								new google.maps.LatLng(ep_ne, ep_ee)
							);
							new_location.push(current_bounds);
					}
					
					////////////////////////////////////////////////////////////////////////
					//metadata extraction from JSON data structure
					var ep_uri = current_eprint.uri;
					var ep_creator = "";					
					var date = current_eprint.date;
					
					//output creators object
					if(current_eprint.creators != null)
					{
						var family = "";
						var given = "";
						var intials = "";
						
						for (var n=0; n<current_eprint.creators.length; n++)
						{
							//check for presence of family and given name in each creators object
							if(current_eprint.creators[n]["name"]["family"] != null){ family = current_eprint.creators[n]["name"]["family"] }
							if(current_eprint.creators[n]["name"]["given"] != null)
							{ 
								//create single intials from the given name
								intials = ", ";
								given = current_eprint.creators[n]["name"]["given"]; 
								
								//split the given name for a max of 3 intials
								//and make sure all commas are in the correct place
								var split_given = given.split(" ", 3);
								for (var m=0; m<split_given.length; m++)
								{
									intials = intials + split_given[m].charAt(0) + " ";
								}
								intials = intials.substr(0, intials.length-1); 
							}
							ep_creator = ep_creator + family + intials + ". ";
						}
						ep_creator = ep_creator.substr(0, ep_creator.length-2); 
					}
					
					//create the html for the infowindow
					var content = '<div id="map_info">';
					if(ep_title != null){ content += '<h1 class="maps_info"><a href="' + ep_uri + '">' + current_eprint.title + '</a></h1>'};			
					//if(ep_abstract != null){ content += '<p class="maps_info_content">Abstract: ' +  ep_abstract  + '</p>'};
					
					if(ep_creator != null){ content += '<p class="maps_info_content">' +  ep_creator  + '</p>'};
					content += '<p class="maps_info_content">';
					
					if(date != null){ 
						content += '<p class="maps_info_content">(' +  date.substring(0, 4)  + ')</p>'
						
						};
					
					content += '<p class="maps_info_content">';
			
					content +="</p>";
					//if(ep_uri != null){ content += '<p class="maps_info_link"><a href="' + ep_uri + '">Metadata Record</a></p>'};
					content += '</div>';
					////////////////////////////////////////////////////////////////////////

					//set up the markers and info window
					var markers = [];
					for (var j=0; j<new_location.length; j++){
						//add marker and set content
						var marker_id = i + '_' + j;
						
						var marker = new google.maps.Marker({
							position: new_location[j].getCenter(),
							map: map,
							html: content,
							id: marker_id
						});
							
						//show marker groups
						(function (_i) {
							google.maps.event.addListener(marker, 'click', function () {
							info_window.setContent(this.html);
							info_window.open(map, this);

							change_marker_group(_i);
							});
						})(i);
						markers.push(marker);
					}
					multi_marker.push(markers);

					function change_marker_group(num)
					{
						current_bounce = num;
						
						//toggle selected group
						for(var h=0; h<multi_marker[current_bounce].length;h++)
						{
							toggleBounce(multi_marker[current_bounce][h]);
						}
						
						//toggle old group off animation state is not null
						if(last_bounce != null && last_bounce != current_bounce)
						{
							if (multi_marker[last_bounce][0].getAnimation() != null)
							{
								for(var h=0; h<multi_marker[last_bounce].length;h++)
								{
									toggleBounce(multi_marker[last_bounce][h]);
								}
							}
							last_bounce = current_bounce;
						}
						else
						{
							last_bounce = current_bounce;
						}
					}
					
					//animation toggle
					function toggleBounce(e) {
						if (e.getAnimation() != null) {
							e.setAnimation(null);
						} else {
						e.setAnimation(google.maps.Animation.BOUNCE);
					}
				}
			}
		}
	}
}

////////////////////////////////////////////////////////////////////////
/**
 * Group of functions to control the dynamic overlay
 * for each of the location boxes. The overlay will
 * not zoom on map zoom 
 */
function TxtOverlay(pos, txt, cls, map){

	// Now initialize all properties.
	this.pos = pos;
	this.txt_ = txt;
	this.cls_ = cls;
	this.map_ = map;

	// We define a property to hold the image's
	// div. We'll actually create this div
	// upon receipt of the add() method so we'll
	// leave it null for now.
	this.div_ = null;

	// Explicitly call setMap() on this overlay
	this.setMap(map);
}

TxtOverlay.prototype = new google.maps.OverlayView();

TxtOverlay.prototype.onAdd = function(){

	// Create the DIV and set some basic attributes.
	var div = document.createElement('DIV');
	div.setAttribute('id','location_info');
	div.className = this.cls_;
	div.appendChild(this.txt_);

	// Set the overlay's div_ property to this DIV.
	this.div_ = div;
	var overlayProjection = this.getProjection();
	var position = overlayProjection.fromLatLngToDivPixel(this.pos);
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
	
	// We add an overlay to a map via one of the map's panes.
	var panes = this.getPanes();
	panes.floatPane.appendChild(div);
}

TxtOverlay.prototype.draw = function(){

	var overlayProjection = this.getProjection();

	// Retrieve the southwest and northeast coordinates of this overlay
	// in latlngs and convert them to pixels coordinates.
	var position = overlayProjection.fromLatLngToDivPixel(this.pos);

	var div = this.div_;
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
}

//Optional: helper methods for removing and toggling the text overlay.  
TxtOverlay.prototype.move = function(newPos){
	if (this.div_) {
		this.pos = 	newPos;
		this.draw();
	}
}

TxtOverlay.prototype.hide = function(){
	if (this.div_) {
		this.div_.style.visibility = "hidden";
	}
}

TxtOverlay.prototype.show = function(){
	if (this.div_) {
		this.div_.style.visibility = "visible";
	}
}

TxtOverlay.prototype.toggleDOM = function(){
	if (this.getMap()) {
		this.setMap(null);
	}
	else {
		this.setMap(this.map_);
	}
}
////////////////////////////////////////////////////////////////////////

//init to call correct map for deposit or front page
google.maps.event.addDomListener(window, 'load', select_map);
