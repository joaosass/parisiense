(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory(root));
  } else if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.smoothScroll = factory(root);
  }
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {
  'use strict';
  var smoothScroll = {};
  var supports = 'querySelector' in document && 'addEventListener' in root;
  var settings, eventTimeout, fixedHeader, headerHeight, animationInterval;
  var defaults = {
    selector: '[data-scroll]',
    selectorHeader: '[data-scroll-header]',
    speed: 500,
    easing: 'easeInOutQuad',
    offset: 80,
    updateURL: true,
    callback: function () {}
  };
  var extend = function () {
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;
    if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
      deep = arguments[0];
      i++;
    }
    var merge = function (obj) {
      for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
            extended[prop] = extend(true, extended[prop], obj[prop]);
          } else {
            extended[prop] = obj[prop];
          }
        }
      }
    };
    for (; i < length; i++) {
      var obj = arguments[i];
      merge(obj);
    }
    return extended;
  };
  var getHeight = function (elem) {
    return Math.max(elem.scrollHeight, elem.offsetHeight, elem.clientHeight);
  };
  var getClosest = function (elem, selector) {
    var firstChar = selector.charAt(0);
    var supports = 'classList' in document.documentElement;
    var attribute, value;
    if (firstChar === '[') {
      selector = selector.substr(1, selector.length - 2);
      attribute = selector.split('=');
      if (attribute.length > 1) {
        value = true;
        attribute[1] = attribute[1].replace(/"/g, '').replace(/'/g, '');
      }
    }
    for (; elem && elem !== document; elem = elem.parentNode) {
      if (firstChar === '.') {
        if (supports) {
          if (elem.classList.contains(selector.substr(1))) {
            return elem;
          }
        } else {
          if (new RegExp('(^|\\s)' + selector.substr(1) + '(\\s|$)').test(elem.className)) {
            return elem;
          }
        }
      }
      if (firstChar === '#') {
        if (elem.id === selector.substr(1)) {
          return elem;
        }
      }
      if (firstChar === '[') {
        if (elem.hasAttribute(attribute[0])) {
          if (value) {
            if (elem.getAttribute(attribute[0]) === attribute[1]) {
              return elem;
            }
          } else {
            return elem;
          }
        }
      }

      // If selector is a tag
      if (elem.tagName.toLowerCase() === selector) {
        return elem;
      }

    }

    return null;

  };
  smoothScroll.escapeCharacters = function (id) {
    if (id.charAt(0) === '#') {
      id = id.substr(1);
    }

    var string = String(id);
    var length = string.length;
    var index = -1;
    var codeUnit;
    var result = '';
    var firstCodeUnit = string.charCodeAt(0);
    while (++index < length) {
      codeUnit = string.charCodeAt(index);
      if (codeUnit === 0x0000) {
        throw new InvalidCharacterError(
          'Invalid character: the input contains U+0000.'
        );
      }
      if (
        (codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
        (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (
          index === 1 &&
          codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
          firstCodeUnit === 0x002D
        )
      ) {
        result += '\\' + codeUnit.toString(16) + ' ';
        continue;
      }
      if (
        codeUnit >= 0x0080 ||
        codeUnit === 0x002D ||
        codeUnit === 0x005F ||
        codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
        codeUnit >= 0x0041 && codeUnit <= 0x005A ||
        codeUnit >= 0x0061 && codeUnit <= 0x007A
      ) {
        result += string.charAt(index);
        continue;
      }
      result += '\\' + string.charAt(index);
    }
    return '#' + result;
  };
  var easingPattern = function (type, time) {
    var pattern;
    if (type === 'easeInQuad') pattern = time * time;
    if (type === 'easeOutQuad') pattern = time * (2 - time);
    if (type === 'easeInOutQuad') pattern = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;
    if (type === 'easeInCubic') pattern = time * time * time;
    if (type === 'easeOutCubic') pattern = (--time) * time * time + 1;
    if (type === 'easeInOutCubic') pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1;
    if (type === 'easeInQuart') pattern = time * time * time * time;
    if (type === 'easeOutQuart') pattern = 1 - (--time) * time * time * time;
    if (type === 'easeInOutQuart') pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (--time) * time * time * time;
    if (type === 'easeInQuint') pattern = time * time * time * time * time;
    if (type === 'easeOutQuint') pattern = 1 + (--time) * time * time * time * time;
    if (type === 'easeInOutQuint') pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (--time) * time * time * time * time;
    return pattern || time;
  };
  var getEndLocation = function (anchor, headerHeight, offset) {
    var location = 0;
    if (anchor.offsetParent) {
      do {
        location += anchor.offsetTop;
        anchor = anchor.offsetParent;
      } while (anchor);
    }
    location = location - headerHeight - offset;
    return location >= 0 ? location : 0;
  };
  var getDocumentHeight = function () {
    return Math.max(
      root.document.body.scrollHeight, root.document.documentElement.scrollHeight,
      root.document.body.offsetHeight, root.document.documentElement.offsetHeight,
      root.document.body.clientHeight, root.document.documentElement.clientHeight
    );
  };
  var getDataOptions = function (options) {
    return !options || !(typeof JSON === 'object' && typeof JSON.parse === 'function') ? {} : JSON.parse(options);
  };
  var updateUrl = function (anchor, url) {
    if (root.history.pushState && (url || url === 'true') && root.location.protocol !== 'file:') {
      root.history.pushState(null, null, [root.location.protocol, '//', root.location.host, root.location.pathname, root.location.search, anchor].join(''));
    }
  };

  var getHeaderHeight = function (header) {
    return header === null ? 0 : (getHeight(header) + header.offsetTop);
  };
  smoothScroll.animateScroll = function (anchor, toggle, options) {
    var overrides = getDataOptions(toggle ? toggle.getAttribute('data-options') : null);
    var animateSettings = extend(settings || defaults, options || {}, overrides);
    var isNum = Object.prototype.toString.call(anchor) === '[object Number]' ? true : false;
    var anchorElem = isNum ? null : (anchor === '#' ? root.document.documentElement : root.document.querySelector(anchor));
    if (!isNum && !anchorElem) return;
    var startLocation = root.pageYOffset;
    if (!fixedHeader) {
      fixedHeader = root.document.querySelector(animateSettings.selectorHeader);
    }
    if (!headerHeight) {
      headerHeight = getHeaderHeight(fixedHeader);
    }
    var endLocation = isNum ? anchor : getEndLocation(anchorElem, headerHeight, parseInt(animateSettings.offset, 10));
    var distance = endLocation - startLocation;
    var documentHeight = getDocumentHeight();
    var timeLapsed = 0;
    var percentage, position;
    if (!isNum) {
      updateUrl(anchor, animateSettings.updateURL);
    }
    var stopAnimateScroll = function (position, endLocation, animationInterval) {
      var currentLocation = root.pageYOffset;
      if (position == endLocation || currentLocation == endLocation || ((root.innerHeight + currentLocation) >= documentHeight)) {
        clearInterval(animationInterval);
        if (!isNum) {
          anchorElem.focus();
        }
        animateSettings.callback(anchor, toggle); // Run callbacks after animation complete
      }
    };
    var loopAnimateScroll = function () {
      timeLapsed += 16;
      percentage = (timeLapsed / parseInt(animateSettings.speed, 10));
      percentage = (percentage > 1) ? 1 : percentage;
      position = startLocation + (distance * easingPattern(animateSettings.easing, percentage));
      root.scrollTo(0, Math.floor(position));
      stopAnimateScroll(position, endLocation, animationInterval);
    };
    var startAnimateScroll = function () {
      clearInterval(animationInterval);
      animationInterval = setInterval(loopAnimateScroll, 16);
    };
    if (root.pageYOffset === 0) {
      root.scrollTo(0, 0);
    }
    startAnimateScroll();
  };
  var eventHandler = function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
    var toggle = getClosest(event.target, settings.selector);
    if (toggle && toggle.tagName.toLowerCase() === 'a') {
      event.preventDefault();
      var hash = smoothScroll.escapeCharacters(toggle.hash);
      smoothScroll.animateScroll(hash, toggle, settings);
    }
  };
  var eventThrottler = function (event) {
    if (!eventTimeout) {
      eventTimeout = setTimeout(function () {
        eventTimeout = null;
        headerHeight = getHeaderHeight(fixedHeader);
      }, 66);
    }
  };
  smoothScroll.destroy = function () {
    if (!settings) return;
    root.document.removeEventListener('click', eventHandler, false);
    root.removeEventListener('resize', eventThrottler, false);
    settings = null;
    eventTimeout = null;
    fixedHeader = null;
    headerHeight = null;
    animationInterval = null;
  };
  smoothScroll.init = function (options) {
    if (!supports) return;
    smoothScroll.destroy();
    settings = extend(defaults, options || {});
    fixedHeader = root.document.querySelector(settings.selectorHeader);
    headerHeight = getHeaderHeight(fixedHeader);
    root.document.addEventListener('click', eventHandler, false);
    if (fixedHeader) {
      root.addEventListener('resize', eventThrottler, false);
    }
  };
  return smoothScroll;
});
