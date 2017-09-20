(function() {
  Polymer({

    is: 'px-vis-iron-list',

    properties: {
      data: {
        type: Object,
        observer: '_dataChanged'
      },

      _internalData: {
        type: Object
      }
    },

    _dataChanged: function() {

      var result = [],
          newItem,
          rand;

      for(var i=0; i<this.data.length; i++) {

        newItem = {};
        rand = Math.random();

        //get data and extents
        newItem.chartData = this.data[i].data;

        //generate config for chart type
        if(rand < 0.4) {
          newItem.isTimeseries = true;
          newItem.chartExtents = {
            x: this.data[i].extents.x,
            y: this.data[i].extents.y
          };
          newItem.seriesConfig = this._generateConfigTS();
        } else if(rand < 0.8){
          newItem.isXY = true;
          newItem.chartExtents = {
            x: [0, 999],
            y: this.data[i].extents.y
          };
          newItem.seriesConfig = this._generateConfigXYPolar(false);
        } else {
          newItem.isPolar = true;
          newItem.chartExtents = {
            y: this.data[i].extents.y
          };
          newItem.seriesConfig = this._generateConfigXYPolar(true);
        }

        result.push(newItem);
      }

      this.set('_internalData', result);
    },

    _generateConfigXYPolar: function(polar) {
      var symbol = Math.random() > 0.5 ? 'square' : 'diamond';
      return {
        y0: {
          type: 'scatter',
          x: 'x',
          y: 'y0',
          markerSymbol: symbol,
          markerSize: polar ? 8 : 64
        },
        y1: {
          type: 'scatter',
          x: 'x',
          y: 'y1',
          markerSymbol: symbol,
          markerSize: polar ? 8 : 64
        },
        y2: {
          type: 'scatter',
          x: 'x',
          y: 'y2',
          markerSymbol: symbol,
          markerSize: polar ? 8 : 64
        },
        y3: {
          type: 'scatter',
          x: 'x',
          y: 'y3',
          markerSymbol: symbol,
          markerSize: polar ? 8 : 64
        }
      };
    },

    _generateConfigTS: function() {
      return {
        y0: {
          x: 't',
          y: 'y0'
        },
        y1: {
          x: 't',
          y: 'y1'
        },
        y2: {
          x: 't',
          y: 'y2'
        },
        y3: {
          x: 't',
          y: 'y3'
        }
      };
    }
  });
})();