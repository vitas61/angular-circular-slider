/*!The MIT License (MIT)

Copyright (c) 2015 Prince John Wesley (princejohnwesley@gmail.com)
**/

(function(window, angular, undefined) {

  //utility functions
  function toInteger(o) {
    return (o | 0) === o;
  }

  function toBoolean(o) {
    return (typeof o === 'boolean') || o === 'true';
  }

  function and(left, right) {
    return function(o) {
      return left(o) && right(o);
    };
  }

  // elem is jqLite
  function $$(elem) {
    // only one element
    var dom = elem[0];
    var computedStyle = window.getComputedStyle(dom, null);

    function getCss(prop) {
      return function() {
        return computedStyle[prop];
      };
    }

    function props(p) {
      return dom[p];
    }

    function getProps(prop) {
      return function() {
        return props(prop);
      };
    }

    function parseToFloat(value) {
      return parseFloat(value) || 0.0;
    }

    function addFloats(left, right) {
      return function() {
        return parseToFloat(left()) + parseToFloat(right());
      }
    }

    function applyFloatFn(fn) {
      return function(param) {
        return parseToFloat(fn(param));
      };
    }

    function offsetParent() {
      return angular.element(dom.offsetParent);
    }

    function offset() {
      var box = dom.getBoundingClientRect();
      var docElem = dom.ownerDocument.documentElement;

      return {
        top: box.top + docElem.scrollTop - docElem.clientTop,
        left: box.left + docElem.scrollLeft - docElem.clientLeft
      };
    }


    function position() {
      var p = $$(offsetParent());
      var po = p.offset();
      var box = offset();

      po.top += parseToFloat(p.css('borderTopWidth'));
      po.left += parseToFloat(p.css('borderLeftWidth')); 

      return {
        top: box.top - po.top - parseToFloat(elem.css('marginTop')),
        left: box.left - po.left - parseToFloat(elem.css('marginLeft')),
      };
    }

    return {
      css: elem.css,
      prop: props,
      width: applyFloatFn(getCss('width')),
      height: applyFloatFn(getCss('height')),
      // outer area + margin
      outerWidth: addFloats(addFloats(getProps('offsetWidth'), getCss('marginLeft')),
        getCss('marginRight')),
      outerHeight: addFloats(addFloats(getProps('offsetHeight'), getCss('marginTop')),
        getCss('marginBottom')),
      innerWidth: addFloats(addFloats(getCss('width'), getCss('paddingLeft')),
        getCss('paddingRight')),
      innerHeight: addFloats(addFloats(getCss('height'), getCss('paddingTop')),
        getCss('paddingBottom')),
      offset: offset,
      offsetParent: offsetParent,
      position: position,
    };
  }


  var cs = {};

  var props = {

    defaults: {
      min: 0,
      max: 359,
      value: 0,
      radius: 75,
      innerCircleRatio: '0.5',
      borderRatio: '0.1',
      indicatorBallRatio: '0.2',
      handleDistRatio: '1.0',
      clockwise: true,
      shape: "Circle",
      touch: true,
      animate: true,
      animateDuration: 360,
      selectable: false,
      onSlide: angular.noop,

    },

    template: '\
      <div class="acs-panel">\
        <div class="acs">\
          <div class="acs-value" ng-transclude>\
          </div>\
        </div>\
        <div class="acs-indicator">\
        </div>\
      </div>\
    ',
  };

  var shapes = {
    "Circle": {
      drawShape: function(acsComponents, radius) {
        var d = radius * 2;
        var rpx = d + "px";
        var acs = acsComponents.acs;
        var acsValue = acsComponents.acsValue;
        var acsPanel = acsComponents.acsPanel;
        var scope = acsComponents.scope;
        var w = radius * scope.borderRatio;

        acs.css({
          'width': rpx,
          'height': rpx,
          'border-radius': rpx,
          'border-width': w + 'px',
        });

        var pd = d + w;

        acsPanel.css({
          'border-width': w + 'px',
          'border-radius': pd + 'px',
        });

        var $$acs = $$(acs);
        var $$acsValue = $$(acsValue);
        var iRadius = scope.innerCircleRatio * radius;

        acsValue.css({
          'width': (iRadius * 2) + "px",
          'height': (iRadius * 2) + "px",
          'font-size': iRadius / 2 + "px",
        });

        var corner = radius - iRadius;
        acsValue.css({
          'top': (corner - $$acs.prop('clientTop') - $$acsValue.prop('clientTop')) + "px",
          'left':(corner - $$acs.prop('clientLeft') - $$acsValue.prop('clientLeft')) + "px",
        });
      },
      getCenter: function(acsPosition, acsRadius) {
        return {
          x: acsPosition.left + acsRadius,
          y: acsPosition.top + acsRadius,
          r: acsRadius
        };
      },
      deg2Val: function(deg) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (deg < 0 || deg > 359)
          throw "Invalid angle " + deg;

        deg = (deg + 90) % 360;
        return Math.round(deg * (range / 360.0)) + scope.min;
      },
      val2Deg: function(value) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (value < scope.min || value > scope.max)
          throw "Invalid range " + value;

        var nth = value - scope.min;

        return (Math.round(nth * (360.0 / range)) - 90) % 360;
      },
    },
    "Half Circle": {
      drawShape: function(acsComponents, radius) {
        var d = radius * 2;
        var acs = acsComponents.acs;
        var acsValue = acsComponents.acsValue;
        var acsPanel = acsComponents.acsPanel;
        var scope = acsComponents.scope;
        var w = radius * scope.borderRatio;

        acs.css({
          'width': d + "px",
          'height': radius + "px",
          'border-radius': d + "px " + d + "px 0 0",
          'border-bottom': 'none',
          'border-width': w + 'px',
        });

        var pd = d + w;

        acsPanel.css({
          'border-width': w + 'px',
          'border-radius': pd + "px " + pd + "px 0 0",
          'border-bottom': 'none'
        });

        var $$acs = $$(acs);
        var $$acsValue = $$(acsValue);
        var iRadius = scope.innerCircleRatio * radius;

        acsValue.css({
          'width': (iRadius * 2) + "px",
          'height': (iRadius * 2) + "px",
          'font-size': iRadius / 2 + "px",
        });

        var corner = radius - iRadius;
        acsValue.css({
          'top': (corner - $$acs.prop('clientTop') - $$acsValue.prop('clientTop')) + "px",
          'left':(corner - $$acs.prop('clientLeft') - $$acsValue.prop('clientLeft')) + "px",
        });
      },
      getCenter: function(acsPosition, acsRadius) {
        return {
          x: acsPosition.left + acsRadius,
          y: acsPosition.top + acsRadius,
          r: acsRadius
        };
      },
      deg2Val: function(deg) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (deg < 0 || deg > 359)
          throw "Invalid angle " + deg;

        deg = (deg + 180) % 360;
        return Math.round(deg * (range / 180.0)) + scope.min;
      },
      val2Deg: function(value) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (value < scope.min || value > scope.max)
          throw "Invalid range " + value;

        var nth = value - scope.min;

        return (Math.round(nth * (180.0 / range)) - 180) % 360;
      },
    },
    "Half Circle Left": {
      drawShape: function(acsComponents, radius) {
        var d = radius * 2;
        var acs = acsComponents.acs;
        var acsValue = acsComponents.acsValue;
        var acsPanel = acsComponents.acsPanel;
        var scope = acsComponents.scope;
        var w = radius * scope.borderRatio;

        acs.css({
          'height': d + "px",
          'width': radius + "px",
          'border-radius': d + "px 0 0 " + d + "px",
          'border-right': 'none',
          'border-width': w + 'px',
        });

        var pd = d + w;

        acsPanel.css({
          'border-width': w + 'px',
          'border-radius': pd + "px 0 0" + pd + "px",
          'border-right': 'none'
        });

        var $$acs = $$(acs);
        var $$acsValue = $$(acsValue);
        var iRadius = scope.innerCircleRatio * radius;

        acsValue.css({
          'width': (iRadius * 2) + "px",
          'height': (iRadius * 2) + "px",
          'font-size': iRadius / 2 + "px",
        });

        var corner = radius - iRadius;
        acsValue.css({
          'top': (corner - $$acs.prop('clientTop') - $$acsValue.prop('clientTop')) + "px",
          'left':(corner - $$acs.prop('clientLeft') - $$acsValue.prop('clientLeft')) + "px",
        });
      },
      getCenter: function(acsPosition, acsRadius) {
        return {
          x: acsPosition.left + acsRadius * 2,
          y: acsPosition.top + acsRadius * 2,
          r: acsRadius * 2
        };
      },
      deg2Val: function(deg) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (deg < 0 || deg > 359)
          throw "Invalid angle " + deg;

        deg = (deg - 90) % 360;
        return Math.round(deg * (range / 180.0)) + scope.min;
      },
      val2Deg: function(value) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (value < scope.min || value > scope.max)
          throw "Invalid range " + value;

        var nth = value - scope.min;

        return (Math.round(nth * (180.0 / range)) + 90) % 360;
      },
    },

    "Half Circle Right": {
      drawShape: function(acsComponents, radius) {
        var d = radius * 2;
        var acs = acsComponents.acs;
        var acsValue = acsComponents.acsValue;
        var acsPanel = acsComponents.acsPanel;
        var scope = acsComponents.scope;
        var w = radius * scope.borderRatio;

        acs.css({
          'height': d + "px",
          'width': radius + "px",
          'border-radius': "0 " + d + "px " + d + "px 0",
          'border-left': 'none',
          'border-width': w + 'px',
        });

        var pd = d + w;

        acsPanel.css({
          'border-width': w + 'px',
          'border-radius': "0 " + pd + "px" + pd + "px 0",
          'border-left': 'none'
        });

        var $$acs = $$(acs);
        var $$acsValue = $$(acsValue);
        var iRadius = scope.innerCircleRatio * radius;

        acsValue.css({
          'width': (iRadius * 2) + "px",
          'height': (iRadius * 2) + "px",
          'font-size': iRadius / 2 + "px",
        });

        var corner = radius - iRadius;
        acsValue.css({
          'top': (corner - $$acs.prop('clientTop') - $$acsValue.prop('clientTop')) + "px",
          'right':(corner - $$acs.prop('clientLeft') - $$acsValue.prop('clientLeft')) + "px",
        });
      },
      getCenter: function(acsPosition, acsRadius) {
        return {
          x: acsPosition.left,
          y: acsPosition.top + acsRadius * 2,
          r: acsRadius * 2
        };
      },
      deg2Val: function(deg) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (deg < 0 || deg > 359)
          throw "Invalid angle " + deg;

        deg = (deg + 90) % 360;
        return Math.round(deg * (range / 180.0)) + scope.min;
      },
      val2Deg: function(value) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (value < scope.min || value > scope.max)
          throw "Invalid range " + value;

        var nth = value - scope.min;

        return (Math.round(nth * (180.0 / range)) - 90) % 360;
      },
    },
    "Half Circle Bottom": {
      drawShape: function(acsComponents, radius) {
        var d = radius * 2;
        var acs = acsComponents.acs;
        var acsValue = acsComponents.acsValue;
        var acsPanel = acsComponents.acsPanel;
        var scope = acsComponents.scope;
        var w = radius * scope.borderRatio;

        acs.css({
          'width': d + "px",
          'height': radius + "px",
          'border-radius': "0 0 " + d + "px " + d + "px",
          'border-top': 'none',
          'border-width': w + 'px',
        });

        var pd = d + w;

        acsPanel.css({
          'border-width': w + 'px',
          'border-radius': "0 0 " + pd + "px " + pd + "px",
          'border-top': 'none'
        });

        var $$acs = $$(acs);
        var $$acsValue = $$(acsValue);
        var iRadius = scope.innerCircleRatio * radius;

        acsValue.css({
          'width': (iRadius * 2) + "px",
          'height': (iRadius * 2) + "px",
          'font-size': iRadius / 2 + "px",
        });

        var corner = radius - iRadius;
        acsValue.css({
          'bottom': (corner - $$acs.prop('clientTop') - $$acsValue.prop('clientTop')) + "px",
          'left':(corner - $$acs.prop('clientLeft') - $$acsValue.prop('clientLeft')) + "px",
        });
      },
      getCenter: function(acsPosition, acsRadius) {
        return {
          x: acsPosition.left + acsRadius,
          y: acsPosition.top,
          r: acsRadius
        };
      },
      deg2Val: function(deg) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (deg < 0 || deg > 359)
          throw "Invalid angle " + deg;

        return Math.round(deg * (range / 180.0)) + scope.min;
      },
      val2Deg: function(value) {
        var scope = cs.components.scope;
        var range = scope.max - scope.min + 1;
        if (value < scope.min || value > scope.max)
          throw "Invalid range " + value;

        var nth = value - scope.min;

        return Math.round(nth * (180.0 / range));
      },
    }
  };




  function circularSlider() {
    return {
      template: props.template,
      restrict: 'EA',
      transclude: true,
      controller: CircularSliderController,
      controllerAs: 'slider',
      scope: {
        csSlider: '=?',
        min: '@',
        max: '@',
        value: '=?',
        radius: '@',
        innerCircleRatio: '@',
        indicatorBallRatio: '@',
        handleDistRatio: '@',
        borderRatio: '@',
        clockwise: '@',
        shape: '@',
        touch: '@',
        animate: '@',
        animateDuration: '@',
        selectable: '@',
        onSlide: '@',
      },
      link: link,
    };
  }

  function link(scope, element, attr, controller) {
    angular.forEach(scope.$$isolateBindings, function(binding, key) {
      if (angular.isUndefined(scope[key])) {
        scope[key] = props.defaults[key];
      }
    });

    // validations
    controller.validateBindings();

    // building components
    element.addClass('acs-slider');
    redrawShape();

    // wiring events

    // bind slider in scope
    scope.csSlider = {
      'setValue' : setValue,
    };

    // private functions

    function redrawShape() {
      var component = getComponents();
      var radius = getRadius();
      shapes[scope.shape].drawShape(component, radius);
      drawIndicatorBall(component, radius);

      var $$acs = $$(component.acs);
      var $$acsIndicator = $$(component.acsIndicator);
      cs.acsPosition = $$acs.position();
      cs.acsOuterArea = $$acs.outerWidth() - $$acs.width();
      cs.acsBallOuterArea = $$acsIndicator.outerWidth() - $$acsIndicator.width();
  
      cs.acsRadius = ($$acs.width() + cs.acsOuterArea) / 2;
      cs.acsBallRadius = ($$acsIndicator.width() + cs.acsBallOuterArea) / 2;
      cs.acsCenter = shapes[scope.shape].getCenter(cs.acsPosition, cs.acsRadius);

      setValue(scope.value || scope.min);

    }

    function setValue(value) {
      controller.validateBinding('value');

      var val = scope.clockwise ? value : (scope.max - value);
      var d360 = shapes[scope.shape].val2Deg(val);
      var rad = d360 * Math.PI / 180;
      var components = getComponents();

      var x = cs.acsCenter.x + (cs.acsCenter.r * scope.handleDistRatio * Math.cos(rad)) - cs.acsBallRadius;
      var y = cs.acsCenter.y + (cs.acsCenter.r * scope.handleDistRatio * Math.sin(rad)) - 2 * cs.acsBallRadius;
      
      components.acsIndicator.css('top', y + "px");
      components.acsIndicator.css('left', x + "px");
      
      scope.value = value;
      scope.onSlide(value);
    }

    function drawIndicatorBall(component, radius) {
      component.acsIndicator.css({
        'width': (radius * scope.indicatorBallRatio) + "px",
        'height': (radius * scope.indicatorBallRatio) + "px",
      });
    };

    function getComponents() {
      return cs.components ? cs.components : buildComponents();

      function buildComponents() {
        var acsPanel = element.children();
        var acsPanelChildren = acsPanel.children();
        var acs = angular.element(acsPanelChildren[0]);
        var acsIndicator = angular.element(acsPanelChildren[1]);
        var acsValue = acs.children();

        var acsComponents = {
          'acsPanel': acsPanel,
          'acs': acs,
          'acsIndicator': acsIndicator,
          'acsValue': acsValue,
          'scope': scope,
          'ctrl': controller,
        };
        return (cs.components = acsComponents);
      }
    }

    function getRadius() {
      return Math.abs(parseInt(scope.radius)) || props.defaults.radius;
    }
  }


  function CircularSliderController($scope) {

    function typeErrorMsg(typeName) {
      return function(binding, value) {
        return [binding, '(', value, ') - Expected', typeName].join(' ');
      };
    }

    var shapes = ['Circle', 'Half Circle', 'Half Circle Left', 'Half Circle Right', 'Half Circle Bottom'];

    var transforms = {
      integer: {
        bindings: ['min', 'max', 'value', 'radius', 'animateDuration'],
        transform: parseInt
      },
      number: {
        bindings: ['innerCircleRatio', 'borderRatio', 'indicatorBallRatio', 'handleDistRatio'],
        transform: parseFloat,
      },
      'function': {
        bindings: ['onSlide'],
        transform: function(fun) {
          return fun ? fun : angular.noop;
        },
      }
    };

    var rules = {
      type: {
        integer: {
          bindings: ['min', 'max', 'value', 'radius', 'animateDuration'],
          test: toInteger,
          onError: typeErrorMsg('integer')
        },
        number: {
          bindings: ['innerCircleRatio', 'borderRatio', 'indicatorBallRatio', 'handleDistRatio'],
          test: Number.isFinite,
          onError: typeErrorMsg('number')
        },
        'boolean': {
          bindings: ['touch', 'animate', 'selectable', 'clockwise'],
          test: toBoolean,
          onError: typeErrorMsg('boolean')
        },
        'function': {
          bindings: ['onSlide'],
          test: angular.isFunction,
          onError: typeErrorMsg('function')
        },
      },

      constraint: {
        range: {
          bindings: ['min', 'max'],
          test: function minMax() {
            return $scope.min <= $scope.max;
          },
          onError: function() {
            return ['Invalid slide range: [', $scope.min, ',', $scope.max, ']'].join('');
          },
        },
        value: {
          bindings: ['value'],
          test: function valueInRange(value) {
            return $scope.min <= value && value <= $scope.max;
          },
          onError: function() {
            return [$scope.value, '(value) out of range: [', $scope.min, ',', $scope.max, ']'].join('');
          },
        },
        shape: {
          bindings: ['shape'],
          test: function shapeSupported() {
            return shapes.indexOf($scope.shape) !== -1;
          },
          onError: function() {
            return ['Unsupported shape: ', $scope.shape].join('');
          },
        },
        ratio: {
          bindings: ['innerCircleRatio', 'handleDistRatio', 'borderRatio', 'indicatorBallRatio'],
          test: function ratio(value) {
            return value >= 0.0 && value <= 1.0;
          },
          onError: function(b, value) {
            return [b + '(', value, ') is out of range: [0,1]'].join('');
          },
        },
      }
    };


    this.validateBindings = function(property) {
      var props = property ? property : this.props,
        p, binding;

      for (p in props) {
        // Apply binding transformer
        if (props[p].transform) {
          $scope[p] = props[p].transform($scope[p]);
        }
        // test binding types and constraints
        props[p].tests.forEach(function(t) {
          if (!t.test($scope[p])) {
            throw t.onError(p, $scope[p]);
          }
        });
      }
    };

    this.validateBinding = function(binding) {
      if(angular.isUndefined(binding)) return;
      var property = {};
      property[binding] = this.props[binding];
      this.validateBindings(property);
    };

    function init(controller) {

      // build constraints & transforms
      angular.forEach(rules, function(category, rule) {
        angular.forEach(category, function(action, name) {
          var bindings = action.bindings;
          bindings.map(function(binding) {
            controller[binding] = controller[binding] || {
              tests: []
            };
            controller[binding].tests.push({
              test: action.test,
              onError: action.onError
            });
          });
        });
      });

      angular.forEach(transforms, function(transformer) {
        angular.forEach(transformer.bindings, function(binding) {
          controller[binding].transform = transformer.transform;
        })
      });
    }


    init(this.props = {});

  }


  CircularSliderController.$inject = ['$scope'];

  angular.module('angular.circular-slider', [])
    .directive('circularSlider', circularSlider);

}(window, window.angular));
