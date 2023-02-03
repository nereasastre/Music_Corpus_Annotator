// @ts-ignore
// import { PointF2D } from "opensheetmusicdisplay";

import {PointF2D} from "opensheetmusicdisplay";

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




export const keyToColor = { "1": "#33FF42", "2": "#FFBE33", "3": "#FF4633" };
export const colorToDifficulty = { "#33FF42": "easy", "#FFBE33": "medium", "#FF4633": "hard" };
export const difficultyToColor = { "easy": "#33FF42", "medium": "#FFBE33", "hard": "#FF4633" };

