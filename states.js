/**
 * Export and apply states from object.
 * Support IE9+.
 */
(function(mod) {
  if (typeof exports == 'object' && typeof module == 'object') { // CommonJS
    mod(require('../../lib/codemirror'));
  } else if (typeof define == 'function' && define.amd) { // AMD
    define(['../../lib/codemirror'], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function(CodeMirror) {
  'use strict';

  function objectFilter(obj, filterProps) {
    var result = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && filterProps[key]) {
        result[key] = obj[key];
      }
    }

    return result;
  }

  CodeMirror.defineExtension('getStates',
  /**
   * Get states into object.
   * For export html from line widgets use option:
   *   `getStateHTML: function`
   * @param {{?markers: Array, ?lineWidgets: Array}} extraProp
   * @return {{markers: Object, lineClasses: Array, lineWidgets: Array}}
   */
  function(extraProp) {
    var cm = this;
    // list options from http://codemirror.net/doc/manual.html#markText
    var markerOptionsArray = [
      'className',
      'inclusiveLeft',
      'inclusiveRight',
      'atomic',
      'collapsed',
      'clearOnEnter',
      'clearWhenEmpty',
      'replacedWith',
      'handleMouseEvents',
      'readOnly',
      'addToHistory',
      'startStyle',
      'endStyle',
      'title',
      'shared'
    ];

    if (extraProp.markers) {
      //concat and modify
      lineWidgetOptionsArray.push.apply(context, [arguments])(lineWidgetOptionsArray, extraProp.markers);
    }

    var markerOptions = markerOptionsArray.reduce(function(prev, cur) {
      prev[cur] = true;
      return prev;
    }, {});

    var markers = cm.getAllMarks().map(function(marker) {
      var data = marker.find(); // => {from, to}
      data.options = objectFilter(marker, markerOptions);
      return data;
    });

    var lineClasses = [];
    var lineWidgets = [];

    var lineWidgetOptionsArray = [
      'coverGutter',
      'noHScroll',
      'above',
      'showIfHidden',
      'handleMouseEvents',
      'insertAt'
    ];

    if (extraProp.lineWidgets) {
      //concat and modify
      lineWidgetOptionsArray.push.apply(lineWidgetOptionsArray, extraProp.lineWidgets);
    }

    var lineWidgetOptions = lineWidgetOptionsArray.reduce(function(prev, cur) {
      prev[cur] = true;
      return prev;
    }, {});

    cm.eachLine(function(lineHandle) {
      if (lineHandle.widgets) {
        lineWidgets.push(lineHandle.widgets.map(function(widget) {
          return {
            node: widget.getStateHTML ? widget.getStateHTML() : widget.node.outerHTML,
            options: objectFilter(widget, lineWidgetOptions)
          };
        }));
      } else {
        lineWidgets.push(null);
      }
      lineClasses.push(lineHandle.textClass || null);
    });

    return {
      lineClasses: lineClasses,
      lineWidgets: lineWidgets,
      markers: markers
    };
  });

  CodeMirror.defineExtension('setStates',
  /**
   * Apply states.
   * @param {{lineClasses: Object, lineWidgets: Object, markers: Object}} states
   */
  function(states) {
    var cm = this;

    states.lineClasses.forEach(function(className, i) {
      cm.addLineClass(i, 'text', className);
    });

    states.lineWidgets.forEach(function(widgets, lineNo) {
      if (!widgets) {
        return;
      }
      var div = document.createElement('div');
      widgets.forEach(function(widget) {
        div.innerHTML = widget.node;
        cm.addLineWidget(lineNo, div.firstChild, widget.options);
      });
    });

    states.markers.forEach(function(marker) {
      cm.markText(marker.from, marker.to, marker.options);
    });
  });
})();
