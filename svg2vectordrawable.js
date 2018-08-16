// The MIT License (MIT)
// Copyright (c) 2018 Ashung Hung Ashung Hung (ashung.hung@gmail.com)

// https://github.com/hgourvest/node-xml-lite
var xml = require('node-xml-lite');
var fs = require('fs');
var path = require('path');
const shapeConverter = require('./shape_converter');

// svg2vectorDrawableContent(svgContent: String, density: String|Number) -> vectorDrawableContent
// svgContent: '<svg>...</svg>'
// density: ldpi|mdpi|hdpi|xhdpi|xxhdpi|xxxhdpi|nodpi|[number]

function svg2vectorDrawableContent(svgContent, density) {

    var svg = xml.parseString(svgContent);
    var style = getStyle(svg.childs);

    // Get width & height
    var width = 24;
    var height = 24;
    var viewportWidth = 24;
    var viewportHeight = 24;

    if(hasArrtib(svg.attrib, 'width')) {
        width = parseInt(svg.attrib.width);
    } else if(hasArrtib(svg.attrib, 'viewBox')) {
        width = svg.attrib.viewBox.split(' ')[2];
    }

    if(hasArrtib(svg.attrib, 'height')) {
        height = parseInt(svg.attrib.height);
    } else if(hasArrtib(svg.attrib, 'viewBox')) {
        height = svg.attrib.viewBox.split(' ')[3];
    }

    if(hasArrtib(svg.attrib, 'viewBox')) {
        viewportWidth = svg.attrib.viewBox.split(' ')[2];
        viewportHeight = svg.attrib.viewBox.split(' ')[3];
    } else {
        if(hasArrtib(svg.attrib, 'width')) {
            viewportWidth = parseInt(svg.attrib.width);
        }
        if(hasArrtib(svg.attrib, 'height')) {
            viewportHeight = parseInt(svg.attrib.height);
        }
    }

    if(density === undefined) {
        density = 'nodpi';
    }

    width = Math.ceil(width/densityToRatio(density));
    height = Math.ceil(height/densityToRatio(density));

    // XML code
    var vectorDrawableXML =
'\
<?xml version="1.0" encoding="utf-8"?>\n\
<vector xmlns:android="http://schemas.android.com/apk/res/android"\n\
    android:width="' + width + 'dp"\n\
    android:height="' + height + 'dp"\n\
    android:viewportWidth="' + viewportWidth + '"\n\
    android:viewportHeight="' + viewportHeight + '">\n\
';

    function travel(obj, indent, groupAttrs) {

        indent ++;

        try{
            for(var i = 0; i < obj.length; i ++) {

                // g -> group
                if(obj[i].name === 'g' || obj[i].name === 'defs') {

                    // Attributes in group
                    groupAttrs = {};

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'fill', style)) {
                            groupAttrs.fill = getValueFromStyle('.' + obj[i].attrib.class, 'fill', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'opacity', style)) {
                            groupAttrs.opacity = getValueFromStyle('.' + obj[i].attrib.class, 'opacity', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'fill-opacity', style)) {
                            groupAttrs.fillAlpha = getValueFromStyle('.' + obj[i].attrib.class, 'fill-opacity', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke', style)) {
                            groupAttrs.stroke = getValueFromStyle('.' + obj[i].attrib.class, 'stroke', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-opacity', style)) {
                            groupAttrs.strokeAlpha = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-opacity', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-width', style)) {
                            groupAttrs.strokeWidth = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-width', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linejoin', style)) {
                            groupAttrs.strokeLineJoin = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linejoin', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-miterlimit', style)) {
                            groupAttrs.strokeMiterLimit = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-miterlimit', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linecap', style)) {
                            groupAttrs.strokeLineCap = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linecap', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'fill-rule', style)) {
                            groupAttrs.fillType = getValueFromStyle('.' + obj[i].attrib.class, 'fill-rule', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('fill', getStyleInline(obj[i].attrib))) {
                            groupAttrs.fill = getValueFromStyleInline('fill', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('opacity', getStyleInline(obj[i].attrib))) {
                            groupAttrs.opacity = getValueFromStyleInline('opacity', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('fill-opacity', getStyleInline(obj[i].attrib))) {
                            groupAttrs.fillAlpha = getValueFromStyleInline('fill-opacity', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('stroke', getStyleInline(obj[i].attrib))) {
                            groupAttrs.stroke = getValueFromStyleInline('stroke', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('stroke-opacity', getStyleInline(obj[i].attrib))) {
                            groupAttrs.strokeAlpha = getValueFromStyleInline('stroke-opacity', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('stroke-width', getStyleInline(obj[i].attrib))) {
                            groupAttrs.strokeWidth = getValueFromStyleInline('stroke-width', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('stroke-linejoin', getStyleInline(obj[i].attrib))) {
                            groupAttrs.strokeLineJoin = getValueFromStyleInline('stroke-linejoin', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('stroke-miterlimit', getStyleInline(obj[i].attrib))) {
                            groupAttrs.strokeMiterLimit = getValueFromStyleInline('stroke-miterlimit', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('stroke-linecap', getStyleInline(obj[i].attrib))) {
                            groupAttrs.strokeLineCap = getValueFromStyleInline('stroke-linecap', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('fill-rule', getStyleInline(obj[i].attrib))) {
                            groupAttrs.fillType = getValueFromStyleInline('fill-rule', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'fill')) {
                        groupAttrs.fill = obj[i].attrib['fill'];
                    }
                    if(hasArrtib(obj[i].attrib, 'opacity')) {
                        groupAttrs.opacity = obj[i].attrib['opacity'];
                    }
                    if(hasArrtib(obj[i].attrib, 'fill-opacity')) {
                        groupAttrs.fillAlpha = obj[i].attrib['fill-opacity'];
                    }
                    if(hasArrtib(obj[i].attrib, 'stroke')) {
                        groupAttrs.stroke = obj[i].attrib['stroke'];
                    }
                    if(hasArrtib(obj[i].attrib, 'stroke-opacity')) {
                        groupAttrs.strokeAlpha = obj[i].attrib['stroke-opacity'];
                    }
                    if(hasArrtib(obj[i].attrib, 'stroke-width')) {
                        groupAttrs.strokeWidth = obj[i].attrib['stroke-width'];
                    }
                    if(hasArrtib(obj[i].attrib, 'stroke-linejoin')) {
                        groupAttrs.strokeLineJoin = obj[i].attrib['stroke-linejoin'];
                    }
                    if(hasArrtib(obj[i].attrib, 'stroke-miterlimit')) {
                        groupAttrs.strokeMiterLimit = obj[i].attrib['stroke-miterlimit'];
                    }
                    if(hasArrtib(obj[i].attrib, 'stroke-linecap')) {
                        groupAttrs.strokeLineCap = obj[i].attrib['stroke-linecap'];
                    }
                    if(hasArrtib(obj[i].attrib, 'fill-rule')) {
                        groupAttrs.fillType = obj[i].attrib['fill-rule'];
                    }

                    // Hack to not output empty groups
                    if(obj[i].childs[0] !== '\n') {
                      vectorDrawableXML += repeatString(' ', indent) + '<group>\n';
                      travel(obj[i].childs, indent, groupAttrs);
                      vectorDrawableXML += repeatString(' ', indent) + '</group>\n';
                    }

                } else if(/(path|rect|circle|polygon|polyline|line|ellipse)/i.test(obj[i].name)) {

                    vectorDrawableXML += repeatString(' ', indent) + '<path\n';

                    // fill, opacity -> android:fillColor
                    var fill = groupAttrs.fill || '';
                    var opacity = groupAttrs.opacity || 1;
                    var fillColor = '';
                    var opacityHex = 'FF';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'fill', style)) {
                            fill = getValueFromStyle('.' + obj[i].attrib.class, 'fill', style);
                        }
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'opacity', style)) {
                            opacity = getValueFromStyle('.' + obj[i].attrib.class, 'opacity', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('fill', getStyleInline(obj[i].attrib))) {
                            fill = getValueFromStyleInline('fill', getStyleInline(obj[i].attrib));
                        }
                        if(getValueFromStyleInline('opacity', getStyleInline(obj[i].attrib))) {
                            opacity = getValueFromStyleInline('opacity', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'fill')) {
                        fill = obj[i].attrib['fill'];
                    }
                    if(hasArrtib(obj[i].attrib, 'opacity')) {
                        opacity = obj[i].attrib['opacity'];
                    }

                    if(opacity !== '' && Number(opacity) !== 1) {
                        opacityHex = precentToHex(opacity * 100);
                        // #AARRGGBB
                        fillColor = '#' + opacityHex + formatColor(fill).replace('#', '');
                    } else if (fill.toLowerCase() === "none") {
                        fillColor = '';
                    } else {
                        // #RRGGBB
                        fillColor = formatColor(fill);
                    }

                    if (fillColor !== '') {
                        vectorDrawableXML += repeatString(' ', indent) + '    android:fillColor="' + fillColor + '"\n';
                    }

                    // fill-opacity -> android:fillAlpha
                    var fillAlpha = groupAttrs.fillAlpha || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'fill-opacity', style)) {
                            fillAlpha = getValueFromStyle('.' + obj[i].attrib.class, 'fill-opacity', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('fill-opacity', getStyleInline(obj[i].attrib))) {
                            fillAlpha = getValueFromStyleInline('fill-opacity', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'fill-opacity')) {
                        fillAlpha = obj[i].attrib['fill-opacity'];
                    }

                    if(fillAlpha !== '' && Number(fillAlpha) !== 1) {
                        vectorDrawableXML += repeatString(' ', indent) + '    android:fillAlpha="' + fillAlpha + '"\n';
                    }

                    // stroke -> android:strokeColor
                    var stroke = groupAttrs.stroke || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke', style)) {
                            stroke = getValueFromStyle('.' + obj[i].attrib.class, 'stroke', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('stroke', getStyleInline(obj[i].attrib))) {
                            stroke = getValueFromStyleInline('stroke', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'stroke')) {
                        stroke = obj[i].attrib['stroke'];
                    }

                    if(stroke !== '' && stroke !== 'none') {
                        stroke = formatColor(stroke);
                        vectorDrawableXML += repeatString(' ', indent) + '    android:strokeColor="' + stroke + '"\n';
                    }

                    // stroke-opacity -> android:strokeAlpha
                    var strokeAlpha = groupAttrs.strokeAlpha || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-opacity', style)) {
                            strokeAlpha = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-opacity', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('stroke-opacity', getStyleInline(obj[i].attrib))) {
                            strokeAlpha = getValueFromStyleInline('stroke-opacity', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'stroke-opacity')) {
                        strokeAlpha = obj[i].attrib['stroke-opacity'];
                    }

                    if(strokeAlpha !== '' && (stroke !== '' && stroke !== 'none')) {
                        vectorDrawableXML += repeatString(' ', indent) + '    android:strokeAlpha="' + strokeAlpha + '"\n';
                    }

                    // stroke-width -> android:strokeWidth
                    var strokeWidth = groupAttrs.strokeWidth || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-width', style)) {
                            strokeWidth = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-width', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('stroke-width', getStyleInline(obj[i].attrib))) {
                            strokeWidth = getValueFromStyleInline('stroke-width', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'stroke-width')) {
                        strokeWidth = obj[i].attrib['stroke-width'];
                    }

                    if(stroke !== '' && stroke !== 'none') {
                        if (strokeWidth === '') {
                            vectorDrawableXML += repeatString(' ', indent) + '    android:strokeWidth="1"\n';
                        } else {
                            vectorDrawableXML += repeatString(' ', indent) + '    android:strokeWidth="' + strokeWidth + '"\n';
                        }
                    }

                    // stroke-linejoin -> android:strokeLineJoin
                    var strokeLineJoin = groupAttrs.strokeLineJoin || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linejoin', style)) {
                            strokeLineJoin = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linejoin', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('stroke-linejoin', getStyleInline(obj[i].attrib))) {
                            strokeLineJoin = getValueFromStyleInline('stroke-linejoin', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'stroke-linejoin')) {
                        strokeLineJoin = obj[i].attrib['stroke-linejoin'];
                    }

                    if(strokeLineJoin !== '' && (stroke !== '' && stroke !== 'none')) {
                        vectorDrawableXML += repeatString(' ', indent) + '    android:strokeLineJoin="' + strokeLineJoin + '"\n';
                    }

                    // stroke-miterlimit -> android:strokeMiterLimit
                    var strokeMiterLimit = groupAttrs.strokeMiterLimit || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-miterlimit', style)) {
                            strokeMiterLimit = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-miterlimit', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('stroke-miterlimit', getStyleInline(obj[i].attrib))) {
                            strokeMiterLimit = getValueFromStyleInline('stroke-miterlimit', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'stroke-miterlimit')) {
                        strokeMiterLimit = obj[i].attrib['stroke-miterlimit'];
                    }

                    if(strokeMiterLimit !== '' && (stroke !== '' && stroke !== 'none')) {
                        vectorDrawableXML += repeatString(' ', indent) + '    android:strokeMiterLimit="' + strokeMiterLimit + '"\n';
                    }

                    // stroke-linecap -> android:strokeLineCap
                    var strokeLineCap = groupAttrs.strokeLineCap || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linecap', style)) {
                            strokeLineCap = getValueFromStyle('.' + obj[i].attrib.class, 'stroke-linecap', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('stroke-linecap', getStyleInline(obj[i].attrib))) {
                            strokeLineCap = getValueFromStyleInline('stroke-linecap', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'stroke-linecap')) {
                        strokeLineCap = obj[i].attrib['stroke-linecap'];
                    }

                    if(strokeLineCap !== '' && (stroke !== '' && stroke !== 'none')) {
                        vectorDrawableXML += repeatString(' ', indent) + '    android:strokeLineCap="' + strokeLineCap + '"\n';
                    }

                    // fill-rule -> android:fillType
                    var fillType = groupAttrs.fillType || '';

                    if(style && hasArrtib(obj[i].attrib, 'class')) {
                        if(getValueFromStyle('.' + obj[i].attrib.class, 'fill-rule', style)) {
                            fillType = getValueFromStyle('.' + obj[i].attrib.class, 'fill-rule', style);
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'style')) {
                        if(getValueFromStyleInline('fill-rule', getStyleInline(obj[i].attrib))) {
                            fillType = getValueFromStyleInline('fill-rule', getStyleInline(obj[i].attrib));
                        }
                    }

                    if(hasArrtib(obj[i].attrib, 'fill-rule')) {
                        fillType = obj[i].attrib['fill-rule'];
                    }

                    if(fillType === 'evenodd') {
                        vectorDrawableXML += repeatString(' ', indent) + '    android:fillType="evenOdd"\n';
                    }

                    // d -> android:pathData
                    var d = '';

                    if(obj[i].attrib.points) {
                      obj[i].attrib.points = obj[i].attrib.points.replace(/[^0-9., ]/g, '')
                    }
                    if(/(rect)/i.test(obj[i].name)) {
                        d = shapeConverter.convertRect(obj[i].attrib);
                    } else if(/(circle)/i.test(obj[i].name)) {
                        d = shapeConverter.convertCircle(obj[i].attrib);
                    } else if (/(polygon)/i.test(obj[i].name)) {
                        d = shapeConverter.convertPolygon(obj[i].attrib, false)
                    } else if (/(polyline)/i.test(obj[i].name)) {
                        d = shapeConverter.convertPolygon(obj[i].attrib, true)
                    } else if(/(line)/i.test(obj[i].name)) {
                      d = shapeConverter.convertLine(obj[i].attrib);
                    } else if(/(ellipse)/i.test(obj[i].name)) {
                      d = shapeConverter.convertEllipse(obj[i].attrib);
                    } else {
                      d = obj[i].attrib.d.trim();
                    }

                    vectorDrawableXML += repeatString(' ', indent) + '    android:pathData="' + d + '"/>\n';
                }
            }
        } catch(e) {}
    }

    travel(svg.childs, 0, {});

    vectorDrawableXML += '</vector>';

    return vectorDrawableXML;

}

