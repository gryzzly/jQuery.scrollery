/**
 * jQuery.scrollery – simple gallery that uses scrolling.
 * 
 * @author Misha Reyzlin <http://mishareyzlin.com>
 * @license – WTFPL <http://sam.zoy.org/wtfpl/>
 *
 * @version 0.3
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

        var Scrollery = function ( container ) {
          this.container = container;
          this.list = this.container.children('ul');
          this.items = this.list.children();
          this.len = this.items.length;
          this.images = this.list.find('img');
          this.imagesCounter = 0;
          
          // change container's overflow to hidden
          // it's a good idea to have overflow property 
          // of the container to be set initially to "auto" or "scroll",
          // so that if javascript is disabled, content is still accessible 
          // by simply scrolling it with mousewheel or arrow keys
          if ( opts.hideScrollBar ) this.list.css( 'overflow-x', 'hidden' );
          
          // we have to make sure that all images have loaded
          // so we have right x coordinates
          // after all images will be loaded, .init() will be invoked
          this.loadImages();
        };

        Scrollery.prototype = {
          
          imageDone : function () {
            if ( this.imagesCounter === this.len ) {
              this.init();
            }
          },
          
          loadImages : function () {
            var self = this;

            this.images.each( function () {
              // image is already loaded
              if ( this.complete ) {
                // Webkit and Mozilla report true even for broken images
                // although they shouldn't
                // spec: http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content-1.html#dom-img-complete
                self.imageDone();
              }
              // image is loaded, but is broken
              // these ones aren't yet loaded, so we can't attach event listeners to them
              else {
                this.onload = function () {
                  self.imageDone();
                };
                this.onerror = function () {
                  self.imageDone();
                }
              }
            });
          },
          
          doScroll : function () {
            var currentScroll, i;
            // prevent queing up
            if ( this.list.is(':animated') ) return;

            i = 0;
            currentScroll = this.list.scrollLeft();

            // find next items position
            while ( i < this.len ) {
              i += 1;
              if ( currentScroll < this.positions[ i ] ) break;
            }

            // scroll to the next item, unless we reached the last frame
            this.list.scrollTo(
              currentScroll < this.scrollDelta ? this.items.eq( i ) : 0 , 
              opts.delay
            );
          },
          
          init : function () {
            var self = this;

            this.positions = [];
            this.childrenWidth = 0;
            this.scrollDelta = 0;

            // increase scrollWidth by adding padding-right
            // that is the width of the list minus one last image
            this.list.css(
              'padding-right',
              this.list.outerWidth() - this.images.last().width()
            );

            // save items' positions to compare scroll to them
            for ( var i = 0; i < this.len; i += 1 ) {
              this.positions.push( this.items.eq( i ).position().left );
              this.childrenWidth += this.items[ i ].clientWidth;
            }
            // there is an IE <= 9 bug, scrollWidth on an element that has
            // whitespace:nowrap is reported without padding
            // so let's construct scrollWidth by ourselves
            this.scrollDelta = this.childrenWidth + 
                               parseInt( this.list.css('padding-left') ) +
                               parseInt( this.list.css('padding-right') );
            this.scrollDelta -= this.list.outerWidth();

            // the user is expected to have the same padding on all the items
            // TODO: document this
            this.scrollDelta -= parseInt( this.items.eq( 0 ).css('padding-left') );
            this.scrollDelta -= parseInt( this.items.eq( 0 ).css('padding-right') );

            // don't do anything when container is wider than its children
            if ( this.list.outerWidth() > this.childrenWidth ) return;

            // Event handlers
            this.container
              .bind( 'click.scrollery', function () {
                self.doScroll();
              } );

            if ( opts.keyboardControls ) {
              doc
                .bind( 'keydown.scrollery', function (e) {

                  var code = e.keyCode || e.which;
                  // 39 - right arrow
                  if ( code === 39 ) {
                    e.preventDefault();

                    self.doScroll();
                  }
                });
            }

            // recalculate scrollDelta on window resize
            $(window).resize( function () {
              // reset outer width in order to calculate 
              // right padding based on new dimensions
              self.list.css('padding-right', 0);
              self.list.css(
                'padding-right',
                self.list.outerWidth() - self.images.last().width() 
              );
              self.scrollDelta = self.list[ 0 ].scrollWidth - self.list.outerWidth();
              self.scrollDelta -= parseInt( self.items.eq( 0 ).css('padding-left') );
              self.scrollDelta -= parseInt( self.items.eq( 0 ).css('padding-right') );
            });          
          }
        };
        
        return this.each( function () {
          new Scrollery( $(this) );
        });
    };
} (jQuery) );