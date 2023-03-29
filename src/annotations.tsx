import {colorToDifficulty, recordAnnotationTime, selectColor} from "./utils";
import {renderBoundingBoxesMeasures} from "./boundingBoxes";
import {eel} from "./App";


export function annotateWholeMeasures(measureNumbers: number | Array<number>, color: string, measureList: any,  scoreName: string){
  /**
   * Annotates all of the notes in a measure with the same annotation
   * @param {number | Array<number>} measureNumbers: A number or array of numbers with the measure numbers to annotate
   * @param {String} color: The HEX code of the color
   * @param {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList: The osmd measureList
   * @param {string} scoreName: The score name
   * @returns None
   */

  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]  // if number, convert to array
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);

  for (let measureNumber of measureNumbers) {
    // Some scores have firstMeasureNumber = 0 or 1, but osmd measureList always starts at 0
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    if (measureNumber >= firstMeasureNumber && measureNumber <= lastMeasureNumber) {
      for (let staff = 0; staff < measure.length; staff++) {
        let notesInStaff = measure[staff].staffEntries.length  // number of notes in staff
        for (let note = 0; note < notesInStaff; note++) {
          // @ts-ignore
          annotations[`measure-${measureNumber}`][`staff-${staff}`][`note-${note}`] = colorToDifficulty[color];
        }
      }
    }
  }
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
  // check if al notes have been annotated and update the "annotated" field in index.json
  eel.update_annotations(scoreName, annotations)
  recordAnnotationTime(scoreName);
}

export function annotateWithinCoordinates(initX: number, finalX: number, measureNumber: number, staffNumber: number, measureList: any, color: string, scoreName: string){
  /**
   * Annotates notes in a measure and staff within initX and finalX
   * @param {number} initX: The initial X coordinate
   * @param {number} finalX: The final X coordinate
   * @param {number} measureNumber: The measure number to annotate
   * @param {number} staff: The staff to annotate (0 or 1)
   * @param {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList: The osmd measureList
   * @param {String} color: The color of the annotation
   * @param {String} scoreName: The score Name
   * @returns None
   */

  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  let firstMeasureNumber = measureList[0][0].measureNumber;
  let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]  // osmd measure object
  let staff = measure[staffNumber]  // osmd staff object
  let staffEntries = staff.staffEntries  // array of all notes in staff
  for (let noteIdx = 0; noteIdx < staffEntries.length; noteIdx++ ){
    let note = staffEntries[noteIdx]
    let notePosition = note.PositionAndShape.absolutePosition.x;
    if (initX <= notePosition && notePosition <= finalX ){
      // @ts-ignore
      annotations[`measure-${measureNumber}`][`staff-${staffNumber}`][`note-${noteIdx}`] = colorToDifficulty[color];
    }
  }
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));
  // check if al notes have been annotated and update the "annotated" field in index.json
  eel.update_annotations(scoreName, annotations)
  recordAnnotationTime(scoreName);
}


export function initLocalStorageToNone(measureList: any, scoreName: string, renderSelect = true, resetAnnotationTime = true) {
  /**
   * Annotates notes in a measure and staff within initX and finalX
   * @param {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList: The osmd measureList
   * @param {String} scoreName: The score Name
   * @param {boolean} renderSelect: If True, renders a select (gray) box in the first measure.
   * @param {boolean} resetAnnotationTime: If True, resets the annotation time to 0
   * @returns { { [key: string]: any } } - The annotation data object.
   */

  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);
  if (!annotations) {  // if the annotations were not recorded in localstorage
    annotations = {};
  }
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  console.log("INIT LOCAL STORAGE TO NONE", firstMeasureNumber, lastMeasureNumber)
  for (let measureNumber = firstMeasureNumber; measureNumber < lastMeasureNumber + 1; measureNumber++) {
    // some measureNumbers start at 1 and some at 0 but measureList always starts at 0
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    // @ts-ignore
    annotations[`measure-${measureNumber}`] = {}
    for( let staffNumber = 0; staffNumber < measure.length; staffNumber++ ) {
      let staffEntries = measure[staffNumber].staffEntries;  // list of all notes in staff
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
  if (resetAnnotationTime) {
    // @ts-ignore
    annotations["startTime"] = Date.now();  // used for computing annotation time
    // @ts-ignore
    annotations["annotationTime"] = 0  // start annotation time at 0
  }
  window.localStorage.setItem(scoreName, JSON.stringify(annotations));

  if (renderSelect){
    renderBoundingBoxesMeasures([firstMeasureNumber], selectColor, measureList);
  }
  // check if al notes have been annotated and update the "annotated" field in index.json
  eel.update_annotations(scoreName, annotations)
  recordAnnotationTime(scoreName);
  return annotations;
}

export function areAllNotesAnnotatedWithSameDifficulty(measure: any, scoreName: string) {
  /**
   * Checks whether the all of the notes in the measure are annotated with the same difficulty
   * @param {OpenSheetMusicDisplay.GraphicSheet.measureList[number]} measure: A measure object inside the measureList array
   * @param {String} scoreName: The score name
   * @returns True if all notes in the measure are annotated the same, False otherwise
   */
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
