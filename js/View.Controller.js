/*
*
*/

var View = View || {}
, Search;

// to differentiate between initial load state, and application state
View.init = false;

(function( Search, View ){

    "use strict";

    // method to enforce decoupling of states of the view from the logic by which they are constructed and handled 
    Search = function( options ){
        // enforce prototypal inheritance
        if( ! ( this instanceof Search ) ){ return new Search( options ); }

        // assignment of the input conditions
        this.options = options;

        var src = View.factories.api.endpoint( this.options.query )
        , script = View.factories.html.script( { src: src } );
        
        // add the JSONP resource to the document
        if( script ){
            View.factories.include( { script: script } );            
        }

    }

    Search.prototype.state = function(){
        var state = View.state; // cache reference
        // each state has unique conditions so...
        state.update.clear();
        var page = this.results.pagination.effective_offset+1;
        // handling for pushstate
        state.update.url( { query: this.options.terms, page: page } );
        // toggle the loading state, e.g. spinner presentations
        View.state.update.loading( { el: "results", active: false } );
    }

    // a method to handle and traffick data returned from the remote server
    Search.prototype.input_handler = function( options ){
        // check: we are OK
        if( options.ok ){
            // 1. cache the reference to these results in the scope of Search
            this.results = options;
            // 2. manage the state of the view
            this.state();
            // 3. handle the cases, results or none        
            if( options.count === 0 ){
                View.factories.noresults( options );
            } else {
                View.factories.results( options );
            }
        } else {
            this.error_handler( options );
        }
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
        include: function( options ){
            var script = options.script || false;
            if( script ){
                // TODO: looks like we have to keep adding script tags rather than replacing the src attribute each time?
                var target = document.getElementsByTagName( "head" )[ 0 ];
                target.appendChild( script );            
            }
        },
        api: {
            // an abstract method to interface with other methods, etc.
            // @param options is the event object, the lexical 'this' is the object passed into the event listener
            controller: function( options ){
                // cases: support form submits as well as manual calls (e.g. passing in the terms from url state, etc.)
                var search_query = ( options !== undefined && options.terms !== undefined ) ? options.terms : false
                , offset = ( options !== undefined && options.offset !== undefined ) ? options.offset : 0
                , clean_query = false;
                if( ! search_query ){
                    for( var i=0, count=this.getElementsByTagName( "input" ).length; i<count; i+=1 ){
                        var query = this.getElementsByTagName( "input" )[ i ];
                        if( query.getAttribute( "name" ) === "request" ){
                            search_query = query.value;
                            break;
                        }
                    }
                }
                if( search_query ){
                    // provide the cue to the user that something is loading
                    View.state.update.loading( { el: "results", active: true } );
                    clean_query = search_query.replace( / /g, "+" );
                    var request = {
                        uri: ( View.model.methods.uri.find_all ),
                        method: ( View.model.methods.find_all ),
                        callback: "View.Search.input_handler",
                        query: clean_query,
                        offset: offset
                    };
                    View.Search = Search( { query: request, terms: clean_query } );
                }
            },
            params:{ 
                // maintain a registry of allowed parameters, so we don't end up with dysfunctional calls
                registry:[ "offset", "keywords" ],
                serialize: function( options ){
                    // the options @param must exist and be an object
                    if( options !== undefined && typeof options === "object" ){
                        var query_string = "";
                        for( var key in options ){
                            // check to ensure we have registered our query keys
                            if( this.registry.indexOf( key ) > -1 ){
                                query_string += [ "&", key, "=", options[ key ] ].join( "" );
                            }
                        }
                        return query_string;
                    }
                }
            },
            endpoint: function( options ){
                var model = View.model
                , endpoint = false
                , params = {};

                model.uri = options.uri || false; // set || reset
                model.method = options.method || false; // set || reset
                
                var callback = options.callback || false
                , query = options.query || ""
                , type = options.type || "keywords";
                params.offset = ( options !== undefined && options.offset !== undefined )? options.offset : 0;
                params[ type ] = query;
                // use the factory to build the query string part
                var query_string = this.params.serialize( params ); 
                if( model.uri && model.method && callback ){
                    // return a construct that forms a valid JSONP src attribute
                    endpoint = [ model.base, model.uri, ".js?callback=", callback, "&api_key=", model.api_key, query_string ].join( "" )
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
            results.appendChild( this.html.el( { tag: "h2", datum: "We didn't find anything that matched your search." } ) );
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
                results.appendChild( result );
            }
            var result_count = View.factories.result_count( options );
            if( options.count > options.pagination.effective_limit ){
                var pagination = View.factories.pagination( options.pagination );
                result_count.appendChild( pagination );
            }
            View.state.update.search_results( { result: results, result_count: result_count } );
        },
        pagination: function( options ){
            return View.factories.html.el( {
                tag: "a",
                datum: ( document.createTextNode( "Next >") ),
                attrs:[ { attr: "href", set: "javascript:;" }, { attr: "class", set: "next-page" }, { attr: "id", set: "page-ctrl" } ]
            } );            
        },
        result_count: function( options ){
            var from = ( ( options.pagination.effective_offset === 0 ) ? 1 : ( options.pagination.effective_limit*options.pagination.effective_offset ) + 1 )
            // show the number we should be showing, unless it is greater than we have actually have
            , to = ( options.pagination.effective_limit > options.count ) ? options.count : ( ( options.pagination.effective_offset === 0 ) ? options.pagination.effective_limit : options.pagination.effective_limit*( options.pagination.effective_offset+1 ) );
            return View.factories.html.el( {
                tag: "h4",
                datum: ( document.createTextNode( [ "Displaying", from, "to", to, "of", options.count, "results" ].join( " " ) ) )
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
                    meta.appendChild( this.el( { tag: "h2", datum: "Result" } ) );
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
                        datum: ( document.createTextNode( "View More ..." ) ),
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
                var text = options.text || false
                , el = false;
                if( text ){
                    el = document.createTextNode( text );
                }
                return el;
            },
            // creates a script tag for JSONP facilitation
            script: function( options ){
                var src = options.src || false
                , script = false;
                if( src ){
                    script = View.factories.html.el( { tag: "script", attrs:[ { attr: "src", set: src }, { attr: "id", set: "api-results" } ] } );
                }
                return script;
            }
        }
    }

    // View.controllers provides methods and data constructs to broker interaction between user controls and the view
    View.controllers = {
        // a method to bind a listener to an event
        trigger: function( options ){
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
        // TODO
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
            // a method to toggle the state of the view when something is happengin
            loading: function( options ){
                var target = options.el || false
                , state = options.active
                , el = document.getElementById( target );
                if( target && el ){
                    var classes = el.getAttribute( "class" );
                    if( state ){
                        el.setAttribute( "class", [ classes, " loading" ].join( "" ) );
                    } else {
                        setTimeout( function(){
                            el.setAttribute( "class", classes.replace( "loading", "" ) );
                        }, 1500 );
                    }
                }
            },
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
                        // now attach see more/see less controls for the description element, because it is so variable in length
                        var reveals = document.getElementsByClassName( "more" );
                        for( var i=0, count = reveals.length; i<count; i+=1 ){
                            if( reveals[ i ] ){
                                // check threshold
                                if( ( reveals[ i ].parentNode ).offsetHeight > 160 ) {
                                    ( reveals[ i ].parentNode ).setAttribute( "class", [ ( reveals[ i ].parentNode ).getAttribute( "class" ), "reveal" ].join( " " ) )
                                    var id = [ "more-", i ].join( "" );
                                    reveals[ i ].setAttribute( "id", id );
                                    // set configuration for handling form submissions, i.e. API queries
                                    var revealConfig = { eventType: "click", el: id, callback: View.utilities.reveal };
                                    // pass the configuration to initialize the handling
                                    View.controllers.trigger( revealConfig );
                                } else {
                                    // don't need the component
                                    reveals[ i ].setAttribute( "class", "hidden" )
                                }
                            }
                        }
                        // if we have paginate, trigger it to make the next call
                        if( View.Search.results.pagination.next_page !== null ){
                            // set configuration for handling form submissions, i.e. API queries
                            var paginateConfig = { eventType: "click", el: "page-ctrl", callback: View.utilities.paginate };
                            // pass the configuration to initialize the handling
                            View.controllers.trigger( paginateConfig );
                        }
                    }
                }
            },
            // a method to persist state of the view via the URL
            url: function( options ){
                var url_state = options
                , terms = url_state.query;
                history.pushState( url_state, [ "results for ", terms.replace( "+", " " ) ].join( "" ), [ "?page=", url_state.page, "&", "terms=", terms ].join( "" ) );
            },
        },
        // a method to build a view from state provided by the url construct
        make: function( event ){
            var options = {}
            , offset = 0
            , terms = "";
            options.el = "search-request"; 
            // case: we are rebuilding from the browser history controls
            if( event !== undefined && event.state !== undefined ){
                offset = ( event.state.page-1 );
                terms = ( event.state.query );
            } else {
                if( location.search.length ){
                    // case: we are building from the URL structure
                    // get the parameterized component of the url, remove the "?," and atomize to get the details
                    var params = ( location.search.substring( 1, location.search.length ) ).split( "&" );
                    for( var i=0, count=params.length; i<count; i+=1 ){
                        // split the key=value construct into an array og key-value pairs
                        var key_value = params[ i ].split( "=" );
                        // get offset data to build/rebuild the call
                        if( key_value[ 0 ] === "page" ){
                            offset = parseInt( key_value[ 1 ] ) - 1;
                        }
                        // get terms information to build/rebuild the call
                        if( key_value[ 0 ] === "terms" ){
                            terms = key_value[ 1 ];
                        }
                    }
                }
            }
            if( terms !== "" ){
                options.offset = offset;
                options.terms = terms;
                View.factories.api.controller( options );
                // make sure the form reflects the state
                ( document.getElementById( "search-request" ) ).childNodes[ 1 ].value = terms;
            }
        }
    }

    // View.utilities provides shared methods and data constructs
    View.utilities = {
        // provide a user control to show and hide long descriptions for results returned from the remote origin
        reveal: function( event ){
            var state = ( this.parentNode ).getAttribute( "class" );
            if( state.indexOf( "reveal" ) < 0 ){
                ( this.parentNode ).setAttribute( "class", [ state, " reveal" ].join( "" ) );
                ( document.getElementById( event.target.id ) ).innerHTML = "View More ...";
            } else {
                ( this.parentNode ).setAttribute( "class", state.replace( " reveal", "" ) );
                ( document.getElementById( event.target.id ) ).innerHTML = "View Less";
            }
        },
        paginate: function( event ){
            var obj = View.Search.options.query
            , options = {
                el: "search-request",
                offset: ( obj.offset + 1 ),
                terms: ( obj.query )
            }
            View.factories.api.controller( options );
        }
    }

    // set configuration for handling form submissions, i.e. API queries
    var searchConfig = { eventType: "submit", el: "search-request", callback: View.factories.api.controller, preventDefault: true };

    // pass the configuraiton to initialize the handling
    View.controllers.trigger( searchConfig );

    // build a query from a deep link
    if( location.search.length ){
        View.state.make();
    }

    if( ! View.init ){
        window.onpopstate = function(){ View.state.make( event ); };
    }

    View.init = true;

}( Search, View ));
