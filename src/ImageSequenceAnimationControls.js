/**
 * Links a parameter to an existing HTML slider element.
 *
 * On the HTML side, there must be two input elements: an <code><input type="range" /></code> as well as an <code><input type="number" /></code>.
 *
 * @param {object} settings Configures the slider via the following attributes:
 * <ul>
 *     <li><code>name</code>: Unique name of the input elements (name of the parameter). Must correspond to the filenames in the zip file.</li>
 *     <li><code>min</code>: First value of the slider (including).</li>
 *     <li><code>max</code>: Last value of the slider (excluding).</li>
 *     <li><code>step</code>: Step size of the slider.</li>
 *     <li><code>default</code>: Initial value of the slider (optional) Defaults to <code>min</code>.</li>
 * </ul>
 * @constructor
 */
function HTMLSlider(settings) {
    var parameter = new ParameterAnimation(settings.name, settings.min, settings.max, settings.step, settings.default);

    this.init = function(animation) {
        // Retrieve input elements
        var slider = document.querySelector("#" + animation.divID + " input[type='range'][name='" + settings.name + "']");
        var number = document.querySelector("#" + animation.divID + " input[type='number'][name='" + settings.name + "']");

        // Input handlers
        slider.addEventListener("input", function() {
            parameter.setCurrent(this.value);
        });
        number.addEventListener("input", function() {
            parameter.setCurrent(this.value);
        });

        // Set the size of the number element relative to the max possible stored number
        var maxVal = Math.abs(parameter.max) > Math.abs(parameter.min) ? Math.abs(parameter.max) : Math.abs(parameter.min);
        if (parameter.step !== 1) {
            maxVal *= 20;    // Higher width for floating numbers
        }

        function numDigitsInt(number) {
            return Math.ceil(Math.log10(number + 1))
        }

        var padding = 2;    // E.g. to make space for a sign
        number.style.width = (numDigitsInt(maxVal) + padding) + "em";

        // Set slider attributes
        slider.min = parameter.min;
        slider.max = parameter.max;
        slider.step = parameter.step;
        slider.value = parameter.defaultValue;

        // Set number attributes
        number.min = parameter.min;
        number.max = parameter.max;
        number.step = parameter.step;
        number.value = parameter.defaultValue;

        // Control elements are disabled until loading is finished
        slider.disabled = true;
        number.disabled = true;

        parameter.addOnChangeListener(function(value) {
            slider.value = value;
            number.value = value;
        });

        animation.addLoadingFinishedListener(function() {
            slider.disabled = false;
            number.disabled = false;
        });
    };

    this.getParameters = function() {
        return [parameter];
    };
}

/**
 * Links a parameter to an existing HTML checkbox.
 *
 * On the HTML side, there must be an <code><input type="checkbox" /></code> element.
 *
 * The checkbox uses the same parameter object as a slider, i.e. {@link ParameterAnimation}. A value of 0 corresponds unchecked and 1 to checked.
 *
 * @param {object} settings Configures the checkbox via the following attributes:
 * <ul>
 *     <li><code>name</code>: Unique name of the checkbox (name of the parameter). Must correspond to the filenames in the zip file.</li>
 * </ul>
 * @constructor
 */
function HTMLCheckbox(settings) {
    this.init = function(animation) {
        var checkbox = document.querySelector("#" + animation.divID + " input[type='checkbox'][name='" + settings.name + "']");
        this.parameter = new ParameterAnimation(settings.name, 0, 1, 1, checkbox.checked);

        var self = this;
        checkbox.addEventListener("change", function() {
            self.parameter.setCurrent(this.checked);
        });

        // Make sure the checkbox shows what is set in the parameter
        checkbox.checked = this.parameter.current;

        // Control elements are disabled until loading is finished
        checkbox.disabled = true;

        animation.addLoadingFinishedListener(function() {
            checkbox.disabled = false;
        });
        this.parameter.addOnChangeListener(function(value) {
            checkbox.checked = value;
        });
    };

    this.getParameters = function() {
        return [this.parameter]
    };
}

/**
 * Links a parameter to an existing HTML selection.
 *
 * On the HTML side, there must be <code><select><option value="0">Option 1</option>...</select></code> elements.
 *
 * The selection uses the same parameter object as a slider, i.e. {@link ParameterAnimation}. The different options must be set as index.
 *
 * @param {object} settings Configures the selection via the following attributes:
 * <ul>
 *     <li><code>name</code>: Unique name of the selection (name of the parameter). Must correspond to the filenames in the zip file.</li>
 * </ul>
 * @constructor
 */
function HTMLSelection(settings) {
    this.init = function(animation) {
        var selection = document.querySelector("#" + animation.divID + " select[name='" + settings.name + "']");

        var maxIdx = selection.options.length - 1;
        var defaultOption = 0;
        var defaultSet = false;

        for (var i = 0; i < selection.options.length; ++i) {
            // Check if the option has a valid index as value
            var optionValue = parseInt(selection.options[i].value);
            if (optionValue < 0 || optionValue > maxIdx) {
                throw new Error("The value " + optionValue + " for the option " + selection.options[i].label + " is not a valid index.");
            }

            // Find the default option
            if (selection.options[i].selected) {
                if (defaultSet) {
                    console.warn("The selection " + selection.name + " has at least two options with an default value. Only the first default value (" + defaultOption + ") is used.");
                }
                else {
                    defaultOption = i;
                    defaultSet = true;
                }
            }
        }

        // Store as class variable so that we can return it later (the construction depends on the HTML selection element)
        this.parameter = new ParameterAnimation(settings.name, 0, maxIdx, 1, defaultOption);

        var self = this;
        selection.addEventListener("change", function() {
            self.parameter.setCurrent(parseInt(this.value));
        });

        selection.value = this.parameter.defaultValue;

        // Control elements are disabled until loading is finished
        selection.disabled = true;

        animation.addLoadingFinishedListener(function() {
            selection.disabled = false;
        });
        this.parameter.addOnChangeListener(function(value) {
            selection.value = value;
        });
    };

    this.getParameters = function() {
        return [this.parameter]
    };
}