// svg2vectorDrawableFile(svgFile: String, vectorDrawableFile: String, density: String|Number)
// svgFile: 'dir/svg.svg'
// vectorDrawableFile: 'dir/vectordrawable.xml'
// density: ldpi|mdpi|hdpi|xhdpi|xxhdpi|xxxhdpi|nodpi|[number]

function svg2vectorDrawableFile(svgFile, vectorDrawableFile, density) {
    var svgContent = getFileContent(svgFile);
    var vectorDrawableContent = svg2vectorDrawableContent(svgContent, density);
    createFile(vectorDrawableFile, vectorDrawableContent, false);
}

function getFileContent(filePath, runScript) {
    var r = fs.readFileSync(filePath).toString();
        r = r.replace(/<!--[\s\S]*?-->/g, '');
    if(runScript != undefined) {
        eval('r = r.' + runScript + ';');
    }
    return r;
}

// createFile(filePath: String, fileContent: String, debugMode: Blooen)
// filePath: 'a/b/c/d/vectordrawable.xml'
// fileContent: '<vector>...</vector>'
// debugMode: true|false

function createFile(filePath, fileContent, debugMode) {
    if(debugMode == undefined || debugMode == false) {
        mkdir(path.dirname(filePath));
        fs.writeFileSync(filePath, fileContent);
    } else {
        console.log('``` xml');
        console.log(fileContent);
        console.log('```');
        console.log('──────────────────────────────────────────────────────────');
    }
}

