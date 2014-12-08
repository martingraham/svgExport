SVGExport is a chrome extension that trawls the current page's DOM for SVG elements and makes copies of them. This only copies inline styles so it then collates all the css rules that apply to that svg element and it's child nodes and stuffs them as a style element inside the SVG.
Finally it serializes each SVG element and uses Eli Grey's FileSaver (https://github.com/eligrey/FileSaver.js/) to save them all as SVG files into your download folder. For the most part, this produces usable output for Inkscape etc including clipping via defs in a svg. (If you set fills using rgba it won't work, use separate fill and fill-opacity css rules.)

Thanks to the user adardesign who's code i used from stackoverflow. The alternative was storing every declared css rule and this actually knackered the svg when it started including adblock css rules etc.

To use it copy the repository to a folder on your computer. Then go to chrome, open chrome://extensions, tick "Developer mode", then select "load unpacked extension..." and navigate to the folder you downloaded this code to and select that folder. It should then pop up. Go to whichever page you want to save the svg from (refresh the page if you've just installed the extension) and then when you're ready click the blue svg hexagon in the browser bar. SVG Files should then start downloading to your downloads folder.

Why? Basically to save screen output from D3 based visualisations and blow it up to poster size. Saving the things as screenshots just makes them horribly pixelated.

Martin Graham, Dec 2014
