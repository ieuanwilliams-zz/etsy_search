/*
*
*/

var View = View || {};
(function( View ){

    "use strict";

    // View.factories provides methods and data constructs to create new elements for the view based on user inputs
    View.factories = {
        api: {
            // a factory method to create a request to an API
            query: function( options ){

            }
        },
        // creates view-ready representations from data
        html: {
            // creates an instance for the view, based on search input and results from the API
            article: function( options ){

            }
        }
    }

    View.test = function( options ){ console.log( options ); }

    // View.controllers provides methods and data constructs to broker interaction between user controls and the view
    View.controllers = {
        // a method to bind a listener to an event
        addListener: function( options ){
            var eventType = options.eventType || false
            , el = options.el || false
            , callback = options.callback || false
            , capture = options.capture || false;
            if( eventType && el && callback ){
                var htmlObject = document.getElementById( el );
                // let's not worry about IE8...
                htmlObject.addEventListener(
                    eventType,
                    function( event ){
                        callback.apply( event, [ options ] )
                    },
                    capture
                );
            }
        }
    }

    // View.state provides methods and data constructs to change state from a previous state
    View.state = {
        // method to update the state of the view, based on something changing, e.g. a new request being made
        update: {
            // a method to add content to the view, once API data is returned
            search_results: function( options ){

            },
            // a method to persist state of the view via the URL
            url: function( options ){

            }
        }
    }

    // View.utilities provides shared methods and data constructs
    View.utilities = {
        proxy: function(){}
    }

    View.controllers.addListener( { eventType: "submit", el: "search-request", callback: View.test } );

}( View ));
