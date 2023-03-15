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
  annotateWholeMeasures,
  annotateWithinCoordinates,
  areAllNotesAnnotatedWithSameDifficulty
} from "./annotations";

interface Box {
  x: number,
  y: number,
  height: number,
  width: number,
  yMiddle: number,
  heightMiddle: number,
  color: string,
  measureNumber: number
}

const createBoundingBox = (x: number, y: number, height: number, width: number, yMiddle: number, heightMiddle: number, color: string, measureNumber: number, wholeMeasure = true) => {
  /**
   * Renders a box on the score
   * @param  {number} x:  The x coordinate of the box
   * @param  {number} x:  The y coordinate of the box
   * @param  {number} height:  The height of the box
   * @param  {number} width:  The width coordinate of the box
   * @param  {number} yMiddle:  The y coordinate of the box between staffs
   * @param  {number} heightMiddle:  The height of the box between staffs
   * @param  {String} color:  The HEX code of the color
   * @param  {number} measureNumber: The osmd measure number of the box.
   * @param  {boolean} wholeMeasure:  True if the box will cover the whole measure.
                                      False if the box only covers some notes of the measyre
   * @return None
   */
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
   boundingBoxMiddle.setAttribute("width", max(convertUnitsToPixels(width), 0).toString());
   boundingBoxMiddle.classList.add("boundingBox");

   if (wholeMeasure) {
      boundingBoxMiddle.classList.add("box".concat(measureNumber.toString()));
      boundingBox.classList.add("box".concat(measureNumber.toString()));  // unique box id
   } else { // todo this could maybe be removed
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
   * Sets the coordinates of a box that will cover whole measures for the measures in measureList and calls function to render the boxes
   * @param  {Array<number> | number} measureNumbers:  A list of measure numbers or a measure number to render boxes in
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score name.
   * @return None
   */
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]
  const height = 4;

  for (const measure of measureList) {
    let measureNumber = measure[0].MeasureNumber;
    if (checkAvailability(measureNumbers, measureNumber)) {
      if (color !== selectColor && areAllNotesAnnotatedWithSameDifficulty(measure, scoreName)) {
        cleanBox(measureNumber);  // clean previous boxes to avoid infiniteBoxes
      }
      for (let staff = 0; staff < measure.length; staff++) {
        const positionAndShape = measure[staff].PositionAndShape;
        const positionAndShape1 = measure[1].PositionAndShape;
        const width = positionAndShape.BoundingRectangle.width;
        const x = positionAndShape.AbsolutePosition.x;
        const y = positionAndShape.AbsolutePosition.y;
        const yMiddle = y + height;
        const heightMiddle = max(positionAndShape1.AbsolutePosition.y - positionAndShape.AbsolutePosition.y - 4, 0);
        createBoundingBox(x, y, height, width, yMiddle, heightMiddle, color, measureNumber)
      }
    }
  }
};

export function renderBoundingBoxesFromCoords(initData: MouseData, finalData: MouseData,  color: string, measureList: any, scoreName: string) {
  /**
   * Renders bounding boxes from a mouse position in initData to a mouse position in finalData and annotates them.
   * @param  {MouseData} initData:  An instance of MouseData (utils.tsx) with the initial mouse coordinates,
   *                                initial closest note and measure
   * @param  {MouseData} finalData:  An instance of MouseData (utils.tsx) with the final mouse coordinates,
   * initial closest note and measure
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score name.
   * @return None
   */
  let measureNumbers: Array<number>
  let firstMeasureNumber = measureList[0][0].measureNumber
  measureNumbers = range(initData.measure, finalData.measure)
  const height = 4;

  for (let measureNumber of measureNumbers) {
    // Some scores have firstMeasureNumber = 0 or 1, but measureList always starts at 0
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    if (color !== selectColor) {
      cleanBox(measureNumber, false);  // clean previous boxes to avoid infiniteBoxes
    }
    // if the measureNumber is not the first or last one, the bounding box will cover all of the measure
    if (measureNumber !== initData.measure && measureNumber !== finalData.measure){
      renderBoundingBoxesAndAnnotateWholeMeasure([measureNumber], color, measureList, scoreName)
    } else {  // if the box is the first or last one, we render only a certain area
      for (let staff = 0; staff < measure.length; staff++) {
        const positionAndShape = measure[staff].PositionAndShape;
        const positionAndShape1 = measure[1].PositionAndShape;
        let x = measureNumber === initData.measure ? initData.pos.x : positionAndShape.AbsolutePosition.x;
        const y = positionAndShape.AbsolutePosition.y;

        let width;
        // annotation within the same measure
        if (measureNumber === initData.measure && measureNumber === finalData.measure) {
          width = finalData.pos.x - initData.pos.x;
          annotateWithinCoordinates(x, finalData.pos.x, measureNumber, staff, measureList, color, scoreName)
        }
        // rendering an irregular box on the first measure
        else if (measureNumber === initData.measure) {
          // x coordinate of the end of the measure
          const measureFinalX = positionAndShape.AbsolutePosition.x + positionAndShape.BoundingRectangle.width;
          // width of the box: from the initial mouse position until the end of the measure
          width = measureFinalX - initData.pos.x
          // annotate only the notes in between the coordinates
          annotateWithinCoordinates(initData.pos.x, measureFinalX, measureNumber, staff, measureList, color, scoreName)
        } // rendering an irregular box on the last measure
        else if (measureNumber === finalData.measure) {
          // width is from the start position of the measure to the final x from the mouse coordinates
          width = finalData.pos.x - positionAndShape.AbsolutePosition.x;
          annotateWithinCoordinates(positionAndShape.AbsolutePosition.x, finalData.pos.x, measureNumber, staff, measureList, color, scoreName)
        }
        const yMiddle = y + height;
        const heightMiddle = max(positionAndShape1.AbsolutePosition.y - positionAndShape.AbsolutePosition.y - 4, 0);
        // @ts-ignore
        createBoundingBox(x, y, height, width, yMiddle, heightMiddle, color, measureNumber, false)  // render bounding box
        }
    }
  }
    recordAnnotationTime(scoreName);
}

