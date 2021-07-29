'use strict';

var App = (function() {

  function App(config) {
    var defaults = {
      el: '#app',
      data: {}
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  App.prototype.init = function(){
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

      // otherwise ensure sum adds up to children values
      } else if (_.has(dept, 'value')) {
        var expectedTotal = dept.value;
        var sum =  _.reduce(dept.children, function(memo, subdivision){ return memo + subdivision.value; }, 0);
        if (sum < expectedTotal) {
          dept.children.push({
            "name": "Other",
            "value": expectedTotal - sum
          })
        }
      }

      dept = _.omit(dept, 'value');

      return dept;
    });

    data = {
      "name": "root",
      "children": [
        data
      ]
    }

    return data;

  };

  App.prototype.loadMap = function(data){
    var $el = $(this.opt.el);
    var width = $el.width();
    var height = $el.height();
    var view;

    var svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("background", '#000')
        .style("cursor", "pointer")
        .on("click", function(e){
          zoom(e, root);
        });

    var root = d3.pack()
        .size([width, height])
        .padding(3)
      (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));
    var focus = root;

    var color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    var node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); d3.select(this).attr("stroke-width", "2"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on("click", function(e, d){
          focus !== d && (zoom(e, d), e.stopPropagation());
        });

    var label = svg.append("g")
        .style("font", "16px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name);

    d3.select(this.opt.el).node().appendChild(svg.node());

    function zoomTo(v) {
      const k = width / v[2];
      view = v;
      label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d => d.r * k);
    }

    function zoom(event, d) {
      focus = d;
      var transition = svg.transition()
          .duration(event.altKey ? 7500 : 750)
          .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
          });
      label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
          .style("fill-opacity", d => d.parent === focus ? 1 : 0)
          .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
          .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    zoomTo([root.x, root.y, root.r * 2]);


  };

  return App;

})();

var config = {
  data: {
    "name": "AMNH Collections",
    "children": [
      {
        "name": "Cryo Collection",
        "value": 117728,
        "children": 4
      },{
        "name": "Earth and Planetary Sciences",
        "value": 155298,
        "children": 4
      },{
        "name": "Anthropology",
        "value": 540433,
        "children": 8
      },{
        "name": "Vertebrate Zoology",
        "value": 4422837,
        "children": 10
      },{
        "name": "Paleontology",
        "value": 5564095,
        "children": 12
      },{
        "name": "Invertebrate Zoology",
        "value": 23357868,
        "children": [
          {"name": "Amber", "value": 12744},
          {"name": "Arachnida", "value": 1216768},
          {"name": "Cnidaria", "value": 8824},
          {"name": "Coleoptera", "value": 1982780},
          {"name": "Crustace", "value": 29022},
          {"name": "Diptera", "value": 1138717},
          {"name": "Hemiptera", "value": 976518},
          {"name": "Hymenoptera", "value": 8724094},
          {"name": "Isoptera", "value": 1000000},
          {"name": "Lepidoptera", "value": 2263456},
          {"name": "Minor orders", "value": 824644},
          {"name": "Misc bulk", "value": 33597},
          {"name": "Molusca", "value": 500034},
          {"name": "Myriapoda", "value": 79880},
          {"name": "Other Invert Phhyla", "value": 53978},
          {"name": "Protists", "value": 47895}
        ]
      }
    ]
  }
};

var app = new App(config);
