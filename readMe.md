SVGExport trawls the current page's DOM for SVG elements and makes copies of them. This only copies inline styles so it then collates all the css rules it can find in the document's
associated stylesheets and adds the whole lot as a first child style element to each copied SVG element. Finally it serializes each SVG element and uses Eli Grey's FileSaver (https://github.com/eligrey/FileSaver.js/) to
save them all as SVG files into your download folder. For the most part, this produces usable output for Inkscape etc, though some stuff fails, gradients look like they do, but clipping via defs in a svg carry over.

Copying all the styles it can find on a page makes each SVG's style element pretty heavy, and adds a lot of styles each SVG might not need, but it was the quickest way to do it.

Why? Basically to save screen output from D3 based visualisations and blow it up to poster size. Saving the things as screenshots just makes them horribly pixelated.

Martin Graham, Dec 2014