export const renderBoundingBoxesAndAnnotateWholeMeasure = (measureNumbers: Array<number> | number, color: string, measureList: any, scoreName: string) => {
  /**
   * Renders a bounding box on the measures in measureNumbers and annotates all of the notes within the measures
   * @param  {Array<number> | number} measureNumbers:  A list of measure numbers or a measure number to render boxes in
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score name.
   * @return None
   */
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

function getConsecutiveNotesWithSameAnnotation(measureNumber: any, staffNumber: any, measureList: any, scoreName: string){
  function createAndPushBox(startX: number, y: any, height: number, width: number, yMiddle: any, heightMiddle: number, color: any, measureNumber: any) {
    const box: Box = {
            x: startX,
            y: y,
            height: height,
            width: width,
            yMiddle: yMiddle,
            heightMiddle: heightMiddle,
            color: color,
            measureNumber: measureNumber
          }
          staffBoxes.push(box)
  }

  let annotations = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let firstMeasureNumber = measureList[0][0].measureNumber;
  let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]

  // Staff and measure
  let staffEntries = measure[staffNumber].staffEntries
  let notesInStaff = staffEntries.length

  // Position data
  const positionAndShape = measure[staffNumber].PositionAndShape;
  const positionAndShape1 = measure[1].PositionAndShape;
  const measureWidth = positionAndShape.BoundingRectangle.width;
  const measureStartPosition = positionAndShape.AbsolutePosition.x
  const y = positionAndShape.AbsolutePosition.y;
  const height = 4
  const yMiddle = y + height;
  const heightMiddle = max(positionAndShape1.AbsolutePosition.y - y - height, 0);

  // To store boxes
  let staffBoxes: Box[] = []
  let firstNotNoneBox = 0
  let difficulty = annotations[`measure-${measureNumber}`][`staff-${staffNumber}`][`note-${firstNotNoneBox}`];
  while (difficulty === "None" && firstNotNoneBox < notesInStaff){
    firstNotNoneBox += 1
    difficulty = annotations[`measure-${measureNumber}`][`staff-${staffNumber}`][`note-${firstNotNoneBox}`];
  }
  let startX = 0;
  let endX = 0;
  for (let noteNumber = firstNotNoneBox; noteNumber < notesInStaff; noteNumber++){
     const currentAnnotation = annotations[`measure-${measureNumber}`][`staff-${staffNumber}`][`note-${noteNumber}`];
     // @ts-ignore
    let color = difficultyToColor[difficulty]
    console.log("COLOR", color)
    let currentX = staffEntries[noteNumber].boundingBox.AbsolutePosition.x;

    if (currentAnnotation === difficulty) {  // if same difficulty, update the box coordinates
      if (startX === 0) {  // first iteration of staff
        startX = firstNotNoneBox === 0 ? measureStartPosition : currentX - 1.5;  // if first note is note 0, start is start of measure
        endX = currentX;
      } else if (currentX > endX) {
        endX = currentX + 1.5  // adding 1 to add some extra space
      }

    } else if (currentAnnotation !== difficulty) {  // if different difficulty, push the previous box
      let width = endX - startX;
      createAndPushBox(startX, y, height, width, yMiddle, heightMiddle, color, measureNumber)
      startX = endX;  // start next box
      endX = currentX  // adding 1 to add some extra space
      difficulty = currentAnnotation  // update difficulty
    }
    if ( noteNumber === notesInStaff - 1){
      // @ts-ignore
      color = difficultyToColor[currentAnnotation]
      endX = measureStartPosition + measureWidth ;
      let width = endX - startX;
      createAndPushBox(startX, y, height, width, yMiddle, heightMiddle, color, measureNumber)
     }
    console.log("END X", endX)
      }
   return staffBoxes
}

