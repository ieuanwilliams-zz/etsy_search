/*
*
*/

var View = View || {};
(function( View ){

    "use strict";

    View.api_key = "99z99h6ab0ff4m7bwebzzose";

    // View.factories provides methods and data constructs to create new elements for the view based on user inputs
    View.factories = {
        api: {
            // a factory method to create a request to an API
            query: function( options ){

            }
        },
        // creates view-ready representations from data
        html: {
            // abstract element builder using native ECMA
            el: function( options ){
                var tag = options.tag || false
                , attrs = options.attrs || false
                , datum = options.datum || false
                , el = false;
                if( tag ){
                    el = document.createElement( tag );
                    if( attrs && attrs.length ){
                        for( var i=0, count=attrs.length; i<count; i+=1 ){
                            el.setAttribute( attrs[ i ].attr, attrs[ i ].set );
                        }
                    }
                    if( datum ){
                        // we are passing text
                        if( typeof datum === "string" ){
                            var txt = document.createTextNode( datum );
                            el.appendChild( txt );
                        }
                        // we are passing html
                        else if( typeof datum === "object" ){
                            el.appendChild( datum );
                        } else {
                            el.innerHTML = datum;
                        }
                    }
                }
                return el;
            },
            // creates an instance for the view, based on search input and results from the API
            article: function( options ){
                var data = options.data || false
                , article = false;
                if( data ){
                    var article = View.factories.html.el( { tag: "article", datum: data, attrs:[ { attr: "class", set: "result" } ] } );
                }
                return article;
            },
            // creates a script tag for JSONP facilitation
            script: function( options ){
                var src = options.src || false
                , script = false;
                if( src ){
                    var script = View.factories.html.el( { tag: "script", attrs:[ { attr: "src", set: src } ] } );
                }
                return script;
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
