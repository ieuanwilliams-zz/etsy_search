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

        this.options = options;

        var src = View.factories.api.endpoint( this.options.query )
        , script = View.factories.html.script( { src: src } );

        // manage the state of the view
        this.state();
        
        if( script ){
            var target = document.getElementsByTagName( "head" )[ 0 ];
            target.appendChild( script );
        }

        this.config = {};
        this.query = View.utilities.proxy( this.config );        
    }

    Search.prototype.state = function(){
        var state = View.state; // cache reference
        state.update.clear();
        // state.update.url( { query: this.options.terms } );
    }

    // View.model provides methods and data constructs to model the retrieval of useful, relevant data from the remote origin
    View.model = {
        api_key: "99z99h6ab0ff4m7bwebzzose",
        base: "https://openapi.etsy.com/v2",
        method: false, // cache current query method
        uri: false, // cache a current endpoint uri
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
                var search_query = false
                , clean_query = false
                for( var i=0,count=this.getElementsByTagName( "input" ).length; i<count; i+=1 ){
                    var query = this.getElementsByTagName( "input" )[ i ];
                    if( query.getAttribute( "name" ) === "request" ){
                        search_query = query.value;
                    }
                }
                if( search_query ){
                    clean_query = search_query.replace( / /g, "+" );
                    var request = {
                        uri: ( View.model.methods.uri.find_all ),
                        method: ( View.model.methods.find_all ),
                        callback: "View.controllers.input_handler",
                        query: clean_query
                    };
                    Search( { query: request, terms: clean_query } );
                }

                // TODO: update state, e.g. URL and view
                // TODO: add pagination
            },
            endpoint: function( options ){
                var model = View.model
                , endpoint = false;
                model.uri = options.uri || false; // set || reset
                model.method = options.method || false; // set || reset
                var callback = options.callback || false
                , query = options.query || ""
                , type = options.type || "keywords";
                if( model.uri && model.method && callback ){
                    // return a construct that forms a valid JSONP src attribute
                    endpoint = [ model.base, model.uri, ".js?callback=", callback, "&api_key=", model.api_key, "&", type, "=", query ].join( "" )
                }
                return endpoint;
            },
            // a factory method to create a semantic request to an API, based on search criteria
            query: function( options ){
                return {};
            }
        },
        noresults: function( options ){
            var results = document.createDocumentFragment();
            results.appendChild( this.html.el( { tag: "h2", datum: "Er, we didn't find anything that matched your search." } ) );
            View.state.update.search_results( { result: results } );
        },
        // an abstract model for what will be built into the DOM
        results: function( options ){
            var results = document.createDocumentFragment();
            for( var i=0, count = options.results.length; i<count; i+=1 ){
                // construct an individual result from the remote origin
                var description = options.results[ i ].description
                , title = options.results[ i ].title
                , url = options.results[ i ].url
                , tags = options.results[ i ].tags.join( ", " )
                , categories = options.results[ i ].category_path.join( ", " )
                , listing_id = options.listing_id || false; // to get the image(s) associated with the listing
                var result = this.html.article( {
                    description: description,
                    title: title,
                    url: url,
                    tags: tags,
                    categories: categories
                } );
                results.appendChild( this.html.el( { tag: "h2", datum: "Result" } ) );
                results.appendChild( result );
            }
            var result_count = View.factories.result_count( options );
            View.state.update.search_results( { result: results, result_count: result_count } );
        },
        result_count: function( options ){
            return View.factories.html.el( {
                tag: "h4",
                datum: ( document.createTextNode( [ "Displaying", ( ( options.pagination.effective_page === 1 ) ? options.pagination.effective_page : options.pagination.effective_limit*options.pagination.effective_page ), "to", options.pagination.effective_limit, "of", options.count, "results" ].join( " " ) ) )
            } );            
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
                        if( typeof datum === "string" ){
                            // we are passing text
                            var txt = document.createTextNode( datum );
                            el.appendChild( txt );
                        } else if( typeof datum === "object" ){
                            // we are passing html
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
                var article = false
                , meta = this.article_meta( options );
                if( meta ){
                    article = View.factories.html.el( { tag: "article", datum: meta, attrs:[ { attr: "class", set: "result" } ] } );
                }
                return article;
            },
            article_meta: function( options ){
                var meta = document.createDocumentFragment()
                , title = options.title || false
                , description = options.description || false
                , url = options.url || false
                , tags = options.tags || false
                , categories = options.categories || false;
                if( url && title ){
                    var anchor = this.el({
                        tag: "a",
                        datum: ( this.text( { text: title } ) ),
                        attrs:[ { attr: "href", set: url },{ attr: "target", set: "_blank" } ]
                    })
                    , header = this.el({
                        tag: "h5",
                        datum: anchor
                    });
                    meta.appendChild( header );
                }
                if( description ){
                    var teaser = this.el({
                        tag: "div",
                        datum: ( this.text( { text: description } ) ),
                        attrs:[ { attr: "class", set: "description" } ]
                    });
                    var more_btn = this.el({
                        tag: "a",
                        datum: ( document.createTextNode( "View More" ) ),
                        attrs:[ { attr: "href", set: "javascript:;" }, { attr: "class", set: "more" } ]
                    });
                    teaser.appendChild( more_btn );
                    meta.appendChild( teaser );
                }
                if( categories && tags ){
                    var semantic_cats = this.el({
                        tag: "div",
                        datum: ( this.text( { text: categories } ) ),
                        attrs:[ { attr: "class", set: "categories" } ]
                    })
                    , semantic_tags = this.el({
                        tag: "div",
                        datum: ( this.text( { text: tags } ) ),
                        attrs:[ { attr: "class", set: "tags" } ]
                    });
                    meta.appendChild( semantic_cats );
                    meta.appendChild( semantic_tags );
                }
                return meta;
            },
            text: function( options ){
                var text = options.text || false;
                if( text ){
                    return document.createTextNode( text );
                }
                return false;
            },
            // creates a script tag for JSONP facilitation
            script: function( options ){
                var src = options.src || false
                , script = false;
                if( src ){
                    script = View.factories.html.el( { tag: "script", attrs:[ { attr: "src", set: src } ] } );
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
                console.log( options );
                if( options.count === 0 ){ 
                    View.factories.noresults( options );
                } else {
                    View.factories.results( options );
                }
            } else {
                this.error_handler( options );
            }
        },
        error_handler: function( options ){

        }
    }

    // View.state provides methods and data constructs to change state from a previous state
    View.state = {
        // a model (an array of objects built from the Search() prototype)
        // for previous views so as to cache them and rebuild them, as necessary based on browser actions
        history: [],
        // method to update the state of the view, based on something changing, e.g. a new request being made
        update: {
            clear: function(){
                var content = document.getElementById( "results" );
                content.innerHTML = "";
            },
            // a method to add content to the view, once API data is returned
            search_results: function( options ){
                var result = options.result || false
                , result_count = options.result_count || false;
                if( result ){
                    var dropzone = document.getElementById( "results" );
                    if( dropzone ){
                        dropzone.appendChild( result_count );
                        dropzone.appendChild( result );
                        var reveals = document.getElementsByClassName( "more" );
                        for( var i=0, count = reveals.length; i<count; i+=1 ){
                            var id = [ "more-", i ].join( "" );
                            reveals[ i ].setAttribute( "id", id )
                            // set configuration for handling form submissions, i.e. API queries
                            var revealConfig = { eventType: "click", el: id, callback: View.utilities.reveal };
                            // pass the configuraiton to initialize the handling
                            View.controllers.addListener( revealConfig );                            
                        }
                    }
                }
            },
            // a method to persist state of the view via the URL
            url: function( options ){
                console.log( options );
                var url_state = options;
                history.pushState( url_state, [ "results for ", url_state.query.replace( "+", " " ) ].join( "" ) );
            }
        }
    }

    // View.utilities provides shared methods and data constructs
    View.utilities = {
        proxy: function(){},
        reveal: function( event ){
            var state = ( this.parentNode ).getAttribute( "class" );
            if( state.indexOf( "reveal" ) > -1 ){
                ( this.parentNode ).setAttribute( "class", state.replace( " reveal", "" ) );
                ( document.getElementById( event.target.id ) ).innerHTML = "View More";
            } else {
                ( this.parentNode ).setAttribute( "class", [ state, " reveal" ].join( "" ) );
                ( document.getElementById( event.target.id ) ).innerHTML = "View Less";
            }
        }
    }

    // set configuration for handling form submissions, i.e. API queries
    var searchConfig = { eventType: "submit", el: "search-request", callback: View.factories.api.controller, preventDefault: true };

    // pass the configuraiton to initialize the handling
    View.controllers.addListener( searchConfig );

    // build a query from a deep link
    if( location.search.length ){

    }

}( Search, View ));
