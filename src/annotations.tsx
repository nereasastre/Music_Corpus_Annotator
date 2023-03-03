import {colorToDifficulty, selectColor} from "./utils";
import {renderBoundingBoxes} from "./boundingBoxes";

export function annotate(measureNumbers: number | Array<number>, color: string, measureList: any,  scoreName: string){
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  for (let measure of measureNumbers){
    if (measure >= firstMeasureNumber && measure <= lastMeasureNumber) {
          // @ts-ignore
      annotations[measure] = colorToDifficulty[color];
    }
  }
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
}

export function annotateWholeMeasures(measureNumbers: number | Array<number>, color: string, measureList: any,  scoreName: string){
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  for (let measure of measureNumbers) {
    if (measure >= firstMeasureNumber && measure <= lastMeasureNumber) {
      for (let staff = 0; staff < measureList[measure].length; staff++) {
        let notesInStaff = measureList[measure][staff].staffEntries.length  // number of notes in staff
        for (let note = 0; note < notesInStaff; note++) {
          // @ts-ignore
          annotations[`measure-${measure}`][`staff-${staff}`][`note-${note}`] = colorToDifficulty[color];
        }
      }
    }
  }
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
}



export function initLocalStorageToNone(measureList: any, scoreName: string, renderSelect = true) {
  let annotations = {};
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;

  for (let measure = firstMeasureNumber; measure < lastMeasureNumber + 1; measure++) {
    // @ts-ignore
    annotations[`measure-${measure}`] = {}
    for( let staff = 0; staff < measureList[measure].length; staff++ ) {
        // @ts-ignore
      annotations[`measure-${measure}`][`staff-${staff}`] = {};
      let notesInStaff = measureList[measure][staff].staffEntries.length  // number of notes in staff

      for (let note = 0; note < notesInStaff; note++){
        // @ts-ignore
        annotations[`measure-${measure}`][`staff-${staff}`][`note-${note}`] = "None";
      }
    }
    }

  // @ts-ignore
  annotations["isCorrupted"] = false;
  // @ts-ignore
  annotations["startTime"] = Date.now();
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));

  if (renderSelect){
    renderBoundingBoxes([firstMeasureNumber], selectColor, measureList, scoreName);
  }

  return annotations;
}