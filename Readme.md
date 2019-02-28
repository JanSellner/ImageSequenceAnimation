# Image Sequence Animation
Simple JavaScript library to include interactive animations to a webpage based on precomputed images.

The general problem is described as follows: suppose you have created an animation with the programming language of your choice (e.g. Python and Jupyter notebooks). Suppose further that you want to make this animation available to your users (e.g. readers of a blog post). This is, however, not directly possible since you cannot always expect that your users can (or want) execute your code.

This library solves this problem by discretizing your animation and precomputing all outputs. For example, if your animation uses a single slider manipulating one parameter `a` to show a different plots, then you can define possible values and precompute all images. What this library now does is to create a slider, let the user choose a value and then show the appropriate image.

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
and we want to plot this function for `a = [1, 3, 5, 7, 9]`. The animation is implemented in a [Jupyter notebook](example.ipynb) where for each parameter value a figure is shown. To make this animation available on a webpage, follow the instructions below:

1. Export all figures as png files with an index-based filename:
    ```
    a=0.png  # value 1
    a=1.png  # value 3
    a=2.png  # value 5
    a=3.png  # value 7
    a=4.png  # value 9
    ```
2. (Optional) Reduce the file size of your png files (e.g. with the tool [PngOptimizer](https://psydk.org/pngoptimizer)).
3. Add all files to a zip archive.
4. Embed the animation into your webpage, e.g. with the following markup ([`example.html`](example.html)):
    ```html
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>Quadratic Function</title>
            <script src='ImageSequenceAnimation.bundle.min.js'></script>
        </head>
        <body>
            <div id="animation" data-zip_src="example.zip">
                <canvas width="497" height="375"></canvas><br />
                <label>a = <input type="number" name="a" /></label><input type="range" name="a" /><br />
            </div>
            <script>
                var animation = new ImageSequenceAnimation("animation");
                animation.addControl(new HTMLSlider({name: "a", min: 1, max: 9, step: 2}));
                animation.loadFromZip();
            </script>
        </body>
    </html>
    ```

That's it. You can now open the file [`example.html`](example.html) in your browser and play with the animation (make sure that the zip file as well as the library is stored beside the html file). Note how the possible values of `a` are specified via `min`, `max` and `step`.

## Documentation
### API
The API is documented in the un-minified [JavaScript](lib) files.

### Zip File
The zip file must contain every possible combination of parameter values as defined by the range (min, max, step). Each parameter value must be part of the filename as `name=index`. If you have more than one parameter, just append it, e.g. `x=00y=00.png`.

Note: the `data-zip_src` attribute can also directly contain a Base64 encoded zip file, e.g. `data-zip_src="data:application/zip;base64,UEsDBBQ...` so that it is easily possible to create a self-contained webpage.

## Control Elements
Currently, the following control elements are supported:
* HTML slider (`<input type="range" />`) together with a number box (`<input type="number" />`).
* HTML checkbox (`<input type="checkbox" />`).
* HTML selection (`<select><option value="0">Option 1</option>...</select>`).
* Canvas locator (mouse coordinates inside the `<canvas></canvas>` element).

## More Examples
I use this library on my [website](https://milania.de) and you can find a lot more examples there (e.g. in the [showcase](https://milania.de/showcase) section).

## Limitations
There are basically two limitations with the precomputed approach used by this library:
* You can only show values to the user which you have precomputed. This means e.g. that the user cannot enter arbitrary values for `a` in the above example. What is more, some control elements like a text input field is probably not very useful because there is no way that you can precompute every possible user input in an efficient way.
* As more images you precompute, as larger gets the zip file. This is only useful to some extent as you usually don't want you users to load huge files on every visit of your page. This can get especially problematic when you have many parameters as you need to precompute every possible parameter combination. Note: there is a `animation.loadFromZip();` method to load the data only upon request (user interaction) to mitigate this problem a bit.

Besides these limitations, the approach is still useful for many smaller animations. Very often it is sufficient to let the user choose from some predefined values for a parameter to make a point clear.

On the plus side, your users don't have to execute the animation code and there is also no need to connect to a third-party service to do the calculations for them.
