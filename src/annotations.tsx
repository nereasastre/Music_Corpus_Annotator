import {colorToDifficulty, recordAnnotationTime, selectColor} from "./utils";
import {renderBoundingBoxesMeasures} from "./boundingBoxes";
import {eel} from "./App";


export function annotateWholeMeasures(measureNumbers: number | Array<number>, color: string, measureList: any,  scoreName: string){
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  for (let measureNumber of measureNumbers) {
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    if (measureNumber >= firstMeasureNumber && measureNumber <= lastMeasureNumber) {
      for (let staff = 0; staff < measure.length; staff++) {
        console.log("STAFF", staff)
        let notesInStaff = measure[staff].staffEntries.length  // number of notes in staff
        for (let note = 0; note < notesInStaff; note++) {
          console.log("NOTE", note)
          console.log(colorToDifficulty[selectColor])
          // @ts-ignore
          annotations[`measure-${measureNumber}`][`staff-${staff}`][`note-${note}`] = colorToDifficulty[color];
        }
      }
    }
  }
  console.log("Annotations: ", annotations)
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
  eel.update_annotations(scoreName, annotations)
  recordAnnotationTime(scoreName);

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
  eel.update_annotations(scoreName, annotations)
  recordAnnotationTime(scoreName);

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
  eel.update_annotations(scoreName, annotations)
  recordAnnotationTime(scoreName);

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
