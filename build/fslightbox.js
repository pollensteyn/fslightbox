(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {

    loader: '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>',
    self: '',
    DOMObject: '',

    createHolder: function (index) {
        let sourceHolder = new this.DOMObject('div').addClassesAndCreate(['fslightbox-source-holder']);
        sourceHolder.innerHTML = this.loader;
        this.self.data.sources[index] = sourceHolder;
        return sourceHolder;
    },


    /**
     * Renders loader when loading fsLightbox initially
     * @param self
     * @param slide
     * @param DOMObject
     */
    renderHolderInitial: function (self, slide, DOMObject) {
        this.self = self;
        this.DOMObject = DOMObject;
        const sourcesIndexes = self.getSourcesIndexes.all(slide);
        const totalSlides = self.data.total_slides;

        if (totalSlides >= 3) {
            const prev = this.createHolder(sourcesIndexes.previous);
            self.transforms.transformMinus(prev);
            self.data.mediaHolder.holder.appendChild(prev);
        }
        if (totalSlides >= 1) {
            const curr = this.createHolder(sourcesIndexes.current);
            self.data.mediaHolder.holder.appendChild(curr);
        }
        if (totalSlides >= 2) {
            const next = this.createHolder(sourcesIndexes.next);
            self.transforms.transformPlus(next);
            self.data.mediaHolder.holder.appendChild(next);
        }
    },


    /**
     * Renders loader when loading a previous source
     * @param slide
     */
    renderHolderPrevious: function (slide) {
        const previousSourceIndex = this.self.getSourcesIndexes.previous(slide);
        const prev = this.createHolder(previousSourceIndex);
        this.self.transforms.transformMinus(prev);
        this.self.data.mediaHolder.holder.insertAdjacentElement('afterbegin', prev);
    },


    /**
     * Renders loader when loading a next source
     * @param slide
     */
    renderHolderNext: function (slide) {
        const nextSourceIndex = this.self.getSourcesIndexes.next(slide);
        const next = this.createHolder(nextSourceIndex);
        this.self.transforms.transformPlus(next);
        this.self.data.mediaHolder.holder.appendChild(next);
    },


    /**
     * Renders loader when loading a previous source
     * @param slide
     */
    renderHolderCurrent: function (slide) {
        const sourcesIndexes = this.self.getSourcesIndexes.all(slide);
        const curr = this.createHolder(sourcesIndexes.current);
        this.self.transforms.transformNull(curr);
        this.self.data.mediaHolder.holder.insertBefore(curr, this.self.data.sources[sourcesIndexes.next]);
    },


    /**
     * Change slide to previous after clicking button
     * @param self
     * @param previousSlide
     */
    previousSlideViaButton: function (self, previousSlide) {
        if (previousSlide === 1) {
            self.data.slide = self.data.total_slides;
        } else {
            self.data.slide -= 1;
        }

        self.stopVideos();
        self.data.updateSlideNumber(self.data.slide);
        const newSourcesIndexes = self.getSourcesIndexes.all(self.data.slide);

        if (typeof self.data.sources[newSourcesIndexes.previous] === "undefined") {
            self.loadsources('previous', self.data.slide);
        }

        const sources = self.data.sources;
        const currentSource = sources[newSourcesIndexes.current];
        const nextSource = sources[newSourcesIndexes.next];

        nextSource.classList.remove('fslightbox-transform-transition');
        currentSource.classList.remove('fslightbox-transform-transition');
        sources[newSourcesIndexes.previous].classList.remove('fslightbox-transform-transition');

        nextSource.classList.remove('fslightbox-fade-in-animation');
        void nextSource.offsetWidth;
        nextSource.classList.add('fslightbox-fade-in-animation');


        currentSource.classList.remove('fslightbox-fade-in-animation');
        void currentSource.offsetWidth;
        currentSource.classList.add('fslightbox-fade-in-animation');

        self.transforms.transformNull(currentSource);
        self.transforms.transformPlus(nextSource);
    },


    /**
     * Change slide to next after clicking button
     * @param self
     * @param previousSlide
     */
    nextSlideViaButton: function (self, previousSlide) {
        if (previousSlide === self.data.total_slides) {
            self.data.slide = 1;
        } else {
            self.data.slide += 1;
        }

        self.stopVideos();
        self.data.updateSlideNumber(self.data.slide);
        const newSourcesIndexes = self.getSourcesIndexes.all(self.data.slide);

        if (typeof self.data.sources[newSourcesIndexes.next] === "undefined") {
            self.loadsources('next', self.data.slide);
        }

        const sources = self.data.sources;
        const currentSource = sources[newSourcesIndexes.current];
        const previousSource = sources[newSourcesIndexes.previous];

        previousSource.classList.remove('fslightbox-transform-transition');
        currentSource.classList.remove('fslightbox-transform-transition');
        sources[newSourcesIndexes.next].classList.remove('fslightbox-transform-transition');

        previousSource.classList.remove('fslightbox-fade-in-animation');
        void previousSource.offsetWidth;
        previousSource.classList.add('fslightbox-fade-in-animation');


        currentSource.classList.remove('fslightbox-fade-in-animation');
        void currentSource.offsetWidth;
        currentSource.classList.add('fslightbox-fade-in-animation');


        self.transforms.transformNull(currentSource);
        self.transforms.transformMinus(previousSource);
    }
};
},{}],2:[function(require,module,exports){
module.exports = function (self, DOMObject) {

    //we will hover all windows with div with high z-index to be sure mouseup is triggered
    const invisibleHover = new DOMObject('div').addClassesAndCreate(['fslightbox-invisible-hover']);

    //to these elements are added mouse events
    const elements = {
        "mediaHolder": self.data.mediaHolder.holder,
        "nav": self.data.nav,
        "invisibleHover": invisibleHover
    };
    //sources are transformed
    const sources = self.data.sources;
    const mediaHolder = self.data.mediaHolder.holder;

    // if there are only 2 or 1 urls transforms will be different
    const urlsLength = self.data.urls.length;

    let is_dragging = false;
    let mouseDownClientX;
    let difference;
    let slideaAble = true;

    let eventListeners = {


        mouseDownEvent: function (e) {

            // tag can't be video cause it would be unclickable in microsoft browsers
            if (e.target.tagName !== 'VIDEO') {
                e.preventDefault();
            }
            for (let elem in elements) {
                elements[elem].classList.add('fslightbox-cursor-grabbing');
            }
            is_dragging = true;
            (self.data.isMobile) ?
                mouseDownClientX = e.touches[0].clientX :
                mouseDownClientX = e.clientX;
            difference = 0;
        },


        mouseUpEvent: function () {

            if (mediaHolder.contains(invisibleHover)) {
                mediaHolder.removeChild(invisibleHover);
            }
            let sourcesIndexes = self.getSourcesIndexes.all(self.data.slide);

            for (let elem in elements) {
                elements[elem].classList.remove('fslightbox-cursor-grabbing');
            }

            is_dragging = false;

            // if user didn't slide none animation should work
            if (difference === 0) {
                return;
            }

            //we can slide only if previous animation has finished
            if (!slideaAble) {
                return;
            }
            slideaAble = false;

            // add transition if user slide to source
            sources[sourcesIndexes.previous].classList.add('fslightbox-transform-transition');
            sources[sourcesIndexes.current].classList.add('fslightbox-transform-transition');
            sources[sourcesIndexes.next].classList.add('fslightbox-transform-transition');


            // slide previous
            if (difference > 0) {

                // update slide number
                if (self.data.slide === 1) {
                    self.data.updateSlideNumber(self.data.total_slides);
                } else {
                    self.data.updateSlideNumber(self.data.slide - 1);
                }

                if (urlsLength >= 2) {
                    self.transforms.transformPlus(sources[sourcesIndexes.current]);
                    self.transforms.transformNull(sources[sourcesIndexes.previous]);
                }
                else {
                  self.transforms.transformNull(sources[sourcesIndexes.current]);
                }

                // get new indexes
                sourcesIndexes = self.getSourcesIndexes.all(self.data.slide);

                //if source isn't already in memory
                if (typeof self.data.sources[sourcesIndexes.previous] === "undefined") {
                    self.loadsources('previous', self.data.slide);
                }
            }


            // slide next
            else if (difference < 0) {

                //update slide number
                if (self.data.slide === self.data.total_slides) {
                    self.data.updateSlideNumber(1);
                } else {
                    self.data.updateSlideNumber(self.data.slide + 1);
                }


                if (urlsLength > 1) {
                    self.transforms.transformMinus(sources[sourcesIndexes.current]);
                    self.transforms.transformNull(sources[sourcesIndexes.next]);
                } else {
                    self.transforms.transformNull(sources[sourcesIndexes.current]);
                }

                // get new indexes
                sourcesIndexes = self.getSourcesIndexes.all(self.data.slide);
                //if source isn't already in memory
                if (typeof self.data.sources[sourcesIndexes.next] === "undefined") {
                    self.loadsources('next', self.data.slide);
                }
            }

            difference = 0;
            self.stopVideos();

            setTimeout(function () {

                // remove transition because with dragging it looks awful
                sources[sourcesIndexes.previous].classList.remove('fslightbox-transform-transition');
                sources[sourcesIndexes.current].classList.remove('fslightbox-transform-transition');
                sources[sourcesIndexes.next].classList.remove('fslightbox-transform-transition');

                // user shouldn't be able to slide when animation is running
                slideaAble = true;
            }, 250);
        },


        mouseMoveEvent: function (e) {

            if (!is_dragging || !slideaAble) {
                return;
            }

            let clientX;
            (self.data.isMobile) ?
                clientX = e.touches[0].clientX :
                clientX = e.clientX;

            mediaHolder.appendChild(invisibleHover);
            difference = clientX - mouseDownClientX;
            const sourcesIndexes = self.getSourcesIndexes.all(self.data.slide);

            if (urlsLength >= 3) {
                sources[sourcesIndexes.previous].style.transform = 'translate(' +
                    (-self.data.slideDistance * window.innerWidth + difference)
                    + 'px,0)';
            }

            if (urlsLength >= 1) {
                sources[sourcesIndexes.current].style.transform = 'translate(' + difference + 'px,0)';
            }

            if (urlsLength >= 2) {
                sources[sourcesIndexes.next].style.transform = 'translate('
                    + (self.data.slideDistance * window.innerWidth + difference)
                    + 'px,0)';
            }
        }
    };


    for (let elem in elements) {
        elements[elem].addEventListener('mousedown', eventListeners.mouseDownEvent);
        elements[elem].addEventListener('touchstart', eventListeners.mouseDownEvent);
    }
    window.addEventListener('mouseup', eventListeners.mouseUpEvent);
    window.addEventListener('touchend', eventListeners.mouseUpEvent);
    invisibleHover.addEventListener('mouseup', eventListeners.mouseUpEvent);
    invisibleHover.addEventListener('touchend', eventListeners.mouseUpEvent);
    window.addEventListener('mousemove', eventListeners.mouseMoveEvent);
    window.addEventListener('touchmove', eventListeners.mouseMoveEvent);
};
},{}],3:[function(require,module,exports){
window.fsLightboxObject = function () {

    /**
     * @constructor
     */
    this.data = {
        slide: 1,
        total_slides: 1,
        slideDistance: 1.3,
        slideCounter: true,
        slideButtons: true,
        isFirstTimeLoad: false,
        moveSlidesViaDrag: true,
        toolbarButtons: {
            "close": true,
            "fullscreen": true
        },

        element: null,
        isMobile: false,

        urls: [],
        sources: [],
        sourcesLoaded: [],
        rememberedSourcesDimensions: [],
        videos: [],

        mediaHolder: {},
        nav: {},
        toolbar: {},
        slideCounterElem: {},

        initiated: false,
        fullscreen: false,
        fadingOut: false,

        onResizeEvent: '',
        updateSlideNumber: function () {
        }
    };


    /**
     * @type {Window}
     */
    let self = this;


    /**
     * Init a new fsLightbox instance
     */
    this.init = function () {
        self.data.initiated = true;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) self.data.isMobile = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        self.data.onResizeEvent = new onResizeEvent();
        new self.dom();
        require('./changeSlideByDragging.js')(self, DOMObject);
    };


    /**
     * Show dom of fsLightbox instance if exists
     */
    this.show = function () {
        self.scrollbar.showScrollbar();
        self.data.element.classList.remove('fslightbox-container-fadeout');
        document.body.appendChild(self.data.element);
        self.data.element.classList.remove(['fslightbox-fade-in-animation']);
        self.data.element.classList.add(['fslightbox-fade-in-animation']);
        self.data.onResizeEvent.refreshWindowOnresize();
    };


    /**
     * Hide dom of existing fsLightbox instance
     */
    this.hide = function () {
        self.scrollbar.hideScrollbar();
        if(self.data.fullscreen) self.toolbar.closeFullscreen();
        self.data.element.classList.add('fslightbox-container-fadeout');
        self.data.fadingOut = true;
        setTimeout(function () {
            self.data.fadingOut = false;
            document.body.removeChild(self.data.element);
        },250);
    };


    /**
     * Render all library elements
     * @constructor
     */
    this.dom = function () {
        require('./renderDOM.js')(self, DOMObject);
    };


    /**
     * Generate dom element with classes
     * @constructor
     */
    function DOMObject(tag) {
        this.elem = document.createElement(tag);

        this.addClassesAndCreate = function (classes) {
            for (let index in classes) {
                this.elem.classList.add(classes[index]);
            }
            return this.elem
        }
    }


    /**
     * Object that contains all actions that fslightbox is doing during running
     * @constructor
     */
    function onResizeEvent() {
        let _this = this;

        const sources = self.data.sources;

        this.refreshWindowOnresize = function () {
            window.onresize = function () {
                _this.mediaHolderDimensions();
                _this.sourcesDimensions();
            }
        };

        this.mediaHolderDimensions = function () {
            if (window.innerWidth > 1000) {
                self.data.mediaHolder.holder.style.width = (window.innerWidth - 0.1 * window.innerWidth) + 'px';
                self.data.mediaHolder.holder.style.height = (window.innerHeight - 0.1 * window.innerHeight) + 'px';
            } else {
                self.data.mediaHolder.holder.style.width = window.innerWidth + 'px';
                self.data.mediaHolder.holder.style.height = window.innerHeight + 'px';
            }
        };

        this.sourcesDimensions = function () {

            const stageSourcesIndexes = self.getSourcesIndexes.all(self.data.slide);
            const rememberedSourceDimension = self.data.rememberedSourcesDimensions;

            for (let sourceIndex in sources) {

                // add tranforms to stage sources
                if(self.data.urls.length > 2) {
                    self.transforms.transformMinus(sources[stageSourcesIndexes.previous]);
                }
                self.transforms.transformNull(sources[stageSourcesIndexes.current]);
                if(self.data.urls.length > 1) {
                    self.transforms.transformPlus(sources[stageSourcesIndexes.next]);
                }

                const elem = sources[sourceIndex].firstChild;

                let sourceWidth = rememberedSourceDimension[sourceIndex].width;
                let sourceHeight = rememberedSourceDimension[sourceIndex].height;

                const coefficient = sourceWidth / sourceHeight;
                const deviceWidth = parseInt(self.data.mediaHolder.holder.style.width);
                const deviceHeight = parseInt(self.data.mediaHolder.holder.style.height);
                let newHeight = deviceWidth / coefficient;
                if (newHeight < deviceHeight - 60) {
                    elem.style.height = newHeight + "px";
                    elem.style.width = deviceWidth + "px";
                } else {
                    newHeight = deviceHeight - 60;
                    elem.style.height = newHeight + "px";
                    elem.style.width = newHeight * coefficient + "px";
                }
            }
        };

        window.onresize = function () {
            self.data.isMobile = false;
            (function (a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) self.data.isMobile = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            _this.mediaHolderDimensions();
            _this.sourcesDimensions();
        };
    }


    /**
     * Contains methods that takes care of scrollbar
     * @type {{hideScrollbar: Window.scrollbar.hideScrollbar, showScrollbar: Window.scrollbar.showScrollbar}}
     */
    this.scrollbar = {

        hideScrollbar: function () {
            document.documentElement.classList.remove('fslightbox-open');
            if (!self.data.isMobile) {
                document.documentElement.classList.remove('fslightbox-scrollbarfix');
            }
        },

        showScrollbar: function () {
            document.documentElement.classList.add('fslightbox-open');
            if (!self.data.isMobile) {
                document.documentElement.classList.add('fslightbox-scrollbarfix');
            }
        }
    };


    /**
     * SVGIcon object with getSVGIcon method which return <svg> element with <path> child
     * @returns {Element}
     * @constructor
     */
    this.SVGIcon = function () {
        /**
         *  <svg> with added 'fslightbox-svg-icon' class
         */
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");

        /**
         * child of svg empty <path>
         */
        this.path = document.createElementNS('http://www.w3.org/2000/svg', "path");
        this.svg.setAttributeNS(null, 'class', 'fslightbox-svg-icon');
        this.svg.setAttributeNS(null, 'viewBox', '0 0 15 15');


        /**
         * Returns DOM <svg> icon containing <path> child with d attribute from parameter
         * @param d
         * @returns {*}
         */
        this.getSVGIcon = function (viewBox, dimension, d) {
            this.path.setAttributeNS(null, 'd', d);
            this.svg.setAttributeNS(null, 'viewBox', viewBox);
            this.svg.setAttributeNS(null, 'width', dimension);
            this.svg.setAttributeNS(null, 'height', dimension);
            this.svg.appendChild(this.path);
            return this.svg;
        }
    };


    /**
     * Slide counter object - upper left corner of fsLightbox
     * @constructor
     */
    this.slideCounterElem = function () {
        let numberContainer = new DOMObject('div').addClassesAndCreate(['fslightbox-slide-number-container']);
        self.data.slideCounterElem = new DOMObject('div').addClassesAndCreate(['fslightbox-slide-slide-number']);

        self.data.slideCounterElem.innerHTML = self.data.slide;
        self.data.slideCounterElem.id = 'current_slide';

        let space = new DOMObject('div').addClassesAndCreate(['fslightbox-slide-slide-number', 'fslightbox-slash']);
        space.innerHTML = '/';

        let slides = new DOMObject('div').addClassesAndCreate(['fslightbox-slide-slide-number']);
        slides.innerHTML = self.data.total_slides;

        numberContainer.appendChild(self.data.slideCounterElem);
        numberContainer.appendChild(space);
        numberContainer.appendChild(slides);

        // this method is called after switching slides
        self.data.updateSlideNumber = function (number) {
            self.data.slide = number;
            self.data.slideCounterElem.innerHTML = number;
        };

        this.renderSlideCounter = function (nav) {
            nav.appendChild(numberContainer);
        }
    };


    /**
     * Toolbar button
     * @constructor
     */
    this.toolbarButton = function () {
        this.button = new DOMObject('div').addClassesAndCreate(['fslightbox-toolbar-button', 'button-style']);

        this.addSVGIcon = function (d) {
            let SVGIcon = new self.SVGIcon().getSVGIcon(d);
            this.button.appendChild(
                SVGIcon
            )
        };

        this.remove = function () {
            console.log(this.button);
        }
    };


    /**
     * Toolbar object which contains toolbar buttons
     * @constructor
     */
    let toolbarModule = require('./toolbar');
    this.toolbar = new toolbarModule(self,DOMObject);


    /**
     * Div that holds source elem
     */
    this.mediaHolder = function () {
        this.holder = new DOMObject('div').addClassesAndCreate(['fslightbox-media-holder']);

        if (window.innerWidth > 1000) {
            this.holder.style.width = (window.innerWidth - 0.1 * window.innerWidth) + 'px';
            this.holder.style.height = (window.innerHeight - 0.1 * window.innerHeight) + 'px';
        } else {
            this.holder.style.width = window.innerWidth + 'px';
            this.holder.style.height = window.innerHeight + 'px';
        }

        this.renderHolder = function (container) {
            container.appendChild(this.holder);
        };
    };


    /**
     * Return object with stage sources indexes depending on provided slide
     * @param slide
     * @returns {{previous: number, current: number, next: number}}
     */
    this.getSourcesIndexes = {

        previous: function (slide) {
            let previousSlideIndex;
            const arrayIndex = slide - 1;

            // previous
            if (arrayIndex === 0) {
                previousSlideIndex = self.data.total_slides - 1;
            } else {
                previousSlideIndex = arrayIndex - 1;
            }

            return previousSlideIndex;
        },


        next: function (slide) {

            let nextSlideIndex;
            const arrayIndex = slide - 1;

            //next
            if (slide === self.data.total_slides) {
                nextSlideIndex = 0;
            } else {
                nextSlideIndex = arrayIndex + 1;
            }

            return nextSlideIndex;
        },


        all: function (slide) {
            // sources are stored in array indexed from 0
            const arrayIndex = slide - 1;
            const sourcesIndexes = {
                previous: 0,
                current: 0,
                next: 0
            };

            // previous
            if (arrayIndex === 0) {
                sourcesIndexes.previous = self.data.total_slides - 1;
            } else {
                sourcesIndexes.previous = arrayIndex - 1;
            }

            // current
            sourcesIndexes.current = arrayIndex;

            //next
            if (slide === self.data.total_slides) {
                sourcesIndexes.next = 0;
            } else {
                sourcesIndexes.next = arrayIndex + 1;
            }

            return sourcesIndexes;
        },
    };


    this.transforms = {

        transformMinus: function (elem) {
            elem.style.transform = 'translate(' + (-self.data.slideDistance * window.innerWidth) + 'px,0)';
        },

        transformNull: function (elem) {
            elem.style.transform = 'translate(0,0)';
        },

        transformPlus: function (elem) {
            elem.style.transform = 'translate(' + self.data.slideDistance * window.innerWidth + 'px,0)';
        }
    };


    /**
     * Stop videos after changing slide
     */
    this.stopVideos = function () {

        const videos = self.data.videos;

        // true is html5 video, false is youtube video
        for (let videoIndex in videos) {

            if (videos[videoIndex] === true) {
                if (typeof self.data.sources[videoIndex].firstChild.pause !== "undefined") {
                    self.data.sources[videoIndex].firstChild.pause();
                }
            }
            else {
                self.data.sources[videoIndex].firstChild.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*')
            }
        }
    };


    this.setSlide = function (slide) {

        self.data.slide = slide;
        self.data.updateSlideNumber(slide);
        const sourcesIndexes = self.getSourcesIndexes.all(slide);
        const sources = self.data.sources;

        if (sources.length === 0) {
            self.loadsources('initial', slide);
        } else {
            if (typeof sources[sourcesIndexes.previous] === "undefined")
                self.loadsources('previous', slide);


            if (typeof sources[sourcesIndexes.current] === "undefined")
                self.loadsources('current', slide);


            if (typeof sources[sourcesIndexes.next] === "undefined")
                self.loadsources('next', slide);
        }

        for (let sourceIndex in sources) {
            sources[sourceIndex].classList.remove('fslightbox-transform-transition');

            // sources length needs to be higher than 1 because if there is only 1 slide
            // sourcesIndexes.previous will be 0 so it would return a bad transition
            if (sourceIndex == sourcesIndexes.previous && sources.length > 1) {
                self.transforms.transformMinus(sources[sourcesIndexes.previous]);
                continue;
            }
            if (sourceIndex == sourcesIndexes.current) {
                self.transforms.transformNull(sources[sourcesIndexes.current]);
                continue;
            }
            if (sourceIndex == sourcesIndexes.next) {
                self.transforms.transformPlus(sources[sourcesIndexes.next]);
                continue;
            }

            self.transforms.transformMinus(sources[sourceIndex]);
        }
    };


    /**
     * Methods that appends sources to mediaHolder depending on action
     * @type {{initialAppend, previousAppend, nextAppend}|*}
     */
    this.appendMethods = require('./appendSource');


    /**
     * Display source (images, HTML5 video, YouTube video) depending on given url from user
     * Or if display is initial display 3 initial sources
     * If there are >= 3 initial sources there will be always 3 in stage
     * @param typeOfLoad
     * @param slide
     * @returns {module.exports}
     */
    this.loadsources = function (typeOfLoad, slide) {
        const loadsourcemodule = require("./loadSource.js");
        return new loadsourcemodule(self, DOMObject, typeOfLoad, slide);
    };
}
;


!function () {
    window.fsLightboxInstances = [];
    let a = document.getElementsByTagName('a');

    for (let i = 0; i < a.length; i++) {

        if (!a[i].hasAttribute('data-fslightbox')) {
            continue;
        }

        const boxName =  a[i].getAttribute('data-fslightbox');
        if(typeof fsLightboxInstances[boxName] === "undefined") {
            fsLightbox = new fsLightboxObject();
            fsLightboxInstances[boxName] = fsLightbox;
        }

        a[i].addEventListener('click', function (e) {

            e.preventDefault();
            const gallery = e.target.parentNode.getAttribute('data-fslightbox');

            if (fsLightboxInstances[gallery].data.initiated) {
                fsLightboxInstances[gallery].setSlide(
                    fsLightboxInstances[gallery].data.urls.indexOf(e.target.parentNode.getAttribute('href')) + 1
                );
                fsLightboxInstances[gallery].show();
                return;
            }

            let urls = [];
            for (let j = 0; j < a.length; j++) {

                const name = a[j].getAttribute('data-fslightbox');

                if (name === gallery) {
                    urls.push(a[j].getAttribute('href'));
                }
            }

            fsLightboxInstances[gallery].data.urls = urls;
            fsLightboxInstances[gallery].data.total_slides = urls.length;
            fsLightboxInstances[gallery].init();
            fsLightboxInstances[gallery].setSlide(
                urls.indexOf(e.target.parentNode.getAttribute('href')) + 1
            );
        });
    }
}(document, window);

},{"./appendSource":1,"./changeSlideByDragging.js":2,"./loadSource.js":4,"./renderDOM.js":5,"./toolbar":6}],4:[function(require,module,exports){
module.exports = function (self, DOMObject, typeOfLoad, slide) {

    const _this = this;
    const sourcesIndexes = self.getSourcesIndexes.all(slide);
    const urls = self.data.urls;
    const sources = self.data.sources;
    let tempSources = {};

    let sourceDimensions = function (sourceElem, sourceWidth, sourceHeight) {

        const coefficient = sourceWidth / sourceHeight;
        const deviceWidth = parseInt(self.data.mediaHolder.holder.style.width);
        const deviceHeight = parseInt(self.data.mediaHolder.holder.style.height);
        let newHeight = deviceWidth / coefficient;
        if (newHeight < deviceHeight - 60) {
            sourceElem.style.height = newHeight + "px";
            sourceElem.style.width = deviceWidth + "px";
        } else {
            newHeight = deviceHeight - 60;
            sourceElem.style.height = newHeight + "px";
            sourceElem.style.width = newHeight * coefficient + "px";
        }
    };


    let load = function (sourceHolder, sourceElem) {
        sourceHolder.innerHTML = '';
        sourceHolder.appendChild(sourceElem);
        void sourceHolder.firstChild.offsetWidth;
        sourceHolder.firstChild.classList.add('fslightbox-fade-in-animation');
    };

    let appendInitial = function (sourceHolder, sourceElem) {
        sourceHolder.innerHTML = '';
        sourceHolder.appendChild(sourceElem.firstChild);
        sourceHolder.firstChild.classList.add('fslightbox-fade-in-animation');
    };

    /**
     * add fade in class and dimension function
     */
    let onloadListener = function (sourceElem, sourceWidth, sourceHeight, arrayIndex) {

        let sourceHolder = new DOMObject('div').addClassesAndCreate(['fslightbox-source-holder']);

        //normal source dimensions needs to be stored in array
        //it will be needed when resizing a source
        self.data.rememberedSourcesDimensions[arrayIndex] = {
            "width": sourceWidth,
            "height": sourceHeight
        };

        // set dimensions for the 1st time
        sourceDimensions(sourceElem, sourceWidth, sourceHeight);

        sourceHolder.appendChild(sourceElem);
        const previousSource = sources[sourcesIndexes.previous];
        const currentSource = sources[sourcesIndexes.current];
        const nextSource = sources[sourcesIndexes.next];


        switch (typeOfLoad) {
            case 'initial':
                // add to temp array because loading is asynchronous so we can't depend on load order
                tempSources[arrayIndex] = sourceHolder;
                const tempSourcesLength = Object.keys(tempSources).length;

                let appends = {

                    appendPrevious: function () {
                        appendInitial(previousSource, tempSources[sourcesIndexes.previous]);
                    },

                    appendCurrent: function () {
                        appendInitial(currentSource, tempSources[sourcesIndexes.current]);
                    },

                    appendNext: function () {
                        appendInitial(nextSource, tempSources[sourcesIndexes.next]);
                    }
                };

                if(urls.length >= 3) {
                    // append sources only if all stage sources are loaded
                    if(tempSourcesLength >= 3) {
                        appends.appendPrevious();
                        appends.appendCurrent();
                        appends.appendNext();
                    }
                }


                if(urls.length === 2) {
                    if(tempSourcesLength >= 2) {
                        appends.appendPrevious();
                        appends.appendCurrent();
                    }
                }

                if(urls.length === 1) {
                    appends.appendCurrent();
                }
                break;
            case 'current':
                // replace loader with loaded source
                load(currentSource, sourceElem);
                break;
            case 'next':
                // replace loader with loaded source
                load(nextSource, sourceElem);
                break;
            case 'previous':
                // replace loader with loaded source
                load(previousSource, sourceElem);
                break;
        }
    };


    this.loadYoutubevideo = function (videoId, arrayIndex) {
        let iframe = new DOMObject('iframe').addClassesAndCreate(['fslightbox-single-source']);
        iframe.src = '//www.youtube.com/embed/' + videoId + '?enablejsapi=1';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('frameborder', '0');
        iframe.onmouseup = function () {
            console.log('japierdoel');
        };
        self.data.mediaHolder.holder.appendChild(iframe);
        onloadListener(iframe, 1920, 1080, arrayIndex);
    };


    this.imageLoad = function (src, arrayIndex) {
        let sourceElem = new DOMObject('img').addClassesAndCreate(['fslightbox-single-source']);
        sourceElem.src = src;
        sourceElem.addEventListener('load', function () {
            onloadListener(sourceElem, this.width, this.height, arrayIndex);
        });
    };


    this.videoLoad = function (src, arrayIndex) {
        let videoElem = new DOMObject('video').addClassesAndCreate(['fslightbox-single-source']);
        let source = new DOMObject('source').elem;
        source.src = src;
        videoElem.innerText = 'Sorry, your browser doesn\'t support embedded videos, <a\n' +
            '            href="http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4">download</a> and watch\n' +
            '        with your favorite video player!';

        videoElem.setAttribute('controls', '');
        videoElem.appendChild(source);
        videoElem.addEventListener('loadedmetadata', function () {
            onloadListener(videoElem, this.videoWidth, this.videoHeight, arrayIndex);
        });
    };

    this.invalidFile = function (arrayIndex) {
        let invalidFileWrapper = new DOMObject('div').addClassesAndCreate(['fslightbox-invalid-file-wrapper']);
        invalidFileWrapper.innerHTML = 'Invalid file';

        onloadListener(invalidFileWrapper, window.innerWidth, window.innerHeight, arrayIndex);
    };


    this.createSourceElem = function (sourceUrl) {
        const parser = document.createElement('a');
        const indexOfSource = self.data.urls.indexOf(sourceUrl);

        parser.href = sourceUrl;

        function getId(sourceUrl) {
            let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            let match = sourceUrl.match(regExp);

            if (match && match[2].length == 11) {
                return match[2];
            } else {
                return 'error';
            }
        }

        if (parser.hostname === 'www.youtube.com') {
            self.data.videos[indexOfSource] = false;
            this.loadYoutubevideo(getId(sourceUrl), indexOfSource);
        } else {
            const xhr = new XMLHttpRequest();
            xhr.onloadstart = function () {
                xhr.responseType = "blob";
            };

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        //check what type of file provided from link
                        let responseType = xhr.response.type;
                        responseType.indexOf('/');
                        responseType = responseType.slice(0, responseType.indexOf('/'));

                        if (responseType === 'image') {
                            _this.imageLoad(URL.createObjectURL(xhr.response), indexOfSource);
                        }

                        else if (responseType === 'video') {
                            _this.videoLoad(URL.createObjectURL(xhr.response), indexOfSource);
                            self.data.videos[indexOfSource] = true;
                        }

                        else {
                            _this.invalidFile(indexOfSource);
                        }
                    }
                }
            };

            xhr.open('get', sourceUrl, true);
            xhr.send(null);
        }
    };


    switch (typeOfLoad) {
        case 'initial':
            //append loader when loading initially
            self.appendMethods.renderHolderInitial(self,slide,DOMObject);

            if(urls.length >= 1) {
                this.createSourceElem(urls[sourcesIndexes.current]);
            }

            if(urls.length >= 2) {
                this.createSourceElem(urls[sourcesIndexes.next]);
            }

            if(urls.length >= 3) {
                this.createSourceElem(urls[sourcesIndexes.previous]);
                break;
            }
            break;

        case 'previous':
            // append loader when loading a next source
            self.appendMethods.renderHolderPrevious(slide);

            // load previous source
            this.createSourceElem(urls[sourcesIndexes.previous]);
            break;

        case 'next':
            // append loader when loading a next source
            self.appendMethods.renderHolderNext(slide);

            //load next source
            this.createSourceElem(urls[sourcesIndexes.next]);
            break;

        case 'current':

            // append loader when loading a next source
            self.appendMethods.renderHolderCurrent(slide);

            // load previous source
            this.createSourceElem(urls[sourcesIndexes.current]);
            break;
    }
};
},{}],5:[function(require,module,exports){
module.exports = function (self, DOMObject) {
    let privateMethods = {

        renderNav: function (container) {
            self.data.nav = new DOMObject('div').addClassesAndCreate(['fslightbox-nav']);
            self.toolbar.renderToolbar(self.data.nav);

            if (self.data.slideCounter === true) {
                new self.slideCounterElem().renderSlideCounter(self.data.nav);
            }

            container.appendChild(self.data.nav);

        },

        createBTN: function(buttonContainer, container, d) {
            let btn = new DOMObject('div').addClassesAndCreate(['fslightbox-slide-btn', 'button-style']);
            btn.appendChild(
                new self.SVGIcon().getSVGIcon('0 0 20 20', '1em', d)
            );
            buttonContainer.appendChild(btn);
            container.appendChild(buttonContainer);
        },

        renderSlideButtons: function (container) {
            if (self.data.slideButtons === false) {
                return false;
            }
            //render left btn
            let left_btn_container = new DOMObject('div').addClassesAndCreate(['fslightbox-slide-btn-container','fslightbox-slide-btn-left-container']);
            this.createBTN(left_btn_container, container, 'M8.388,10.049l4.76-4.873c0.303-0.31,0.297-0.804-0.012-1.105c-0.309-0.304-0.803-0.293-1.105,0.012L6.726,9.516c-0.303,0.31-0.296,0.805,0.012,1.105l5.433,5.307c0.152,0.148,0.35,0.223,0.547,0.223c0.203,0,0.406-0.08,0.559-0.236c0.303-0.309,0.295-0.803-0.012-1.104L8.388,10.049z');

            //go to previous slide onclick
            left_btn_container.onclick = function () {
                self.appendMethods.previousSlideViaButton(self,self.data.slide);
            };

            let right_btn_container = new DOMObject('div').addClassesAndCreate(['fslightbox-slide-btn-container', 'fslightbox-slide-btn-right-container']);
            this.createBTN(right_btn_container, container, 'M11.611,10.049l-4.76-4.873c-0.303-0.31-0.297-0.804,0.012-1.105c0.309-0.304,0.803-0.293,1.105,0.012l5.306,5.433c0.304,0.31,0.296,0.805-0.012,1.105L7.83,15.928c-0.152,0.148-0.35,0.223-0.547,0.223c-0.203,0-0.406-0.08-0.559-0.236c-0.303-0.309-0.295-0.803,0.012-1.104L11.611,10.049z');
            // go to next slide on click
            right_btn_container.onclick = function () {
                self.appendMethods.nextSlideViaButton(self,self.data.slide);
            };
        }
    };

    //disable scrolling and add fix for jumping site if not mobile
    self.scrollbar.showScrollbar();

    //create container
    self.data.element = new DOMObject('div').addClassesAndCreate(['fslightbox-container']);
    self.data.element.id = "fslightbox-container";
    document.body.appendChild(self.data.element);

    //render slide buttons and nav(toolbar)
    privateMethods.renderNav(self.data.element);

    if(self.data.total_slides > 1) {
        privateMethods.renderSlideButtons(self.data.element);
    }

    self.data.mediaHolder = new self.mediaHolder();
    self.data.mediaHolder.renderHolder(self.data.element);
    self.data.element.classList.add(['fslightbox-fade-in-animation']);
    self.data.isfirstTimeLoad = true;
};
},{}],6:[function(require,module,exports){
module.exports = function (self, DOMObject) {

    this.toolbarElem = new DOMObject('div').addClassesAndCreate(['fslightbox-toolbar']);
    const _this = this;

    this.renderDefaultButtons = function () {
        let shouldRenderButtons = self.data.toolbarButtons;

        if (shouldRenderButtons.fullscreen === true) {
            let button = new DOMObject('div').addClassesAndCreate(['fslightbox-toolbar-button', 'button-style']);
            let svg = new self.SVGIcon().getSVGIcon('0 0 17.5 17.5', '1.25em', 'M4.5 11H3v4h4v-1.5H4.5V11zM3 7h1.5V4.5H7V3H3v4zm10.5 6.5H11V15h4v-4h-1.5v2.5zM11 3v1.5h2.5V7H15V3h-4z');
            button.appendChild(svg);
            button.onclick = function () {
                (self.data.fullscreen) ?
                    _this.closeFullscreen():
                    _this.openFullscreen();

            };
            this.toolbarElem.appendChild(button);
        }

        if (shouldRenderButtons.close === true) {
            let button = new DOMObject('div').addClassesAndCreate(['fslightbox-toolbar-button', 'button-style']);
            let svg = new self.SVGIcon().getSVGIcon('0 0 20 20', '1em', 'M 11.469 10 l 7.08 -7.08 c 0.406 -0.406 0.406 -1.064 0 -1.469 c -0.406 -0.406 -1.063 -0.406 -1.469 0 L 10 8.53 l -7.081 -7.08 c -0.406 -0.406 -1.064 -0.406 -1.469 0 c -0.406 0.406 -0.406 1.063 0 1.469 L 8.531 10 L 1.45 17.081 c -0.406 0.406 -0.406 1.064 0 1.469 c 0.203 0.203 0.469 0.304 0.735 0.304 c 0.266 0 0.531 -0.101 0.735 -0.304 L 10 11.469 l 7.08 7.081 c 0.203 0.203 0.469 0.304 0.735 0.304 c 0.267 0 0.532 -0.101 0.735 -0.304 c 0.406 -0.406 0.406 -1.064 0 -1.469 L 11.469 10 Z');
            button.appendChild(svg);
            button.onclick = function () {
                if(!self.data.fadingOut) self.hide();
            };
            this.toolbarElem.appendChild(button);
        }
    };


    this.openFullscreen = function () {
        self.data.fullscreen = true;
        let elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    };

    this.closeFullscreen = function () {
        self.data.fullscreen = false;
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };

    this.renderToolbar = function (nav) {
        this.renderDefaultButtons();
        nav.appendChild(this.toolbarElem);
    };
};
},{}]},{},[3,5,4,1,2,6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYXBwZW5kU291cmNlLmpzIiwic3JjL2pzL2NoYW5nZVNsaWRlQnlEcmFnZ2luZy5qcyIsInNyYy9qcy9pbmRleC5qcyIsInNyYy9qcy9sb2FkU291cmNlLmpzIiwic3JjL2pzL3JlbmRlckRPTS5qcyIsInNyYy9qcy90b29sYmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgbG9hZGVyOiAnPGRpdiBjbGFzcz1cImxkcy1yaW5nXCI+PGRpdj48L2Rpdj48ZGl2PjwvZGl2PjxkaXY+PC9kaXY+PGRpdj48L2Rpdj48L2Rpdj4nLFxyXG4gICAgc2VsZjogJycsXHJcbiAgICBET01PYmplY3Q6ICcnLFxyXG5cclxuICAgIGNyZWF0ZUhvbGRlcjogZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgbGV0IHNvdXJjZUhvbGRlciA9IG5ldyB0aGlzLkRPTU9iamVjdCgnZGl2JykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtc291cmNlLWhvbGRlciddKTtcclxuICAgICAgICBzb3VyY2VIb2xkZXIuaW5uZXJIVE1MID0gdGhpcy5sb2FkZXI7XHJcbiAgICAgICAgdGhpcy5zZWxmLmRhdGEuc291cmNlc1tpbmRleF0gPSBzb3VyY2VIb2xkZXI7XHJcbiAgICAgICAgcmV0dXJuIHNvdXJjZUhvbGRlcjtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBsb2FkZXIgd2hlbiBsb2FkaW5nIGZzTGlnaHRib3ggaW5pdGlhbGx5XHJcbiAgICAgKiBAcGFyYW0gc2VsZlxyXG4gICAgICogQHBhcmFtIHNsaWRlXHJcbiAgICAgKiBAcGFyYW0gRE9NT2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHJlbmRlckhvbGRlckluaXRpYWw6IGZ1bmN0aW9uIChzZWxmLCBzbGlkZSwgRE9NT2JqZWN0KSB7XHJcbiAgICAgICAgdGhpcy5zZWxmID0gc2VsZjtcclxuICAgICAgICB0aGlzLkRPTU9iamVjdCA9IERPTU9iamVjdDtcclxuICAgICAgICBjb25zdCBzb3VyY2VzSW5kZXhlcyA9IHNlbGYuZ2V0U291cmNlc0luZGV4ZXMuYWxsKHNsaWRlKTtcclxuICAgICAgICBjb25zdCB0b3RhbFNsaWRlcyA9IHNlbGYuZGF0YS50b3RhbF9zbGlkZXM7XHJcblxyXG4gICAgICAgIGlmICh0b3RhbFNsaWRlcyA+PSAzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZXYgPSB0aGlzLmNyZWF0ZUhvbGRlcihzb3VyY2VzSW5kZXhlcy5wcmV2aW91cyk7XHJcbiAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1NaW51cyhwcmV2KTtcclxuICAgICAgICAgICAgc2VsZi5kYXRhLm1lZGlhSG9sZGVyLmhvbGRlci5hcHBlbmRDaGlsZChwcmV2KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRvdGFsU2xpZGVzID49IDEpIHtcclxuICAgICAgICAgICAgY29uc3QgY3VyciA9IHRoaXMuY3JlYXRlSG9sZGVyKHNvdXJjZXNJbmRleGVzLmN1cnJlbnQpO1xyXG4gICAgICAgICAgICBzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLmFwcGVuZENoaWxkKGN1cnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodG90YWxTbGlkZXMgPj0gMikge1xyXG4gICAgICAgICAgICBjb25zdCBuZXh0ID0gdGhpcy5jcmVhdGVIb2xkZXIoc291cmNlc0luZGV4ZXMubmV4dCk7XHJcbiAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1QbHVzKG5leHQpO1xyXG4gICAgICAgICAgICBzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLmFwcGVuZENoaWxkKG5leHQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBsb2FkZXIgd2hlbiBsb2FkaW5nIGEgcHJldmlvdXMgc291cmNlXHJcbiAgICAgKiBAcGFyYW0gc2xpZGVcclxuICAgICAqL1xyXG4gICAgcmVuZGVySG9sZGVyUHJldmlvdXM6IGZ1bmN0aW9uIChzbGlkZSkge1xyXG4gICAgICAgIGNvbnN0IHByZXZpb3VzU291cmNlSW5kZXggPSB0aGlzLnNlbGYuZ2V0U291cmNlc0luZGV4ZXMucHJldmlvdXMoc2xpZGUpO1xyXG4gICAgICAgIGNvbnN0IHByZXYgPSB0aGlzLmNyZWF0ZUhvbGRlcihwcmV2aW91c1NvdXJjZUluZGV4KTtcclxuICAgICAgICB0aGlzLnNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1NaW51cyhwcmV2KTtcclxuICAgICAgICB0aGlzLnNlbGYuZGF0YS5tZWRpYUhvbGRlci5ob2xkZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KCdhZnRlcmJlZ2luJywgcHJldik7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgbG9hZGVyIHdoZW4gbG9hZGluZyBhIG5leHQgc291cmNlXHJcbiAgICAgKiBAcGFyYW0gc2xpZGVcclxuICAgICAqL1xyXG4gICAgcmVuZGVySG9sZGVyTmV4dDogZnVuY3Rpb24gKHNsaWRlKSB7XHJcbiAgICAgICAgY29uc3QgbmV4dFNvdXJjZUluZGV4ID0gdGhpcy5zZWxmLmdldFNvdXJjZXNJbmRleGVzLm5leHQoc2xpZGUpO1xyXG4gICAgICAgIGNvbnN0IG5leHQgPSB0aGlzLmNyZWF0ZUhvbGRlcihuZXh0U291cmNlSW5kZXgpO1xyXG4gICAgICAgIHRoaXMuc2VsZi50cmFuc2Zvcm1zLnRyYW5zZm9ybVBsdXMobmV4dCk7XHJcbiAgICAgICAgdGhpcy5zZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLmFwcGVuZENoaWxkKG5leHQpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXJzIGxvYWRlciB3aGVuIGxvYWRpbmcgYSBwcmV2aW91cyBzb3VyY2VcclxuICAgICAqIEBwYXJhbSBzbGlkZVxyXG4gICAgICovXHJcbiAgICByZW5kZXJIb2xkZXJDdXJyZW50OiBmdW5jdGlvbiAoc2xpZGUpIHtcclxuICAgICAgICBjb25zdCBzb3VyY2VzSW5kZXhlcyA9IHRoaXMuc2VsZi5nZXRTb3VyY2VzSW5kZXhlcy5hbGwoc2xpZGUpO1xyXG4gICAgICAgIGNvbnN0IGN1cnIgPSB0aGlzLmNyZWF0ZUhvbGRlcihzb3VyY2VzSW5kZXhlcy5jdXJyZW50KTtcclxuICAgICAgICB0aGlzLnNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1OdWxsKGN1cnIpO1xyXG4gICAgICAgIHRoaXMuc2VsZi5kYXRhLm1lZGlhSG9sZGVyLmhvbGRlci5pbnNlcnRCZWZvcmUoY3VyciwgdGhpcy5zZWxmLmRhdGEuc291cmNlc1tzb3VyY2VzSW5kZXhlcy5uZXh0XSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoYW5nZSBzbGlkZSB0byBwcmV2aW91cyBhZnRlciBjbGlja2luZyBidXR0b25cclxuICAgICAqIEBwYXJhbSBzZWxmXHJcbiAgICAgKiBAcGFyYW0gcHJldmlvdXNTbGlkZVxyXG4gICAgICovXHJcbiAgICBwcmV2aW91c1NsaWRlVmlhQnV0dG9uOiBmdW5jdGlvbiAoc2VsZiwgcHJldmlvdXNTbGlkZSkge1xyXG4gICAgICAgIGlmIChwcmV2aW91c1NsaWRlID09PSAxKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZGF0YS5zbGlkZSA9IHNlbGYuZGF0YS50b3RhbF9zbGlkZXM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2VsZi5kYXRhLnNsaWRlIC09IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxmLnN0b3BWaWRlb3MoKTtcclxuICAgICAgICBzZWxmLmRhdGEudXBkYXRlU2xpZGVOdW1iZXIoc2VsZi5kYXRhLnNsaWRlKTtcclxuICAgICAgICBjb25zdCBuZXdTb3VyY2VzSW5kZXhlcyA9IHNlbGYuZ2V0U291cmNlc0luZGV4ZXMuYWxsKHNlbGYuZGF0YS5zbGlkZSk7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZi5kYXRhLnNvdXJjZXNbbmV3U291cmNlc0luZGV4ZXMucHJldmlvdXNdID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgIHNlbGYubG9hZHNvdXJjZXMoJ3ByZXZpb3VzJywgc2VsZi5kYXRhLnNsaWRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvdXJjZXMgPSBzZWxmLmRhdGEuc291cmNlcztcclxuICAgICAgICBjb25zdCBjdXJyZW50U291cmNlID0gc291cmNlc1tuZXdTb3VyY2VzSW5kZXhlcy5jdXJyZW50XTtcclxuICAgICAgICBjb25zdCBuZXh0U291cmNlID0gc291cmNlc1tuZXdTb3VyY2VzSW5kZXhlcy5uZXh0XTtcclxuXHJcbiAgICAgICAgbmV4dFNvdXJjZS5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcbiAgICAgICAgY3VycmVudFNvdXJjZS5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcbiAgICAgICAgc291cmNlc1tuZXdTb3VyY2VzSW5kZXhlcy5wcmV2aW91c10uY2xhc3NMaXN0LnJlbW92ZSgnZnNsaWdodGJveC10cmFuc2Zvcm0tdHJhbnNpdGlvbicpO1xyXG5cclxuICAgICAgICBuZXh0U291cmNlLmNsYXNzTGlzdC5yZW1vdmUoJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nKTtcclxuICAgICAgICB2b2lkIG5leHRTb3VyY2Uub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgbmV4dFNvdXJjZS5jbGFzc0xpc3QuYWRkKCdmc2xpZ2h0Ym94LWZhZGUtaW4tYW5pbWF0aW9uJyk7XHJcblxyXG5cclxuICAgICAgICBjdXJyZW50U291cmNlLmNsYXNzTGlzdC5yZW1vdmUoJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nKTtcclxuICAgICAgICB2b2lkIGN1cnJlbnRTb3VyY2Uub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgY3VycmVudFNvdXJjZS5jbGFzc0xpc3QuYWRkKCdmc2xpZ2h0Ym94LWZhZGUtaW4tYW5pbWF0aW9uJyk7XHJcblxyXG4gICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1OdWxsKGN1cnJlbnRTb3VyY2UpO1xyXG4gICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1QbHVzKG5leHRTb3VyY2UpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugc2xpZGUgdG8gbmV4dCBhZnRlciBjbGlja2luZyBidXR0b25cclxuICAgICAqIEBwYXJhbSBzZWxmXHJcbiAgICAgKiBAcGFyYW0gcHJldmlvdXNTbGlkZVxyXG4gICAgICovXHJcbiAgICBuZXh0U2xpZGVWaWFCdXR0b246IGZ1bmN0aW9uIChzZWxmLCBwcmV2aW91c1NsaWRlKSB7XHJcbiAgICAgICAgaWYgKHByZXZpb3VzU2xpZGUgPT09IHNlbGYuZGF0YS50b3RhbF9zbGlkZXMpIHtcclxuICAgICAgICAgICAgc2VsZi5kYXRhLnNsaWRlID0gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxmLmRhdGEuc2xpZGUgKz0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYuc3RvcFZpZGVvcygpO1xyXG4gICAgICAgIHNlbGYuZGF0YS51cGRhdGVTbGlkZU51bWJlcihzZWxmLmRhdGEuc2xpZGUpO1xyXG4gICAgICAgIGNvbnN0IG5ld1NvdXJjZXNJbmRleGVzID0gc2VsZi5nZXRTb3VyY2VzSW5kZXhlcy5hbGwoc2VsZi5kYXRhLnNsaWRlKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzZWxmLmRhdGEuc291cmNlc1tuZXdTb3VyY2VzSW5kZXhlcy5uZXh0XSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICBzZWxmLmxvYWRzb3VyY2VzKCduZXh0Jywgc2VsZi5kYXRhLnNsaWRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvdXJjZXMgPSBzZWxmLmRhdGEuc291cmNlcztcclxuICAgICAgICBjb25zdCBjdXJyZW50U291cmNlID0gc291cmNlc1tuZXdTb3VyY2VzSW5kZXhlcy5jdXJyZW50XTtcclxuICAgICAgICBjb25zdCBwcmV2aW91c1NvdXJjZSA9IHNvdXJjZXNbbmV3U291cmNlc0luZGV4ZXMucHJldmlvdXNdO1xyXG5cclxuICAgICAgICBwcmV2aW91c1NvdXJjZS5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcbiAgICAgICAgY3VycmVudFNvdXJjZS5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcbiAgICAgICAgc291cmNlc1tuZXdTb3VyY2VzSW5kZXhlcy5uZXh0XS5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcblxyXG4gICAgICAgIHByZXZpb3VzU291cmNlLmNsYXNzTGlzdC5yZW1vdmUoJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nKTtcclxuICAgICAgICB2b2lkIHByZXZpb3VzU291cmNlLm9mZnNldFdpZHRoO1xyXG4gICAgICAgIHByZXZpb3VzU291cmNlLmNsYXNzTGlzdC5hZGQoJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nKTtcclxuXHJcblxyXG4gICAgICAgIGN1cnJlbnRTb3VyY2UuY2xhc3NMaXN0LnJlbW92ZSgnZnNsaWdodGJveC1mYWRlLWluLWFuaW1hdGlvbicpO1xyXG4gICAgICAgIHZvaWQgY3VycmVudFNvdXJjZS5vZmZzZXRXaWR0aDtcclxuICAgICAgICBjdXJyZW50U291cmNlLmNsYXNzTGlzdC5hZGQoJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nKTtcclxuXHJcblxyXG4gICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1OdWxsKGN1cnJlbnRTb3VyY2UpO1xyXG4gICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1NaW51cyhwcmV2aW91c1NvdXJjZSk7XHJcbiAgICB9XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VsZiwgRE9NT2JqZWN0KSB7XHJcblxyXG4gICAgLy93ZSB3aWxsIGhvdmVyIGFsbCB3aW5kb3dzIHdpdGggZGl2IHdpdGggaGlnaCB6LWluZGV4IHRvIGJlIHN1cmUgbW91c2V1cCBpcyB0cmlnZ2VyZWRcclxuICAgIGNvbnN0IGludmlzaWJsZUhvdmVyID0gbmV3IERPTU9iamVjdCgnZGl2JykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtaW52aXNpYmxlLWhvdmVyJ10pO1xyXG5cclxuICAgIC8vdG8gdGhlc2UgZWxlbWVudHMgYXJlIGFkZGVkIG1vdXNlIGV2ZW50c1xyXG4gICAgY29uc3QgZWxlbWVudHMgPSB7XHJcbiAgICAgICAgXCJtZWRpYUhvbGRlclwiOiBzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLFxyXG4gICAgICAgIFwibmF2XCI6IHNlbGYuZGF0YS5uYXYsXHJcbiAgICAgICAgXCJpbnZpc2libGVIb3ZlclwiOiBpbnZpc2libGVIb3ZlclxyXG4gICAgfTtcclxuICAgIC8vc291cmNlcyBhcmUgdHJhbnNmb3JtZWRcclxuICAgIGNvbnN0IHNvdXJjZXMgPSBzZWxmLmRhdGEuc291cmNlcztcclxuICAgIGNvbnN0IG1lZGlhSG9sZGVyID0gc2VsZi5kYXRhLm1lZGlhSG9sZGVyLmhvbGRlcjtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSBhcmUgb25seSAyIG9yIDEgdXJscyB0cmFuc2Zvcm1zIHdpbGwgYmUgZGlmZmVyZW50XHJcbiAgICBjb25zdCB1cmxzTGVuZ3RoID0gc2VsZi5kYXRhLnVybHMubGVuZ3RoO1xyXG5cclxuICAgIGxldCBpc19kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgbGV0IG1vdXNlRG93bkNsaWVudFg7XHJcbiAgICBsZXQgZGlmZmVyZW5jZTtcclxuICAgIGxldCBzbGlkZWFBYmxlID0gdHJ1ZTtcclxuXHJcbiAgICBsZXQgZXZlbnRMaXN0ZW5lcnMgPSB7XHJcblxyXG5cclxuICAgICAgICBtb3VzZURvd25FdmVudDogZnVuY3Rpb24gKGUpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHRhZyBjYW4ndCBiZSB2aWRlbyBjYXVzZSBpdCB3b3VsZCBiZSB1bmNsaWNrYWJsZSBpbiBtaWNyb3NvZnQgYnJvd3NlcnNcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUgIT09ICdWSURFTycpIHtcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGxldCBlbGVtIGluIGVsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50c1tlbGVtXS5jbGFzc0xpc3QuYWRkKCdmc2xpZ2h0Ym94LWN1cnNvci1ncmFiYmluZycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlzX2RyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgKHNlbGYuZGF0YS5pc01vYmlsZSkgP1xyXG4gICAgICAgICAgICAgICAgbW91c2VEb3duQ2xpZW50WCA9IGUudG91Y2hlc1swXS5jbGllbnRYIDpcclxuICAgICAgICAgICAgICAgIG1vdXNlRG93bkNsaWVudFggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgIGRpZmZlcmVuY2UgPSAwO1xyXG4gICAgICAgIH0sXHJcblxyXG5cclxuICAgICAgICBtb3VzZVVwRXZlbnQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChtZWRpYUhvbGRlci5jb250YWlucyhpbnZpc2libGVIb3ZlcikpIHtcclxuICAgICAgICAgICAgICAgIG1lZGlhSG9sZGVyLnJlbW92ZUNoaWxkKGludmlzaWJsZUhvdmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgc291cmNlc0luZGV4ZXMgPSBzZWxmLmdldFNvdXJjZXNJbmRleGVzLmFsbChzZWxmLmRhdGEuc2xpZGUpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgZWxlbSBpbiBlbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHNbZWxlbV0uY2xhc3NMaXN0LnJlbW92ZSgnZnNsaWdodGJveC1jdXJzb3ItZ3JhYmJpbmcnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaXNfZHJhZ2dpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIHVzZXIgZGlkbid0IHNsaWRlIG5vbmUgYW5pbWF0aW9uIHNob3VsZCB3b3JrXHJcbiAgICAgICAgICAgIGlmIChkaWZmZXJlbmNlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vd2UgY2FuIHNsaWRlIG9ubHkgaWYgcHJldmlvdXMgYW5pbWF0aW9uIGhhcyBmaW5pc2hlZFxyXG4gICAgICAgICAgICBpZiAoIXNsaWRlYUFibGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzbGlkZWFBYmxlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAvLyBhZGQgdHJhbnNpdGlvbiBpZiB1c2VyIHNsaWRlIHRvIHNvdXJjZVxyXG4gICAgICAgICAgICBzb3VyY2VzW3NvdXJjZXNJbmRleGVzLnByZXZpb3VzXS5jbGFzc0xpc3QuYWRkKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcbiAgICAgICAgICAgIHNvdXJjZXNbc291cmNlc0luZGV4ZXMuY3VycmVudF0uY2xhc3NMaXN0LmFkZCgnZnNsaWdodGJveC10cmFuc2Zvcm0tdHJhbnNpdGlvbicpO1xyXG4gICAgICAgICAgICBzb3VyY2VzW3NvdXJjZXNJbmRleGVzLm5leHRdLmNsYXNzTGlzdC5hZGQoJ2ZzbGlnaHRib3gtdHJhbnNmb3JtLXRyYW5zaXRpb24nKTtcclxuXHJcblxyXG4gICAgICAgICAgICAvLyBzbGlkZSBwcmV2aW91c1xyXG4gICAgICAgICAgICBpZiAoZGlmZmVyZW5jZSA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgc2xpZGUgbnVtYmVyXHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLnNsaWRlID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLnVwZGF0ZVNsaWRlTnVtYmVyKHNlbGYuZGF0YS50b3RhbF9zbGlkZXMpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEudXBkYXRlU2xpZGVOdW1iZXIoc2VsZi5kYXRhLnNsaWRlIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHVybHNMZW5ndGggPj0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1QbHVzKHNvdXJjZXNbc291cmNlc0luZGV4ZXMuY3VycmVudF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1OdWxsKHNvdXJjZXNbc291cmNlc0luZGV4ZXMucHJldmlvdXNdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBzZWxmLnRyYW5zZm9ybXMudHJhbnNmb3JtTnVsbChzb3VyY2VzW3NvdXJjZXNJbmRleGVzLmN1cnJlbnRdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgbmV3IGluZGV4ZXNcclxuICAgICAgICAgICAgICAgIHNvdXJjZXNJbmRleGVzID0gc2VsZi5nZXRTb3VyY2VzSW5kZXhlcy5hbGwoc2VsZi5kYXRhLnNsaWRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2lmIHNvdXJjZSBpc24ndCBhbHJlYWR5IGluIG1lbW9yeVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxmLmRhdGEuc291cmNlc1tzb3VyY2VzSW5kZXhlcy5wcmV2aW91c10gPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRzb3VyY2VzKCdwcmV2aW91cycsIHNlbGYuZGF0YS5zbGlkZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAvLyBzbGlkZSBuZXh0XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGRpZmZlcmVuY2UgPCAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy91cGRhdGUgc2xpZGUgbnVtYmVyXHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLnNsaWRlID09PSBzZWxmLmRhdGEudG90YWxfc2xpZGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLnVwZGF0ZVNsaWRlTnVtYmVyKDEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEudXBkYXRlU2xpZGVOdW1iZXIoc2VsZi5kYXRhLnNsaWRlICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh1cmxzTGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1NaW51cyhzb3VyY2VzW3NvdXJjZXNJbmRleGVzLmN1cnJlbnRdKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRyYW5zZm9ybXMudHJhbnNmb3JtTnVsbChzb3VyY2VzW3NvdXJjZXNJbmRleGVzLm5leHRdKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50cmFuc2Zvcm1zLnRyYW5zZm9ybU51bGwoc291cmNlc1tzb3VyY2VzSW5kZXhlcy5jdXJyZW50XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IG5ldyBpbmRleGVzXHJcbiAgICAgICAgICAgICAgICBzb3VyY2VzSW5kZXhlcyA9IHNlbGYuZ2V0U291cmNlc0luZGV4ZXMuYWxsKHNlbGYuZGF0YS5zbGlkZSk7XHJcbiAgICAgICAgICAgICAgICAvL2lmIHNvdXJjZSBpc24ndCBhbHJlYWR5IGluIG1lbW9yeVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxmLmRhdGEuc291cmNlc1tzb3VyY2VzSW5kZXhlcy5uZXh0XSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZHNvdXJjZXMoJ25leHQnLCBzZWxmLmRhdGEuc2xpZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkaWZmZXJlbmNlID0gMDtcclxuICAgICAgICAgICAgc2VsZi5zdG9wVmlkZW9zKCk7XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgdHJhbnNpdGlvbiBiZWNhdXNlIHdpdGggZHJhZ2dpbmcgaXQgbG9va3MgYXdmdWxcclxuICAgICAgICAgICAgICAgIHNvdXJjZXNbc291cmNlc0luZGV4ZXMucHJldmlvdXNdLmNsYXNzTGlzdC5yZW1vdmUoJ2ZzbGlnaHRib3gtdHJhbnNmb3JtLXRyYW5zaXRpb24nKTtcclxuICAgICAgICAgICAgICAgIHNvdXJjZXNbc291cmNlc0luZGV4ZXMuY3VycmVudF0uY2xhc3NMaXN0LnJlbW92ZSgnZnNsaWdodGJveC10cmFuc2Zvcm0tdHJhbnNpdGlvbicpO1xyXG4gICAgICAgICAgICAgICAgc291cmNlc1tzb3VyY2VzSW5kZXhlcy5uZXh0XS5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdXNlciBzaG91bGRuJ3QgYmUgYWJsZSB0byBzbGlkZSB3aGVuIGFuaW1hdGlvbiBpcyBydW5uaW5nXHJcbiAgICAgICAgICAgICAgICBzbGlkZWFBYmxlID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSwgMjUwKTtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgbW91c2VNb3ZlRXZlbnQ6IGZ1bmN0aW9uIChlKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzX2RyYWdnaW5nIHx8ICFzbGlkZWFBYmxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBjbGllbnRYO1xyXG4gICAgICAgICAgICAoc2VsZi5kYXRhLmlzTW9iaWxlKSA/XHJcbiAgICAgICAgICAgICAgICBjbGllbnRYID0gZS50b3VjaGVzWzBdLmNsaWVudFggOlxyXG4gICAgICAgICAgICAgICAgY2xpZW50WCA9IGUuY2xpZW50WDtcclxuXHJcbiAgICAgICAgICAgIG1lZGlhSG9sZGVyLmFwcGVuZENoaWxkKGludmlzaWJsZUhvdmVyKTtcclxuICAgICAgICAgICAgZGlmZmVyZW5jZSA9IGNsaWVudFggLSBtb3VzZURvd25DbGllbnRYO1xyXG4gICAgICAgICAgICBjb25zdCBzb3VyY2VzSW5kZXhlcyA9IHNlbGYuZ2V0U291cmNlc0luZGV4ZXMuYWxsKHNlbGYuZGF0YS5zbGlkZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodXJsc0xlbmd0aCA+PSAzKSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2VzW3NvdXJjZXNJbmRleGVzLnByZXZpb3VzXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKCcgK1xyXG4gICAgICAgICAgICAgICAgICAgICgtc2VsZi5kYXRhLnNsaWRlRGlzdGFuY2UgKiB3aW5kb3cuaW5uZXJXaWR0aCArIGRpZmZlcmVuY2UpXHJcbiAgICAgICAgICAgICAgICAgICAgKyAncHgsMCknO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodXJsc0xlbmd0aCA+PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2VzW3NvdXJjZXNJbmRleGVzLmN1cnJlbnRdLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoJyArIGRpZmZlcmVuY2UgKyAncHgsMCknO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodXJsc0xlbmd0aCA+PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2VzW3NvdXJjZXNJbmRleGVzLm5leHRdLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoJ1xyXG4gICAgICAgICAgICAgICAgICAgICsgKHNlbGYuZGF0YS5zbGlkZURpc3RhbmNlICogd2luZG93LmlubmVyV2lkdGggKyBkaWZmZXJlbmNlKVxyXG4gICAgICAgICAgICAgICAgICAgICsgJ3B4LDApJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIGZvciAobGV0IGVsZW0gaW4gZWxlbWVudHMpIHtcclxuICAgICAgICBlbGVtZW50c1tlbGVtXS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBldmVudExpc3RlbmVycy5tb3VzZURvd25FdmVudCk7XHJcbiAgICAgICAgZWxlbWVudHNbZWxlbV0uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGV2ZW50TGlzdGVuZXJzLm1vdXNlRG93bkV2ZW50KTtcclxuICAgIH1cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZXZlbnRMaXN0ZW5lcnMubW91c2VVcEV2ZW50KTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGV2ZW50TGlzdGVuZXJzLm1vdXNlVXBFdmVudCk7XHJcbiAgICBpbnZpc2libGVIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZXZlbnRMaXN0ZW5lcnMubW91c2VVcEV2ZW50KTtcclxuICAgIGludmlzaWJsZUhvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgZXZlbnRMaXN0ZW5lcnMubW91c2VVcEV2ZW50KTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBldmVudExpc3RlbmVycy5tb3VzZU1vdmVFdmVudCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZXZlbnRMaXN0ZW5lcnMubW91c2VNb3ZlRXZlbnQpO1xyXG59OyIsIndpbmRvdy5mc0xpZ2h0Ym94T2JqZWN0ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZGF0YSA9IHtcclxuICAgICAgICBzbGlkZTogMSxcclxuICAgICAgICB0b3RhbF9zbGlkZXM6IDEsXHJcbiAgICAgICAgc2xpZGVEaXN0YW5jZTogMS4zLFxyXG4gICAgICAgIHNsaWRlQ291bnRlcjogdHJ1ZSxcclxuICAgICAgICBzbGlkZUJ1dHRvbnM6IHRydWUsXHJcbiAgICAgICAgaXNGaXJzdFRpbWVMb2FkOiBmYWxzZSxcclxuICAgICAgICBtb3ZlU2xpZGVzVmlhRHJhZzogdHJ1ZSxcclxuICAgICAgICB0b29sYmFyQnV0dG9uczoge1xyXG4gICAgICAgICAgICBcImNsb3NlXCI6IHRydWUsXHJcbiAgICAgICAgICAgIFwiZnVsbHNjcmVlblwiOiB0cnVlXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZWxlbWVudDogbnVsbCxcclxuICAgICAgICBpc01vYmlsZTogZmFsc2UsXHJcblxyXG4gICAgICAgIHVybHM6IFtdLFxyXG4gICAgICAgIHNvdXJjZXM6IFtdLFxyXG4gICAgICAgIHNvdXJjZXNMb2FkZWQ6IFtdLFxyXG4gICAgICAgIHJlbWVtYmVyZWRTb3VyY2VzRGltZW5zaW9uczogW10sXHJcbiAgICAgICAgdmlkZW9zOiBbXSxcclxuXHJcbiAgICAgICAgbWVkaWFIb2xkZXI6IHt9LFxyXG4gICAgICAgIG5hdjoge30sXHJcbiAgICAgICAgdG9vbGJhcjoge30sXHJcbiAgICAgICAgc2xpZGVDb3VudGVyRWxlbToge30sXHJcblxyXG4gICAgICAgIGluaXRpYXRlZDogZmFsc2UsXHJcbiAgICAgICAgZnVsbHNjcmVlbjogZmFsc2UsXHJcbiAgICAgICAgZmFkaW5nT3V0OiBmYWxzZSxcclxuXHJcbiAgICAgICAgb25SZXNpemVFdmVudDogJycsXHJcbiAgICAgICAgdXBkYXRlU2xpZGVOdW1iZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIGxldCBzZWxmID0gdGhpcztcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0IGEgbmV3IGZzTGlnaHRib3ggaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNlbGYuZGF0YS5pbml0aWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIChmdW5jdGlvbiAoYSkge1xyXG4gICAgICAgICAgICBpZiAoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWlub3xhbmRyb2lkfGlwYWR8cGxheWJvb2t8c2lsay9pLnRlc3QoYSkgfHwgLzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLCA0KSkpIHNlbGYuZGF0YS5pc01vYmlsZSA9IHRydWU7XHJcbiAgICAgICAgfSkobmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYSk7XHJcbiAgICAgICAgc2VsZi5kYXRhLm9uUmVzaXplRXZlbnQgPSBuZXcgb25SZXNpemVFdmVudCgpO1xyXG4gICAgICAgIG5ldyBzZWxmLmRvbSgpO1xyXG4gICAgICAgIHJlcXVpcmUoJy4vY2hhbmdlU2xpZGVCeURyYWdnaW5nLmpzJykoc2VsZiwgRE9NT2JqZWN0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvdyBkb20gb2YgZnNMaWdodGJveCBpbnN0YW5jZSBpZiBleGlzdHNcclxuICAgICAqL1xyXG4gICAgdGhpcy5zaG93ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNlbGYuc2Nyb2xsYmFyLnNob3dTY3JvbGxiYXIoKTtcclxuICAgICAgICBzZWxmLmRhdGEuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LWNvbnRhaW5lci1mYWRlb3V0Jyk7XHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzZWxmLmRhdGEuZWxlbWVudCk7XHJcbiAgICAgICAgc2VsZi5kYXRhLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShbJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nXSk7XHJcbiAgICAgICAgc2VsZi5kYXRhLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChbJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nXSk7XHJcbiAgICAgICAgc2VsZi5kYXRhLm9uUmVzaXplRXZlbnQucmVmcmVzaFdpbmRvd09ucmVzaXplKCk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZGUgZG9tIG9mIGV4aXN0aW5nIGZzTGlnaHRib3ggaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5oaWRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNlbGYuc2Nyb2xsYmFyLmhpZGVTY3JvbGxiYXIoKTtcclxuICAgICAgICBpZihzZWxmLmRhdGEuZnVsbHNjcmVlbikgc2VsZi50b29sYmFyLmNsb3NlRnVsbHNjcmVlbigpO1xyXG4gICAgICAgIHNlbGYuZGF0YS5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2ZzbGlnaHRib3gtY29udGFpbmVyLWZhZGVvdXQnKTtcclxuICAgICAgICBzZWxmLmRhdGEuZmFkaW5nT3V0ID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2VsZi5kYXRhLmZhZGluZ091dCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHNlbGYuZGF0YS5lbGVtZW50KTtcclxuICAgICAgICB9LDI1MCk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlciBhbGwgbGlicmFyeSBlbGVtZW50c1xyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZG9tID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJlcXVpcmUoJy4vcmVuZGVyRE9NLmpzJykoc2VsZiwgRE9NT2JqZWN0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgZG9tIGVsZW1lbnQgd2l0aCBjbGFzc2VzXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gRE9NT2JqZWN0KHRhZykge1xyXG4gICAgICAgIHRoaXMuZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRDbGFzc2VzQW5kQ3JlYXRlID0gZnVuY3Rpb24gKGNsYXNzZXMpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggaW4gY2xhc3Nlcykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtLmNsYXNzTGlzdC5hZGQoY2xhc3Nlc1tpbmRleF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT2JqZWN0IHRoYXQgY29udGFpbnMgYWxsIGFjdGlvbnMgdGhhdCBmc2xpZ2h0Ym94IGlzIGRvaW5nIGR1cmluZyBydW5uaW5nXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb25SZXNpemVFdmVudCgpIHtcclxuICAgICAgICBsZXQgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICBjb25zdCBzb3VyY2VzID0gc2VsZi5kYXRhLnNvdXJjZXM7XHJcblxyXG4gICAgICAgIHRoaXMucmVmcmVzaFdpbmRvd09ucmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5tZWRpYUhvbGRlckRpbWVuc2lvbnMoKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLnNvdXJjZXNEaW1lbnNpb25zKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLm1lZGlhSG9sZGVyRGltZW5zaW9ucyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoID4gMTAwMCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5kYXRhLm1lZGlhSG9sZGVyLmhvbGRlci5zdHlsZS53aWR0aCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAtIDAuMSAqIHdpbmRvdy5pbm5lcldpZHRoKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLnN0eWxlLmhlaWdodCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgLSAwLjEgKiB3aW5kb3cuaW5uZXJIZWlnaHQpICsgJ3B4JztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZGF0YS5tZWRpYUhvbGRlci5ob2xkZXIuc3R5bGUud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCArICdweCc7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLnN0eWxlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCArICdweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNvdXJjZXNEaW1lbnNpb25zID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhZ2VTb3VyY2VzSW5kZXhlcyA9IHNlbGYuZ2V0U291cmNlc0luZGV4ZXMuYWxsKHNlbGYuZGF0YS5zbGlkZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbWVtYmVyZWRTb3VyY2VEaW1lbnNpb24gPSBzZWxmLmRhdGEucmVtZW1iZXJlZFNvdXJjZXNEaW1lbnNpb25zO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgc291cmNlSW5kZXggaW4gc291cmNlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGFkZCB0cmFuZm9ybXMgdG8gc3RhZ2Ugc291cmNlc1xyXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5kYXRhLnVybHMubGVuZ3RoID4gMikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1NaW51cyhzb3VyY2VzW3N0YWdlU291cmNlc0luZGV4ZXMucHJldmlvdXNdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1OdWxsKHNvdXJjZXNbc3RhZ2VTb3VyY2VzSW5kZXhlcy5jdXJyZW50XSk7XHJcbiAgICAgICAgICAgICAgICBpZihzZWxmLmRhdGEudXJscy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50cmFuc2Zvcm1zLnRyYW5zZm9ybVBsdXMoc291cmNlc1tzdGFnZVNvdXJjZXNJbmRleGVzLm5leHRdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gc291cmNlc1tzb3VyY2VJbmRleF0uZmlyc3RDaGlsZDtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgc291cmNlV2lkdGggPSByZW1lbWJlcmVkU291cmNlRGltZW5zaW9uW3NvdXJjZUluZGV4XS53aWR0aDtcclxuICAgICAgICAgICAgICAgIGxldCBzb3VyY2VIZWlnaHQgPSByZW1lbWJlcmVkU291cmNlRGltZW5zaW9uW3NvdXJjZUluZGV4XS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgY29lZmZpY2llbnQgPSBzb3VyY2VXaWR0aCAvIHNvdXJjZUhlaWdodDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldmljZVdpZHRoID0gcGFyc2VJbnQoc2VsZi5kYXRhLm1lZGlhSG9sZGVyLmhvbGRlci5zdHlsZS53aWR0aCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VIZWlnaHQgPSBwYXJzZUludChzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLnN0eWxlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3SGVpZ2h0ID0gZGV2aWNlV2lkdGggLyBjb2VmZmljaWVudDtcclxuICAgICAgICAgICAgICAgIGlmIChuZXdIZWlnaHQgPCBkZXZpY2VIZWlnaHQgLSA2MCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gbmV3SGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc3R5bGUud2lkdGggPSBkZXZpY2VXaWR0aCArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3SGVpZ2h0ID0gZGV2aWNlSGVpZ2h0IC0gNjA7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zdHlsZS5oZWlnaHQgPSBuZXdIZWlnaHQgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zdHlsZS53aWR0aCA9IG5ld0hlaWdodCAqIGNvZWZmaWNpZW50ICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgd2luZG93Lm9ucmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzZWxmLmRhdGEuaXNNb2JpbGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWlub3xhbmRyb2lkfGlwYWR8cGxheWJvb2t8c2lsay9pLnRlc3QoYSkgfHwgLzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLCA0KSkpIHNlbGYuZGF0YS5pc01vYmlsZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pKG5hdmlnYXRvci51c2VyQWdlbnQgfHwgbmF2aWdhdG9yLnZlbmRvciB8fCB3aW5kb3cub3BlcmEpO1xyXG4gICAgICAgICAgICBfdGhpcy5tZWRpYUhvbGRlckRpbWVuc2lvbnMoKTtcclxuICAgICAgICAgICAgX3RoaXMuc291cmNlc0RpbWVuc2lvbnMoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnRhaW5zIG1ldGhvZHMgdGhhdCB0YWtlcyBjYXJlIG9mIHNjcm9sbGJhclxyXG4gICAgICogQHR5cGUge3toaWRlU2Nyb2xsYmFyOiBXaW5kb3cuc2Nyb2xsYmFyLmhpZGVTY3JvbGxiYXIsIHNob3dTY3JvbGxiYXI6IFdpbmRvdy5zY3JvbGxiYXIuc2hvd1Njcm9sbGJhcn19XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc2Nyb2xsYmFyID0ge1xyXG5cclxuICAgICAgICBoaWRlU2Nyb2xsYmFyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LW9wZW4nKTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLmRhdGEuaXNNb2JpbGUpIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXNjcm9sbGJhcmZpeCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2hvd1Njcm9sbGJhcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZnNsaWdodGJveC1vcGVuJyk7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi5kYXRhLmlzTW9iaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZnNsaWdodGJveC1zY3JvbGxiYXJmaXgnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU1ZHSWNvbiBvYmplY3Qgd2l0aCBnZXRTVkdJY29uIG1ldGhvZCB3aGljaCByZXR1cm4gPHN2Zz4gZWxlbWVudCB3aXRoIDxwYXRoPiBjaGlsZFxyXG4gICAgICogQHJldHVybnMge0VsZW1lbnR9XHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgdGhpcy5TVkdJY29uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqICA8c3ZnPiB3aXRoIGFkZGVkICdmc2xpZ2h0Ym94LXN2Zy1pY29uJyBjbGFzc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwic3ZnXCIpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBjaGlsZCBvZiBzdmcgZW1wdHkgPHBhdGg+XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5wYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcclxuICAgICAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnY2xhc3MnLCAnZnNsaWdodGJveC1zdmctaWNvbicpO1xyXG4gICAgICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZU5TKG51bGwsICd2aWV3Qm94JywgJzAgMCAxNSAxNScpO1xyXG5cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyBET00gPHN2Zz4gaWNvbiBjb250YWluaW5nIDxwYXRoPiBjaGlsZCB3aXRoIGQgYXR0cmlidXRlIGZyb20gcGFyYW1ldGVyXHJcbiAgICAgICAgICogQHBhcmFtIGRcclxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdldFNWR0ljb24gPSBmdW5jdGlvbiAodmlld0JveCwgZGltZW5zaW9uLCBkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGQpO1xyXG4gICAgICAgICAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAndmlld0JveCcsIHZpZXdCb3gpO1xyXG4gICAgICAgICAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnd2lkdGgnLCBkaW1lbnNpb24pO1xyXG4gICAgICAgICAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnaGVpZ2h0JywgZGltZW5zaW9uKTtcclxuICAgICAgICAgICAgdGhpcy5zdmcuYXBwZW5kQ2hpbGQodGhpcy5wYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3ZnO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2xpZGUgY291bnRlciBvYmplY3QgLSB1cHBlciBsZWZ0IGNvcm5lciBvZiBmc0xpZ2h0Ym94XHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgdGhpcy5zbGlkZUNvdW50ZXJFbGVtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGxldCBudW1iZXJDb250YWluZXIgPSBuZXcgRE9NT2JqZWN0KCdkaXYnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC1zbGlkZS1udW1iZXItY29udGFpbmVyJ10pO1xyXG4gICAgICAgIHNlbGYuZGF0YS5zbGlkZUNvdW50ZXJFbGVtID0gbmV3IERPTU9iamVjdCgnZGl2JykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtc2xpZGUtc2xpZGUtbnVtYmVyJ10pO1xyXG5cclxuICAgICAgICBzZWxmLmRhdGEuc2xpZGVDb3VudGVyRWxlbS5pbm5lckhUTUwgPSBzZWxmLmRhdGEuc2xpZGU7XHJcbiAgICAgICAgc2VsZi5kYXRhLnNsaWRlQ291bnRlckVsZW0uaWQgPSAnY3VycmVudF9zbGlkZSc7XHJcblxyXG4gICAgICAgIGxldCBzcGFjZSA9IG5ldyBET01PYmplY3QoJ2RpdicpLmFkZENsYXNzZXNBbmRDcmVhdGUoWydmc2xpZ2h0Ym94LXNsaWRlLXNsaWRlLW51bWJlcicsICdmc2xpZ2h0Ym94LXNsYXNoJ10pO1xyXG4gICAgICAgIHNwYWNlLmlubmVySFRNTCA9ICcvJztcclxuXHJcbiAgICAgICAgbGV0IHNsaWRlcyA9IG5ldyBET01PYmplY3QoJ2RpdicpLmFkZENsYXNzZXNBbmRDcmVhdGUoWydmc2xpZ2h0Ym94LXNsaWRlLXNsaWRlLW51bWJlciddKTtcclxuICAgICAgICBzbGlkZXMuaW5uZXJIVE1MID0gc2VsZi5kYXRhLnRvdGFsX3NsaWRlcztcclxuXHJcbiAgICAgICAgbnVtYmVyQ29udGFpbmVyLmFwcGVuZENoaWxkKHNlbGYuZGF0YS5zbGlkZUNvdW50ZXJFbGVtKTtcclxuICAgICAgICBudW1iZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoc3BhY2UpO1xyXG4gICAgICAgIG51bWJlckNvbnRhaW5lci5hcHBlbmRDaGlsZChzbGlkZXMpO1xyXG5cclxuICAgICAgICAvLyB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgYWZ0ZXIgc3dpdGNoaW5nIHNsaWRlc1xyXG4gICAgICAgIHNlbGYuZGF0YS51cGRhdGVTbGlkZU51bWJlciA9IGZ1bmN0aW9uIChudW1iZXIpIHtcclxuICAgICAgICAgICAgc2VsZi5kYXRhLnNsaWRlID0gbnVtYmVyO1xyXG4gICAgICAgICAgICBzZWxmLmRhdGEuc2xpZGVDb3VudGVyRWxlbS5pbm5lckhUTUwgPSBudW1iZXI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJTbGlkZUNvdW50ZXIgPSBmdW5jdGlvbiAobmF2KSB7XHJcbiAgICAgICAgICAgIG5hdi5hcHBlbmRDaGlsZChudW1iZXJDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9vbGJhciBidXR0b25cclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgICB0aGlzLnRvb2xiYXJCdXR0b24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5idXR0b24gPSBuZXcgRE9NT2JqZWN0KCdkaXYnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC10b29sYmFyLWJ1dHRvbicsICdidXR0b24tc3R5bGUnXSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkU1ZHSWNvbiA9IGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGxldCBTVkdJY29uID0gbmV3IHNlbGYuU1ZHSWNvbigpLmdldFNWR0ljb24oZCk7XHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9uLmFwcGVuZENoaWxkKFxyXG4gICAgICAgICAgICAgICAgU1ZHSWNvblxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuYnV0dG9uKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvb2xiYXIgb2JqZWN0IHdoaWNoIGNvbnRhaW5zIHRvb2xiYXIgYnV0dG9uc1xyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKi9cclxuICAgIGxldCB0b29sYmFyTW9kdWxlID0gcmVxdWlyZSgnLi90b29sYmFyJyk7XHJcbiAgICB0aGlzLnRvb2xiYXIgPSBuZXcgdG9vbGJhck1vZHVsZShzZWxmLERPTU9iamVjdCk7XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGl2IHRoYXQgaG9sZHMgc291cmNlIGVsZW1cclxuICAgICAqL1xyXG4gICAgdGhpcy5tZWRpYUhvbGRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmhvbGRlciA9IG5ldyBET01PYmplY3QoJ2RpdicpLmFkZENsYXNzZXNBbmRDcmVhdGUoWydmc2xpZ2h0Ym94LW1lZGlhLWhvbGRlciddKTtcclxuXHJcbiAgICAgICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoID4gMTAwMCkge1xyXG4gICAgICAgICAgICB0aGlzLmhvbGRlci5zdHlsZS53aWR0aCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAtIDAuMSAqIHdpbmRvdy5pbm5lcldpZHRoKSArICdweCc7XHJcbiAgICAgICAgICAgIHRoaXMuaG9sZGVyLnN0eWxlLmhlaWdodCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgLSAwLjEgKiB3aW5kb3cuaW5uZXJIZWlnaHQpICsgJ3B4JztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmhvbGRlci5zdHlsZS53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoICsgJ3B4JztcclxuICAgICAgICAgICAgdGhpcy5ob2xkZXIuc3R5bGUuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICsgJ3B4JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucmVuZGVySG9sZGVyID0gZnVuY3Rpb24gKGNvbnRhaW5lcikge1xyXG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5ob2xkZXIpO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBvYmplY3Qgd2l0aCBzdGFnZSBzb3VyY2VzIGluZGV4ZXMgZGVwZW5kaW5nIG9uIHByb3ZpZGVkIHNsaWRlXHJcbiAgICAgKiBAcGFyYW0gc2xpZGVcclxuICAgICAqIEByZXR1cm5zIHt7cHJldmlvdXM6IG51bWJlciwgY3VycmVudDogbnVtYmVyLCBuZXh0OiBudW1iZXJ9fVxyXG4gICAgICovXHJcbiAgICB0aGlzLmdldFNvdXJjZXNJbmRleGVzID0ge1xyXG5cclxuICAgICAgICBwcmV2aW91czogZnVuY3Rpb24gKHNsaWRlKSB7XHJcbiAgICAgICAgICAgIGxldCBwcmV2aW91c1NsaWRlSW5kZXg7XHJcbiAgICAgICAgICAgIGNvbnN0IGFycmF5SW5kZXggPSBzbGlkZSAtIDE7XHJcblxyXG4gICAgICAgICAgICAvLyBwcmV2aW91c1xyXG4gICAgICAgICAgICBpZiAoYXJyYXlJbmRleCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXNTbGlkZUluZGV4ID0gc2VsZi5kYXRhLnRvdGFsX3NsaWRlcyAtIDE7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91c1NsaWRlSW5kZXggPSBhcnJheUluZGV4IC0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzU2xpZGVJbmRleDtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKHNsaWRlKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgbmV4dFNsaWRlSW5kZXg7XHJcbiAgICAgICAgICAgIGNvbnN0IGFycmF5SW5kZXggPSBzbGlkZSAtIDE7XHJcblxyXG4gICAgICAgICAgICAvL25leHRcclxuICAgICAgICAgICAgaWYgKHNsaWRlID09PSBzZWxmLmRhdGEudG90YWxfc2xpZGVzKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0U2xpZGVJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0U2xpZGVJbmRleCA9IGFycmF5SW5kZXggKyAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dFNsaWRlSW5kZXg7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIGFsbDogZnVuY3Rpb24gKHNsaWRlKSB7XHJcbiAgICAgICAgICAgIC8vIHNvdXJjZXMgYXJlIHN0b3JlZCBpbiBhcnJheSBpbmRleGVkIGZyb20gMFxyXG4gICAgICAgICAgICBjb25zdCBhcnJheUluZGV4ID0gc2xpZGUgLSAxO1xyXG4gICAgICAgICAgICBjb25zdCBzb3VyY2VzSW5kZXhlcyA9IHtcclxuICAgICAgICAgICAgICAgIHByZXZpb3VzOiAwLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudDogMCxcclxuICAgICAgICAgICAgICAgIG5leHQ6IDBcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIHByZXZpb3VzXHJcbiAgICAgICAgICAgIGlmIChhcnJheUluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2VzSW5kZXhlcy5wcmV2aW91cyA9IHNlbGYuZGF0YS50b3RhbF9zbGlkZXMgLSAxO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc291cmNlc0luZGV4ZXMucHJldmlvdXMgPSBhcnJheUluZGV4IC0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gY3VycmVudFxyXG4gICAgICAgICAgICBzb3VyY2VzSW5kZXhlcy5jdXJyZW50ID0gYXJyYXlJbmRleDtcclxuXHJcbiAgICAgICAgICAgIC8vbmV4dFxyXG4gICAgICAgICAgICBpZiAoc2xpZGUgPT09IHNlbGYuZGF0YS50b3RhbF9zbGlkZXMpIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZXNJbmRleGVzLm5leHQgPSAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc291cmNlc0luZGV4ZXMubmV4dCA9IGFycmF5SW5kZXggKyAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlc0luZGV4ZXM7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcblxyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtcyA9IHtcclxuXHJcbiAgICAgICAgdHJhbnNmb3JtTWludXM6IGZ1bmN0aW9uIChlbGVtKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgnICsgKC1zZWxmLmRhdGEuc2xpZGVEaXN0YW5jZSAqIHdpbmRvdy5pbm5lcldpZHRoKSArICdweCwwKSc7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHJhbnNmb3JtTnVsbDogZnVuY3Rpb24gKGVsZW0pIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsMCknO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRyYW5zZm9ybVBsdXM6IGZ1bmN0aW9uIChlbGVtKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgnICsgc2VsZi5kYXRhLnNsaWRlRGlzdGFuY2UgKiB3aW5kb3cuaW5uZXJXaWR0aCArICdweCwwKSc7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTdG9wIHZpZGVvcyBhZnRlciBjaGFuZ2luZyBzbGlkZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnN0b3BWaWRlb3MgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZGVvcyA9IHNlbGYuZGF0YS52aWRlb3M7XHJcblxyXG4gICAgICAgIC8vIHRydWUgaXMgaHRtbDUgdmlkZW8sIGZhbHNlIGlzIHlvdXR1YmUgdmlkZW9cclxuICAgICAgICBmb3IgKGxldCB2aWRlb0luZGV4IGluIHZpZGVvcykge1xyXG5cclxuICAgICAgICAgICAgaWYgKHZpZGVvc1t2aWRlb0luZGV4XSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxmLmRhdGEuc291cmNlc1t2aWRlb0luZGV4XS5maXJzdENoaWxkLnBhdXNlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLnNvdXJjZXNbdmlkZW9JbmRleF0uZmlyc3RDaGlsZC5wYXVzZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5kYXRhLnNvdXJjZXNbdmlkZW9JbmRleF0uZmlyc3RDaGlsZC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwic3RvcFZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICB0aGlzLnNldFNsaWRlID0gZnVuY3Rpb24gKHNsaWRlKSB7XHJcblxyXG4gICAgICAgIHNlbGYuZGF0YS5zbGlkZSA9IHNsaWRlO1xyXG4gICAgICAgIHNlbGYuZGF0YS51cGRhdGVTbGlkZU51bWJlcihzbGlkZSk7XHJcbiAgICAgICAgY29uc3Qgc291cmNlc0luZGV4ZXMgPSBzZWxmLmdldFNvdXJjZXNJbmRleGVzLmFsbChzbGlkZSk7XHJcbiAgICAgICAgY29uc3Qgc291cmNlcyA9IHNlbGYuZGF0YS5zb3VyY2VzO1xyXG5cclxuICAgICAgICBpZiAoc291cmNlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgc2VsZi5sb2Fkc291cmNlcygnaW5pdGlhbCcsIHNsaWRlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZXNbc291cmNlc0luZGV4ZXMucHJldmlvdXNdID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2Fkc291cmNlcygncHJldmlvdXMnLCBzbGlkZSk7XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VzW3NvdXJjZXNJbmRleGVzLmN1cnJlbnRdID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2Fkc291cmNlcygnY3VycmVudCcsIHNsaWRlKTtcclxuXHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZXNbc291cmNlc0luZGV4ZXMubmV4dF0gPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRzb3VyY2VzKCduZXh0Jywgc2xpZGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgc291cmNlSW5kZXggaW4gc291cmNlcykge1xyXG4gICAgICAgICAgICBzb3VyY2VzW3NvdXJjZUluZGV4XS5jbGFzc0xpc3QucmVtb3ZlKCdmc2xpZ2h0Ym94LXRyYW5zZm9ybS10cmFuc2l0aW9uJyk7XHJcblxyXG4gICAgICAgICAgICAvLyBzb3VyY2VzIGxlbmd0aCBuZWVkcyB0byBiZSBoaWdoZXIgdGhhbiAxIGJlY2F1c2UgaWYgdGhlcmUgaXMgb25seSAxIHNsaWRlXHJcbiAgICAgICAgICAgIC8vIHNvdXJjZXNJbmRleGVzLnByZXZpb3VzIHdpbGwgYmUgMCBzbyBpdCB3b3VsZCByZXR1cm4gYSBiYWQgdHJhbnNpdGlvblxyXG4gICAgICAgICAgICBpZiAoc291cmNlSW5kZXggPT0gc291cmNlc0luZGV4ZXMucHJldmlvdXMgJiYgc291cmNlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRyYW5zZm9ybXMudHJhbnNmb3JtTWludXMoc291cmNlc1tzb3VyY2VzSW5kZXhlcy5wcmV2aW91c10pO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNvdXJjZUluZGV4ID09IHNvdXJjZXNJbmRleGVzLmN1cnJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1OdWxsKHNvdXJjZXNbc291cmNlc0luZGV4ZXMuY3VycmVudF0pO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNvdXJjZUluZGV4ID09IHNvdXJjZXNJbmRleGVzLm5leHQpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1QbHVzKHNvdXJjZXNbc291cmNlc0luZGV4ZXMubmV4dF0pO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYudHJhbnNmb3Jtcy50cmFuc2Zvcm1NaW51cyhzb3VyY2VzW3NvdXJjZUluZGV4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNZXRob2RzIHRoYXQgYXBwZW5kcyBzb3VyY2VzIHRvIG1lZGlhSG9sZGVyIGRlcGVuZGluZyBvbiBhY3Rpb25cclxuICAgICAqIEB0eXBlIHt7aW5pdGlhbEFwcGVuZCwgcHJldmlvdXNBcHBlbmQsIG5leHRBcHBlbmR9fCp9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuYXBwZW5kTWV0aG9kcyA9IHJlcXVpcmUoJy4vYXBwZW5kU291cmNlJyk7XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGxheSBzb3VyY2UgKGltYWdlcywgSFRNTDUgdmlkZW8sIFlvdVR1YmUgdmlkZW8pIGRlcGVuZGluZyBvbiBnaXZlbiB1cmwgZnJvbSB1c2VyXHJcbiAgICAgKiBPciBpZiBkaXNwbGF5IGlzIGluaXRpYWwgZGlzcGxheSAzIGluaXRpYWwgc291cmNlc1xyXG4gICAgICogSWYgdGhlcmUgYXJlID49IDMgaW5pdGlhbCBzb3VyY2VzIHRoZXJlIHdpbGwgYmUgYWx3YXlzIDMgaW4gc3RhZ2VcclxuICAgICAqIEBwYXJhbSB0eXBlT2ZMb2FkXHJcbiAgICAgKiBAcGFyYW0gc2xpZGVcclxuICAgICAqIEByZXR1cm5zIHttb2R1bGUuZXhwb3J0c31cclxuICAgICAqL1xyXG4gICAgdGhpcy5sb2Fkc291cmNlcyA9IGZ1bmN0aW9uICh0eXBlT2ZMb2FkLCBzbGlkZSkge1xyXG4gICAgICAgIGNvbnN0IGxvYWRzb3VyY2Vtb2R1bGUgPSByZXF1aXJlKFwiLi9sb2FkU291cmNlLmpzXCIpO1xyXG4gICAgICAgIHJldHVybiBuZXcgbG9hZHNvdXJjZW1vZHVsZShzZWxmLCBET01PYmplY3QsIHR5cGVPZkxvYWQsIHNsaWRlKTtcclxuICAgIH07XHJcbn1cclxuO1xyXG5cclxuXHJcbiFmdW5jdGlvbiAoKSB7XHJcbiAgICB3aW5kb3cuZnNMaWdodGJveEluc3RhbmNlcyA9IFtdO1xyXG4gICAgbGV0IGEgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYScpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICBpZiAoIWFbaV0uaGFzQXR0cmlidXRlKCdkYXRhLWZzbGlnaHRib3gnKSkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGJveE5hbWUgPSAgYVtpXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtZnNsaWdodGJveCcpO1xyXG4gICAgICAgIGlmKHR5cGVvZiBmc0xpZ2h0Ym94SW5zdGFuY2VzW2JveE5hbWVdID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgIGZzTGlnaHRib3ggPSBuZXcgZnNMaWdodGJveE9iamVjdCgpO1xyXG4gICAgICAgICAgICBmc0xpZ2h0Ym94SW5zdGFuY2VzW2JveE5hbWVdID0gZnNMaWdodGJveDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFbaV0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG5cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBjb25zdCBnYWxsZXJ5ID0gZS50YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtZnNsaWdodGJveCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZzTGlnaHRib3hJbnN0YW5jZXNbZ2FsbGVyeV0uZGF0YS5pbml0aWF0ZWQpIHtcclxuICAgICAgICAgICAgICAgIGZzTGlnaHRib3hJbnN0YW5jZXNbZ2FsbGVyeV0uc2V0U2xpZGUoXHJcbiAgICAgICAgICAgICAgICAgICAgZnNMaWdodGJveEluc3RhbmNlc1tnYWxsZXJ5XS5kYXRhLnVybHMuaW5kZXhPZihlLnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnaHJlZicpKSArIDFcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBmc0xpZ2h0Ym94SW5zdGFuY2VzW2dhbGxlcnldLnNob3coKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHVybHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGFbal0uZ2V0QXR0cmlidXRlKCdkYXRhLWZzbGlnaHRib3gnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gZ2FsbGVyeSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybHMucHVzaChhW2pdLmdldEF0dHJpYnV0ZSgnaHJlZicpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnNMaWdodGJveEluc3RhbmNlc1tnYWxsZXJ5XS5kYXRhLnVybHMgPSB1cmxzO1xyXG4gICAgICAgICAgICBmc0xpZ2h0Ym94SW5zdGFuY2VzW2dhbGxlcnldLmRhdGEudG90YWxfc2xpZGVzID0gdXJscy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZzTGlnaHRib3hJbnN0YW5jZXNbZ2FsbGVyeV0uaW5pdCgpO1xyXG4gICAgICAgICAgICBmc0xpZ2h0Ym94SW5zdGFuY2VzW2dhbGxlcnldLnNldFNsaWRlKFxyXG4gICAgICAgICAgICAgICAgdXJscy5pbmRleE9mKGUudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdocmVmJykpICsgMVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KGRvY3VtZW50LCB3aW5kb3cpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZWxmLCBET01PYmplY3QsIHR5cGVPZkxvYWQsIHNsaWRlKSB7XHJcblxyXG4gICAgY29uc3QgX3RoaXMgPSB0aGlzO1xyXG4gICAgY29uc3Qgc291cmNlc0luZGV4ZXMgPSBzZWxmLmdldFNvdXJjZXNJbmRleGVzLmFsbChzbGlkZSk7XHJcbiAgICBjb25zdCB1cmxzID0gc2VsZi5kYXRhLnVybHM7XHJcbiAgICBjb25zdCBzb3VyY2VzID0gc2VsZi5kYXRhLnNvdXJjZXM7XHJcbiAgICBsZXQgdGVtcFNvdXJjZXMgPSB7fTtcclxuXHJcbiAgICBsZXQgc291cmNlRGltZW5zaW9ucyA9IGZ1bmN0aW9uIChzb3VyY2VFbGVtLCBzb3VyY2VXaWR0aCwgc291cmNlSGVpZ2h0KSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvZWZmaWNpZW50ID0gc291cmNlV2lkdGggLyBzb3VyY2VIZWlnaHQ7XHJcbiAgICAgICAgY29uc3QgZGV2aWNlV2lkdGggPSBwYXJzZUludChzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLnN0eWxlLndpZHRoKTtcclxuICAgICAgICBjb25zdCBkZXZpY2VIZWlnaHQgPSBwYXJzZUludChzZWxmLmRhdGEubWVkaWFIb2xkZXIuaG9sZGVyLnN0eWxlLmhlaWdodCk7XHJcbiAgICAgICAgbGV0IG5ld0hlaWdodCA9IGRldmljZVdpZHRoIC8gY29lZmZpY2llbnQ7XHJcbiAgICAgICAgaWYgKG5ld0hlaWdodCA8IGRldmljZUhlaWdodCAtIDYwKSB7XHJcbiAgICAgICAgICAgIHNvdXJjZUVsZW0uc3R5bGUuaGVpZ2h0ID0gbmV3SGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgICAgICBzb3VyY2VFbGVtLnN0eWxlLndpZHRoID0gZGV2aWNlV2lkdGggKyBcInB4XCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmV3SGVpZ2h0ID0gZGV2aWNlSGVpZ2h0IC0gNjA7XHJcbiAgICAgICAgICAgIHNvdXJjZUVsZW0uc3R5bGUuaGVpZ2h0ID0gbmV3SGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgICAgICBzb3VyY2VFbGVtLnN0eWxlLndpZHRoID0gbmV3SGVpZ2h0ICogY29lZmZpY2llbnQgKyBcInB4XCI7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgbGV0IGxvYWQgPSBmdW5jdGlvbiAoc291cmNlSG9sZGVyLCBzb3VyY2VFbGVtKSB7XHJcbiAgICAgICAgc291cmNlSG9sZGVyLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIHNvdXJjZUhvbGRlci5hcHBlbmRDaGlsZChzb3VyY2VFbGVtKTtcclxuICAgICAgICB2b2lkIHNvdXJjZUhvbGRlci5maXJzdENoaWxkLm9mZnNldFdpZHRoO1xyXG4gICAgICAgIHNvdXJjZUhvbGRlci5maXJzdENoaWxkLmNsYXNzTGlzdC5hZGQoJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nKTtcclxuICAgIH07XHJcblxyXG4gICAgbGV0IGFwcGVuZEluaXRpYWwgPSBmdW5jdGlvbiAoc291cmNlSG9sZGVyLCBzb3VyY2VFbGVtKSB7XHJcbiAgICAgICAgc291cmNlSG9sZGVyLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIHNvdXJjZUhvbGRlci5hcHBlbmRDaGlsZChzb3VyY2VFbGVtLmZpcnN0Q2hpbGQpO1xyXG4gICAgICAgIHNvdXJjZUhvbGRlci5maXJzdENoaWxkLmNsYXNzTGlzdC5hZGQoJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgZmFkZSBpbiBjbGFzcyBhbmQgZGltZW5zaW9uIGZ1bmN0aW9uXHJcbiAgICAgKi9cclxuICAgIGxldCBvbmxvYWRMaXN0ZW5lciA9IGZ1bmN0aW9uIChzb3VyY2VFbGVtLCBzb3VyY2VXaWR0aCwgc291cmNlSGVpZ2h0LCBhcnJheUluZGV4KSB7XHJcblxyXG4gICAgICAgIGxldCBzb3VyY2VIb2xkZXIgPSBuZXcgRE9NT2JqZWN0KCdkaXYnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC1zb3VyY2UtaG9sZGVyJ10pO1xyXG5cclxuICAgICAgICAvL25vcm1hbCBzb3VyY2UgZGltZW5zaW9ucyBuZWVkcyB0byBiZSBzdG9yZWQgaW4gYXJyYXlcclxuICAgICAgICAvL2l0IHdpbGwgYmUgbmVlZGVkIHdoZW4gcmVzaXppbmcgYSBzb3VyY2VcclxuICAgICAgICBzZWxmLmRhdGEucmVtZW1iZXJlZFNvdXJjZXNEaW1lbnNpb25zW2FycmF5SW5kZXhdID0ge1xyXG4gICAgICAgICAgICBcIndpZHRoXCI6IHNvdXJjZVdpZHRoLFxyXG4gICAgICAgICAgICBcImhlaWdodFwiOiBzb3VyY2VIZWlnaHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBzZXQgZGltZW5zaW9ucyBmb3IgdGhlIDFzdCB0aW1lXHJcbiAgICAgICAgc291cmNlRGltZW5zaW9ucyhzb3VyY2VFbGVtLCBzb3VyY2VXaWR0aCwgc291cmNlSGVpZ2h0KTtcclxuXHJcbiAgICAgICAgc291cmNlSG9sZGVyLmFwcGVuZENoaWxkKHNvdXJjZUVsZW0pO1xyXG4gICAgICAgIGNvbnN0IHByZXZpb3VzU291cmNlID0gc291cmNlc1tzb3VyY2VzSW5kZXhlcy5wcmV2aW91c107XHJcbiAgICAgICAgY29uc3QgY3VycmVudFNvdXJjZSA9IHNvdXJjZXNbc291cmNlc0luZGV4ZXMuY3VycmVudF07XHJcbiAgICAgICAgY29uc3QgbmV4dFNvdXJjZSA9IHNvdXJjZXNbc291cmNlc0luZGV4ZXMubmV4dF07XHJcblxyXG5cclxuICAgICAgICBzd2l0Y2ggKHR5cGVPZkxvYWQpIHtcclxuICAgICAgICAgICAgY2FzZSAnaW5pdGlhbCc6XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgdG8gdGVtcCBhcnJheSBiZWNhdXNlIGxvYWRpbmcgaXMgYXN5bmNocm9ub3VzIHNvIHdlIGNhbid0IGRlcGVuZCBvbiBsb2FkIG9yZGVyXHJcbiAgICAgICAgICAgICAgICB0ZW1wU291cmNlc1thcnJheUluZGV4XSA9IHNvdXJjZUhvbGRlcjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBTb3VyY2VzTGVuZ3RoID0gT2JqZWN0LmtleXModGVtcFNvdXJjZXMpLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXBwZW5kcyA9IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJldmlvdXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwZW5kSW5pdGlhbChwcmV2aW91c1NvdXJjZSwgdGVtcFNvdXJjZXNbc291cmNlc0luZGV4ZXMucHJldmlvdXNdKTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRDdXJyZW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGVuZEluaXRpYWwoY3VycmVudFNvdXJjZSwgdGVtcFNvdXJjZXNbc291cmNlc0luZGV4ZXMuY3VycmVudF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZE5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwZW5kSW5pdGlhbChuZXh0U291cmNlLCB0ZW1wU291cmNlc1tzb3VyY2VzSW5kZXhlcy5uZXh0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZih1cmxzLmxlbmd0aCA+PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYXBwZW5kIHNvdXJjZXMgb25seSBpZiBhbGwgc3RhZ2Ugc291cmNlcyBhcmUgbG9hZGVkXHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGVtcFNvdXJjZXNMZW5ndGggPj0gMykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBlbmRzLmFwcGVuZFByZXZpb3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGVuZHMuYXBwZW5kQ3VycmVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBlbmRzLmFwcGVuZE5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGlmKHVybHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGVtcFNvdXJjZXNMZW5ndGggPj0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBlbmRzLmFwcGVuZFByZXZpb3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGVuZHMuYXBwZW5kQ3VycmVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZih1cmxzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZHMuYXBwZW5kQ3VycmVudCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2N1cnJlbnQnOlxyXG4gICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBsb2FkZXIgd2l0aCBsb2FkZWQgc291cmNlXHJcbiAgICAgICAgICAgICAgICBsb2FkKGN1cnJlbnRTb3VyY2UsIHNvdXJjZUVsZW0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ25leHQnOlxyXG4gICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBsb2FkZXIgd2l0aCBsb2FkZWQgc291cmNlXHJcbiAgICAgICAgICAgICAgICBsb2FkKG5leHRTb3VyY2UsIHNvdXJjZUVsZW0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ByZXZpb3VzJzpcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgbG9hZGVyIHdpdGggbG9hZGVkIHNvdXJjZVxyXG4gICAgICAgICAgICAgICAgbG9hZChwcmV2aW91c1NvdXJjZSwgc291cmNlRWxlbSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICB0aGlzLmxvYWRZb3V0dWJldmlkZW8gPSBmdW5jdGlvbiAodmlkZW9JZCwgYXJyYXlJbmRleCkge1xyXG4gICAgICAgIGxldCBpZnJhbWUgPSBuZXcgRE9NT2JqZWN0KCdpZnJhbWUnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC1zaW5nbGUtc291cmNlJ10pO1xyXG4gICAgICAgIGlmcmFtZS5zcmMgPSAnLy93d3cueW91dHViZS5jb20vZW1iZWQvJyArIHZpZGVvSWQgKyAnP2VuYWJsZWpzYXBpPTEnO1xyXG4gICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2FsbG93ZnVsbHNjcmVlbicsICcnKTtcclxuICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZWJvcmRlcicsICcwJyk7XHJcbiAgICAgICAgaWZyYW1lLm9ubW91c2V1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2phcGllcmRvZWwnKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNlbGYuZGF0YS5tZWRpYUhvbGRlci5ob2xkZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcclxuICAgICAgICBvbmxvYWRMaXN0ZW5lcihpZnJhbWUsIDE5MjAsIDEwODAsIGFycmF5SW5kZXgpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgdGhpcy5pbWFnZUxvYWQgPSBmdW5jdGlvbiAoc3JjLCBhcnJheUluZGV4KSB7XHJcbiAgICAgICAgbGV0IHNvdXJjZUVsZW0gPSBuZXcgRE9NT2JqZWN0KCdpbWcnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC1zaW5nbGUtc291cmNlJ10pO1xyXG4gICAgICAgIHNvdXJjZUVsZW0uc3JjID0gc3JjO1xyXG4gICAgICAgIHNvdXJjZUVsZW0uYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgb25sb2FkTGlzdGVuZXIoc291cmNlRWxlbSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIGFycmF5SW5kZXgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgdGhpcy52aWRlb0xvYWQgPSBmdW5jdGlvbiAoc3JjLCBhcnJheUluZGV4KSB7XHJcbiAgICAgICAgbGV0IHZpZGVvRWxlbSA9IG5ldyBET01PYmplY3QoJ3ZpZGVvJykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtc2luZ2xlLXNvdXJjZSddKTtcclxuICAgICAgICBsZXQgc291cmNlID0gbmV3IERPTU9iamVjdCgnc291cmNlJykuZWxlbTtcclxuICAgICAgICBzb3VyY2Uuc3JjID0gc3JjO1xyXG4gICAgICAgIHZpZGVvRWxlbS5pbm5lclRleHQgPSAnU29ycnksIHlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBlbWJlZGRlZCB2aWRlb3MsIDxhXFxuJyArXHJcbiAgICAgICAgICAgICcgICAgICAgICAgICBocmVmPVwiaHR0cDovL2Rvd25sb2FkLmJsZW5kZXIub3JnL3BlYWNoL2JpZ2J1Y2tidW5ueV9tb3ZpZXMvQmlnQnVja0J1bm55XzMyMHgxODAubXA0XCI+ZG93bmxvYWQ8L2E+IGFuZCB3YXRjaFxcbicgK1xyXG4gICAgICAgICAgICAnICAgICAgICB3aXRoIHlvdXIgZmF2b3JpdGUgdmlkZW8gcGxheWVyISc7XHJcblxyXG4gICAgICAgIHZpZGVvRWxlbS5zZXRBdHRyaWJ1dGUoJ2NvbnRyb2xzJywgJycpO1xyXG4gICAgICAgIHZpZGVvRWxlbS5hcHBlbmRDaGlsZChzb3VyY2UpO1xyXG4gICAgICAgIHZpZGVvRWxlbS5hZGRFdmVudExpc3RlbmVyKCdsb2FkZWRtZXRhZGF0YScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgb25sb2FkTGlzdGVuZXIodmlkZW9FbGVtLCB0aGlzLnZpZGVvV2lkdGgsIHRoaXMudmlkZW9IZWlnaHQsIGFycmF5SW5kZXgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmludmFsaWRGaWxlID0gZnVuY3Rpb24gKGFycmF5SW5kZXgpIHtcclxuICAgICAgICBsZXQgaW52YWxpZEZpbGVXcmFwcGVyID0gbmV3IERPTU9iamVjdCgnZGl2JykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtaW52YWxpZC1maWxlLXdyYXBwZXInXSk7XHJcbiAgICAgICAgaW52YWxpZEZpbGVXcmFwcGVyLmlubmVySFRNTCA9ICdJbnZhbGlkIGZpbGUnO1xyXG5cclxuICAgICAgICBvbmxvYWRMaXN0ZW5lcihpbnZhbGlkRmlsZVdyYXBwZXIsIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQsIGFycmF5SW5kZXgpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgdGhpcy5jcmVhdGVTb3VyY2VFbGVtID0gZnVuY3Rpb24gKHNvdXJjZVVybCkge1xyXG4gICAgICAgIGNvbnN0IHBhcnNlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICBjb25zdCBpbmRleE9mU291cmNlID0gc2VsZi5kYXRhLnVybHMuaW5kZXhPZihzb3VyY2VVcmwpO1xyXG5cclxuICAgICAgICBwYXJzZXIuaHJlZiA9IHNvdXJjZVVybDtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0SWQoc291cmNlVXJsKSB7XHJcbiAgICAgICAgICAgIGxldCByZWdFeHAgPSAvXi4qKHlvdXR1LmJlXFwvfHZcXC98dVxcL1xcd1xcL3xlbWJlZFxcL3x3YXRjaFxcP3Y9fFxcJnY9KShbXiNcXCZcXD9dKikuKi87XHJcbiAgICAgICAgICAgIGxldCBtYXRjaCA9IHNvdXJjZVVybC5tYXRjaChyZWdFeHApO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoICYmIG1hdGNoWzJdLmxlbmd0aCA9PSAxMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoWzJdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdlcnJvcic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwYXJzZXIuaG9zdG5hbWUgPT09ICd3d3cueW91dHViZS5jb20nKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZGF0YS52aWRlb3NbaW5kZXhPZlNvdXJjZV0gPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5sb2FkWW91dHViZXZpZGVvKGdldElkKHNvdXJjZVVybCksIGluZGV4T2ZTb3VyY2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgICAgICB4aHIub25sb2Fkc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gXCJibG9iXCI7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGVjayB3aGF0IHR5cGUgb2YgZmlsZSBwcm92aWRlZCBmcm9tIGxpbmtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3BvbnNlVHlwZSA9IHhoci5yZXNwb25zZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVR5cGUuaW5kZXhPZignLycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVR5cGUgPSByZXNwb25zZVR5cGUuc2xpY2UoMCwgcmVzcG9uc2VUeXBlLmluZGV4T2YoJy8nKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VUeXBlID09PSAnaW1hZ2UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbWFnZUxvYWQoVVJMLmNyZWF0ZU9iamVjdFVSTCh4aHIucmVzcG9uc2UpLCBpbmRleE9mU291cmNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocmVzcG9uc2VUeXBlID09PSAndmlkZW8nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy52aWRlb0xvYWQoVVJMLmNyZWF0ZU9iamVjdFVSTCh4aHIucmVzcG9uc2UpLCBpbmRleE9mU291cmNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGF0YS52aWRlb3NbaW5kZXhPZlNvdXJjZV0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmludmFsaWRGaWxlKGluZGV4T2ZTb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgeGhyLm9wZW4oJ2dldCcsIHNvdXJjZVVybCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHhoci5zZW5kKG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIHN3aXRjaCAodHlwZU9mTG9hZCkge1xyXG4gICAgICAgIGNhc2UgJ2luaXRpYWwnOlxyXG4gICAgICAgICAgICAvL2FwcGVuZCBsb2FkZXIgd2hlbiBsb2FkaW5nIGluaXRpYWxseVxyXG4gICAgICAgICAgICBzZWxmLmFwcGVuZE1ldGhvZHMucmVuZGVySG9sZGVySW5pdGlhbChzZWxmLHNsaWRlLERPTU9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICBpZih1cmxzLmxlbmd0aCA+PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVNvdXJjZUVsZW0odXJsc1tzb3VyY2VzSW5kZXhlcy5jdXJyZW50XSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKHVybHMubGVuZ3RoID49IDIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlU291cmNlRWxlbSh1cmxzW3NvdXJjZXNJbmRleGVzLm5leHRdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYodXJscy5sZW5ndGggPj0gMykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVTb3VyY2VFbGVtKHVybHNbc291cmNlc0luZGV4ZXMucHJldmlvdXNdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBjYXNlICdwcmV2aW91cyc6XHJcbiAgICAgICAgICAgIC8vIGFwcGVuZCBsb2FkZXIgd2hlbiBsb2FkaW5nIGEgbmV4dCBzb3VyY2VcclxuICAgICAgICAgICAgc2VsZi5hcHBlbmRNZXRob2RzLnJlbmRlckhvbGRlclByZXZpb3VzKHNsaWRlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGxvYWQgcHJldmlvdXMgc291cmNlXHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlU291cmNlRWxlbSh1cmxzW3NvdXJjZXNJbmRleGVzLnByZXZpb3VzXSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgLy8gYXBwZW5kIGxvYWRlciB3aGVuIGxvYWRpbmcgYSBuZXh0IHNvdXJjZVxyXG4gICAgICAgICAgICBzZWxmLmFwcGVuZE1ldGhvZHMucmVuZGVySG9sZGVyTmV4dChzbGlkZSk7XHJcblxyXG4gICAgICAgICAgICAvL2xvYWQgbmV4dCBzb3VyY2VcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVTb3VyY2VFbGVtKHVybHNbc291cmNlc0luZGV4ZXMubmV4dF0pO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSAnY3VycmVudCc6XHJcblxyXG4gICAgICAgICAgICAvLyBhcHBlbmQgbG9hZGVyIHdoZW4gbG9hZGluZyBhIG5leHQgc291cmNlXHJcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kTWV0aG9kcy5yZW5kZXJIb2xkZXJDdXJyZW50KHNsaWRlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGxvYWQgcHJldmlvdXMgc291cmNlXHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlU291cmNlRWxlbSh1cmxzW3NvdXJjZXNJbmRleGVzLmN1cnJlbnRdKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VsZiwgRE9NT2JqZWN0KSB7XHJcbiAgICBsZXQgcHJpdmF0ZU1ldGhvZHMgPSB7XHJcblxyXG4gICAgICAgIHJlbmRlck5hdjogZnVuY3Rpb24gKGNvbnRhaW5lcikge1xyXG4gICAgICAgICAgICBzZWxmLmRhdGEubmF2ID0gbmV3IERPTU9iamVjdCgnZGl2JykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtbmF2J10pO1xyXG4gICAgICAgICAgICBzZWxmLnRvb2xiYXIucmVuZGVyVG9vbGJhcihzZWxmLmRhdGEubmF2KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuc2xpZGVDb3VudGVyID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBuZXcgc2VsZi5zbGlkZUNvdW50ZXJFbGVtKCkucmVuZGVyU2xpZGVDb3VudGVyKHNlbGYuZGF0YS5uYXYpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc2VsZi5kYXRhLm5hdik7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNyZWF0ZUJUTjogZnVuY3Rpb24oYnV0dG9uQ29udGFpbmVyLCBjb250YWluZXIsIGQpIHtcclxuICAgICAgICAgICAgbGV0IGJ0biA9IG5ldyBET01PYmplY3QoJ2RpdicpLmFkZENsYXNzZXNBbmRDcmVhdGUoWydmc2xpZ2h0Ym94LXNsaWRlLWJ0bicsICdidXR0b24tc3R5bGUnXSk7XHJcbiAgICAgICAgICAgIGJ0bi5hcHBlbmRDaGlsZChcclxuICAgICAgICAgICAgICAgIG5ldyBzZWxmLlNWR0ljb24oKS5nZXRTVkdJY29uKCcwIDAgMjAgMjAnLCAnMWVtJywgZClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGJ0bik7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChidXR0b25Db250YWluZXIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbmRlclNsaWRlQnV0dG9uczogZnVuY3Rpb24gKGNvbnRhaW5lcikge1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5kYXRhLnNsaWRlQnV0dG9ucyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL3JlbmRlciBsZWZ0IGJ0blxyXG4gICAgICAgICAgICBsZXQgbGVmdF9idG5fY29udGFpbmVyID0gbmV3IERPTU9iamVjdCgnZGl2JykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtc2xpZGUtYnRuLWNvbnRhaW5lcicsJ2ZzbGlnaHRib3gtc2xpZGUtYnRuLWxlZnQtY29udGFpbmVyJ10pO1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJUTihsZWZ0X2J0bl9jb250YWluZXIsIGNvbnRhaW5lciwgJ004LjM4OCwxMC4wNDlsNC43Ni00Ljg3M2MwLjMwMy0wLjMxLDAuMjk3LTAuODA0LTAuMDEyLTEuMTA1Yy0wLjMwOS0wLjMwNC0wLjgwMy0wLjI5My0xLjEwNSwwLjAxMkw2LjcyNiw5LjUxNmMtMC4zMDMsMC4zMS0wLjI5NiwwLjgwNSwwLjAxMiwxLjEwNWw1LjQzMyw1LjMwN2MwLjE1MiwwLjE0OCwwLjM1LDAuMjIzLDAuNTQ3LDAuMjIzYzAuMjAzLDAsMC40MDYtMC4wOCwwLjU1OS0wLjIzNmMwLjMwMy0wLjMwOSwwLjI5NS0wLjgwMy0wLjAxMi0xLjEwNEw4LjM4OCwxMC4wNDl6Jyk7XHJcblxyXG4gICAgICAgICAgICAvL2dvIHRvIHByZXZpb3VzIHNsaWRlIG9uY2xpY2tcclxuICAgICAgICAgICAgbGVmdF9idG5fY29udGFpbmVyLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmFwcGVuZE1ldGhvZHMucHJldmlvdXNTbGlkZVZpYUJ1dHRvbihzZWxmLHNlbGYuZGF0YS5zbGlkZSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBsZXQgcmlnaHRfYnRuX2NvbnRhaW5lciA9IG5ldyBET01PYmplY3QoJ2RpdicpLmFkZENsYXNzZXNBbmRDcmVhdGUoWydmc2xpZ2h0Ym94LXNsaWRlLWJ0bi1jb250YWluZXInLCAnZnNsaWdodGJveC1zbGlkZS1idG4tcmlnaHQtY29udGFpbmVyJ10pO1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJUTihyaWdodF9idG5fY29udGFpbmVyLCBjb250YWluZXIsICdNMTEuNjExLDEwLjA0OWwtNC43Ni00Ljg3M2MtMC4zMDMtMC4zMS0wLjI5Ny0wLjgwNCwwLjAxMi0xLjEwNWMwLjMwOS0wLjMwNCwwLjgwMy0wLjI5MywxLjEwNSwwLjAxMmw1LjMwNiw1LjQzM2MwLjMwNCwwLjMxLDAuMjk2LDAuODA1LTAuMDEyLDEuMTA1TDcuODMsMTUuOTI4Yy0wLjE1MiwwLjE0OC0wLjM1LDAuMjIzLTAuNTQ3LDAuMjIzYy0wLjIwMywwLTAuNDA2LTAuMDgtMC41NTktMC4yMzZjLTAuMzAzLTAuMzA5LTAuMjk1LTAuODAzLDAuMDEyLTEuMTA0TDExLjYxMSwxMC4wNDl6Jyk7XHJcbiAgICAgICAgICAgIC8vIGdvIHRvIG5leHQgc2xpZGUgb24gY2xpY2tcclxuICAgICAgICAgICAgcmlnaHRfYnRuX2NvbnRhaW5lci5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRNZXRob2RzLm5leHRTbGlkZVZpYUJ1dHRvbihzZWxmLHNlbGYuZGF0YS5zbGlkZSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvL2Rpc2FibGUgc2Nyb2xsaW5nIGFuZCBhZGQgZml4IGZvciBqdW1waW5nIHNpdGUgaWYgbm90IG1vYmlsZVxyXG4gICAgc2VsZi5zY3JvbGxiYXIuc2hvd1Njcm9sbGJhcigpO1xyXG5cclxuICAgIC8vY3JlYXRlIGNvbnRhaW5lclxyXG4gICAgc2VsZi5kYXRhLmVsZW1lbnQgPSBuZXcgRE9NT2JqZWN0KCdkaXYnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC1jb250YWluZXInXSk7XHJcbiAgICBzZWxmLmRhdGEuZWxlbWVudC5pZCA9IFwiZnNsaWdodGJveC1jb250YWluZXJcIjtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2VsZi5kYXRhLmVsZW1lbnQpO1xyXG5cclxuICAgIC8vcmVuZGVyIHNsaWRlIGJ1dHRvbnMgYW5kIG5hdih0b29sYmFyKVxyXG4gICAgcHJpdmF0ZU1ldGhvZHMucmVuZGVyTmF2KHNlbGYuZGF0YS5lbGVtZW50KTtcclxuXHJcbiAgICBpZihzZWxmLmRhdGEudG90YWxfc2xpZGVzID4gMSkge1xyXG4gICAgICAgIHByaXZhdGVNZXRob2RzLnJlbmRlclNsaWRlQnV0dG9ucyhzZWxmLmRhdGEuZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZi5kYXRhLm1lZGlhSG9sZGVyID0gbmV3IHNlbGYubWVkaWFIb2xkZXIoKTtcclxuICAgIHNlbGYuZGF0YS5tZWRpYUhvbGRlci5yZW5kZXJIb2xkZXIoc2VsZi5kYXRhLmVsZW1lbnQpO1xyXG4gICAgc2VsZi5kYXRhLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChbJ2ZzbGlnaHRib3gtZmFkZS1pbi1hbmltYXRpb24nXSk7XHJcbiAgICBzZWxmLmRhdGEuaXNmaXJzdFRpbWVMb2FkID0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZWxmLCBET01PYmplY3QpIHtcclxuXHJcbiAgICB0aGlzLnRvb2xiYXJFbGVtID0gbmV3IERPTU9iamVjdCgnZGl2JykuYWRkQ2xhc3Nlc0FuZENyZWF0ZShbJ2ZzbGlnaHRib3gtdG9vbGJhciddKTtcclxuICAgIGNvbnN0IF90aGlzID0gdGhpcztcclxuXHJcbiAgICB0aGlzLnJlbmRlckRlZmF1bHRCdXR0b25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGxldCBzaG91bGRSZW5kZXJCdXR0b25zID0gc2VsZi5kYXRhLnRvb2xiYXJCdXR0b25zO1xyXG5cclxuICAgICAgICBpZiAoc2hvdWxkUmVuZGVyQnV0dG9ucy5mdWxsc2NyZWVuID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGxldCBidXR0b24gPSBuZXcgRE9NT2JqZWN0KCdkaXYnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC10b29sYmFyLWJ1dHRvbicsICdidXR0b24tc3R5bGUnXSk7XHJcbiAgICAgICAgICAgIGxldCBzdmcgPSBuZXcgc2VsZi5TVkdJY29uKCkuZ2V0U1ZHSWNvbignMCAwIDE3LjUgMTcuNScsICcxLjI1ZW0nLCAnTTQuNSAxMUgzdjRoNHYtMS41SDQuNVYxMXpNMyA3aDEuNVY0LjVIN1YzSDN2NHptMTAuNSA2LjVIMTFWMTVoNHYtNGgtMS41djIuNXpNMTEgM3YxLjVoMi41VjdIMTVWM2gtNHonKTtcclxuICAgICAgICAgICAgYnV0dG9uLmFwcGVuZENoaWxkKHN2Zyk7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgKHNlbGYuZGF0YS5mdWxsc2NyZWVuKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2xvc2VGdWxsc2NyZWVuKCk6XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub3BlbkZ1bGxzY3JlZW4oKTtcclxuXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHRoaXMudG9vbGJhckVsZW0uYXBwZW5kQ2hpbGQoYnV0dG9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzaG91bGRSZW5kZXJCdXR0b25zLmNsb3NlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGxldCBidXR0b24gPSBuZXcgRE9NT2JqZWN0KCdkaXYnKS5hZGRDbGFzc2VzQW5kQ3JlYXRlKFsnZnNsaWdodGJveC10b29sYmFyLWJ1dHRvbicsICdidXR0b24tc3R5bGUnXSk7XHJcbiAgICAgICAgICAgIGxldCBzdmcgPSBuZXcgc2VsZi5TVkdJY29uKCkuZ2V0U1ZHSWNvbignMCAwIDIwIDIwJywgJzFlbScsICdNIDExLjQ2OSAxMCBsIDcuMDggLTcuMDggYyAwLjQwNiAtMC40MDYgMC40MDYgLTEuMDY0IDAgLTEuNDY5IGMgLTAuNDA2IC0wLjQwNiAtMS4wNjMgLTAuNDA2IC0xLjQ2OSAwIEwgMTAgOC41MyBsIC03LjA4MSAtNy4wOCBjIC0wLjQwNiAtMC40MDYgLTEuMDY0IC0wLjQwNiAtMS40NjkgMCBjIC0wLjQwNiAwLjQwNiAtMC40MDYgMS4wNjMgMCAxLjQ2OSBMIDguNTMxIDEwIEwgMS40NSAxNy4wODEgYyAtMC40MDYgMC40MDYgLTAuNDA2IDEuMDY0IDAgMS40NjkgYyAwLjIwMyAwLjIwMyAwLjQ2OSAwLjMwNCAwLjczNSAwLjMwNCBjIDAuMjY2IDAgMC41MzEgLTAuMTAxIDAuNzM1IC0wLjMwNCBMIDEwIDExLjQ2OSBsIDcuMDggNy4wODEgYyAwLjIwMyAwLjIwMyAwLjQ2OSAwLjMwNCAwLjczNSAwLjMwNCBjIDAuMjY3IDAgMC41MzIgLTAuMTAxIDAuNzM1IC0wLjMwNCBjIDAuNDA2IC0wLjQwNiAwLjQwNiAtMS4wNjQgMCAtMS40NjkgTCAxMS40NjkgMTAgWicpO1xyXG4gICAgICAgICAgICBidXR0b24uYXBwZW5kQ2hpbGQoc3ZnKTtcclxuICAgICAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZighc2VsZi5kYXRhLmZhZGluZ091dCkgc2VsZi5oaWRlKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHRoaXMudG9vbGJhckVsZW0uYXBwZW5kQ2hpbGQoYnV0dG9uKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICB0aGlzLm9wZW5GdWxsc2NyZWVuID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNlbGYuZGF0YS5mdWxsc2NyZWVuID0gdHJ1ZTtcclxuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuICAgICAgICBpZiAoZWxlbS5yZXF1ZXN0RnVsbHNjcmVlbikge1xyXG4gICAgICAgICAgICBlbGVtLnJlcXVlc3RGdWxsc2NyZWVuKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtLm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XHJcbiAgICAgICAgICAgIGVsZW0ubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcclxuICAgICAgICAgICAgZWxlbS53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZWxlbS5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XHJcbiAgICAgICAgICAgIGVsZW0ubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5jbG9zZUZ1bGxzY3JlZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2VsZi5kYXRhLmZ1bGxzY3JlZW4gPSBmYWxzZTtcclxuICAgICAgICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4pIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZW5kZXJUb29sYmFyID0gZnVuY3Rpb24gKG5hdikge1xyXG4gICAgICAgIHRoaXMucmVuZGVyRGVmYXVsdEJ1dHRvbnMoKTtcclxuICAgICAgICBuYXYuYXBwZW5kQ2hpbGQodGhpcy50b29sYmFyRWxlbSk7XHJcbiAgICB9O1xyXG59OyJdfQ==