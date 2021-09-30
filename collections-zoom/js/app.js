'use strict';

// utility function for returning a promise that resolves after a delay
function delay(t) {
    return new Promise(function (resolve) {
        setTimeout(resolve, t);
    });
}

Promise.delay = function (fn, t) {
    // fn is an optional argument
    if (!t) {
        t = fn;
        fn = function () {};
    }
    return delay(t).then(fn);
}

Promise.prototype.delay = function (fn, t) {
    // return chained promise
    return this.then(function () {
        return Promise.delay(fn, t);
    });

}

var App = (function() {

  function App(config) {
    var defaults = {
      el: '#app',
      data: {},
      zoomDuration: 2000,
      packPadding: 12,
      auto: false
    };
    this.opt = _.extend({}, defaults, queryParams(), config);
    this.init();
  }

  function queryParams(){
    if (location.search.length) {
      var search = location.search.substring(1);
      return JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
    }
    return {};
  };

  function formatNumber(v){
    if (isNaN(v)) return v;
    return v.toLocaleString();
  }

  App.prototype.init = function(){
    var _this = this;
    var data = this.loadData(this.opt.data)

    console.log('Loaded data', data);

    this.loadMap(data);
  };

  App.prototype.loadData = function(data){
    data.children = _.map(data.children, function(dept){
      var subdivisions = dept.children;
      // generate random numbers for this amount of children
      if (Number.isInteger(subdivisions)) {
        var total = dept.value;
        dept.children = _.times(subdivisions, function(n){
          var minValue = Math.round(total / (subdivisions-n));
          var maxValue = Math.round(total / 2);
          if (minValue === total) {
            maxValue = minValue;
          }
          else if (minValue > maxValue) {
            var tmp = minValue;
            minValue = maxValue;
            maxValue = tmp;
          }
          var count = _.random(minValue, maxValue);
          total -= count;
          return {
            "name": "Subdivision " + (n+1),
            "value": count
          }
        });

      // created value (sum) for department
      } else if (_.has(dept, 'children')) {
        var sum =  _.reduce(dept.children, function(memo, subdivision){ return memo + subdivision.value; }, 0);
        dept.value = sum;
      }

      if (dept.value) {
        dept.formattedValue = formatNumber(dept.value);
      }

      if (dept.children) {
        dept.children = _.map(dept.children, function(subdivision){
          subdivision.formattedValue = formatNumber(subdivision.value);
          if (subdivision.unit) subdivision.formattedValue += " " + subdivision.unit;
          return subdivision;
        })
      }

      // dept = _.omit(dept, 'value');

      return dept;
    });

    data.formattedValue = formatNumber(_.reduce(data.children, function(memo, dept){ return memo + dept.value; }, 0));

    data = {
      "name": "root",
      "children": [
        data
      ]
    }

    return data;

  };

  App.prototype.loadMap = function(data){
    var _this = this;
    var $el = $(this.opt.el);
    var $dashboard = $('#dashboard');
    var width = $el.width();
    var height = $el.height();
    var view;
    var startingDepth = 1;

    var svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("background", '#000')
        .style("cursor", "pointer");

    var filterDef = svg.append("defs");
    var pattern = filterDef.append("pattern")
                  .attr("id", "panel")
                  .attr("patternContentUnits", "objectBoundingBox")
                  .attr("width", "100%")
                  .attr("height", "100%")
    pattern.append("image")
          .attr("xlink:href", "img/Trilobite_Layout_01.jpg")
          .attr("preserveAspectRatio", "none")
          .attr("width", "1")
          .attr("height", "1")

    var root = d3.pack()
        .size([width, height])
        .padding(this.opt.packPadding)
      (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));
    var focus = root;
    var startingNode = _.find(root.descendants(), function(d){ return d.depth === startingDepth; }) || root;

    var color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    function isNodeValid(d) {
      var delta = Math.abs(d.depth - focus.depth);
      return d !== root && delta === 1 && focus !== d && !d.data.isHidden;
    }

    var node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
        .attr("fill", function(d){
          // if (d.data.name === "Coleoptera") {
          //   console.log(d);
          //   console.log(d.ancestors())
          //   console.log(d.descendants())
          // }
          var fillColor = "white";

          if (d.data.fillColor) fillColor = d.data.fillColor;
          else if (d.children && !d.data.isLeaf) fillColor = color(d.depth);
          return fillColor;
        })
        .attr("pointer-events", d => isNodeValid(d) ? null : "none")
        .attr("id", d => d.data.name ? d.data.name.toLowerCase().replaceAll(' ', '-') : '')
        .style("fill-opacity", d => d.data.isHidden ? 0 : 1)
        .on("mouseover", function(e, d) {
          d3.select(this).attr("stroke", "#000");
          d3.select(this).attr("stroke-width", "2");
        })
        .on("mouseout", function(e, d) {
          d3.select(this).attr("stroke", null);
        })
        .on("click", function(e, d){
          isNodeValid(d) && (zoom(e, d), e.stopPropagation());
        });

    var label = svg.append("g")
        .style("font", "16px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .attr("fill", function(d){
          if (d.data.isHere) return "red";
          else if (d.depth===1) return "#3d6a64";
          else return "black";
        })
        .style("fill-opacity", d => d.parent === root && !d.data.isHidden || d.depth===1 ? 1 : 0)
        .style("display", d => d.parent === root && !d.data.isHidden ? "inline" : "none");

    label.append("tspan")
      .text(d => d.data.name || "")
      .style("font-weight", "bold")
      .attr("x", 0)
      .attr("dx", 0)
      .attr("dy", 22);

    label.append("tspan")
      .text(d => d.data.formattedValue || "")
      .attr("x", 0)
      .attr("dx", 0)
      .attr("dy", 22);

    d3.select(this.opt.el).node().appendChild(svg.node());

    function zoomTo(v) {
      var k = width / v[2];
      view = v;

      label.attr("transform", function(d){
        var x = (d.x - v[0]) * k;
        var y = (d.y - v[1]) * k - 22;
        if (d.data.isHere) {
          var z = Math.max(2, k);
          y = y - z*10;
        } else if (d.depth === 1) y = y - v[1] + k*40;
        return `translate(${x},${y})`;
      });
      node.attr("transform", function(d){
        var x = (d.x - v[0]) * k;
        var y = (d.y - v[1]) * k;
        return `translate(${x},${y})`;
      });
      node.attr("r", d => d.r * k);
    }

    function isLabelVisible(d){
      return d.parent === focus || d.data.isHere || d === focus && (!d.children || d.data.isLeaf) || d.depth===1 && d === focus;
    }

    function zoom(event, toNode) {
      focus = toNode;
      var transition = svg.transition()
          .duration(_this.opt.zoomDuration)
          .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
          });
      label
        .filter(function(d) { return isLabelVisible(d) || this.style.display === "inline"; })
        .transition(transition)
          .style("fill-opacity", d => isLabelVisible(d) ? 1 : 0)
          .on("start", function(d) { if (isLabelVisible(d)) this.style.display = "inline"; })
          .on("end", function(d) { if (!isLabelVisible(d)) this.style.display = "none"; });
      node.attr("pointer-events", d => isNodeValid(d) ? null : "none")

      // if (!toNode.children || toNode.data.isLeaf) {
      //   $dashboard.addClass('active');
      // } else {
      //   $dashboard.removeClass('active');
      // }
    }

    zoomTo([root.x, root.y, root.r * 2]);
    zoom({}, startingNode);

    function loop(){
      var stepDur = _this.opt.zoomDuration + 1000;
      var nodes = root.descendants();
      var n1 = _.find(nodes, function(d){ return d.data.name == 'AMNH Collections'; });
      var n2 = _.find(nodes, function(d){ return d.data.name == 'Paleontology'; });
      var n3 = _.find(nodes, function(d){ return d.data.name == 'Fossil Invertebrates'; });
      var n4 = _.find(nodes, function(d){ return d.data.name == 'You are here'; });

      Promise.delay(function(){ zoom({}, n2); }, stepDur)
             .delay(function(){ zoom({}, n3); }, stepDur)
             .delay(function(){ zoom({}, n4); }, stepDur)
             .delay(function(){ zoom({}, n3); }, stepDur)
             .delay(function(){ zoom({}, n2); }, stepDur)
             .delay(function(){ zoom({}, n1); }, stepDur)
             .delay(function(){ loop(); }, stepDur)
    };

    if (this.opt.auto) {
      loop();
    }

  };

  return App;

})();




