
const EOL = require('os').EOL;
const JSAPI = require('svgo/lib/svgo/jsAPI');
// https://www.npmjs.com/package/svg-path-bounds
const pathBounds = require('svg-path-bounds');

let JS2XML = function() {
    this.width = 24;
    this.height = 24;
    this.viewportWidth = 24;
    this.viewportHeight = 24;
    this.indent = 4;
    this.indentLevel = 0;
    // https://developer.android.com/reference/android/graphics/drawable/VectorDrawable
    this.supportAttrs = [
        'width', // android:width
        'height', // android:height
        'viewBox', // android:viewportWidth, android:viewportHeight
        'opacity', // Not support
        'transform', // Only support in group tag, 
                    // android:rotation android:pivotX android:pivotY 
                    // android:scaleX android:scaleY
                    // android:translateX android:translateY
        'd', // android:pathData
        'fill', // android:fillColor
        'fill-opacity', // android:fillAlpha
        'stroke', // android:strokeColor
        'stroke-width', // android:strokeWidth
        'stroke-opacity', // android:strokeAlpha
        'stroke-linecap', // android:strokeLineCap butt, round, square. Default is butt.
        'stroke-linejoin', // android:strokeLineJoin miter,round,bevel. Default is miter.
        'stroke-miterlimit', // android:strokeMiterLimit Default is 4.
        'fill-rule' // android:fillType For SDK 24+, evenOdd, nonZero. Default is nonZero.
    ];
    this.vectordrawableTags = [
        'vector', // svg
        'group', // g
        'path', // path, rect, circle, polygon, ellipse, polyline, line
        'clip-path', 
        'aapt:attr',
        'gradient', // linearGradient, radialGradient
        'item' // stop
    ];
};

