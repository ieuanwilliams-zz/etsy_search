/*
*
*/

var View = View || {}
, Search;
(function( Search, View ){

    "use strict";

    // method to enforce decoupling of states of the view from the logic by which they are constructed and handled 
    Search = function( options ){
        // enforce prototypal inheritance
        if( ! ( this instanceof Search ) ){ return new Search( options ); }
        this.config = {};
        this.query = View.utilities.proxy( this.config );

    }

    // View.model provides methods and data constructs to model the retrieval of useful, relevant data from the remote origin
    View.model = {
        api_key: "99z99h6ab0ff4m7bwebzzose",
        base: "https://openapi.etsy.com/v2",
        method: false, // cache current query method
        uri: false, // cache a current endpoint uri
        endpoint: function( options ){
            this.uri = options.uri || false; // set || reset
            this.method = options.method || false; // set || reset
            var callback = options.callback || false
            , query = [ "&", options.query ].join( "" ) || "";
            if( this.uri && this.method && callback && typeof callback === "function" ){
                // return a construct that forms a valid JSONP src attribute
                return [ this.base, this.uri, "/", this.method, "/etsystore.js?callback=", callback, "&api_key=", this.api_key, query ].join( "" )
            }
            return false;
        },
        uri: false,
        methods: {
            find_all: "findAllListingActive",
            uri: {
              find_all: "/listings/active"
            }
        }        
    }

    // View.factories provides methods and data constructs to create new elements for the view based on user inputs
    View.factories = {
        api: {
            // an abstract method to interfacet with other methods, etc.
            // @param options is the event object, the lexical 'this' is the object passed into the event listener
            controller: function( options ){
                var search_query = false;
                for( var i=0,count=this.getElementsByTagName( "input" ).length; i<count; i+=1 ){
                    var query = this.getElementsByTagName( "input" )[ i ];
                    if( query.getAttribute( "name" ) === "request" ){
                        search_query = query.value;
                    }
                }
                if( search_query ){
                    search_query.replace( " ", "+" );
                }

                // 1. get the information from the form

                // 2. create a query string

                // 3. initialize a Search()

                // 4. update state, e.g. URL and view
            },
            // a factory method to create a semantic request to an API, based on search criteria
            query: function( options ){

                return {

                };
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
            , capture = options.capture || false
            , preventDefault = options.preventDefault || false;
            if( eventType && el && callback ){
                var htmlObject = document.getElementById( el );
                // let's not worry about IE8...
                htmlObject.addEventListener(
                    eventType,
                    function( event ){
                        if( preventDefault ){ event.preventDefault(); }
                        callback.apply( this, [ event ] )
                    },
                    capture
                );
            }
        },
        input_handler: function( options ){
            if( options.ok ){
                // traffic our data
            } else {
                this.handle_error( options );
            }
        },
        handle_error: function( options ){

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

    // set configuration for handling form submissions, i.e. API queries
    var searchConfig = { eventType: "submit", el: "search-request", callback: View.factories.api.controller, preventDefault: true };

    // pass the configuraiton to initialize the handling
    View.controllers.addListener( searchConfig );

}( Search, View ));
