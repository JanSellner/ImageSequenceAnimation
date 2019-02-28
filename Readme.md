# Image Sequence Animation
Simple JavaScript library to include interactive animations to a webpage based on precomputed images.

The problem this library tries to solve can be described as follows: suppose you have created an animation with the programming language of your choice (e.g. Python and Jupyter notebooks). Suppose further that you want to make this animation available to your users (e.g. readers of your blog post). This is, however, not directly possible since you cannot always expect that your users can (or want) execute your code and rewriting everything in JavaScript is not always practicable.

This library tackles this problem by discretizing your animation and precomputing all outputs. For example, if your animation uses a single slider manipulating one parameter `a` to show different plots, then you can define possible values and precompute all images. What this library now does is to create a slider on the webpage, let the user choose a value and then show the appropriate image.

## Installation
Simply download the file [`ImageSequenceAnimation.bundle.min.js`](dist/ImageSequenceAnimation.bundle.min.js) and include it in your webpage:
```html
<script src='ImageSequenceAnimation.bundle.min.js'></script>
```
This file ships already with all necessary dependencies (basically [JSZip](https://stuk.github.io/jszip/)).

## Example
Let's say that the parameter `a` belongs to the quadratic function
```
f(x) = a * x^2
```
and we want to plot this function for `a = [1, 3, 5, 7, 9]`. The animation is implemented in a [Jupyter notebook](example/example.ipynb) where for each parameter value a figure is shown. To make this animation available on a webpage, follow the instructions below:

1. Export all figures as png files with an index-based filename:
    ```
    a=0.png  # value 1
    a=1.png  # value 3
    a=2.png  # value 5
    a=3.png  # value 7
    a=4.png  # value 9
    ```
2. (Optional) Reduce the file size of your png files (e.g. with [PngOptimizer](https://psydk.org/pngoptimizer)).
3. Add all files to a zip archive.
4. Embed the animation in your webpage:
    ```html
    <div id="animation" data-zip_src="example.zip">
        <canvas></canvas><br />
        <label>a = <input type="number" name="a" /></label><input type="range" name="a" /><br />
    </div>
    <script>
        var divID = "animation";
        var animation = new ImageSequenceAnimation(divID);
        // The name must match with the name of the control elements specified in the div above
        animation.addControl(new HTMLSlider({name: "a", min: 1, max: 9, step: 2}));
        animation.loadFromZip();
    </script>
    ```

    Basically, you need to specify the link to the zip file via the `data-zip_src` attribute, define a canvas, set up the control elements and add a small script to link the pieces together and load the animation. Note how the possible values of `a` are specified via `min`, `max` and `step`.

That's it. The complete example can be found in [`example.html`](example/example.html) and works out of the box.

## Documentation
### API
The API is documented in the un-minified [JavaScript](src) files.

### Zip File
The zip file must contain every possible combination of parameter values as defined by the range (min, max, step). Each parameter value must be part of the filename as `name=index`. If you have more than one parameter, just append the names, e.g. `x=00y=00.png`.

Note: the `data-zip_src` attribute can also directly contain a Base64 encoded zip file, e.g. `data-zip_src="data:application/zip;base64,UEsDBBQ...` so that it is easily possible to create a self-contained webpage.

## Control Elements
Currently, the following control elements are supported:
* HTML slider (`<input type="range" />`) together with a number box (`<input type="number" />`). This was used in the [example above](#example).
* HTML checkbox (`<input type="checkbox" />`). [Example](https://milania.de/showcase/Maximaler_Konsum_im_Solow-Modell).
* HTML selection (`<select><option value="0">Option 1</option>...</select>`). [Example](https://milania.de/showcase/Hyperparameters_of_an_SVM_with_an_RBF_kernel).
* Canvas locator (mouse coordinates inside the `<canvas></canvas>` element). [Example](https://milania.de/showcase/Barycentric_coordinates).

## Limitations
There are basically two limitations with the precomputed approach used by this library:
* You can only show values to the user which you have precomputed. This means e.g. that the user cannot enter arbitrary values for `a` in the above example. What is more, some control elements like a text input field is probably not very useful because there is no way that you can precompute every possible user input in an efficient way.
* As more images you precompute, as larger gets the zip file. This is only useful to some extent as you usually don't want that your users have to load huge files on every visit of your page. This can get especially problematic when you have many parameters as you need to precompute every possible parameter combination. Note: there is an `animation.loadFromZipLazy();` method to load the data only upon request (user interaction) to mitigate this problem a bit.

Besides these limitations, the approach is still useful for many smaller animations. Very often it is sufficient to let the user select parameters from a range of predefined values to make a point clear.

On the plus side, your users don't have to execute the animation code and there is also no need to connect to a third-party service to do the calculations for them.
