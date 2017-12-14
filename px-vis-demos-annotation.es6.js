(function() {
  Polymer({

    is: 'px-vis-demos-annotation',

    properties: {
      currentChart: {
        type: Object
      },

      isRadarParallel: {
        type: Boolean,
        value: false
      },

      _seriesFound: {
        type: String
      },

      annotationValue: {
        type: Array
      },

      allCharts: {
        type: Array
      },

      dropdownSeries: {
        type: Array
      },

      dropdownDisplayValue: {
        type: String
      },

      dropdownSelected: {
        type: String
      },

      annotationText: {
        type: String,
        value: ''
      },

      //whether the tooltip is locked in place for editing
      _lockTooltip: {
        type: Boolean,
        value: false
      },

      //current annotation being edited
      _currentDataEdit: {
        type: Object
      },

      //cancel save delete
      _editAction: {
        type: String,
        value: 'cancel'
      },

      editMode: {
        type: Boolean,
        value: false
      }
    },

    attached: function() {

      this.allCharts = [];
      this.allCharts.push(this.$.timeseries);
      this.allCharts.push(this.$.xy);
      this.allCharts.push(this.$.polar);
      this.allCharts.push(this.$.radar);
      this.allCharts.push(this.$.para);

      this.allCharts.forEach(function(element) {
        element.addEventListener('px-vis-annotation-creation', this.createAnnotation.bind(this));
        element.addEventListener('px-vis-annotation-enter', this.showAnnotation.bind(this));
        element.addEventListener('px-vis-annotation-leave', this.hideAnnotation.bind(this));
        element.addEventListener('px-vis-annotation-click', this.editAnnotation.bind(this));

        //lazy copying...
        var old = JSON.parse(JSON.stringify(element.toolbarConfig));
        old.config.customAnnotations =
          {
            'tooltipLabel': 'Annotations',
            'icon': 'px-vis:comment',
            'cursorIcon': 'px-vis:comment',
            'buttonGroup': 1,
            'onClick': function () {
              this.set('_internalShowTooltip', false);
              this.set('showStrongIcon', true);
              this.set('interactionSpaceConfig.searchType', 'closestPoint');
              this.set('interactionSpaceConfig.searchFor', 'point');
            },
            'onDeselect': function () {
              this.set('showStrongIcon', false);
              this.set('interactionSpaceConfig.searchFor', 'timestamp');
            },
            'actionConfig': {
              'mouseout': 'resetTooltip',
              'mousemove': 'calcTooltipData',
              'mousedown': 'null',
              'click': function (evt) {
                this.fire('px-vis-event-request', { 'eventName': 'px-vis-annotation-creation', 'data': { 'mouseCoords': evt.mouseCoords, 'clickTarget': evt.target, 'chart': this } })
              },
              'mouseup': 'null'
            },
            'subConfig': {
              'hideAnnotations': {
                'tooltipLabel': 'Hide Annotations',
                'icon': 'px-vis:hide',
                'buttonGroup': 1,
                'toggle': true,
                'onClick': 'function(button) {this.$$("px-vis-annotations").set("hide", button.selected);}'
              }
            }
          };
          element.set('toolbarConfig', old);
      }, this);

      this.$.modal.addEventListener('px-modal-accepted', this.modalClose.bind(this));

      this.$.tooltip.addEventListener('px-tooltip-hide', this._tooltipHide.bind(this));
      this.$.ttContent.addEventListener('tooltip-content-save', this._saveEdit.bind(this));
      this.$.ttContent.addEventListener('tooltip-content-delete', this._deleteEdit.bind(this));
      this.$.ttContent.addEventListener('tooltip-content-cancel', this._cancelEdit.bind(this));
    },

    createAnnotation: function(evt) {

      //store current chart for further use
      this.currentChart = evt.detail.data.chart;

      //get chart type
      this.isRadarParallel = this.currentChart.nodeName === 'PX-VIS-PARALLEL-COORDINATES' || this.currentChart.nodeName === 'PX-VIS-RADAR';

      var mousePos = evt.detail.data.mouseCoords;

      //find the series available
      if(this.isRadarParallel) {
        //find what axis we clicked on. The click target is the interaction
        //space on top of the axis
        var axis = evt.detail.data.clickTarget.parentElement;
        this.set('_seriesFound', axis.getAttribute('dimension'));
        this.annotationValue = this.getDataFromPixel(mousePos, _seriesFound);
      } else {

        var closest = this.currentChart.tooltipData.series[0].name,
            min = Number.MAX_VALUE,
            distance;

        //we search for the closest point
        this.currentChart.tooltipData.series.forEach(function(val) {

          //do square distance because we only care about comparing
          distance = Math.pow(val.coord[0] - mousePos[0], 2) + Math.pow(val.coord[1] - mousePos[1], 2);

          if(distance < min) {
            closest = {
              id: val.name,
              value: [val.value[this.currentChart.completeSeriesConfig[val.name].x], val.value[this.currentChart.completeSeriesConfig[val.name].y]]
            };
            min = distance;
          }
        }.bind(this));

        this.set('_seriesFound', closest.id);
        //here we use the value of the closest point we found. we could
        //also use the mouse position converted to value and keep track
        //of the closest point
        this.annotationValue = closest.value;
      }

      //open the modal
      this.$.modal.set('opened', true);
    },

    showAnnotation: function(evt) {

      if(!this._lockTooltip) {

        this.$.ttContent.annotationMessage = evt.detail.data.annotationData.data.message;

        //this.$.annotationPopover.set('for', evt.detail.data.icon);
        this.set('_ttTarget', evt.detail.data.icon);
        this.$.tooltip.set('opened', true);
      }
    },

    hideAnnotation: function(evt) {
      if(!this._lockTooltip) {
        this.$.tooltip.set('opened', false);
      }
    },

    editAnnotation: function(evt) {
      this._lockTooltip = true;

      this.set('editMode', true);

      //render our templates and repositon based on new content
      this.$.ttContent.forceTemplateRender();
      this.$.tooltip.setPosition();

      this._currentDataEdit = evt.detail.data.annotationData;
      this.currentChart = Polymer.dom(evt).localTarget;
    },

    modalClose: function(evt) {

      //process data and assign to currentChart
      var newData;

      newData = {
        x: this.annotationValue[0],
        y: this.annotationValue[1],
        data: {
          message: this.$.modalText.value.trim()
        },
        series: this._seriesFound
      };
      this.currentChart.push('annotationData', newData);
      this.$.modalText.value = '';
    },

    _saveEdit: function(evt) {
      this._editAction = 'save';
      this._closeEdit();
    },

    _cancelEdit: function(evt) {
      this._editAction = 'cancel';
      this._closeEdit();
    },

    _deleteEdit: function(evt) {
      this._editAction = 'delete';
      this._closeEdit();
    },

    _closeEdit: function() {
      this.$.tooltip.set('opened', false);
      this.set('editMode', false);
      this._lockTooltip = false;
    },

    _tooltipHide: function() {

      var index;
      if(this._editAction === 'save') {
        index = this.currentChart.annotationData.indexOf(this._currentDataEdit);
        this.currentChart.annotationData[index].data.message = this.$.ttContent.annotationMessage;
      } else if(this._editAction === 'delete') {
        index = this.currentChart.annotationData.indexOf(this._currentDataEdit);
        this.currentChart.splice('annotationData', index, 1);
      }

      this._editAction = 'none';
    }
  });
})();
