/// <reference path="../jquery/jquery.d.ts"/>

declare module JQueryUI {

  interface ValueSliderOptions {
    animate?: any; // bool, string or number
    disabled?: bool;
    max?: number;
    min?: number;
    step?: number;
    value?: number;
  }

}

interface JQuery {

  valueslider(): JQuery;
  valueslider(methodName: string): JQuery;
  valueslider(methodName: 'destroy'): void;
  valueslider(methodName: 'disable'): void;
  valueslider(methodName: 'enable'): void;
  valueslider(methodName: 'refresh'): void;
  valueslider(methodName: 'value'): number;
  valueslider(methodName: 'value', value: number): void;
  valueslider(methodName: 'widget'): JQuery;
  valueslider(options: JQueryUI.ValueSliderOptions): JQuery;
  valueslider(optionLiteral: string, optionName: string): any;
  valueslider(optionLiteral: string, options: JQueryUI.ValueSliderOptions): any;
  valueslider(optionLiteral: string, optionName: string, optionValue: any): JQuery;

}