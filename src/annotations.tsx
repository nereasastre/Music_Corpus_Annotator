import {colorToDifficulty, selectColor} from "./utils";
import {renderBoundingBoxesMeasures} from "./boundingBoxes";

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

export function annotateWithinCoordinates(initX: any, finalX: any, measureNumber: number, staffNumber: number, measureList: any, color: string, scoreName: string){
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  let firstMeasureNumber = measureList[0][0].measureNumber;
  let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
  let staff = measure[staffNumber]
  let staffEntries = staff.staffEntries
  for (let noteIdx = 0; noteIdx < staffEntries.length; noteIdx++ ){
    let note = staffEntries[noteIdx]
    let notePosition = note.PositionAndShape.absolutePosition.x;
    if (initX <= notePosition && notePosition <= finalX ){
      // @ts-ignore
      annotations[`measure-${measureNumber}`][`staff-${staffNumber}`][`note-${noteIdx}`] = colorToDifficulty[color];
    }
  }
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
}


export function initLocalStorageToNone(measureList: any, scoreName: string, renderSelect = true) {
  let annotations = {};
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;

  for (let measureNumber = firstMeasureNumber; measureNumber < lastMeasureNumber + 1; measureNumber++) {
    // some measureNumbers start at 1 and some at 0 but measureList always starts at 0
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    // @ts-ignore
    annotations[`measure-${measureNumber}`] = {}
    for( let staffNumber = 0; staffNumber < measure.length; staffNumber++ ) {
      let staffEntries = measure[staffNumber].staffEntries;
        // @ts-ignore
      annotations[`measure-${measureNumber}`][`staff-${staffNumber}`] = {};
      let notesInStaff = staffEntries.length  // number of notes in staff

      for (let note = 0; note < notesInStaff; note++){
        // @ts-ignore
        annotations[`measure-${measureNumber}`][`staff-${staffNumber}`][`note-${note}`] = "None";
      }
    }
    }

  // @ts-ignore
  annotations["isCorrupted"] = false;
  // @ts-ignore
  annotations["startTime"] = Date.now();
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));

  if (renderSelect){
    renderBoundingBoxesMeasures([firstMeasureNumber], selectColor, measureList, scoreName);
  }

  return annotations;
}

export function areAllNotesAnnotatedWithSameDifficulty(measure: any, scoreName: string) {
    let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
    let measureNumber = measure[0].measureNumber;
    let firstNoteAnnotations = annotations[`measure-${measureNumber}`][`staff-${0}`][`note-${0}`];
    for( let staffNumber = 0; staffNumber < measure.length; staffNumber++ ) {
      let staffEntries = measure[staffNumber].staffEntries;
      let notesInStaff = staffEntries.length  // number of notes in staff
      for (let note = 0; note < notesInStaff; note++){
        let noteAnnotations = annotations[`measure-${measureNumber}`][`staff-${staffNumber}`][`note-${note}`]
        if (noteAnnotations !== firstNoteAnnotations && noteAnnotations !== undefined){
            return false
          }
      }
    }
    return true
}

export function initIrregularBoxes(scoreName: string) {
  let irregularBoxes = {}
  // @ts-ignore
  window.localStorage.setItem("irregularBoxes_".concat(scoreName), JSON.stringify(irregularBoxes));
}

export function addIrregularBox(x: any, y: any, height: any, width: any, yMiddle: any, heightMiddle: any, color: string, measureNumber: number, scoreName: string){
  let irregularBoxes = JSON.parse(window.localStorage.getItem("irregularBoxes_".concat(scoreName)) as string);

  irregularBoxes[measureNumber] = irregularBoxes[measureNumber] ? irregularBoxes[measureNumber] : []

  let irregularBoxesinMeasure = irregularBoxes[measureNumber].length
  irregularBoxes[measureNumber][irregularBoxesinMeasure] = {}
  irregularBoxes[measureNumber][irregularBoxesinMeasure]["x"] = x
  irregularBoxes[measureNumber][irregularBoxesinMeasure]["y"] = y
  irregularBoxes[measureNumber][irregularBoxesinMeasure]["height"] = height
  irregularBoxes[measureNumber][irregularBoxesinMeasure]["width"] = width
  irregularBoxes[measureNumber][irregularBoxesinMeasure]["yMiddle"] = yMiddle
  irregularBoxes[measureNumber][irregularBoxesinMeasure]["heightMiddle"] = heightMiddle
  irregularBoxes[measureNumber][irregularBoxesinMeasure]["color"] = color
  window.localStorage.setItem("irregularBoxes_".concat(scoreName), JSON.stringify(irregularBoxes));
}