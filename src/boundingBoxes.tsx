import {
  checkAvailability,
  colorToDifficulty,
  convertUnitsToPixels,
  difficultyToColor,
  isFullyAnnotated,
  markAnnotated,
  max,
  min, MouseData, range,
  recordAnnotationTime,
  selectColor
} from "./utils";
import {
  addIrregularBox,
  annotate,
  annotateWholeMeasures,
  annotateWithinCoordinates,
  areAllNotesAnnotatedWithSameDifficulty
} from "./annotations";

const createBoundingBox = (x: any, y: any, height: any, width: any, yMiddle: any, heightMiddle: any, color: string, measureNumber: number, wholeMeasure = true) => {
   const boundingBox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
   const boundingBoxMiddle = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    // Staff's bounding box
   boundingBox.setAttribute("fill", color);
   boundingBox.setAttribute("fill-opacity", "0.25");
   boundingBox.setAttribute("x", convertUnitsToPixels(x).toString());
   boundingBox.setAttribute("y", convertUnitsToPixels(y).toString());
   boundingBox.setAttribute("height", convertUnitsToPixels(height).toString());
   boundingBox.setAttribute("width", convertUnitsToPixels(width).toString());
   boundingBox.classList.add("boundingBox");

   // Bounding box between staffs
   boundingBoxMiddle.setAttribute("fill", color);
   boundingBoxMiddle.setAttribute("fill-opacity", "0.25");
   boundingBoxMiddle.setAttribute("x", convertUnitsToPixels(x).toString());
   boundingBoxMiddle.setAttribute("y", convertUnitsToPixels(yMiddle).toString());
   boundingBoxMiddle.setAttribute("height", convertUnitsToPixels(heightMiddle).toString());
   boundingBoxMiddle.setAttribute("width", convertUnitsToPixels(width).toString());
   boundingBoxMiddle.classList.add("boundingBox");

   if (wholeMeasure) {
      boundingBoxMiddle.classList.add("box".concat(measureNumber.toString()));
      boundingBox.classList.add("box".concat(measureNumber.toString()));  // unique box id
   } else {
     boundingBox.classList.add("irregularBox_".concat(measureNumber.toString()))
     boundingBoxMiddle.classList.add("irregularBox_".concat(measureNumber.toString()))
   }

   document.querySelector("svg")!.append(boundingBox);
   document.querySelector("svg")!.append(boundingBoxMiddle);

        // if the color is the select color, identify it as erasable
   if (color === selectColor) {
     boundingBox.classList.add("erasableBoundingBox");
     boundingBoxMiddle.classList.add("erasableBoundingBox");
   }


}
export const renderBoundingBoxesMeasures = (measureNumbers: Array<number> | number, color: string, measureList: any, scoreName: string) => {
  /**
   * Renders a box on the score
   * @param  {Array<number> | number} measureNumbers:  A list of measure numbers or a measure number to render boxes in
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score name.
   * @return None
   */
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]

  for (const measure of measureList) {
    let measureNumber = measure[0].MeasureNumber;
    if (checkAvailability(measureNumbers, measureNumber)) {
      if (color !== selectColor && areAllNotesAnnotatedWithSameDifficulty(measure, scoreName)) {
        cleanBox(measureNumber, scoreName);  // clean previous boxes to avoid infiniteBoxes
      }
      for (let staff = 0; staff < measure.length; staff++) {
        const positionAndShape = measure[staff].PositionAndShape;
        const positionAndShape1 = measure[1].PositionAndShape;
        const height = 4;
        const width = positionAndShape.BoundingRectangle.width;
        const x = positionAndShape.AbsolutePosition.x
        const yNew = positionAndShape.AbsolutePosition.y;
        const yMiddle = yNew + height;
        const heightMiddle = max(positionAndShape1.AbsolutePosition.y - positionAndShape.AbsolutePosition.y - 4, 0);
        createBoundingBox(x, yNew, height, width, yMiddle, heightMiddle, color, measureNumber)
      }
    }
  }
};

