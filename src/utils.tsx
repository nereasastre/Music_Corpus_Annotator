// @ts-ignore
// import { PointF2D } from "opensheetmusicdisplay";

import {PointF2D} from "opensheetmusicdisplay";
import React from "react";

export const convertUnitsToPixels = (units: number) => units * 10;  // converts osmd units to pixels

export function mousePosition(event: MouseEvent) {
  /**
   * Converts the mouseEvent coordinates to OSMD coordinates
   * @param {MouseEvent} event: The mouse event containing the coordinates
   * @returns An osmd PointF2D with the converted mouse coordinates
   */
  const units = 10;
  const xpos = event.pageX / units;
  const ypos = (event.pageY - 200) / units;  // Subtract the pixels corresponding to the page header 
  return new PointF2D(xpos, ypos);
}

export const max = (a: number, b: number) => { return a > b ? a : b}  // return max between a and b
export const min = (a: number, b: number) => { return a < b ? a : b}  // return min between a and b

export function range(start: number, end: number){
  /**
   * Create a list of numbers from start to end (included)
   * @param {number} start: The first number to append to the list
   * @param {number} end: The last number to append to the list
   * @returns {Array<number>} list: The array form start to end
   */
  let list = []
  for (let i = start; i <= end; i++){
    list.push(i)
  }
  return list
}

export interface IAppState {  // interface to save the file in the app state
  file: string;
}

export interface MouseData {  // interface to save the position of a mouse click and it's closest measure
  pos: any;
  measure: number;
}

// returns true if array contains element, false otherwise
export const contains = (array: Array<any>, element: any ) => array.indexOf(element) > -1;

export function markCorrupted(scoreName: string){
  /**
   * Flags file as corrupted
   * @param {String} scoreName: The score name
   */
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  annotations["isCorrupted"] = true;
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
}


export function recordAnnotationTime(scoreName: string) {
  /**
   * Computes the annotation time in milliseconds and saves it to localStorage
   * @param {string} scoreName: The score name
   */
    let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
    // The added annotation time is the past annotation time + now - the last startTime
    annotations["annotationTime"] += (Date.now() - annotations["startTime"])
    annotations["startTime"] = Date.now()
    window.localStorage.setItem(scoreName, JSON.stringify(annotations));
}

export const selectColor = "#b7bbbd";  // color for box selection (no annotation)
export const difficultyKeycodes = ["Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"];  // keycodes to flag difficulty
// keycodes to flag sections (Q-L)
export const sectionKeycodes = ["KeyQ", "KeyW","KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"];

export function createInverseDictionary(obj: { [key: string]: string }): { [key: string]: string } {
  const inverseDict: { [key: string]: string } = {};

  for (const key in obj) {
    const value = obj[key];
    inverseDict[value] = key;
  }

  return inverseDict;
}