function mkdir(localPath) {
    var dirs = localPath.split('/');
    var currentDir = '';
    for(var i = 0; i < dirs.length; i ++) {
        currentDir += dirs[i] + '/';
        if(!fs.existsSync(currentDir)) {
            fs.mkdirSync(path.resolve(currentDir));
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Android
///////////////////////////////////////////////////////////////////////////////

function densityToRatio(densityStringOrDPI) {
    var standardDPI = 160;
    var r = 1;
    if(isNaN(parseInt(densityStringOrDPI))) {
        switch(densityStringOrDPI) {
            case 'ldpi':
                r = 120/standardDPI;
                break;
            case 'mdpi':
                r = 160/standardDPI;
                break;
            case 'hdpi':
                r = 240/standardDPI;
                break;
            case 'xhdpi':
                r = 320/standardDPI;
                break;
            case 'xxhdpi':
                r = 480/standardDPI;
                break;
            case 'xxxhdpi':
                r = 640/standardDPI;
                break;
            case 'nodpi':
                r = 1;
                break;
            default :
                r = 1;
        }
        return r;
    } else {
        r = parseInt(densityStringOrDPI)/standardDPI;
        return r;
    }
}

// #RRGGBB, #RGB, rgb(r,g,b), rgb(r%,g%,b%), keyword
function formatColor(hexColor) {
    if(/#[0-9A-Fa-f]{6}/.test(hexColor)) {
        return hexColor.toUpperCase();
    }
    if(/#[0-9A-Fa-f]{3}/.test(hexColor)) {
        hexColor = '#' + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2] + hexColor[3] + hexColor[3];
        return hexColor.toUpperCase();
    }
    if(/rgb\(\d+\,\d+\,\d+\)/i.test(hexColor.replace(/\s*/g, ''))) {
        var rgb = hexColor.replace(/rgb\(/i, '').replace(/\)/, '').split(',');
        hexColor = '#' + numberToHex(rgb[0]) + numberToHex(rgb[1]) + numberToHex(rgb[2]);
        return hexColor.toUpperCase();
    }
    if(/rgb\(\d+%\,\d+%\,\d+%\)/i.test(hexColor.replace(/\s*/g, ''))) {
        var rgbPercent = hexColor.replace(/rgb\(/i, '').replace(/\)/, '').replace(/%/g, '').split(',');
        hexColor = '#' + precentToHex(rgbPercent[0]) + precentToHex(rgbPercent[1]) + precentToHex(rgbPercent[2]);
        return hexColor.toUpperCase();
    }
    if(/^(#|rgb)/i.test(hexColor) === false) {
        return svgColorKeywordsToHex(hexColor).toUpperCase();
    }
    return '';
}

// 0-255 -> OO-ff
function numberToHex(num) {
    var r = Number(num).toString(16);
    if(r.length == 1) {
         r = '0' + r;
    }
    return r.toUpperCase();
}

// 0-100%(255) -> 00-FF()
function precentToHex(precent) {
    return numberToHex(Math.round(precent * 255 / 100));
}

// SVG 1.0 color names
function svgColorKeywordsToHex(keyword) {
    var hex = '';
    switch(keyword) {
        case 'aliceblue':
            hex = '#f0f8ff';
            break;
        case 'antiquewhite':
            hex = '#faebd7';
            break;
        case 'aqua':
            hex = '#00ffff';
            break;
        case 'aquamarine':
            hex = '#7fffd4';
            break;
        case 'azure':
            hex = '#f0ffff';
            break;
        case 'beige':
            hex = '#f5f5dc';
            break;
        case 'bisque':
            hex = '#ffe4c4';
            break;
        case 'black':
            hex = '#000000';
            break;
        case 'blanchedalmond':
            hex = '#ffebcd';
            break;
        case 'blue':
            hex = '#0000ff';
            break;
        case 'blueviolet':
            hex = '#8a2be2';
            break;
        case 'brown':
            hex = '#a52a2a';
            break;
        case 'burlywood':
            hex = '#deb887';
            break;
        case 'cadetblue':
            hex = '#5f9ea0';
            break;
        case 'chartreuse':
            hex = '#7fff00';
            break;
        case 'chocolate':
            hex = '#d2691e';
            break;
        case 'coral':
            hex = '#ff7f50';
            break;
        case 'cornflowerblue':
            hex = '#6495ed';
            break;
        case 'cornsilk':
            hex = '#fff8dc';
            break;
        case 'crimson':
            hex = '#dc143c';
            break;
        case 'cyan':
            hex = '#00ffff';
            break;
        case 'darkblue':
            hex = '#00008b';
            break;
        case 'darkcyan':
            hex = '#008b8b';
            break;
        case 'darkgoldenrod':
            hex = '#b8860b';
            break;
        case 'darkgray':
            hex = '#a9a9a9';
            break;
        case 'darkgreen':
            hex = '#006400';
            break;
        case 'darkgrey':
            hex = '#a9a9a9';
            break;
        case 'darkkhaki':
            hex = '#bdb76b';
            break;
        case 'darkmagenta':
            hex = '#8b008b';
            break;
        case 'darkolivegreen':
            hex = '#556b2f';
            break;
        case 'darkorange':
            hex = '#ff8c00';
            break;
        case 'darkorchid':
            hex = '#9932cc';
            break;
        case 'darkred':
            hex = '#8b0000';
            break;
        case 'darksalmon':
            hex = '#e9967a';
            break;
        case 'darkseagreen':
            hex = '#8fbc8f';
            break;
        case 'darkslateblue':
            hex = '#483d8b';
            break;
        case 'darkslategray':
            hex = '#2f4f4f';
            break;
        case 'darkslategrey':
            hex = '#2f4f4f';
            break;
        case 'darkturquoise':
            hex = '#00ced1';
            break;
        case 'darkviolet':
            hex = '#9400d3';
            break;
        case 'deeppink':
            hex = '#ff1493';
            break;
        case 'deepskyblue':
            hex = '#00bfff';
            break;
        case 'dimgray':
            hex = '#696969';
            break;
        case 'dimgrey':
            hex = '#696969';
            break;
        case 'dodgerblue':
            hex = '#1e90ff';
            break;
        case 'firebrick':
            hex = '#b22222';
            break;
        case 'floralwhite':
            hex = '#fffaf0';
            break;
        case 'forestgreen':
            hex = '#228b22';
            break;
        case 'fuchsia':
            hex = '#ff00ff';
            break;
        case 'gainsboro':
            hex = '#dcdcdc';
            break;
        case 'ghostwhite':
            hex = '#f8f8ff';
            break;
        case 'gold':
            hex = '#ffd700';
            break;
        case 'goldenrod':
            hex = '#daa520';
            break;
        case 'gray':
            hex = '#808080';
            break;
        case 'green':
            hex = '#008000';
            break;
        case 'greenyellow':
            hex = '#adff2f';
            break;
        case 'grey':
            hex = '#808080';
            break;
        case 'honeydew':
            hex = '#f0fff0';
            break;
        case 'hotpink':
            hex = '#ff69b4';
            break;
        case 'indianred':
            hex = '#cd5c5c';
            break;
        case 'indigo':
            hex = '#4b0082';
            break;
        case 'ivory':
            hex = '#fffff0';
            break;
        case 'khaki':
            hex = '#f0e68c';
            break;
        case 'lavender':
            hex = '#e6e6fa';
            break;
        case 'lavenderblush':
            hex = '#fff0f5';
            break;
        case 'lawngreen':
            hex = '#7cfc00';
            break;
        case 'lemonchiffon':
            hex = '#fffacd';
            break;
        case 'lightblue':
            hex = '#add8e6';
            break;
        case 'lightcoral':
            hex = '#f08080';
            break;
        case 'lightcyan':
            hex = '#e0ffff';
            break;
        case 'lightgoldenrodyellow':
            hex = '#fafad2';
            break;
        case 'lightgray':
            hex = '#d3d3d3';
            break;
        case 'lightgreen':
            hex = '#90ee90';
            break;
        case 'lightgrey':
            hex = '#d3d3d3';
            break;
        case 'lightpink':
            hex = '#ffb6c1';
            break;
        case 'lightsalmon':
            hex = '#ffa07a';
            break;
        case 'lightseagreen':
            hex = '#20b2aa';
            break;
        case 'lightskyblue':
            hex = '#87cefa';
            break;
        case 'lightslategray':
            hex = '#778899';
            break;
        case 'lightslategrey':
            hex = '#778899';
            break;
        case 'lightsteelblue':
            hex = '#b0c4de';
            break;
        case 'lightyellow':
            hex = '#ffffe0';
            break;
        case 'lime':
            hex = '#00ff00';
            break;
        case 'limegreen':
            hex = '#32cd32';
            break;
        case 'linen':
            hex = '#faf0e6';
            break;
        case 'magenta':
            hex = '#ff00ff';
            break;
        case 'maroon':
            hex = '#800000';
            break;
        case 'mediumaquamarine':
            hex = '#66cdaa';
            break;
        case 'mediumblue':
            hex = '#0000cd';
            break;
        case 'mediumorchid':
            hex = '#ba55d3';
            break;
        case 'mediumpurple':
            hex = '#9370db';
            break;
        case 'mediumseagreen':
            hex = '#3cb371';
            break;
        case 'mediumslateblue':
            hex = '#7b68ee';
            break;
        case 'mediumspringgreen':
            hex = '#00fa9a';
            break;
        case 'mediumturquoise':
            hex = '#48d1cc';
            break;
        case 'mediumvioletred':
            hex = '#c71585';
            break;
        case 'midnightblue':
            hex = '#191970';
            break;
        case 'mintcream':
            hex = '#f5fffa';
            break;
        case 'mistyrose':
            hex = '#ffe4e1';
            break;
        case 'moccasin':
            hex = '#ffe4b5';
            break;
        case 'navajowhite':
            hex = '#ffdead';
            break;
        case 'navy':
            hex = '#000080';
            break;
        case 'oldlace':
            hex = '#fdf5e6';
            break;
        case 'olive':
            hex = '#808000';
            break;
        case 'olivedrab':
            hex = '#6b8e23';
            break;
        case 'orange':
            hex = '#ffa500';
            break;
        case 'orangered':
            hex = '#ff4500';
            break;
        case 'orchid':
            hex = '#da70d6';
            break;
        case 'palegoldenrod':
            hex = '#eee8aa';
            break;
        case 'palegreen':
            hex = '#98fb98';
            break;
        case 'paleturquoise':
            hex = '#afeeee';
            break;
        case 'palevioletred':
            hex = '#db7093';
            break;
        case 'papayawhip':
            hex = '#ffefd5';
            break;
        case 'peachpuff':
            hex = '#ffdab9';
            break;
        case 'peru':
            hex = '#cd853f';
            break;
        case 'pink':
            hex = '#ffc0cb';
            break;
        case 'plum':
            hex = '#dda0dd';
            break;
        case 'powderblue':
            hex = '#b0e0e6';
            break;
        case 'purple':
            hex = '#800080';
            break;
        case 'red':
            hex = '#ff0000';
            break;
        case 'rosybrown':
            hex = '#bc8f8f';
            break;
        case 'royalblue':
            hex = '#4169e1';
            break;
        case 'saddlebrown':
            hex = '#8b4513';
            break;
        case 'salmon':
            hex = '#fa8072';
            break;
        case 'sandybrown':
            hex = '#f4a460';
            break;
        case 'seagreen':
            hex = '#2e8b57';
            break;
        case 'seashell':
            hex = '#fff5ee';
            break;
        case 'sienna':
            hex = '#a0522d';
            break;
        case 'silver':
            hex = '#c0c0c0';
            break;
        case 'skyblue':
            hex = '#87ceeb';
            break;
        case 'slateblue':
            hex = '#6a5acd';
            break;
        case 'slategray':
            hex = '#708090';
            break;
        case 'slategrey':
            hex = '#708090';
            break;
        case 'snow':
            hex = '#fffafa';
            break;
        case 'springgreen':
            hex = '#00ff7f';
            break;
        case 'steelblue':
            hex = '#4682b4';
            break;
        case 'tan':
            hex = '#d2b48c';
            break;
        case 'teal':
            hex = '#008080';
            break;
        case 'thistle':
            hex = '#d8bfd8';
            break;
        case 'tomato':
            hex = '#ff6347';
            break;
        case 'turquoise':
            hex = '#40e0d0';
            break;
        case 'violet':
            hex = '#ee82ee';
            break;
        case 'wheat':
            hex = '#f5deb3';
            break;
        case 'white':
            hex = '#ffffff';
            break;
        case 'whitesmoke':
            hex = '#f5f5f5';
            break;
        case 'yellow':
            hex = '#ffff00';
            break;
        case 'yellowgreen':
            hex = '#9acd32';
            break;
        default:
            hex = '#000000';
    }
    return hex;
}

///////////////////////////////////////////////////////////////////////////////
// Get SVG Arrituble
///////////////////////////////////////////////////////////////////////////////

function repeatString(str, num) {
    var t = '';
    for(var i = 0; i < num * 4; i ++) {
        t += str;
    }
    return t;
}

function hasArrtib(obj, attrib) {
    try{
        return attrib in obj;
    } catch(e){
        return false;
    }
}

function getStyleInline(obj) {
    var r = '';
    if(hasArrtib(obj, 'style')) {
        r = obj.style;
    }
    return r;
}

function getStyle(obj) {
    var r = '';
    t(obj);
    function t(o) {
        for(var i = 0; i < o.length; i ++) {
            try {
                if('childs' in o[i]) {
                    t(o[i].childs);
                }
            } catch(e) {}
            if(o[i].name === 'style') {
                r = o[i].childs[0];
            }
        }
    }
    return r;
}

function getValueFromStyle(selectors, property, styleString) {
    var r = '';
    try {
        r = styleString
            .replace(/\s{2,}/g, '')
            .replace(/[\n|\r|\t]/g, '')
            .replace(/\}/g, '}\n')
            .replace(/\s?\{\s?/g, '{')
            .replace(/\s?:\s?/g, ':')
            .match(RegExp(selectors + '{.*}'))[0]
            .match(RegExp(property + ':.*'))[0]
            .replace(RegExp(property + ':'), '');
        r = r.substring(0, r.indexOf(';'));
    } catch (e) {}
    if(/^\.\d+/.test(r)) {
        r = Number(r);
    }
    return r;
}

function getValueFromStyleInline(property, styleString) {
    var r = '';
    try {
        r = styleString
            .replace(/\s?:\s?/g, ':')
            .replace(/\s?;\s?/g, ';')
            .match(RegExp(property + ':.*'))[0]
            .replace(RegExp(property + ':'), '');
        r = r.substring(0, r.indexOf(';'));
    } catch (e) {}
    if(/^\.\d+/.test(r)) {
        r = Number(r);
    }
    return r;
}

///////////////////////////////////////////////////////////////////////////////
// Path data convert
///////////////////////////////////////////////////////////////////////////////

function rectToPath(x, y, width, height, rx, ry) {
    var d = '';
    if(rx === 0 && ry === 0) {
        d = 'M' + x + ',' + y + 'L' + (x+width) + ',' + y + 'L' + (x+width) + ',' + (y+height) + 'L' + x + ',' + (y+height) + 'z';
    } else {
        d = 'M' + (x + rx) + ',' + y + ',' +
            'L' + (x + width - rx) + ',' + y + ',' +
            'Q' + (x + width) + ',' + y + ',' + (x + width) + ',' + (y + ry) + ',' +
            'L' + (x + width) + ',' + (y + height - ry) + ',' +
            'Q' + (x + width) + ',' + (y + height) + ',' + (x + width - rx) + ',' + (y + height) + ',' +
            'L' + (x + rx) + ',' + (y + height) + ',' +
            'Q' + x + ',' + (y + height) + ',' + x + ',' + (y + height - ry) + ',' +
            'L' + x + ',' + (y + ry) + ',' +
            'Q' + x + ',' + y + ',' + (x + rx) + ',' + y + 'z';
    }
    return d;
}

function polygonToPath(points) {
    points = points.trim();
    var pointsArrayRaw = typeof points !== "undefined" ? points.split(",") : [];
    var pointsArray = [];
    for (var i = 0; i < pointsArrayRaw.length; i++) {
        var splitted = pointsArrayRaw[i].split(" ");
        for (var j = 0; j < splitted.length; j++) {
            if (splitted[j].length > 0) {
                pointsArray.push(splitted[j]);
            }
        }
    }
    if (pointsArray.length % 2 == 0) {
        var d = "";
        for (var i = 0; i < pointsArray.length; i += 2) {
            d += i == 0 ? "M" : "L";
            d += pointsArray[i] + "," + pointsArray[i + 1] + "";
        }
        d += "z";
        return d;
    } else {
        return "";
    }
}

function circleToPath(cx, cy, r) {
    //"A rx,ry xAxisRotate LargeArcFlag,SweepFlag x,y".
    var d = 'M' + (cx-r) + ',' + cy +
            'a' + r + ',' + r + ' 0 0,1 ' + r*2 + ',0' +
            'a' + r + ',' + r + ' 0 0,1 -' + r*2 + ',0z';
    return d;
}

function ellipseToPath(cx, cy, rx, ry) {
    var controlDistanceX = rx * 0.5522847498307935;
    var controlDistanceY = ry * 0.5522847498307935;
    var d = 'M' + cx + ',' + (cy - ry) + ',' +
            'C' + (cx + controlDistanceX).toFixed(2) + ',' + (cy - ry) + ',' + (cx + rx) + ',' + (cy - controlDistanceY).toFixed(2) + ',' + (cx + rx) + ',' + cy + ',' +
            'C' + (cx + rx) + ',' + (cy + controlDistanceY).toFixed(2) + ',' + (cx + controlDistanceX).toFixed(2) + ',' + (cy + ry) + ','  + cx + ',' + (cy + ry) + ',' +
            'C' + (cx - controlDistanceX).toFixed(2) + ',' + (cy + ry) + ',' + (cx - rx) + ',' + (cy + controlDistanceY).toFixed(2) + ',' + (cx - rx) + ',' + cy + ',' +
            'C' + (cx - rx) + ',' + (cy - controlDistanceY).toFixed(2) + ',' + (cx - controlDistanceX).toFixed(2) + ',' + (cy - ry) + ',' + cx + ',' + (cy - ry) + 'z';
    return d;
}

///////////////////////////////////////////////////////////////////////////////
// Export Moudle
///////////////////////////////////////////////////////////////////////////////

exports.svg2vectorDrawableContent = svg2vectorDrawableContent;
exports.svg2vectorDrawableFile = svg2vectorDrawableFile;
exports.getFileContent = getFileContent;
exports.createFile = createFile;
