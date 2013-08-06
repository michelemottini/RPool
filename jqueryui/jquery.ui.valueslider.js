// Slider displaying its numeric value - 
// 
// Uses the jQueryUI built-in slider adding a read-only control displaying the current value.
// It does not support multiple vlaues, and works only with horizontally.

(function ($) {

$.widget("ui.valueslider", {

  // default options
  options: {
    animate: false,
    disabled: false,
    max: 100,
    min: 0,
    step: 1,
    value: 0,

    change: null
  },

  _create: function () {
    this.element.addClass("ui-widget");
    this.slider = $("<div/>")
      .appendTo(this.element)
      .slider({
        animate: this.options.animate,
        disabled: this.options.disabled,
        max: this.options.max,
        min: this.options.min,
        orientation: "horizontal",
        range: false,
        step: this.options.step,
        value: this.options.value,
        values: null
      })
      .css("float", "left");
    var dummyValue = this.options.max;
    if (this.options.step < 1) {
      dummyValue += this.options.step;
    }
    if (this.options.min < 0) {
      dummyValue = -dummyValue;
    }
    this.label = $("<label/>", {
      text: dummyValue.toString()
    })
      .appendTo(this.element)
      .addClass("ui-widget-content")
      .css("margin-top", "-0.25em")
      .css("margin-left", "0.75em")
      .css("float", "left");
    var textWidth = this.label.width();
    var dummyDivToComputeEMWidth = $("<div/>")
      .appendTo(this.element)
      .width("1.25em");
    var extraWidth = dummyDivToComputeEMWidth.width();
    dummyDivToComputeEMWidth.remove();
    this.slider.width(this.element.width() - textWidth - extraWidth);
    this.label.width(textWidth);
    this.label.text(this.options.value);
    var that = this;
    this.slider.on("slidechange", function (event, ui) {
      that.label.text(ui.value);
      that._trigger("change", event, ui);
    });
  },

  _destroy: function () {
    this.slider.slider("destroy");
    this.element.empty();
    this.element.removeClass("ui-widget");
  },

  _setOptions: function (options) {
    // Use the _setOption function to handle the options that apply to the embedded slider
    for (var key in options) {
      this._setOption(key, options[key]);
    }
  },

  _setOption: function (key, value) {
    if (key === "animate" || key === "disabled" || key === "max" || key === "min" || key === "step" || key === "value") {
      // These options apply to the embedded slider: redirect them
      this.slider.slider("option", key, value);
      return;
    }
    this._super(key, value);
  }

});

})(jQuery)