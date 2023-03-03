// @ts-ignore
// import { PointF2D } from "opensheetmusicdisplay";

import {PointF2D} from "opensheetmusicdisplay";
import {eel} from "./App";

export const convertUnitsToPixels = (units: number) => units * 10;
export function checkAvailability(arr: Array<number>, val: number) {
  return arr.some(function (arrVal) {
    return val === arrVal;
  });
}

export function mousePosition(event: MouseEvent) {
  const units = 10;
  const xpos = event.pageX / units;
  const ypos = (event.pageY - 200) / units;  // Subtract the pixels corresponding to the page header 
  return new PointF2D(xpos, ypos);
}

export function max(a: number, b: number) {
  if (a > b) {
    return a;
  }
  return b;
}

export function min(a: number, b: number) {
  if (a < b) {
    return a;
  }
  return b;
}

export function range(start: number, end: number){
  let list = []
  for (let i = start; i <= end; i++){
    list.push(i)
  }
  return list
}

export interface IAppState {
  file: string;
}

export const contains = (array: Array<any>, element: any ) =>
    array.indexOf(element) > -1;

export function isFullyAnnotated(measureList: any, scoreName: string) {
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  for (let measure = firstMeasureNumber; measure <= lastMeasureNumber; measure++) {
    if (annotations[measure] === "None") {
      return false  // some measure has not been annotated
    }
  }
  return true
}

export function markCorrupted(scoreName: string){
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  annotations["isCorrupted"] = true;
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
}

export function markAnnotated(scoreName: string, annotated = true){
  console.log("markAnnotated has been called")
  console.log("markAnnotated state.file before calling eel", scoreName)
  eel.mark_annotated(scoreName, annotated)
}

export function recordAnnotationTime(scoreName: string) {
    let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
    annotations["annotationTime"] += (Date.now() - annotations["startTime"])
    annotations["startTime"] = Date.now()
    console.log("Annotation time:", annotations["annotationTime"]);
    window.localStorage.setItem(scoreName, JSON.stringify(annotations));
}

export const selectColor = "#b7bbbd";
export const firstFile = "craig_files/beethoven-piano-sonatas-master/kern/sonata01-1.musicxml";
export const lastFile = "xmander_files/5028687.musicxml";
export const keyToColor = { "1": "#33FF42", "2": "#FFBE33", "3": "#FF4633" };
export const colorToDifficulty = { "#33FF42": "easy", "#FFBE33": "medium", "#FF4633": "hard", "#b7bbbd": "None" };
export const difficultyToColor = { "easy": "#33FF42", "medium": "#FFBE33", "hard": "#FF4633", "None": "#b7bbbd" };


