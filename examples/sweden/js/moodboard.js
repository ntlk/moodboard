/*
 * Moodboard v1.0.0
 * a moodboard layout library
 *
 * Licensed under the MIT License (MIT)
 *
 * http://ntlk.net
 * Copyright 2015 ntlk
 */

var MoodboardEl = function(element) {
  this.el = element;
  this.initialize();
};

MoodboardEl.prototype.initialize = function() {
  if (this.el) {
    var src = this.el.getAttribute('src');
    var image = new Image();

    image.onload = function() {
      this.originalWidth = image.width;
      this.originalHeight = image.height;
    }.bind(this)
    image.src = src;
  }
};

MoodboardEl.prototype.position = function(coverage, layout) {
  if (!this.originalWidth || !this.originalHeight) {
    window.setTimeout(function() {
      this.position(coverage, layout);
    }.bind(this), 100);
    return;
  }

  var dmn = this.getWidthAndHeight(coverage, layout);
  var left = this.getLeft(dmn.width, layout);
  var top = this.getTop(dmn.height, layout);

  this.el.style.width = dmn.width + 'px';
  this.el.style.left = left + 'px';
  this.el.style.top = top + 'px';
  this.el.style.position = 'absolute';
};

MoodboardEl.prototype.getLeft = function(width, layout) {
  return Moodboard.randomNumber(0, layout.width - width);
};

MoodboardEl.prototype.getTop = function(height, layout) {
  return Moodboard.randomNumber(0, layout.height - height);
};

MoodboardEl.prototype.getWidthAndHeight = function(coverage, layout) {
  var totalCoverage = layout.width * layout.height;
  var area = coverage * totalCoverage;
  var variation = area * layout.variation;
  area = Moodboard.randomNumber(area - variation, area + variation);
  var ratio = this.originalWidth / this.originalHeight;

  var height = Math.sqrt(area / ratio);
  var width = area / height;

  return { width: width, height: height };
};

var Moodboard = function(selector, options) {
  options = options || {};
  var elements = document.querySelectorAll(selector);
  this.elements = elements;

  this.coverage = options.coverage || 0.2; // roughly how much of the viewport to cover
  this.variation = options.variation || 0.2; // variation in image coverage from the perfect value
  this.resizeDelay = options.resizeDelay || 300; // miliseconds to wait between firing resize events
  this.disableResize = options.disableResize || false; // choose whether to reposition when window resizes

  this.layoutElements = [];
  this.resizeTimer;

  this.initialize();
  this.initLayout();
};

Moodboard.randomNumber = function(min, max) {
  return Math.floor(Math.random() * max) + min;
}

Moodboard.prototype.getViewportSize = function() {
  this.width = window.innerWidth;
  this.height = window.innerHeight;
};

Moodboard.prototype.initialize = function() {
  this.polyfillBind();
  this.polyfillForEach();
  this.polyfillQuerySelectorAll();
  this.addBodyJsClass();
  this.checkElementsCount();
  this.instantiateLayoutEls();
};

Moodboard.prototype.initLayout = function() {
  this.getViewportSize();
  this.positionLayoutEls();
  this.setUpResizeListener();
};

Moodboard.prototype.positionLayoutEls = function() {
  this.layoutElements.forEach(function(layoutEl) {
    var coverage = this.coverage / this.elements.length;

    layoutEl.position(coverage, this);
  }.bind(this));
};

Moodboard.prototype.instantiateLayoutEls = function() {
  Array.prototype.forEach.call(this.elements, function(element) {
    this.layoutElements.push(new MoodboardEl(element));
  }.bind(this));
};

Moodboard.prototype.checkElementsCount = function() {
  if (this.elements.length < 1) {
    console.error('No elements given to the layout engine.');
  }
};

Moodboard.prototype.setUpResizeListener = function() {
  if (this.disableResize) {
    return;
  }

  window.addEventListener('resize', function() {
    clearTimeout(this.resizeTimer);

    this.resizeTimer = setTimeout(function() {
      this.initLayout();
    }.bind(this), this.resizeDelay);

  }.bind(this));
};

Moodboard.prototype.addBodyJsClass = function() {
  var el = document.body;
  var className = 'js';
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
};

Moodboard.prototype.polyfillBind = function() {
  // thanks @threedaymonk!
  // https://gist.github.com/threedaymonk/1deec29b2f0b29ce55cc

  if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(thisValue){
      var func = this;
      return function() {
        return func.apply(thisValue, arguments);
      }
    }
  }
};

Moodboard.prototype.polyfillForEach = function() {
  // http://javascript.boxsheep.com/polyfills/Array-prototype-forEach/

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, arg) {
      var arr = this,
          len = arr.length,
          thisArg = arg ? arg : undefined,
          i;
      for (i = 0; i < len; i += 1) {
        if (arr.hasOwnProperty(i)) {
          fn.call(thisArg, arr[i], i, arr);
        }
      }
      return undefined;
    };
  }
};

Moodboard.prototype.polyfillQuerySelectorAll = function() {
  // https://gist.github.com/chrisjlee/8960575

  if (!document.querySelectorAll) {
    document.querySelectorAll = function (selectors) {
      var style = document.createElement('style'), elements = [], element;
      document.documentElement.firstChild.appendChild(style);
      document._qsa = [];

      style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
      window.scrollBy(0, 0);
      style.parentNode.removeChild(style);

      while (document._qsa.length) {
        element = document._qsa.shift();
        element.style.removeAttribute('x-qsa');
        elements.push(element);
      }
      document._qsa = null;
      return elements;
    };
  }
};