/**
 * Links two parameters (x and y) to the mouse position in a canvas element.
 *
 * The coordinate system of the parameters is x to the right and y to the top:
 *    y
 *    ^
 *    |
 *    |
 *    0---->x
 *
 * @param name Name of the two parameters:
 *  <ul>
 *     <li><code>xName</code>: Unique name of the parameter controlling the x-direction. Must correspond to the filenames in the zip file.</li>
 *     <li><code>yName</code>: Unique name of the parameter controlling the y-direction. Must correspond to the filenames in the zip file.</li>
 * </ul>
 * @param min First value of the two parameters (including):
 * <ul>
 *     <li><code>xMin</code>: First value of the x parameter.</li>
 *     <li><code>yMin</code>: First value of the y parameter.</li>
 * </ul>
 * @param max Last value of the two parameters (including):
 * <ul>
 *     <li><code>xMax</code>: Last value of the x parameter.</li>
 *     <li><code>yMax</code>: Last value of the y parameter.</li>
 * </ul>
 * @param step Step size of the two parameters:
 * <ul>
 *     <li><code>xStep</code>: Step size of the x range.</li>
 *     <li><code>yStep</code>: Step size of the y range.</li>
 * </ul>
 * @param defaultValue Initial value of the two parameters (optional). Defaults to 0.0:
 * <ul>
 *     <li><code>xDefault</code>: Initial value of the x range.</li>
 *     <li><code>yDefault</code>: Initial value of the y range.</li>
 * </ul>
 * @param margin Specifies a margin around the image which should be excluded from the mouse events. This is e.g. useful when there is a legend which should not react on mouse events:
 * <ul>
 *     <li><code>top</code>: Number of pixels to exclude at the start of the image.</li>
 *     <li><code>right</code>: Number of pixels to exclude on the right side of the image.</li>
 *     <li><code>bottom</code>: Number of pixels to exclude at the end of the image.</li>
 *     <li><code>left</code>: Number of pixels to exclude on the left side of the image.</li>
 * </ul>
 * @constructor
 */
function CanvasLocator(name, min, max, step, defaultValue, margin) {
    function getMousePos(canvas, evt) {
        // http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
        var rect = canvas.getBoundingClientRect();

        return {
            x: Math.floor((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
            y: Math.floor((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
        };
    }

    /**
     * The points from the canvas coordinate system need to be mapped to the specified coordinate system of the user.
     *
     * @param {type} canvas
     * @param {type} evt
     * @returns {undefined}
     */
    function setCoordinates(canvas, evt) {
        if (xEnabled === false || yEnabled === false) {
            return;
        }

        // Example values are based on the animation in http://blog.localhost/showcase/Barycentric_coordinates
        // Canvas coordinate system with a width = 651 and height = 594
        var pos = getMousePos(canvas, evt); // x = [0;650], y = [0;593]
        if (pos.x < margin.left || pos.x > canvas.width - margin.right - 1 ||
            pos.y < margin.top || pos.y > canvas.height - margin.bottom - 1)
        {
            return;
        }

        // The mouse coordinates are normalized to the parameter range
        var x = pos.x - margin.left;    // [0;562]
        var xNorm = (x / (canvas.width - marginWidth - 1)) * (xParameter.max - xParameter.min) + xParameter.min;    // [0;562] -> [0;1] -> [0;1.8] -> [-0.2;1.6]
        var y = (canvas.height - marginHeight - 1) - (pos.y - margin.top);    // [20;593] (remove top margin of 20) -> [0;573] -> [0;565] (remove bottom margin of 8) -> reverse coordinate system
        var yNorm = (y / (canvas.height - marginHeight - 1)) * (yParameter.max - yParameter.min) + yParameter.min;  // [0;565] -> [0;1] -> [0;1.8] -> [-0.5;1.3]

        xParameter.setCurrent(xNorm);
        yParameter.setCurrent(yNorm);
    }

    function addMouseListener(animation) {
        // Mouse press plus press and drag should change the coordinates
        var isMouseDown = false;
        animation.canvas.addEventListener("mousedown", function(evt){
            setCoordinates(this, evt);
            isMouseDown = true;
        });
        animation.canvas.addEventListener("mouseup", function(){
            isMouseDown = false;
        });
        animation.canvas.addEventListener("mousemove", function(evt){
            if (isMouseDown) {
                setCoordinates(this, evt);
            }
        });
    }

    var xParameter = new ParameterAnimation(name.xName, min.xMin, max.xMax, step.xStep, defaultValue.xDefault);
    var yParameter = new ParameterAnimation(name.yName, min.yMin, max.yMax, step.yStep, defaultValue.yDefault);

    var marginWidth = margin.left + margin.right;
    var marginHeight = margin.top + margin.bottom;

    var xEnabled = false;
    var yEnabled = false;

    this.init = function(animation) {
        animation.addLoadingFinishedListener(function() {
            xEnabled = true;
            yEnabled = true;

            // Add mouse listener first when everything is loaded
            addMouseListener(animation);
        });

        // There is no need to register listeners on the parameters (addOnChangeListener) since there is nothing to do on this side (there are no visible controls we need to change)
    };

    this.getParameters = function() {
        return [xParameter, yParameter];
    };
}