export function renderBoundingBoxesFromCoords(initData: MouseData, finalData: MouseData,  color: string, measureList: any, scoreName: string) {
  // initData = [initPos, initNearestNote, initMeasure]
  // finalData = [finalPos, finalNearestNote, finalMeasure]
  let measureNumbers: Array<number>
  let firstMeasureNumber = measureList[0][0].measureNumber
  // @ts-ignore
  measureNumbers = range(initData.measure, finalData.measure)
  console.log("MEASURE NUMBERS: ", measureNumbers)
  const height = 4;

  for (let measureNumber of measureNumbers) {
    console.log("--------------------------------------------------------")
    console.log("COORDS MEASURE NUMBER:", measureNumber)
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
      if (color !== selectColor) {
        // @ts-ignore
        cleanBox(measureNumber, scoreName);  // clean previous boxes to avoid infiniteBoxes
      }
      if (measureNumber !== initData.measure && measureNumber !== finalData.measure){
        console.log("calling renderBoundingBoxesAndAnnotate with measure: ", measureNumber)
        // @ts-ignore
        renderBoundingBoxesAndAnnotate([measureNumber], color, measureList, scoreName)
      }
      else {
        for (let staff = 0; staff < measure.length; staff++) {
          const positionAndShape = measure[staff].PositionAndShape;
          const positionAndShape1 = measure[1].PositionAndShape;
          let x = measureNumber === initData.measure ? initData.pos.x : positionAndShape.AbsolutePosition.x;
          const yNew = positionAndShape.AbsolutePosition.y;

          let width;
           // annotation within the same measure
          if (measureNumber === initData.measure && measureNumber === finalData.measure) {
            console.log("measure number within same measure", measureNumber)
            width = finalData.pos.x - initData.pos.x;
            annotateWithinCoordinates(x, finalData.pos.x, measureNumber, staff, measureList, color, scoreName)
          }
          // rendering an irregular box on the first measure
          else if (measureNumber === initData.measure) {
            console.log("measure: ", measureNumber, "MEASURE IS INIT DATA MEASURE")
            // x coordinate of the end of the measure
            const measureFinalX = positionAndShape.AbsolutePosition.x + positionAndShape.BoundingRectangle.width;
            // width of the box: from the initial mouse position until the end of the measure
            width = measureFinalX - initData.pos.x
            annotateWithinCoordinates(initData.pos.x, measureFinalX, measureNumber, staff, measureList, color, scoreName)
          }
          // rendering an irregular box on the last measure
          else if (measureNumber === finalData.measure) {
            console.log("measure: ", measureNumber, "MEASURE IS FINAL DATA MEASURE")
            // width is from the start position of the measure to the final x from the mouse coordinates
            width = finalData.pos.x - positionAndShape.AbsolutePosition.x;
            console.log(finalData.pos.x, positionAndShape.AbsolutePosition.x )
            console.log(width)
            annotateWithinCoordinates(positionAndShape.AbsolutePosition.x, finalData.pos.x, measureNumber, staff, measureList, color, scoreName)
          }
          const yMiddle = yNew + height;
          const heightMiddle = max(positionAndShape1.AbsolutePosition.y - positionAndShape.AbsolutePosition.y - 4, 0);
          createBoundingBox(x, yNew, height, width, yMiddle, heightMiddle, color, measureNumber, false)
          addIrregularBox(x, yNew, height, width, yMiddle, heightMiddle, color, measureNumber, scoreName)
        }
      }
      }
    recordAnnotationTime(scoreName);
}

export const renderBoundingBoxesAndAnnotate = (measureNumbers: Array<number> | number, color: string, measureList: any, scoreName: string) => {
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]
  renderBoundingBoxesMeasures(measureNumbers, color, measureList, scoreName)
  annotateWholeMeasures(measureNumbers, color, measureList, scoreName);

  // check if whole score is annotated
  let isAnnotated = isFullyAnnotated(measureList, scoreName);

  if (isAnnotated){
          console.log("Score is annotated!")
          markAnnotated(scoreName)
        } else {
          markAnnotated(scoreName, false)
        }
  recordAnnotationTime(scoreName);
}

export const cleanSelectBoxes = () => {
  /**
   * Cleans all select (gray) boxes.
   * @return None
   */
  const boxes = document.querySelectorAll(".erasableBoundingBox");
  boxes.forEach((box) => {
    box.remove();
  });

};

function renderIrregularBoxFromNotes(measureNumber: number, measureList: any, scoreName: string) {
  let annotations = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let measure = measureList[measureNumber]
  for (let staffNumber = 0; staffNumber < measure.length; staffNumber++ ) {
    let staffEntries = measure[staffNumber].staffEntries;
        // @ts-ignore
      let notesInStaff = staffEntries.length
      for (let noteNumber = 0; noteNumber < notesInStaff; noteNumber++){
        let note = staffEntries[noteNumber]
        console.log(note)
        }
      }
}

