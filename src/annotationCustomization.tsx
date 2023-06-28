import React from "react";
import {createInverseDictionary} from './utils'

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
export const colorToAnnotation = { "#33FF42": "easy", "#FFBE33": "medium", "#FF4633": "hard", "#b7bbbd": "None", "#f08080": "KeyQ",
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
export const annotationToColor = createInverseDictionary(colorToAnnotation)
console.log(annotationToColor)

function entries<T>(obj: Record<string, T>): [string, T][] {
  let ownProps = Object.keys(obj),
      i = ownProps.length,
      resArray: [string, T][] = new Array(i);
  while (i--)
    resArray[i] = [ownProps[i], obj[ownProps[i]]];
  return resArray;
}


export function Legend() {
  /**
   * Legend of the colors and keys to be displayed in the application
   */
  const colorEntries = entries(keyToColor)

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
