/**
 * Created by cs22 on 04/12/14.
 */

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        var svgs = [].slice.apply(document.getElementsByTagName('svg'));
        //console.log ("svgs", svgs);
        var docs = svgs.map (function(svg) { return makeSVGDoc (svg); });
        //console.log ("docs", docs);
        saveSVGDocs (docs);

        sendResponse({status: "finished"});
    }
);


function makeSVGDoc (svgElem) {
    // clone node
    var cloneSVG = svgElem.cloneNode (true);

    // find all styles inherited/referenced at or below this node
    var styles = usedStyles (svgElem, true);

    // collect relevant info on parent chain of svg node
    var predecessorInfo = parentChain (svgElem, styles);

    // make a chain of dummy svg nodes to include classes / ids of parent chain of our original svg
    // this mimics any styles that are set outside of the original svg
    // also immediate parent's computed style is captured and set on the dummy svg immediately above the original svg
    var transferAttr = ["width", "height", "xmlns"];
    for (var p = 0; p < predecessorInfo.length; p++) {
        var pinf = predecessorInfo [p];
        var dummySVGElem = document.createElement ("svg");
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
        }
    }

    cloneSVG.setAttribute ("version", "1.1");
    cloneSVG.setAttribute ("xmlns", "http://www.w3.org/2000/svg");    // XMLSerializer does this
    cloneSVG.setAttribute ("xmlns:xlink", "http://www.w3.org/1999/xlink");  // when I used setAttributeNS it ballsed up


    var styleElem = document.createElement ("style");
    styleElem.setAttribute ("type", "text/css");
    var styleText = document.createTextNode (styles.join("\n"));
    styleElem.appendChild (styleText);
    cloneSVG.insertBefore (styleElem, cloneSVG.firstChild);

    return cloneSVG;
}

function parentChain (elem, styles) {
    // Capture id / classes of svg's parent chain.
    // Plus computed style of immediate parent.
    var elemArr = [];
    var first = true;
    while (elem.parentNode !== document) {
        elem = elem.parentNode;
        elemArr.push ({id: elem.id, class: elem.className, style: first ? window.getComputedStyle(elem).cssText : undefined});
        first = false;
    }

    // see if id or element class are referenced in any styles collected below the svg node
    // if not, null the id / class as they're not going to be relevant
    elemArr.forEach (function (elemData) {
        var presences = {id: false, class: false};
        styles.forEach (function (style) {
            if (style.indexOf ("."+elemData.class) >= 0) {
                presences.class = true;
            }
            if (style.indexOf ("#"+elemData.id) >= 0) {
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
function usedStyles (elem, subtree) {
    var needed = [], rule;
    var CSSSheets = document.styleSheets;

    for(j=0;j<CSSSheets.length;j++){
        for(i=0;i<CSSSheets[j].cssRules.length;i++){
            rule = CSSSheets[j].cssRules[i];
            if( subtree ? elem.querySelectorAll(rule.selectorText).length > 0 : elem.matches(rule.selectorText)) {
                needed.push (rule.cssText);
            }
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