/**
 * jQuery.scrollery – simple gallery that uses scrolling.
 * 
 * @author Misha Reyzlin <http://mishareyzlin.com>
 * @license – WTFPL <http://sam.zoy.org/wtfpl/>
 *
 * @version 0.2
 *
 * @param {Object} settings hash – optional set of settings
 *   @option {Number} delay – in milliseconds, how long should scrolling animation take, default: 500
 *   @option {Boolean} hideScrollBar – if container element has scrollbar (overflow: auto / scroll), should the plugin turn hide that scrollbar? default: true
 *   @option {Boolean} keyboardControls – by default, hitting right arrow on the keyboard will toggle "next" animation on the gallery, it can be turned off, default: true
 *
 *  
 * Typical HTML that is required for this gallery:
 *
 * <ul class="gallery">
 *   <li>
 *     <img src="http://lorempixum.com/400/200/abstract/1/">
 *   </li>
 *   <li>
 *     <img src="http://lorempixum.com/200/150/abstract/2/">
 *   </li> 
 *   <li>
 *     <img src="http://lorempixum.com/300/200/abstract/3/">
 *   </li>
 *   <li>
 *     <img src="http://lorempixum.com/350/250/abstract/4/">
 *    </li>
 *  </ul>
 *
 * The CSS:
 * 
 * .scrollery {
 *   overflow-x:scroll; 
 *   white-space:nowrap; – causes for images to stay on one line, 
 *                         as if they were letters of a long word
 *   font-size:0; – fixes a problem with white-space between the images
 *   list-style:none;
 * }
 *    .scrollery li {
 *      display:inline-block;
 *      *display:inline;
 *      *zoom:1;
 *      vertical-align:middle;
 *    }
 * 
 * You would usually apply this plugin like this:
 * $(document).ready(function () {
 *  $('.gallery').scrollery();
 * });
 *
 */
;(function ($) {
    $.fn.scrollery = function ( opts ) {

        var doc = $(document);

        opts = $.extend({
          delay : 500,
          hideScrollBar : true,
          keyboardControls : true
        }, opts );

        return this.each( function () {
            var container = $(this),
                list = $(this).children('ul'),
                items = list.children(),
                len = items.length,
                images = list.find('img'),
                imageDone,
                imagesCounter = 0;
            
            // ---=== Images are loading ===---
            
            // change container's overflow to hidden
            // it's a good idea to have overflow property 
            // of the container to be set initially to "auto" or "scroll",
            // so that if javascript is disabled, content is still accessible 
            // by simply scrolling it with mousewheel or arrow keys
            if ( opts.hideScrollBar ) list.css( 'overflow-x', 'hidden' );

            // we have to make sure that all images have loaded
            // so we have right x coordinates
            imageDone = function() {
              imagesCounter += 1;
              if ( imagesCounter === len ) {
                doc.trigger('images-loaded.scrollery'); 
              }
            };
            
            images.each( function( index ) {
              // image is already loaded
              if ( this.complete ) {
                // Webkit and Mozilla report true even for broken images
                // although they shouldn't
                // spec: http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content-1.html#dom-img-complete
                imageDone();
              }
              // image is loaded, but is broken
              // these ones aren't yet loaded, so we can't attach event listeners to them
              else {
                this.onload = imageDone;
                this.onerror = imageDone;
              }
            });
            // ---=== Images loaded ===---
            
            doc
              .unbind('images-loaded.scrollery')
              .bind('images-loaded.scrollery', function () {
                var positions = [], 
                    childrenWidth = 0,
                    i = 0,
                    scrollDelta,
                    doScroll;
                
                list.css(
                  'padding-right',
                  list.outerWidth() - images.last().width() 
                );
                
                scrollDelta = list[ 0 ].scrollWidth - list.outerWidth();
                scrollDelta -= parseInt( items.eq( 0 ).css('padding-left') );
                scrollDelta -= parseInt( items.eq( 0 ).css('padding-right') );

                // save items' positions to compare scroll to them
                for ( i = 0; i < len; i += 1 ) {
                  positions.push( items.eq( i ).position().left );
                  childrenWidth += items.eq( i ).width();
                }
              
                // don't do anything when container is wider than its children
                if ( container.width() >  childrenWidth ) return;
              
                doScroll = function () {
                  var currentScroll, i;
                  // prevent queing up
                  if ( list.is(':animated') ) return;

                  i = 0;
                  currentScroll = list.scrollLeft();

                  // find next items position
                  while ( i < len ) {
                    i += 1;
                    if ( currentScroll < positions[ i ] ) break;
                  }
                  
                  // scroll to the next item, unless we can't scroll anymore
                  list.scrollTo(
                    currentScroll < scrollDelta ? items.eq( i ) : 0 , 
                    opts.delay
                  );
                };
              
                // Event handlers
                container
                  .unbind( 'click.scrollery' )
                  .bind( 'click.scrollery', doScroll );

                if ( opts.keyboardControls ) {
                  doc
                    .unbind( 'keydown.scrollery' )
                    .bind( 'keydown.scrollery', function (e) {
                      var code = e.keyCode || e.which;
                      // 39 - right arrow
                      if ( code === 39 ) {
                        e.preventDefault();

                        doScroll();
                      }
                    });
                }
                
                // recalculate scrollDelta on window resize
                $(window).resize(function() {
                  list.css('padding-right', 0);
                  list.css(
                    'padding-right',
                    list.outerWidth() - images.last().width() 
                  );
                  scrollDelta = list[ 0 ].scrollWidth - list.outerWidth();
                  scrollDelta -= parseInt( items.eq( 0 ).css('padding-left') );
                  scrollDelta -= parseInt( items.eq( 0 ).css('padding-right') );
                });
            });
        });
    };
} (jQuery) );