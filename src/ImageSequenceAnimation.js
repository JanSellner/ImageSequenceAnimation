var ImageSequenceAnimationLibrary = (function () {
	var JSZip = require('jszip');
	
    function numbInString(filename) {
        var regex = /([A-Za-z]+)=(\d+)/g;

        var parameters = [];
        var match;

        while ((match = regex.exec(filename)) !== null) {
            if (match.length !== 3) {
                throw new Error("No valid numbers in the " + filename + " filename found.");
            }

            parameters.push({name: match[1], value: match[2]});
        }

        return parameters;
    }

    function pad(n, width, z) {
        // http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    function numDecimals(number) {
        if(Math.floor(number) === number) {
            return 0;
        }

        return number.toString().split(".")[1].length || 0;
    }

    function informListeners(listeners, argument) {
        for (var i = 0; i < listeners.length; ++i) {
            listeners[i](argument);
        }
    }

    function ParameterAnimation(name, min, max, step, defaultValue) {
        this.min = min;
        this.max = max;
        this.step = step;
        this.name = name;
        this.numbDigits = 0;
        this.onChangeListeners = [];
        this.setDefault(defaultValue === undefined ? this.min : defaultValue);

        // Check if the range is correct
        // This is not so easy since it can't be expected that the calculations lead to the exact same results. The approach here is to force the number of decimal digits of the calculated maximum to be the same as the provided maximum
        // E.g. this.max = 5.52, numDecimals(5.52) = 2, calculatedMax = (5.520000001).toFixed... = 5.52
        var calculatedMax = (this.min + (this.sizeImages() - 1) * this.step).toFixed(numDecimals(this.max));
        if (calculatedMax !== String(this.max)) {
            throw new Error("The value range (min: " + this.min + ", max: " + this.max + ", step: " + this.step + ") does not fit. It is not possible to reach the maximum from the minimum with the given step size. With the current setting, there are only " + this.sizeImages() + " steps reaching " + calculatedMax + " instead of " + this.max + ".");
        }
    }

    ParameterAnimation.prototype.setDefault = function(defaultValue) {
        this.defaultValue = defaultValue;
        this.setCurrent(this.defaultValue);
    };

    ParameterAnimation.prototype.setCurrent = function(value) {
        if (value < this.min || value > this.max) {
            throw new Error("The value " + value + " is out of range.");
        }

        var oldValue = this.current;
        this.current = value;

        // Inform observers when the value of the parameter has changed
        if (oldValue !== this.current) {
            informListeners(this.onChangeListeners, this.current);
        }
    };

    ParameterAnimation.prototype.sizeImages = function() {
        // E.g. {5,6,7,8,9,10} => (10 - 5) / 1 = 6 elements
        return Math.round((this.max - this.min) / this.step) + 1;   // Currently, the zip library does not offer an easy way to count the total number of elements, but the information is available by the slider definition anyway
    };

    ParameterAnimation.prototype.getImgId = function() {
        var id = Math.round((this.current - this.min) * (1 / this.step));

        if (id < 0 || this.current === "") {   // MS-Edge offers an "x"-Button which results in an empty "" input
            this.setCurrent(this.min);

            id = 0;
        }

        if (id >= this.sizeImages()) {
            this.setCurrent(this.max);

            id = this.sizeImages() - 1;
        }

        return pad(id, this.numbDigits);
    };

    ParameterAnimation.prototype.addOnChangeListener = function(callback) {
        this.onChangeListeners.push(callback.bind(this));
    };

    function ImageSequenceAnimation(divID) {
        // Find the div
        if (divID === undefined) {
            throw new Error("The parameter divID is missing but required.");
        }
        this.divID = divID.startsWith("#") ? divID.substr(1) : divID;   // #id should work as well

        this.div = document.getElementById(this.divID);
        if (this.div === null) {
            throw new Error("Could not find a div with the id " + this.divID + ".");
        }

        // Find the canvas
        this.canvas = this.div.getElementsByTagName("canvas");
        if (this.canvas.length !== 1) {
            throw new Error("The div #" + this.divID + " must contain exactly one canvas element.");
        }
        this.canvas = this.canvas[0];
        this.ctx = this.canvas.getContext("2d");

        this.loadingFinishedListeners = [];
        this.elementLoadedListeners = [];

        this.parameters = {};
        this.parameterNames = [];

        this.loadedElements = 0;
        this.images = {};   // Mapping between the filename (without the extension) and the corresponding image data

        // Indicates whether a zip file has been loading
        this.startedLoading = false;
    }

    function setImage(image, name) {
        if (name !== undefined) {
            this.images[name] = image;
        }
        else {
            this.images[buildParameterString.call(this)] = image;
        }
    }

    function getImage() {
        if (!this.images.hasOwnProperty(buildParameterString.call(this))) {
            throw new Error("The zip file does not contain an image with the name " + buildParameterString.call(this) + ". Make sure you set the control elements in the same order as defined in the zip file.");
        }

        return this.images[buildParameterString.call(this)];
    }

    function imagesSize() {
        return Object.keys(this.images).length;
    }

    function addImage(imgData, filename) {
        var img = new Image();
        var self = this;
        img.onload = function() {
            elementLoaded.call(self);
        };

        var extractedParameters = numbInString(filename);
        var identifier = "";

        extractedParameters.forEach(function(parameter) {
            if (self.parameters[parameter.name] === undefined) {
                throw new Error("The parameter " + parameter.name + " is part of the filenames, but no corresponding control element is set.");
            }

            identifier += parameter.name + "=" + parameter.value;
            if (imagesSize.call(self) === 0) {
                self.parameters[parameter.name].numbDigits = parameter.value.length;
            }
        });

        setImage.call(this, img, identifier);

        img.src = imgData;  // It might be better to first load the image data when the onload function is set
    }

    function elementLoaded(){
        this.loadedElements++;
        informListeners(this.elementLoadedListeners);

        if (loadingFinished.call(this)) {
            // All elements are now loaded
            informListeners(this.loadingFinishedListeners);
            loadImage.call(this);
        }
    }

    function buildParameterString() {
        var string = "";

        for (var i = 0; i < this.parameterNames.length; ++i) {
            var name = this.parameterNames[i];
            string += name + "=" + this.parameters[name].getImgId();
        }

        return string;
    }

    function loadImage(img) {
        if (img === undefined) {
            img = getImage.call(this);
        }

        if (img === false || img === undefined) {
            return;
        }

        var oldAlpha = 0.0;
        if (img.width !== this.canvas.width) {
            oldAlpha = this.ctx.globalAlpha;
            this.canvas.width = img.width;
            this.ctx.globalAlpha = oldAlpha;
        }
        if (img.height !== this.canvas.height) {
            oldAlpha = this.ctx.globalAlpha;
            this.canvas.height = img.height;
            this.ctx.globalAlpha = oldAlpha;
        }

        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    }

    function loadingFinished() {
        return this.loadedElements === this.totalElements();
    }

    function getDataSrc() {
        var attribute = "data-zip_src";
        if (!this.div.hasAttribute(attribute)) {
            throw new Error("The div " + this.divID + " does not have an attribute " + attribute + ". This is required and should point to the zip file containing the images.");
        }

        return this.div.getAttribute(attribute);
    }

    ImageSequenceAnimation.prototype.addControl = function(control) {
        control.init(this);
        var parameters = control.getParameters();

        for (var i = 0; i < parameters.length; ++i) {
            var parameter = parameters[i];
            // Get informed when the parameters changes
            parameter.addOnChangeListener(function() {
                loadImage.call(this);
            }.bind(this));

            this.parameters[parameter.name] = parameter;
            this.parameterNames.push(parameter.name);
        }
    };

    ImageSequenceAnimation.prototype.addLoadingFinishedListener = function(callback) {
        this.loadingFinishedListeners.push(callback.bind(this));
    };

    ImageSequenceAnimation.prototype.addElementLoadedListener = function(callback) {
        this.elementLoadedListeners.push(callback.bind(this));
    };

    ImageSequenceAnimation.prototype.totalElements = function() {
        var total = 1;

        for (var i = 0; i < this.parameterNames.length; ++i) {
            var name = this.parameterNames[i];
            total *= this.parameters[name].sizeImages();
        }

        return total;
    };

    ImageSequenceAnimation.prototype.isLoading = function() {
        return this.loadedElements > 0 && !loadingFinished.call(this);
    };

    ImageSequenceAnimation.prototype.loadFromZip = function(src) {
        if (src === undefined) {
            src = getDataSrc.call(this);
        }

        if (this.isLoading()) {
            throw new Error("Cannot load the file " + src + " because the loading process already started.");
        }
        this.startedLoading = true;

        // Issue an AJAX request to get the zip data
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", src);
        xhr.responseType = "blob";  // We want to get binary data
        xhr.onload = function() {
            if (this.status !== 200) {
                throw new Error("Could not load the zip file " + src + " (status code: " + this.status + ").");
            }

            JSZip.loadAsync(this.response).then(function(jszip) {
                jszip.folder("").forEach(function(relativePath, zipObject) {
                    if (!relativePath.endsWith(".png")) {
                        console.warn("The zip file " + src + " contains the file " + relativePath + " which is not a png file. The file is ignored.");
                        return;
                    }

                    zipObject.async("uint8array").then(function (data) {
                        var blob = new Blob([data], {type: "image/png"});    // http://stackoverflow.com/questions/7650587/using-javascript-to-display-blob

                        addImage.call(self, URL.createObjectURL(blob), relativePath);
                    });
                });
            });
        };
        xhr.send();
    };

    ImageSequenceAnimation.prototype.loadFromZipLazy = function(thumbnailExtension, src) {
        if (thumbnailExtension === undefined) {
            thumbnailExtension = ".pdf";
        }
        if (src === undefined) {
            src = getDataSrc.call(this);
        }

        if (this.isLoading()) {
            throw new Error("Cannot load the file " + src + " because the loading process already started.");
        }

        var filenameThumbnail = src.replace(/\.[^.]+$/, thumbnailExtension);

        var self = this;

        var img = new Image();
        img.src = filenameThumbnail;
        img.onload = function() {
            function onMousemove() {
                setText(clickText, 0.5);
            }

            function onMouseout() {
                setText(clickText, 1.0);
            }

            function onMouseup() {
                setText("Loading...", 1.0);

                // Remove listener when the loading starts
                self.removeMouseListeners();

                // Load data
                self.loadFromZip(src);
            }

            var hasMouseListeners = false;
            self.removeMouseListeners = function() {
                if (hasMouseListeners) {
                    self.canvas.removeEventListener("mouseup", onMouseup);
                    self.canvas.removeEventListener("mousemove", onMousemove);
                    self.canvas.removeEventListener("mouseout", onMouseout);
                    hasMouseListeners = false;
                }
            };

            function setText(text, alpha) {
                var canvas = self.canvas;
                var ctx = self.ctx;

                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 0.3;
                loadImage.call(self, img);
                ctx.restore();

                ctx.save();
                ctx.textAlign = "center";
                ctx.font = "50px Georgia";
                ctx.globalAlpha = alpha;
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                ctx.restore();
            }

            self.addElementLoadedListener(function() {
                if (hasMouseListeners) {
                    // If the listeners are still active, remove them (this is the case when two animations are synced. Then, the not-clicked animation gets no mouseup event)
                    self.removeMouseListeners();
                }

                setText("Loading... (" + Math.round(this.loadedElements / self.totalElements() * 100) + " %)", 1.0);
            });

            var clickText = "Click to load";
            setText(clickText, 1.0);

            hasMouseListeners = true;
            self.canvas.addEventListener("mouseup", onMouseup);
            self.canvas.addEventListener("mousemove", onMousemove);
            self.canvas.addEventListener("mouseout", onMouseout);
        };
    };

    ImageSequenceAnimation.prototype.syncAnimations = function(otherAnimation, namesAnimation, namesThis) {
        if (namesAnimation.length !== namesThis.length) {
            throw new Error("Both list of names (parameter names from the other animation object, own parameter names) must have the same length.");
        }

        var self = this;

        // Make sure that if one animation starts loading, the other starts loading as well
        self.addElementLoadedListener(function() {
            if (!otherAnimation.startedLoading) {
                otherAnimation.canvas.dispatchEvent(new Event('mouseup'));
            }
        });
        otherAnimation.addElementLoadedListener(function() {
            if (!self.startedLoading) {
                self.canvas.dispatchEvent(new Event('mouseup'));
            }
        });

        function syncParameters(nameAnimation, nameThis) {
            // A new function is necessary since a new closure is needed to capture the parameter names (nameAnimation, nameThis) for the callback function
            otherAnimation.parameters[nameAnimation].addOnChangeListener(function(value) {
                self.parameters[nameThis].setCurrent(value);
            });
            self.parameters[nameThis].addOnChangeListener(function(value) {
                otherAnimation.parameters[nameAnimation].setCurrent(value);
            });
        }

        for (var i = 0; i < namesAnimation.length; ++i) {
            if (!otherAnimation.parameters.hasOwnProperty(namesAnimation[i])) {
                throw new Error("The parameters of the other animation object do not have a parameter named " + namesAnimation[i] + ".");
            }
            if (!self.parameters.hasOwnProperty(namesThis[i])) {
                throw new Error("The parameters of the own animation object do not have a parameter named " + namesAnimation[i] + ".");
            }

            syncParameters(namesAnimation[i], namesThis[i]);
        }
    };

    return {
        "ImageSequenceAnimation": ImageSequenceAnimation,
        "ParameterAnimation": ParameterAnimation
    };
})();

var ImageSequenceAnimation = ImageSequenceAnimationLibrary.ImageSequenceAnimation;
var ParameterAnimation = ImageSequenceAnimationLibrary.ParameterAnimation;
