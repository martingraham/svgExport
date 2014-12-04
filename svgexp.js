/**
 * Created by cs22 on 04/12/14.
 */

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        var svgs = [].slice.apply(document.getElementsByTagName('svg'));
        console.log ("svgs", svgs);
        var ss = grabStyles();
        console.log ("styles", ss);
        var docs = svgs.map (function(svg) { return makeSVGDoc (svg, ss); });
        console.log ("docs", docs);
        saveSVGDocs (docs);

        sendResponse({status: "finished"});
    }


);

function grabStyles () {
    var styles = [];
    var ss = document.styleSheets;
    for (var i = 0; i < ss.length; i++) {
        var sheet = ss[i];
        var rules = sheet.cssRules || sheet.rules;
        for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            styles.push (rule.cssText);
        }
    }

    return styles.join("\n");
}

function makeSVGDoc (svgElem, styles) {
    var cloneSVG = svgElem.cloneNode (true);
    cloneSVG.setAttribute ("version", "1.1");
    //cloneSVG.setAttribute ("xmlns", "http://www.w3.org/2000/svg");    // XMLSerializer does this
    cloneSVG.setAttribute ("xmlns:xlink", "http://www.w3.org/1999/xlink");  // when I used setAttributeNS it ballsed up

    var styleElem = document.createElement ("style");
    styleElem.setAttribute ("type", "text/css");
    var styleText = document.createTextNode (styles);
    styleElem.appendChild (styleText);
    cloneSVG.insertBefore (styleElem, cloneSVG.firstChild);

    return cloneSVG;
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