function renderIrregularBoxFromNotes(measureNumber: number, measureList: any, scoreName: string) {
  let firstMeasureNumber = measureList[0][0].measureNumber;
  let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
  let staff0Boxes: any[] | never[] | Box[] = [];
  let staff1Boxes: any[] | never[] | Box[] = [];
  for (let staffNumber = 0; staffNumber < measure.length; staffNumber++ ) {
    if (staffNumber === 0){
      staff0Boxes = getConsecutiveNotesWithSameAnnotation(measureNumber, staffNumber, measureList, scoreName)
    } else if (staffNumber === 1){
      staff1Boxes = getConsecutiveNotesWithSameAnnotation(measureNumber, staffNumber, measureList, scoreName)
    }
  }
  let longestBoxes = staff0Boxes.length > staff1Boxes.length ? staff0Boxes : staff1Boxes
  let startX = staff0Boxes[0] && staff1Boxes[0] ? min(staff0Boxes[0].x, staff1Boxes[0].x) : longestBoxes[0].x
  let staff0Y = measure[0].PositionAndShape.AbsolutePosition.y
  let staff1Y = measure[1].PositionAndShape.AbsolutePosition.y
  const positionAndShape1 = measure[1].PositionAndShape;
  const measureWidth = positionAndShape1.BoundingRectangle.width;
  const measureStartPosition = positionAndShape1.AbsolutePosition.x;
  let measureEndPosition = measureStartPosition + measureWidth;
  let height = 4
  let staff0YMiddle = staff0Y + height;
  let staff1YMiddle = staff1Y + height;
  const staff0HeightMiddle = max(staff1Y - staff0Y - 4, 0);
  const staff1HeightMiddle = 0


  let maxBoxes = max(staff0Boxes.length, staff1Boxes.length)
  console.log(staff0Boxes, staff1Boxes)
  let endX: number
  let color: string
  for (let boxNumber = 0; boxNumber < maxBoxes; boxNumber++){
    let staff0Box = staff0Boxes[boxNumber];
    let staff1Box = staff1Boxes[boxNumber]


    if (staff0Boxes.length === staff1Boxes.length) {
      endX = max(staff0Box.x + staff0Box.width, staff1Box.x + staff1Box.width) // rightmost x
      color = staff0Box.color === staff1Box.color ? staff0Box.color : staff1Box.color // todo fix
      } else {
      let longestBox = longestBoxes[boxNumber]
      endX = longestBox.x + longestBox.width + 1
      color = longestBox.color
    }

    let width = endX - startX
    width = startX + width < measureEndPosition ? width : measureEndPosition - startX

    if (color !== selectColor) {
      createBoundingBox(startX, staff0Y, height, width, staff0YMiddle, staff0HeightMiddle, color, measureNumber, false)
    }
    if (color !== selectColor) {
    createBoundingBox(startX, staff1Y, height, width, staff1YMiddle, staff1HeightMiddle, color, measureNumber, false )
    }
    startX = endX
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
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  console.log(firstMeasureNumber)
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let coloredBoxes = [];


  for (let measureNumber = firstMeasureNumber; measureNumber <= lastMeasureNumber; measureNumber++) {
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    if (areAllNotesAnnotatedWithSameDifficulty(measure, scoreName)) {
      console.log("ALL NOTES ANNOTATED THE SAME", measureNumber)
      let measureDifficulty = annotations[`measure-${measureNumber}`][`staff-${0}`][`note-${0}`];

      if (measureDifficulty && measureDifficulty !== "None") {
        // @ts-ignore
        let measureColor = difficultyToColor[measureDifficulty];
        renderBoundingBoxesMeasures([measureNumber], measureColor, measureList, scoreName);
        coloredBoxes.push(measureNumber);
      }
    } else {
      console.log("Rendering irregular boxes with measure: ", measureNumber)
      renderIrregularBoxFromNotes(measureNumber, measureList, scoreName)
      coloredBoxes.push(measureNumber);
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

export function cleanBox(measureNumber: number, irregularBoxes = true) {
  /**
 * Cleans a bounding box
 * @param  {number} boxNumber:  The box number to erase.
 * @param  {String} scoreName:  The score name.
 * @return None.
 */
  const boxes = document.querySelectorAll(".box".concat(measureNumber.toString()));
  if (boxes.length > 0) {
    boxes.forEach((box) => {
      box.remove();
    });
  }
  if (irregularBoxes) {
    const irregularBoxes = document.querySelectorAll(".irregularBox_".concat(measureNumber.toString()))
    if (irregularBoxes.length > 0) {
      irregularBoxes.forEach((irregularBox) => {
        irregularBox.remove();
      });
    }
  }
}

function cleanBoxAndAnnotate(boxNumber: number, measureList: any, scoreName: string){
  cleanBox(boxNumber);
  annotateWholeMeasures(boxNumber, selectColor, measureList, scoreName)

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
    cleanBox(boxNumber);
    renderBoundingBoxesAndAnnotateWholeMeasure([boxNumber], color, measureList, scoreName);
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