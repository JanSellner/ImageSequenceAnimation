/**
 *
 * @param {object} params defining the slider parameter: name, min, max, step, default, e.g. <code>slideAnimation.sliderNumber({name: "s", min: 0, max: 1, step: 0.0333, default: 0.4995});</code>
 * @constructor
 */
function HTMLSlider(params) {
    var parameter = new ParameterAnimation(params.name, params.min, params.max, params.step, params.default);

    this.init = function(animation) {
        // Retrieve input elements
        var slider = document.querySelector("#" + animation.divID + " input[type='range'][name='" + params.name + "']");
        var number = document.querySelector("#" + animation.divID + " input[type='number'][name='" + params.name + "']");

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

function HTMLCheckbox(params) {
    var parameter = new ParameterAnimation(params.name, 0, 1, 1, params.default);

    this.init = function(animation) {
        var checkbox = document.querySelector("#" + animation.divID + " input[type='checkbox'][name='" + params.name + "']");
        if (params.default === undefined) {
            // When the user does not specify a default value, use the current checkbox value
            parameter.setDefault(checkbox.checked);
        }

        checkbox.addEventListener("change", function() {
            parameter.setCurrent(this.checked);
        });

        // Make sure the checkbox shows what is set in the parameter
        checkbox.checked = parameter.current;

        // Control elements are disabled until loading is finished
        checkbox.disabled = true;

        animation.addLoadingFinishedListener(function() {
            checkbox.disabled = false;
        });
        parameter.addOnChangeListener(function(value) {
            checkbox.checked = value;
        });
    };

    this.getParameters = function() {
        return [parameter]
    };
}

function HTMLSelection(params) {
    var parameter = new ParameterAnimation(params.name, 0, params.size - 1, 1, params.default);

    this.init = function(animation) {
        var selection = document.querySelector("#" + animation.divID + " select[name='" + params.name + "']");

        selection.addEventListener("change", function() {
            parameter.setCurrent(this.value);
        });

        selection.value = parameter.defaultValue;

        // Control elements are disabled until loading is finished
        selection.disabled = true;

        animation.addLoadingFinishedListener(function() {
            selection.disabled = false;
        });
        parameter.addOnChangeListener(function(value) {
            selection.value = value;
        });
    };

    this.getParameters = function() {
        return [parameter]
    };
}

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
     * The points from the canvas coordinate system need to be mappet to the specified coordinate system of the user.
     *
     * @param {type} canvas
     * @param {type} evt
     * @returns {undefined}
     */
    function setCoordinates(canvas, evt) {
        if (xEnabled === false || yEnabled === false) {
            return;
        }

        var pos = getMousePos(canvas, evt);
        //console.log(pos.x + " " + pos.y);
        if (pos.x < margin.left || pos.x > canvas.width - margin.right ||
            pos.y < margin.top || pos.y > canvas.height - margin.bottom)
        {
            return;
        }

        // TODO canvas coordinate system [1:435] or [0;434]?
        var x = pos.x - margin.left;    // [1;435]
        var xNorm = (x / (canvas.width - marginWidth)) * (xParameter.max - xParameter.min) + xParameter.min;    // [1;435] -> [0;1+x] -> [0;1.8+x] -> [-0.2;1.6+x] (+x are the values of the margin)
        var y = (canvas.height - marginHeight) - (pos.y - margin.top);    // [1;374] -> [1;354] (remove top margin) -> reverse coordinate system
        var yNorm = (y / (canvas.height - marginHeight)) * (yParameter.max - yParameter.min) + yParameter.min;  // [0;1+y] -> [0;1.8+y] -> [-0.5;1.3+y] (+y is the value of the margin)

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