var config = {
  data: {
    "name": "AMNH Collections",
    "children": [
      {
        "name": "Monell Cryo-Facility",
        "value": 126219
      },{
        "name": "Earth and Planetary Sciences",
        "children": [
          {"name": "EPS/Mineralogy", "value": 126527},
          {"name": "EPS/Meteorites", "value": 5294},
          {"name": "Tektites", "value": 921},
          {"name": "EPS/Mineral Deposits", "value": 13441},
          {"name": "EPS/Petrology", "value": 24603},
          {"name": "Astro/Observations", "value": 45, "unit": "TB"},
          {"name": "Astro/Simulations", "value": 50, "unit": "TB"},
          {"name": "Astro/Instruments", "value": 2}
        ]
      },{
        "name": "Anthropology",
        "children": [
          {"name": "Archaeology", "value": 340641},
          {"name": "Ethnology", "value": 169893},
          {"name": "Biology", "value": 23009},
          {"name": "Other (casts, molds)", "value": 7215}
        ]
      },{
        "name": "Vertebrate Zoology",
        "children": [
          {"name": "Herpetology", "value": 376154},
          {"name": "Ichthyology", "value": 3231638},
          {"name": "Mammalogy", "value": 279812},
          {"name": "Ornithology", "value": 890540}
        ]
      },{
        "name": "Paleontology",
        "children": [
          {"name": "Fossil Amphibians, Reptiles and Birds", "value": 33231},
          {"name": "Fossil Fish", "value": 28687},
          {"name": "Fossil Invertebrates", "value": 5110000, "isLeaf": true, "children": [
            {"name": "You are here", "value": 10000, "isHere": true, "fillColor": "url(#panel)"},
            {"value": 1972780, "isHidden": true}
          ]},
          {"name": "Fossil Mammals", "value": 400000},
          {"name": "Fossil Plants", "value": 440}
        ]
      },{
        "name": "Invertebrate Zoology",
        "children": [
          {"name": "Amber", "value": 12744},
          {"name": "Arachnida", "value": 1216768},
          {"name": "Cnidaria", "value": 8826},
          {"name": "Coleoptera", "value": 1982780},
          {"name": "Crustacea", "value": 116500},
          {"name": "Diptera", "value": 1138717},
          {"name": "Hemiptera", "value": 976518},
          {"name": "Hymenoptera", "value": 8724094},
          {"name": "Isoptera", "value": 1000000},
          {"name": "Lepidoptera", "value": 2263456},
          {"name": "Minor Orders", "value": 824644},
          {"name": "Misc. Bulk", "value": 33597},
          {"name": "Mollusca", "value": 1606459},
          {"name": "Myriapoda", "value": 79880},
          {"name": "Other Invert Phyla", "value": 3399856},
          {"name": "Protists", "value": 47895}
        ]
      }
    ]
  }
};

var app = new App(config);
