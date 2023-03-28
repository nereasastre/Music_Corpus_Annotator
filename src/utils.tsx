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

// dictionary that maps keys to their HEX color
export const keyToColor = { "1": "#33FF42", "2": "#FFBE33", "3": "#FF4633",
  "KeyQ": "#f08080",
  "KeyW": "#808000",
  "KeyE": "#FFFF00",
  "KeyR": "#ff00ff",
  "KeyT": "#9acd32",
  "KeyY": "#2e8b57",
  "KeyU": "#00ffff",
  "KeyI": "#34ebc9",
  "KeyO": "#ffe4b5",
  "KeyP": "#8f34eb",
  "KeyA": "#720026",
  "KeyS": "#2f4f4f",
  "KeyD": "#43AA8B",
  "KeyF": "#DAF7A6",
  "KeyG": "#ff1493",
  "KeyH": "#577590",
  "KeyJ": "#800080",
  "KeyK": "#2C2D72",
  "KeyL": "#B4C5E4"};

// dictionary that maps HEX colors to their key
export const colorToDifficulty = { "#33FF42": "easy", "#FFBE33": "medium", "#FF4633": "hard", "#b7bbbd": "None", "#f08080": "KeyQ",
  "#808000": "KeyW",
  "#FFFF00": "KeyE",
  "#ff00ff": "KeyR",
  "#9acd32": "KeyT",
  "#2e8b57": "KeyY",
  "#00ffff": "KeyU",
  "#34ebc9": "KeyI",
  "#ffe4b5": "KeyO",
  "#8f34eb": "KeyP",
  "#720026": "KeyA",
  "#2f4f4f": "KeyS",
  "#43AA8B": "KeyD",
  "#DAF7A6": "KeyF",
  "#ff1493": "KeyG",
  "#577590": "KeyH",
  "#800080": "KeyJ",
  "#2C2D72": "KeyK",
  "#B4C5E4": "KeyL" };

// dictionary that maps what is stored in localstorage to its HEX color
export const difficultyToColor = { "easy": "#33FF42", "medium": "#FFBE33", "hard": "#FF4633", "None": "#b7bbbd", "KeyQ": "#f08080",
  "KeyW": "#808000",
  "KeyE": "#FFFF00",
  "KeyR": "#ff00ff",
  "KeyT": "#9acd32",
  "KeyY": "#2e8b57",
  "KeyU": "#00ffff",
  "KeyI": "#34ebc9",
  "KeyO": "#ffe4b5",
  "KeyP": "#8f34eb",
  "KeyA": "#720026",
  "KeyS": "#2f4f4f",
  "KeyD": "#43AA8B",
  "KeyF": "#DAF7A6",
  "KeyG": "#ff1493",
  "KeyH": "#577590",
  "KeyJ": "#800080",
  "KeyK": "#2C2D72",
  "KeyL": "#B4C5E4"};


export function Legend() {
  /**
   * Legend of the colors and keys to be displayed in the application
   */
  const colorEntries = Object.entries(keyToColor);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {colorEntries.map(([key, color]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", marginRight: 10 }}>
          <div
            style={{
              backgroundColor: color,
              width: 20,
              height: 20,
              marginRight: 5,
            }}
          />
          <div>{key[key.length - 1]}</div>
        </div>
      ))}
    </div>
  );
}