export const renderBoxesFromLocalStorage = (measureList: any, scoreName: string, renderSelect = true) => {
  /**
   * Renders boxes as stored in localStorage
   * @param  {OpenSheetMusicDisplay.measureList} measureList:  OSMD's measure list
   * @param  {String} scoreName:  The score name.
   * @param {boolean} renderSelect: If True, renders the select box.
   * @return The first available box.
   */
  let annotations = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let irregularBoxes = JSON.parse(window.localStorage.getItem("irregularBoxes_".concat(scoreName)) as string);
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  console.log(firstMeasureNumber)
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let coloredBoxes = [];


  for (let measureNumber = firstMeasureNumber; measureNumber <= lastMeasureNumber; measureNumber++) {
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    if (areAllNotesAnnotatedWithSameDifficulty(measure, scoreName)) {
      console.log("MEASURE ANNOTATED WITH SAME DIFFICULTY: ", measureNumber)
      let measureDifficulty = annotations[`measure-${measureNumber}`][`staff-${0}`][`note-${0}`];

      if (measureDifficulty && measureDifficulty !== "None") {
        // @ts-ignore
        let measureColor = difficultyToColor[measureDifficulty];
        renderBoundingBoxesMeasures([measureNumber], measureColor, measureList, scoreName);
        coloredBoxes.push(measureNumber);
      }
    } else {
      console.log("MEASURE NOT ANNOTATED WITH SAME DIFFICULTY: ", measureNumber)
      renderIrregularBoxFromNotes(measureNumber, measureList, scoreName)
    }
  }
  let firstAvailableBox = measureList[0][0].MeasureNumber;
  if (coloredBoxes.length !== 0) {
    firstAvailableBox = min(coloredBoxes[coloredBoxes.length - 1] + 1, lastMeasureNumber);
  }
  if (renderSelect){
    renderBoundingBoxesMeasures([firstAvailableBox], selectColor, measureList, scoreName);
  }
  return firstAvailableBox;
}

export const cleanAllBoxes = () => {
  /**
  * Cleans all boxes.
  * @return None.
  */
  const boxes = document.querySelectorAll(".boundingBox");
  boxes.forEach((box) => {
    box.remove();
  });
};

export function cleanBox(boxNumber: number, scoreName: string) {
  /**
 * Cleans a bounding box
 * @param  {number} boxNumber:  The box number to erase.
 * @param  {String} scoreName:  The score name.
 * @return None.
 */
  const boxes = document.querySelectorAll(".box".concat(boxNumber.toString()));
  if (boxes.length > 0) {
    boxes.forEach((box) => {
      box.remove();
    });
  }
};

function cleanBoxAndAnnotate(boxNumber: number, measureList: any, scoreName: string, measure=true){
  cleanBox(boxNumber, scoreName);
  if (measure){
    annotateWholeMeasures(boxNumber, selectColor, measureList, scoreName)
  } else {
    annotate(boxNumber, selectColor, measureList, scoreName) // todo use with note
  }
}

export function renderBoxAndContinue(boxNumber: number, color: string, measureList: any, scoreName: string) {
  /**
   * Renders a bounding box and updates the current Box number to currentBox += 1
   * @param  {number} boxNumber:  The box number to highlight
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList:  OSMD's measure list.
   * @param  {String} scoreName:  The score's name.
   * @return {number} boxNumber: The updated box number.
   */
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let annotations = JSON.parse(window.localStorage.getItem(scoreName) as string);

  if (color === selectColor) {
    boxNumber -= 1;
  }
  cleanSelectBoxes();
  let no_annotations = annotations[boxNumber] === "None";
  // @ts-ignore
  if (annotations[boxNumber] !== colorToDifficulty[color] || no_annotations) {
    cleanBox(boxNumber, scoreName);
    renderBoundingBoxesAndAnnotate([boxNumber], color, measureList, scoreName);
  }

  boxNumber = min(boxNumber + 1, lastMeasureNumber);
  renderBoundingBoxesMeasures([boxNumber], selectColor, measureList, scoreName)

  return boxNumber;
}

export function deleteBoxAndGoBack(boxNumber: number, measureList: any, scoreName: string) {
  /**
   * Deletes a bounding box, updates boxNumber and renders the selectBox.
   * @param  {number} boxNumber:  The box number to delete
   * @param  {OpenSheetMusicDisplay.measureList} measureList:  OSMD's measure list.
   * @param  {String} scoreName:  The score's name.
   * @return {number} boxNumber: The updated box number.
   */
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  cleanBoxAndAnnotate(boxNumber, measureList, scoreName)
  cleanSelectBoxes();
  boxNumber = max(boxNumber - 1, firstMeasureNumber);
  renderBoundingBoxesMeasures([boxNumber], selectColor, measureList, scoreName); // render select box
  return boxNumber;
}