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
    var cloneSVG = svgElem.cloneNode (true);
    cloneSVG.setAttribute ("version", "1.1");
    //cloneSVG.setAttribute ("xmlns", "http://www.w3.org/2000/svg");    // XMLSerializer does this
    cloneSVG.setAttribute ("xmlns:xlink", "http://www.w3.org/1999/xlink");  // when I used setAttributeNS it ballsed up

    var styles = usedStylesInSubDOM (svgElem);

    var styleElem = document.createElement ("style");
    styleElem.setAttribute ("type", "text/css");
    var styleText = document.createTextNode (styles.join("\n"));
    styleElem.appendChild (styleText);
    cloneSVG.insertBefore (styleElem, cloneSVG.firstChild);

    return cloneSVG;
}

// code adapted from user adardesign's answer in http://stackoverflow.com/questions/13204785/is-it-possible-to-read-the-styles-of-css-classes-not-being-used-in-the-dom-using
function usedStylesInSubDOM (elem) {
    var needed = [], currentRule;
    var CSSSheets = document.styleSheets;

    for(j=0;j<CSSSheets.length;j++){
        for(i=0;i<CSSSheets[j].cssRules.length;i++){
            currentRule = CSSSheets[j].cssRules[i].selectorText;

            if(elem.querySelectorAll(currentRule).length > 0){
                needed.push (CSSSheets[j].cssRules[i].cssText);
            }
        }
    }

    //console.log ("elem", elem, needed);
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