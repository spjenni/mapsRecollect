# LSHTM Plugin Options

# Google maps plugin for recollect geographical location metadata entry 
$c->{plugins}{"InputForm::Surround::Map_surround"}{params}{disable} = 0;

# for further devlopment. Eprints fields can be specified for the map popup info window
# $c->{map_information_fields} = [qw/ title abstract uri eprintid /];

# set the required number of eprint markers
$c->{eprints_loc_limit} = 30;

# Trigger to load the google maps apiv3 with drawing and location libraries enabled
# and the jQuery 1.11.0 min library + jQueryUI
$c->add_trigger( EP_TRIGGER_DYNAMIC_TEMPLATE , sub
{	
	my( %args ) = @_;

	my( $repo, $pins ) = @args{qw/ repository pins/};
	
	$pins->{"utf-8.head"} = "" if( !exists $pins->{"utf-8.head"} );

	$pins->{"utf-8.map_view"} = "" if( !exists $pins->{"utf-8.map_view"} );

	my $protocol = $repo->get_secure ? 'https':'http';
	my $base_url = $c->{base_url};
	
	$pins->{"utf-8.head"} .= <<jQuery;
	

<!-- jQuery -->
<script type="text/javascript" src="$protocol://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

jQuery

	$pins->{"utf-8.head"} .= <<jQueryUI;

<!-- jQueryUI -->
<script type="text/javascript" src="$protocol://ajax.googleapis.com/ajax/libs/jqueryui/1.11.0/jquery-ui.min.js"></script>

jQueryUI

	$pins->{"utf-8.head"} .= <<GMAPS;

<!-- GMAPS -->
<script type="text/javascript" src="$protocol://maps.googleapis.com/maps/api/js?libraries=drawing,places"></script>

GMAPS

	$pins->{"utf-8.map_view"} .= <<MapView;

<!-- MapView -->
<li>
<a id = "ep_map_location" href="$base_url/cgi/MapView">Location
</a>
</li>

MapView

	return EP_TRIGGER_OK;
});

