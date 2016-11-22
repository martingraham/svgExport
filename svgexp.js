/**
 * Created by cs22 on 04/12/14.
 */

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        
       var svgs = getAllSVGElements ();
        //console.log ("svgs", svgs);
        var svgDocs = svgs.map (function(svg) { return makeSVGDoc (svg); });
        //console.log ("docs", docs);
        saveSVGDocs (svgDocs);

        sendResponse({status: "finished"});
    }
);

function getAllSVGElements () {
    // search through all document objects, including those in iframes
    var allIFrames = [].slice.apply (document.getElementsByTagName('iframe'));
    var docs = [document];
    allIFrames.forEach (function (iframe) {
        try {
            docs.push (iframe.contentDocument || iframe.contentWindow.document);
        }
        catch (e) {
            console.log ("Protected cross-domain IFrame", iframe);
        }
    });

    var allSvgs = [];
    docs.forEach (function(doc) {
        var allDocSvgs = [].slice.apply (doc.getElementsByTagName('svg'));
        allSvgs.push.apply (allSvgs, allDocSvgs);
    });
    return allSvgs;
}


function makeSVGDoc (svgElem) {
    // clone node
    var cloneSVG = svgElem.cloneNode (true);
    var ownerDoc = cloneSVG.ownerDocument || document;

    // find all styles inherited/referenced at or below this node
    var styles = usedStyles (svgElem, true, true);

    // collect relevant info on parent chain of svg node
    var predecessorInfo = parentChain (svgElem, styles);

    // make a chain of dummy svg nodes to include classes / ids of parent chain of our original svg
    // this means any styles referenced within the svg that depend on the presence of these classes/ids are fired
    var transferAttr = ["width", "height", "xmlns"];
    var parentAdded = false;
    for (var p = 0; p < predecessorInfo.length; p++) {
        var pinf = predecessorInfo [p];
        var dummySVGElem = ownerDoc.createElement ("svg");
        var empty = true;
        Object.keys(pinf).forEach (function (key) {
            if (pinf[key]) {
                dummySVGElem.setAttribute (key, pinf[key]);
                empty = false;
            }
        });
        // If the dummy svg has no relevant id, classes or computed style then ignore it, otherwise make it the new root
        if (!empty) {
            dummySVGElem.appendChild (cloneSVG);
            transferAttr.forEach (function (attr) {
                dummySVGElem.setAttribute (attr, cloneSVG.getAttribute (attr));
                cloneSVG.removeAttribute (attr);
            });
            cloneSVG = dummySVGElem;
            parentAdded = true;
        }
    }
    
    // if no dummy parent added in previous section, but our svg isn't root then add one as placeholder
    if (svgElem.parentNode != null && !parentAdded) {
        var dummySVGElem = ownerDoc.createElement ("svg");
        dummySVGElem.appendChild (cloneSVG);
        transferAttr.forEach (function (attr) {
            dummySVGElem.setAttribute (attr, cloneSVG.getAttribute (attr));
            cloneSVG.removeAttribute (attr);
        });
        cloneSVG = dummySVGElem;
        parentAdded = true;
    }
    
    // Copy svg's computed style (it's style context) if a dummy parent node has been introduced
    if (parentAdded) {
        cloneSVG.setAttribute ("style", window.getComputedStyle(svgElem).cssText);
    }

    cloneSVG.setAttribute ("version", "1.1");
    cloneSVG.setAttribute ("xmlns", "http://www.w3.org/2000/svg");    // XMLSerializer does this
    cloneSVG.setAttribute ("xmlns:xlink", "http://www.w3.org/1999/xlink");  // when I used setAttributeNS it ballsed up


    var styleElem = ownerDoc.createElement ("style");
    styleElem.setAttribute ("type", "text/css");
    var styleText = ownerDoc.createTextNode (styles.join("\n"));
    styleElem.appendChild (styleText);
    cloneSVG.insertBefore (styleElem, cloneSVG.firstChild);

    return cloneSVG;
}

function parentChain (elem, styles) {
    // Capture id / classes of svg's parent chain.
    var ownerDoc = elem.ownerDocument || document;
    var elemArr = [];
    while (elem.parentNode !== ownerDoc && elem.parentNode !== null) {
        elem = elem.parentNode;
        elemArr.push ({id: elem.id, class: elem.className});
    }

    // see if id or element class are referenced in any styles collected below the svg node
    // if not, null the id / class as they're not going to be relevant
    elemArr.forEach (function (elemData) {
        var presences = {id: false, class: false};
        var classes = elemData.class.split(" ").filter(function(a) { return a.length > 0; });   // v1.13: may be multiple classes in a containing class attribute
        styles.forEach (function (style) {
            for (var c = 0; c < classes.length; c++) {
                if (style.indexOf ("."+classes[c]) >= 0) {
                    presences.class = true;
                    break;  // no need to keep looking through rest of classtypes if one is needed
                }
            }
            if (elemData.id && style.indexOf ("#"+elemData.id) >= 0) {
                presences.id = true;
            }
        });
        Object.keys(presences).forEach (function (presence) {
            if (!presences[presence]) { elemData[presence] = undefined; }
        });
    });

    return elemArr;
}

// code adapted from user adardesign's answer in http://stackoverflow.com/questions/13204785/is-it-possible-to-read-the-styles-of-css-classes-not-being-used-in-the-dom-using
function usedStyles (elem, subtree, both) {
    var needed = [], rule;
    var ownerDoc = elem.ownerDocument || document;
    var CSSSheets = ownerDoc.styleSheets;

    for(var j=0;j<CSSSheets.length;j++){
        if (CSSSheets[j].cssRules == null)
          continue;
        for(var i=0;i<CSSSheets[j].cssRules.length;i++){
            rule = CSSSheets[j].cssRules[i];
            var match = false;
            // Issue reported, css rule '[ng:cloak], [ng-cloak], [data-ng-cloak], [x-ng-cloak], .ng-cloak, .x-ng-cloak, .ng-hide:not(.ng-hide-animate)' gives error
            // It's the [ng:cloak] bit that does the damage
            // Fix found from https://github.com/exupero/saveSvgAsPng/issues/11 - but the css rule isn't applied
            try {
                if (subtree) {
                    match = elem.querySelectorAll(rule.selectorText).length > 0;
                }
                if (!subtree || both) {
                    match |= elem.matches(rule.selectorText);
                }
            }
            catch (err) {
                console.warn ("CSS selector error: "+rule.selectorText+". Often angular issue.", err);
            }
            if (match) { needed.push (rule.cssText); }
        }
    }

    return needed;
}


function saveSVGDocs (svgDocs) {
    var xmls = new XMLSerializer();
    svgDocs.forEach (function (doc, i) {
        var xmlStr = xmls.serializeToString(doc);
        // serializing adds an xmlns attribute to the style element ('cos it thinks we want xhtml), which knackers it for inkscape, here we chop it out
        xmlStr = xmlStr.split("xmlns=\"http://www.w3.org/1999/xhtml\"").join("");
        var blob = new Blob([xmlStr], {type: "image/svg+xml"});
        saveAs(blob, "saved"+i+".svg");
    });
}