JS2XML.prototype.refactorData = function(data) {
    // Tag gradient
    let elemGradients = data.querySelectorAll('linearGradient, radialGradient, sweepGradient');
    if (elemGradients) {
        elemGradients.forEach(gradient => {
            let gradientId = gradient.attr('id').value;
            let gradientPaths = data.querySelectorAll(`*[fill="url(#${gradientId})"], *[stroke="url(#${gradientId})"]`);
            if (gradientPaths) {
                gradientPaths.forEach(path => {
                    this.addGradientToElement(gradient, path);
                });
            }
        });
    }
    
    // Mask
    // TODO: mask
    
    // Tag g -> group
    let elemGroups = data.querySelectorAll('g');
    elemGroups.forEach(elem => {
        elem.renameElem('group');
        // remove default attr
        if (elem.hasAttr('fill-rule', 'nonzero')) {
            elem.removeAttr('fill-rule');
        }
        // Ungroup not transform and not black/none color
        if (!elem.hasAttr('transform') && (!elem.hasAttr('fill') || (elem.hasAttr('fill') && elem.hasAttr('fill', 'none')))) {
            if (elem.hasAttr('fill-rule', 'evenodd')) {
                elem.content.forEach(item => {
                    if (!item.hasAttr('fill-rule')) {
                        item.addAttr({ name: 'fill-rule', value: 'evenodd', prefix: '', local: 'fill-rule' });
                    }
                });
            }
            elem.parentNode.spliceContent(elem.parentNode.content.indexOf(elem), 0, elem.content);
            elem.parentNode.spliceContent(elem.parentNode.content.indexOf(elem), 1, []);
        }
        // Move fill to child node
        if (elem.hasAttr('fill')) {
            elem.content.forEach(item => {
                if (!item.hasAttr('fill')) {
                    item.addAttr({ name: 'fill', value: elem.attr('fill').value, prefix: '', local: 'fill' });
                }
            });
            elem.removeAttr('fill');
        }
        // Move opacity to child node
        if (elem.hasAttr('opacity')) {
            elem.content.forEach(item => {
                let opacity = elem.attr('opacity').value;
                if (item.hasAttr('opacity')) {
                    opacity = Math.round(elem.attr('opacity').value * item.attr('opacity').value * 100) / 100;
                }
                item.addAttr({ name: 'opacity', value: opacity, prefix: '', local: 'opacity' });
            });
            elem.removeAttr('opacity');
        }
        // TODO: transform
        
        
    });

    // Tag svg -> vector
    let elemSVG = data.querySelector('svg');
    if (elemSVG) {
        elemSVG.renameElem('vector');
        if (elemSVG.hasAttr('width') && elemSVG.hasAttr('height')) {
            this.width = parseInt(elemSVG.attr('width').value);
            this.height = parseInt(elemSVG.attr('height').value);
        }
        if (elemSVG.hasAttr('viewBox')) {
            let [x, y, w, h] = elemSVG.attr('viewBox').value.split(/\s+/);
            this.viewportWidth = w;
            this.viewportHeight = h;
            if (!elemSVG.hasAttr('width') && !elemSVG.hasAttr('height')) {
                this.width = w;
                this.height = h;
            }
        }
        elemSVG.attrs = {};
        // SVG is not support sweep (angular) gradient
        if (data.querySelector('linearGradient, radialGradient, sweepGradient')) {
            elemSVG.addAttr({ name: 'xmlns:aapt', value: 'http://schemas.android.com/aapt', prefix: 'xmlns', local: 'aapt' });
        }
        elemSVG.addAttr({ name: 'android:width', value: this.width + 'dp', prefix: 'android', local: 'width' });
        elemSVG.addAttr({ name: 'android:height', value: this.height + 'dp', prefix: 'android', local: 'height' });
        elemSVG.addAttr({ name: 'android:viewportWidth', value: this.viewportWidth, prefix: 'android', local: 'viewportWidth' });
        elemSVG.addAttr({ name: 'android:viewportHeight', value: this.viewportHeight, prefix: 'android', local: 'viewportHeight' });
    }

    // Tag path
    let elemPaths = data.querySelectorAll('path');
    elemPaths.forEach(elem => {
        // Fill
        if (elem.hasAttr('fill')) {
            let fillAttr = { name: 'android:fillColor', value: elem.attr('fill').value, prefix: 'android', local: 'fillColor' };
            if (!/^url\(#.*\)$/.test(elem.attr('fill').value)) {
                if (elem.hasAttr('fill-opacity')) {
                    fillAttr.value = this.mergeColorAndOpacity(elem.attr('fill').value, elem.attr('fill-opacity').value);
                    elem.removeAttr('fill-opacity');
                }
                elem.addAttr(fillAttr);
            }
            elem.removeAttr('fill');
        }
        else {
            let fillAttr = { name: 'android:fillColor', value: '#000000', prefix: 'android', local: 'fillColor' };
            if (elem.hasAttr('fill-opacity')) {
                fillAttr.value = this.mergeColorAndOpacity('#000000', elem.attr('fill-opacity').value);
                elem.removeAttr('fill-opacity');
            }
            elem.addAttr(fillAttr);
        }
        // Opacity, Android not support path/group alpha
        if (elem.hasAttr('opacity')) {
            elem.addAttr({ name: 'android:fillAlpha', value: elem.attr('opacity').value, prefix: 'android', local: 'fillAlpha' });
        }

        // Tag stroke
        if (elem.hasAttr('stroke')) {
            let strokeAttr = { name: 'android:strokeColor', value: elem.attr('stroke').value, prefix: 'android', local: 'strokeColor' };
            if (!/^url\(#.*\)$/.test(elem.attr('stroke').value)) {
                if (elem.hasAttr('stroke-opacity')) {
                    strokeAttr.value = this.mergeColorAndOpacity(elem.attr('stroke').value, elem.attr('stroke-opacity').value);
                    elem.removeAttr('stroke-opacity');
                }
                elem.addAttr(strokeAttr);
            }
            elem.removeAttr('stroke');

            if (elem.hasAttr('opacity')) {
                elem.addAttr({ name: 'android:strokeAlpha', value: elem.attr('opacity').value, prefix: 'android', local: 'strokeAlpha' });
            }
            
            // SVG stroke-width default is 1, Android android:strokeWidth default is 0
            let strokeWidthAttr = { name: 'android:strokeWidth', value: 0, prefix: 'android', local: 'strokeWidth' };
            if (!elem.hasAttr('stroke-width')) {
                strokeWidthAttr.value = 1;
            }
            else {
                strokeWidthAttr.value = elem.attr('stroke-width').value;
                elem.removeAttr('stroke-width');
            }
            elem.addAttr(strokeWidthAttr);

            if (elem.hasAttr('stroke-linecap')) {
                elem.addAttr({ name: 'android:strokeLineCap', value: elem.attr('stroke-linecap').value, prefix: 'android', local: 'strokeLineCap' });
                elem.removeAttr('stroke-linecap');
            }

            if (elem.hasAttr('stroke-linejoin')) {
                elem.addAttr({ name: 'android:strokeLineJoin', value: elem.attr('stroke-linejoin').value, prefix: 'android', local: 'strokeLineJoin' });
                elem.removeAttr('stroke-linejoin');
            }

            if (elem.hasAttr('stroke-miterlimit')) {
                elem.addAttr({ name: 'android:strokeMiterLimit', value: elem.attr('stroke-miterlimit').value, prefix: 'android', local: 'strokeMiterLimit' });
                elem.removeAttr('stroke-miterlimit');
            }
        }
        // Opacity, Android not support path/group alpha
        if (elem.hasAttr('opacity')) {
            elem.removeAttr('opacity');
        }
        // Fill-rule
        elem.removeAttr('fill-rule', 'nonzero');
        if (elem.hasAttr('fill-rule', 'evenodd')) {
            elem.addAttr({ name: 'android:fillType', value: 'evenOdd', prefix: 'android', local: 'fillType' });
            elem.removeAttr('fill-rule', 'evenodd');
        }
        // Path data
        if (elem.hasAttr('d')) {
            elem.addAttr({ name: 'android:pathData', value: elem.attr('d').value, prefix: 'android', local: 'pathData' });
            elem.removeAttr('d');
        }
    });
};

JS2XML.prototype.addGradientToElement = function(gradient, elem) {
    let vectorDrawableGradient = new JSAPI({ elem: 'gradient', content: [] });
    let vectorDrawableAapt = new JSAPI({ elem: 'aapt:attr', content: [ vectorDrawableGradient ]});

    let gradientId = gradient.attr('id').value;
    if (elem.hasAttr('fill', `url(#${gradientId})`)) {
        vectorDrawableAapt.addAttr({ name: 'name', value: 'android:fillColor', prefix: '', local: 'name'})
    }
    if (elem.hasAttr('stroke', `url(#${gradientId})`)) {
        vectorDrawableAapt.addAttr({ name: 'name', value: 'android:strokeColor', prefix: '', local: 'name'})
    }

    this.adjustGradientCoordinate(gradient, elem);

    if (gradient.elem === 'linearGradient') {
        vectorDrawableGradient.addAttr({ name: 'android:type', value: 'linear', prefix: 'android', local: 'type'});
        let startX = gradient.hasAttr('x1') ? gradient.attr('x1').value : '0';
        let startY = gradient.hasAttr('y1') ? gradient.attr('y1').value : '0';
        let endX = gradient.hasAttr('x2') ? gradient.attr('x2').value : this.viewportWidth;
        let endY = gradient.hasAttr('y2') ? gradient.attr('y2').value : '0';
        vectorDrawableGradient.addAttr({ name: 'android:startX', value: startX, prefix: 'android', local: 'startX'});
        vectorDrawableGradient.addAttr({ name: 'android:startY', value: startY, prefix: 'android', local: 'startY'});
        vectorDrawableGradient.addAttr({ name: 'android:endX', value: endX, prefix: 'android', local: 'endX'});
        vectorDrawableGradient.addAttr({ name: 'android:endY', value: endY, prefix: 'android', local: 'endY'});
    }
    if (gradient.elem === 'radialGradient') {
        vectorDrawableGradient.addAttr({ name: 'android:type', value: 'radial', prefix: 'android', local: 'type'});
        let centerX = gradient.hasAttr('cx') ? gradient.attr('cx').value : this.viewportWidth / 2;
        let centerY = gradient.hasAttr('cy') ? gradient.attr('cy').value : this.viewportHeight / 2;
        if (gradient.hasAttr('rx')) centerX = gradient.attr('rx').value;
        if (gradient.hasAttr('ry')) centerY = gradient.attr('ry').value;
        let gradientRadius = gradient.hasAttr('r') ? gradient.attr('r').value : Math.max(this.viewportWidth, this.viewportHeight) / 2;
        vectorDrawableGradient.addAttr({ name: 'android:centerX', value: centerX, prefix: 'android', local: 'centerX'});
        vectorDrawableGradient.addAttr({ name: 'android:centerY', value: centerY, prefix: 'android', local: 'centerY'});
        vectorDrawableGradient.addAttr({ name: 'android:gradientRadius', value: gradientRadius, prefix: 'android', local: 'gradientRadius'});
    }
    // SVG is not support sweepGradient
    // if (gradient.elem === 'sweepGradient') {
    //     vectorDrawableGradient.addAttr({ name: 'android:type', value: 'sweep', prefix: 'android', local: 'type'});
    //     let centerX = gradient.hasAttr('cx') ? gradient.attr('cx').value : this.viewportWidth / 2;
    //     let centerY = gradient.hasAttr('cy') ? gradient.attr('cy').value : this.viewportHeight / 2;
    //    
    //         console.log(`${centerX}, ${centerY}`)
    //    
    //    
    //     vectorDrawableGradient.addAttr({ name: 'android:centerX', value: centerX, prefix: 'android', local: 'centerX'});
    //     vectorDrawableGradient.addAttr({ name: 'android:centerY', value: centerY, prefix: 'android', local: 'centerY'});
    // }
    // Color stops
    gradient.content.forEach(item => {
        let colorStop = new JSAPI({ elem: 'item' });
        let color = item.attr('stop-color').value;
        let offset = item.attr('offset').value;
        if (this.isPercent(offset)) {
            offset = Math.round(parseFloat(offset)) / 100;
        }
        if (item.hasAttr('stop-opacity')) {
            color = this.mergeColorAndOpacity(color, item.attr('stop-opacity').value);
        }
        colorStop.addAttr({ name: 'android:color', value: color, prefix: 'android', local: 'color'});
        colorStop.addAttr({ name: 'android:offset', value: offset, prefix: 'android', local: 'offset'});
        vectorDrawableGradient.content.push(colorStop);
    });

    if (!elem.content) elem.content = [];
    elem.content.push(vectorDrawableAapt);
};

JS2XML.prototype.adjustGradientCoordinate = function(gradient, elem) {
    // Default value
    if (gradient.elem === 'linearGradient') {
        if (!gradient.hasAttr('x1')) {
            gradient.addAttr({ name: 'x1', value: '0', prefix: '', local: 'x1'});
        }
        if (!gradient.hasAttr('y1')) {
            gradient.addAttr({ name: 'y1', value: '0', prefix: '', local: 'y1'});
        }
        if (!gradient.hasAttr('x2')) {
            gradient.addAttr({ name: 'x2', value: '100%', prefix: '', local: 'x2'});
        }
        if (!gradient.hasAttr('y2')) {
            gradient.addAttr({ name: 'y2', value: '100%', prefix: '', local: 'y2'});
        }
    }
    if (gradient.elem === 'radialGradient') {
        if (!gradient.hasAttr('cx')) {
            gradient.addAttr({ name: 'cx', value: '50%', prefix: '', local: 'cx'});
        }
        if (!gradient.hasAttr('cy')) {
            gradient.addAttr({ name: 'cy', value: '50%', prefix: '', local: 'cy'});
        }
        if (!gradient.hasAttr('r')) {
            gradient.addAttr({ name: 'r', value: '50%', prefix: '', local: 'r'});
        }
    }
    if (gradient.elem === 'sweepGradient') {
        if (!gradient.hasAttr('cx')) {
            gradient.addAttr({ name: 'cx', value: '50%', prefix: '', local: 'cx'});
        }
        if (!gradient.hasAttr('cy')) {
            gradient.addAttr({ name: 'cy', value: '50%', prefix: '', local: 'cy'});
        }
    }
    gradient.eachAttr(attr => {
        let positionAttrs = [
            // SVG linearGradient
            'x1', 'y1', 'x2', 'y2',
            // SVG radialGradient, Android VectorDrawable not support 'fx' and 'fy'.
            'cx', 'cy', 'r', 'fx', 'fy'
        ];
        if (positionAttrs.indexOf(attr.name) >= 0) {
            // Android gradient use gradientUnits="userSpaceOnUse", SVG default is objectBoundingBox.
            if (!gradient.hasAttr('gradientUnits', 'userSpaceOnUse')) {
                let [x1, y1, x2, y2] = pathBounds(elem.attr('d').value);
                // Percent to float.
                if (this.isPercent(attr.value)) {
                    let valueFloat = parseFloat(attr.value) / 100;
                    if (attr.name === 'x1' || attr.name === 'x2' || attr.name === 'cx' || attr.name === 'fx') {
                        attr.value = x1 + (x2 - x1) * valueFloat;
                    }
                    if (attr.name === 'y1' || attr.name === 'y2' || attr.name === 'cy' || attr.name === 'fy') {
                        attr.value = y1 + (y2 - y1) * valueFloat;
                    }
                    if (attr.name === 'r') {
                        attr.value = Math.max(x2 - x1, y2 - y1) * valueFloat;
                    }
                }
                else {
                    if (attr.name === 'x1' || attr.name === 'x2' || attr.name === 'cx' || attr.name === 'fx') {
                        attr.value = x1 + valueFloat;
                    }
                    if (attr.name === 'y1' || attr.name === 'y2' || attr.name === 'cy' || attr.name === 'fy') {
                        attr.value = y1 + valueFloat;
                    }
                }
            }
            else {
                if (this.isPercent(attr.value)) {
                    let valueFloat = parseFloat(attr.value) / 100;
                    if (attr.name === 'x1' || attr.name === 'x2' || attr.name === 'cx' || attr.name === 'fx') {
                        attr.value = this.viewportWidth * valueFloat;
                    }
                    if (attr.name === 'y1' || attr.name === 'y2' || attr.name === 'cy' || attr.name === 'fy') {
                        attr.value = this.viewportHeight * valueFloat;
                    }
                    if (attr.name === 'r') {
                        attr.value = Math.max(this.viewportWidth, this.viewportHeight) * valueFloat;
                    }
                }
            }
            attr.value = Math.round(attr.value * 100) / 100;
        }
    }, this);
};

JS2XML.prototype.mergeColorAndOpacity = function(colorHex, opacity) {
    if(/#[0-9A-Fa-f]{3}/.test(colorHex)) {
        colorHex = '#' + colorHex[1] + colorHex[1] + colorHex[2] + colorHex[2] + colorHex[3] + colorHex[3];
    }
    let opacityHex = Number(Math.round(opacity * 255)).toString(16);
    if (opacityHex.length === 1) {
        opacityHex = '0' + opacityHex;
    }
    let mergedColor = colorHex.slice(0, 1) + opacityHex + colorHex.slice(1);
    return mergedColor.toUpperCase();
};

JS2XML.prototype.isPercent = function(value) {
    return /(-)?\d+(\.d+)?%$/.test(String(value));
};

JS2XML.prototype.convert = function(data) {
    this.refactorData(data);
    let xml = '<?xml version="1.0" encoding="utf-8"?>';
    xml += EOL + this.travelConvert(data) + EOL;
    return xml;
};

JS2XML.prototype.travelConvert = function(data) {
    let xml = '';
    this.indentLevel ++;
    if (data.content) {
        data.content.forEach(item => {
            if (item.elem && this.vectordrawableTags.indexOf(item.elem) !== -1) {
                xml += this.createElement(item);
            }
        }, this);
    }
    this.indentLevel --;
    return xml;
};

JS2XML.prototype.createElement = function(data) {
    
    // console.log(data.elem);

    if (data.isEmpty()) {
        // console.log(this.indentLevel + '-------');
        // console.log(data.elem);
        // console.log(data.attrs);
        // console.log(data);
        
        return this.createIndent() + '<' + data.elem + this.createAttrs(data) + '/>' + EOL;

    }
    else {
        let processedData = '';
        // console.log(this.indentLevel + '-------');
        // console.log(data.elem);
        // console.log(data.attrs);
        // console.log(data);

        processedData += this.travelConvert(data);


        return this.createIndent() + '<' + data.elem + this.createAttrs(data) + '>' + EOL +
            processedData +
            this.createIndent() + '</' + data.elem + '>' + EOL;
    }
};

JS2XML.prototype.createAttrs = function(elem) {
    let attrs = '';
    if (elem.elem === 'vector') {
        attrs += ' xmlns:android="http://schemas.android.com/apk/res/android"';
    }
    elem.eachAttr(function(attr) {
        // TODO: attrname
        if (attr.value !== undefined) {
            if (elem.elem === 'aapt:attr' && attr.name === 'name') {
                attrs += ' ' + attr.name + '="' + attr.value + '"';
            }
            else {
                attrs += EOL + this.createIndent() + ' '.repeat(this.indent) + attr.name + '="' + attr.value + '"';
            }
        }
    }, this);
    return attrs;
};

JS2XML.prototype.createIndent = function() {
    let indent = ' '.repeat(this.indent);
    indent = indent.repeat(this.indentLevel - 1);
    return indent;
};

module.exports = function(data) {
    return new JS2XML().convert(data);
};