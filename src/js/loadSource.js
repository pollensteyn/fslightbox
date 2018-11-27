module.exports = function (self, DOMObject, typeOfLoad, slide) {

    const _this = this;
    let currentSlideArrayIndex = self.data.slide - 1;

    let sourceDimensions = function (sourceElem, sourceWidth, sourceHeight) {
        if (typeof  sourceWidth === "undefined") {
            sourceWidth = self.data.onResizeEvent.rememberdWidth;
            sourceHeight = self.data.onResizeEvent.rememberdHeight;
        }

        const coefficient = sourceWidth / sourceHeight;
        const deviceWidth = window.innerWidth;
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


    /**
     * add fade in class and dimension function
     */
    let onloadListener = function (sourceElem, sourceWidth, sourceHeight, arrayIndex) {

        let sourceHolder = new DOMObject('div').addClassesAndCreate(['fslightbox-source-holder']);

        //normal source dimensions needs to be stored in array
        //it will be needed when loading source from memory
        self.data.rememberedSourcesDimensions[arrayIndex] = {
            "width": sourceWidth,
            "height": sourceHeight
        };

        //add some fade in animation
        sourceElem.classList.remove('fslightbox-fade-in');
        void sourceElem.offsetWidth;
        sourceElem.classList.add('fslightbox-fade-in');

        //add method that changes source dimension on window resize
        self.data.onResizeEvent.sourceDimensions = function () {
            sourceDimensions(sourceElem, sourceWidth, sourceHeight);
        };

        //set dimension for the first time
        self.data.onResizeEvent.sourceDimensions(sourceWidth, sourceHeight);


        // dimensions will be given only one time so we will need to remember it
        // for next onresize event calls
        self.data.onResizeEvent.rememberdWidth = sourceWidth;
        self.data.onResizeEvent.rememberdHeight = sourceHeight;

        sourceHolder.appendChild(sourceElem);
        self.data.sources[arrayIndex] = sourceHolder;



        switch (typeOfLoad) {
            case 'initial':
                self.appendMethods.initialAppend(self);
                break;
            case 'next':
                self.data.slideLoad.loaded = true;
                self.data.slideLoad.loads[slide] = true;
                self.appendMethods.nextAppend(self, slide);
                break;
            case 'previous':
                self.data.slideLoad.loaded = true;
                self.data.slideLoad.loads[slide] = true;
                self.appendMethods.previousAppend(self, slide);
                break;
        }
    };


    this.loadYoutubevideo = function (videoId, arrayIndex) {
        let iframe = new DOMObject('iframe').addClassesAndCreate(['fslightbox-single-source']);
        iframe.src = '//www.youtube.com/embed/' + videoId;
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('frameborder', '0');
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

                        if (responseType === 'video') {
                            _this.videoLoad(URL.createObjectURL(xhr.response), indexOfSource);
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
            // if we load initially we'll need to create all three stage sources
            this.createSourceElem(self.data.urls[currentSlideArrayIndex]);
            this.createSourceElem(self.data.urls[currentSlideArrayIndex + 1]);
            if (currentSlideArrayIndex === 0) {
                this.createSourceElem(self.data.urls[self.data.urls.length - 1]);
            } else {
                this.createSourceElem(currentSlideArrayIndex - 1);
            }
            break;

        case 'previous':
            // Array is indexed from 0 so previous source index will be slide number - 2

            // if slide number is 1
            // we'll be appending source from total_slides index not from slide number index - 2
            if (self.data.slide === 1) {


                // if source was previously appended load it from memory
                if (typeof self.data.sources[self.data.total_slides] !== "undefined") {
                    self.data.slideLoad.loaded = true;
                    self.data.slideLoad.loads[slide] = true;
                    self.appendMethods.previousAppend(self);
                } else {
                    this.createSourceElem(self.data.urls[self.data.total_slides - 1]);
                }

                break;
            }

            // if data was previously appended load it from memory
            else if (typeof self.data.sources[self.data.slide - 2] !== "undefined") {
                self.data.slideLoad.loaded = true;
                self.data.slideLoad.loads[slide] = true;
                self.appendMethods.previousAppend(self);
                break;
            }

            // if source wasn't previously appended we will need to create it
            this.createSourceElem(self.data.urls[self.data.slide - 2]);
            break;

        case 'next':
            // Array is indexed from 0 so next source index will be simply slide number

            // if slide number is equals total slide number
            // we'll be appending source from index 0 not from slide number index
            if (self.data.slide === self.data.total_slides) {

                // if source was previously appended load it from memory
                if (typeof self.data.sources[0] !== "undefined") {
                    self.data.slideLoad.loaded = true;
                    self.data.slideLoad.loads[slide] = true;
                    self.appendMethods.nextAppend(self);
                } else {
                    this.createSourceElem(self.data.urls[0]);
                }

                break;
            }

            // if data was previously appended load it from memory
            else if (typeof self.data.sources[self.data.slide] !== "undefined") {
                self.data.slideLoad.loaded = true;
                self.data.slideLoad.loads[slide] = true;
                self.appendMethods.nextAppend(self);
                break;
            }


            // if source wasn't previously appended we will need to create it
            this.createSourceElem(self.data.urls[self.data.slide]);
            break;
    }


    if(slide) {
        self.data.slideLoad.appends[slide] = false;
    }


    //if first time load add loader
    if (self.data.isFirstTimeLoad === true) {
        self.data.mediaHolder.holder.innerHTML = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>';
        self.data.isFirstTimeLoad = false;
    }


    /*


    //check if source was previously created and
    // create it if it wasn't or if it was load it from variable
    if (typeof self.data.sources[indexOfSourceURL] === "undefined") {
        this.createSourceElem();
    } else {
        console.log('loaded from memory');
        const sourceElem = self.data.sources[indexOfSourceURL];
        const rememberedSourceDimensions = self.data.rememberedSourcesDimensions[indexOfSourceURL];
        self.data.mediaHolder.holder.innerHTML = '';
        self.data.mediaHolder.holder.appendChild(sourceElem);
        console.log(sourceElem);

        self.data.onResizeEvent.sourceDimensions = function () {
            sourceDimensions(
                sourceElem,
                rememberedSourceDimensions.width,
                rememberedSourceDimensions.height
            );
        };
        self.data.onResizeEvent.sourceDimensions();
    }

    */
};