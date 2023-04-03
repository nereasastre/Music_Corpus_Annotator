import {
  contains,
  convertUnitsToPixels,
  difficultyToColor,
  max,
  min, MouseData, range,
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

const createBoundingBox = (x: number, y: number, height: number, width: number, yMiddle: number, heightMiddle: number, color: string, measureNumber: number) => {
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

   boundingBoxMiddle.classList.add("box".concat(measureNumber.toString()));
   boundingBox.classList.add("box".concat(measureNumber.toString()));  // unique box id

   document.querySelector("svg")!.append(boundingBox);
   document.querySelector("svg")!.append(boundingBoxMiddle);

   // if the color is the select color, identify it as erasable
   if (color === selectColor) {
     boundingBox.classList.add("erasableBoundingBox");
     boundingBoxMiddle.classList.add("erasableBoundingBox");
   }
}


export const renderBoundingBoxesMeasures = (measureNumbers: Array<number> | number, color: string, measureList: any) => {
  /**
   * Sets the coordinates of a box that will cover whole measures for the measures in measureList and calls function to render the boxes
   * @param  {Array<number> | number} measureNumbers:  A list of measure numbers or a measure number to render boxes in
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score name.
   * @return None
   */
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]  // if single number, convert to array
  const height = 4;  // height of osmd staffs is 4

  for (const measure of measureList) {
    let measureNumber = measure[0].MeasureNumber;
    if (contains(measureNumbers, measureNumber)) {
      if (color !== selectColor) {
        cleanBox(measureNumber);  // clean previous boxes to avoid infiniteBoxes
      }
      for (let staff = 0; staff < measure.length; staff++) {
        const positionAndShape = measure[staff].PositionAndShape;  // position and shape of current staff
        const positionAndShape1 = measure[1].PositionAndShape;  // position and shape of staff 1
        const width = positionAndShape.BoundingRectangle.width;  // width of the measure
        const x = positionAndShape.AbsolutePosition.x;  // initial x position
        const y = positionAndShape.AbsolutePosition.y;  // staff's y position
        const yMiddle = y + height;  // initial y position of the box between staffs
        // height of the box between staffs
        const heightMiddle = max(positionAndShape1.AbsolutePosition.y - positionAndShape.AbsolutePosition.y - 4, 0);
        createBoundingBox(x, y, height, width, yMiddle, heightMiddle, color, measureNumber)  // render box
      }
    }
  }
};

export function renderBoundingBoxesFromCoords(initData: MouseData, finalData: MouseData,  color: string, measureList: any, scoreName: string) {
  /**
   * Renders bounding boxes from a mouse position in initData to a mouse position in finalData and annotates them.
   * @param  {MouseData} initData:  An instance of MouseData (utils.tsx) with the initial mouse coordinates and measure
   * @param  {MouseData} finalData:  An instance of MouseData (utils.tsx) with the final mouse coordinates and measure
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score name.
   * @return None
   */
  let firstMeasureNumber = measureList[0][0].measureNumber
  let measureNumbers = range(initData.measure, finalData.measure)

  for (let measureNumber of measureNumbers) {
    // Some scores have firstMeasureNumber = 0 or 1, but osmd measureList always starts at 0
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]  // the osmd measure object
    if (color !== selectColor) {
      cleanBox(measureNumber);  // clean previous boxes to avoid infinite boxes
    }
    // if the measureNumber is not the first or last one, the bounding box covers all of the measure
    if (measureNumber !== initData.measure && measureNumber !== finalData.measure){
      renderBoundingBoxesAndAnnotateWholeMeasure([measureNumber], color, measureList, scoreName)
    } else {  // if the box is the first or last one, we render only a certain area
      for (let staff = 0; staff < measure.length; staff++) {
        const positionAndShape = measure[staff].PositionAndShape;  // current staff position and shape
        // if the measureNumber is the initial measure, x is the initial position of the mouse. In any other case,
        // x is the initial position of the measure
        let x = measureNumber === initData.measure ? initData.pos.x : positionAndShape.AbsolutePosition.x;

        if (measureNumber === initData.measure && measureNumber === finalData.measure) {  // annotation within the same measure
          // annotate from the initial x to the final x of the mouse
          annotateWithinCoordinates(x, finalData.pos.x, measureNumber, staff, measureList, color, scoreName)
        } else if (measureNumber === initData.measure) {  // if the measure is the initial measure
          // final x of the box for this measure is the x coordinate of the end of the measure
          const measureFinalX = positionAndShape.AbsolutePosition.x + positionAndShape.BoundingRectangle.width;
          annotateWithinCoordinates(x, measureFinalX, measureNumber, staff, measureList, color, scoreName)  // annotate
        } else if (measureNumber === finalData.measure) { // if the measure is the final measure
          // annotate form the initial x of the measure to the final position of the mouse
          annotateWithinCoordinates(x, finalData.pos.x, measureNumber, staff, measureList, color, scoreName)
        }
        cleanBox(measureNumber) // clean previous boxes
        renderBoxesFromAnnotations(measureNumber, measureList, scoreName)  // render the updated boxes from the annotations
        }
    }
  }
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
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]  // if number, convert to array
  renderBoundingBoxesMeasures(measureNumbers, color, measureList)
  annotateWholeMeasures(measureNumbers, color, measureList, scoreName);
}

export const cleanSelectBoxes = () => {
  /**
   * Cleans all select (gray) boxes.
   * @return None
   */
  const boxes = document.querySelectorAll(".erasableBoundingBox");
    // @ts-ignore
    for (const box of boxes) {
    box.remove();
  }
};


function getConsecutiveNotesWithSameAnnotation(measureNumber: number, staffNumber: number, measureList: any, scoreName: string){
    /*
     * Returns an array of Box containing a box for each group of consecutive notes with the same annotation
     * @param {number} measureNumber: The measure number
     * @param {number} staffNumber: The staff number (0 or 1)
     * @param {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList: The osmd measureList
     * @param {String} scoreName: The name of the score
     * @return {Array<Box>} staffBoxes: The array of boxes
     */
  function createAndPushBox(startX: number, y: any, height: number, width: number, yMiddle: any, heightMiddle: number, color: any, measureNumber: any) {
    /*
     * Creates an instance of box and pushes it to staffBoxes
     * @param {number} startX: The starting x position
     * @param {number} y: The starting y position
     * @param {number} height: The height of the staff. In osmd, height = 4
     * @param {number} width: The width of the box
     * @param {number} yMiddle: The y coordinate of the box between staffs
     * @param {number} heightMiddle: The height of the box between staffs
     * @param {String} color: The HEX code of the color
     * @param  {number} measureNumber:  The measure number

     * @return None
     */
    const box: Box = {x: startX, y: y, height: height, width: width, yMiddle: yMiddle, heightMiddle: heightMiddle, color: color, measureNumber: measureNumber}
    staffBoxes.push(box)
  }

  let annotations = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let firstMeasureNumber = measureList[0][0].measureNumber;
  // Some scores have firstMeasureNumber = 0 or 1, but osmd measureList always starts at 0
  let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]

  // Staff and measure
  let staffEntries = measure[staffNumber].staffEntries  // list of notes in staff
  let notesInStaff = staffEntries.length

  // Position data
  const positionAndShape = measure[staffNumber].PositionAndShape;  // position and shape of current staff
  const positionAndShape1 = measure[1].PositionAndShape;  // position and shape of staff 1
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
  // find first annotated note
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
     let currentX = staffEntries[noteNumber].boundingBox.AbsolutePosition.x;

    if (currentAnnotation === difficulty) {  // if same difficulty, update the current box coordinates
      if (startX === 0) {  // first iteration
        startX = firstNotNoneBox === 0 ? measureStartPosition : currentX;  // if first note is note 0, start is start of measure
        endX = currentX + 1.25;
      } else if (currentX > endX) {  // if the current note has the same difficulty as the previous one, update endX
        endX = currentX + 1.25  // adding 1 to add some extra space
      }
    } else if (currentAnnotation !== difficulty) {  // if different difficulty, push the previous box
      let width = endX - startX;
      createAndPushBox(startX, y, height, width, yMiddle, heightMiddle, color, measureNumber)
      startX = endX;  // start next box
      endX = currentX + 1.25  // adding 1 to add some extra space
      difficulty = currentAnnotation  // update difficulty ot the current note's difficulty
    }
    if (noteNumber === notesInStaff - 1){  // last iteration, push the last box
      // @ts-ignore
      color = difficultyToColor[currentAnnotation]
      endX = measureStartPosition + measureWidth;
      let width = endX - startX;
      createAndPushBox(startX, y, height, width, yMiddle, heightMiddle, color, measureNumber)
     }
  }
   return staffBoxes
}

function renderBoxesFromAnnotations(measureNumber: number, measureList: any, scoreName: string) {
 /**
     * Renders the measure's boxes form the annotations
     * @param {number} measureNumber: The measure number
     * @param {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList: The osmd measureList
     * @param {String} scoreName: The name of the score
     * @return None
     */
  let firstMeasureNumber = measureList[0][0].measureNumber;
  // Some scores have firstMeasureNumber = 0 or 1, but osmd measureList always starts at 0
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
  console.log("STAFF 1 BOXES", staff1Boxes)
  console.log("STAFF 0 BOXES", staff0Boxes)
  // if a staff has more annotations than another one, keep the longest one
  let longestBoxes = staff0Boxes.length > staff1Boxes.length ? staff0Boxes : staff1Boxes
  // startX is either leftmost box, or longestBoxes.x if any of the staffBoxes array is undefined
  let startX = staff0Boxes[0] && staff1Boxes[0] ? min(staff0Boxes[0].x, staff1Boxes[0].x) : longestBoxes[0].x
  let staff0Y = measure[0].PositionAndShape.AbsolutePosition.y
  let staff1Y = measure[1].PositionAndShape.AbsolutePosition.y
  const positionAndShape1 = measure[1].PositionAndShape;
  const measureWidth = positionAndShape1.BoundingRectangle.width;
  const measureStartPosition = positionAndShape1.AbsolutePosition.x;
  let measureEndPosition = measureStartPosition + measureWidth;  // end is the start position of the measure + width
  let height = 4  // osmd height for staffs
  let staff0YMiddle = staff0Y + height;  // y of box between staffs (staff 0)
  let staff1YMiddle = staff1Y + height;  // y of box between staffs (staff 0)
  const staff0HeightMiddle = max(staff1Y - staff0Y - 4, 0);
  const staff1HeightMiddle = 0

  let maxBoxes = longestBoxes.length
  let endX: number
  let color: string
  for (let boxNumber = 0; boxNumber < maxBoxes; boxNumber++){
    let staff0Box = staff0Boxes[boxNumber];
    let staff1Box = staff1Boxes[boxNumber];

    if (staff0Boxes.length === staff1Boxes.length) {  // if they have the same annotations
      endX = max(staff0Box.x + staff0Box.width, staff1Box.x + staff1Box.width) // end is rightmost x
      color = staff0Box.color === staff1Box.color ? staff0Box.color : staff1Box.color
      } else {  // otherwise, we render boxes with the coordinates of the staff with more annotations
      let longestBox = longestBoxes[boxNumber]
      endX = longestBox.x + longestBox.width
      color = longestBox.color
    }

    let width = endX - startX
    // make sure to not go beyond the end of measure
    width = startX + width < measureEndPosition ? width : measureEndPosition - startX

    if (color !== selectColor && color) {  // skip "None" boxes
      createBoundingBox(startX, staff0Y, height, width, staff0YMiddle, staff0HeightMiddle, color, measureNumber)
    }
    if (color !== selectColor && color) {  // skip "None" boxes
    createBoundingBox(startX, staff1Y, height, width, staff1YMiddle, staff1HeightMiddle, color, measureNumber )
    }
    startX = endX  // update startX
  }
}

export const renderBoxesFromLocalStorage = (measureList: any, scoreName: string, renderSelect = true) => {
  /**
   * Renders all boxes in score as stored in localStorage
   * @param  {OpenSheetMusicDisplay.measureList} measureList:  OSMD's measure list
   * @param  {String} scoreName:  The score name.
   * @param {boolean} renderSelect: If True, renders the select box.
   * @return The first available box.
   */
  let annotations = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let coloredBoxes = [];

  for (let measureNumber = firstMeasureNumber; measureNumber <= lastMeasureNumber; measureNumber++) {
    // Some scores have firstMeasureNumber = 0 or 1, but osmd measureList always starts at 0
    let measure = firstMeasureNumber === 0 ? measureList[measureNumber] : measureList[measureNumber - 1]
    if (areAllNotesAnnotatedWithSameDifficulty(measure, scoreName)) {  // if all notes are the same, render whole measure
      let measureDifficulty = annotations[`measure-${measureNumber}`][`staff-${0}`][`note-${0}`];
      if (measureDifficulty && measureDifficulty !== "None") {
        // @ts-ignore
        let measureColor = difficultyToColor[measureDifficulty];
        renderBoundingBoxesMeasures([measureNumber], measureColor, measureList);
        coloredBoxes.push(measureNumber);
      }
    } else {  // render boxes with multiple different annotations per measure
      renderBoxesFromAnnotations(measureNumber, measureList, scoreName)
      coloredBoxes.push(measureNumber);
    }
  }
  let firstAvailableBox = measureList[0][0].MeasureNumber;
  if (coloredBoxes.length !== 0) {
    firstAvailableBox = min(coloredBoxes[coloredBoxes.length - 1] + 1, lastMeasureNumber);
  }
  if (renderSelect){
    renderBoundingBoxesMeasures([firstAvailableBox], selectColor, measureList);
  }
  return firstAvailableBox;
}

export const cleanAllBoxes = () => {
  /**
  * Deletes all boxes.
  * @return None.
  */
  const boxes = document.querySelectorAll(".boundingBox");
    // @ts-ignore
    for (const box of boxes) {
    box.remove();
  }
};

export function cleanBox(measureNumber: number) {
  /**
 * Deletes a bounding box given its measure number
 * @param  {number} boxNumber:  The box number to erase.
 * @param  {String} scoreName:  The score name.
 * @return None.
 */
  const boxes = document.querySelectorAll(".box".concat(measureNumber.toString()));
  if (boxes.length > 0) {
    // @ts-ignore
      for (const box of boxes) {
      box.remove();
    }
  }
}

function cleanBoxAndAnnotate(measureNumber: number, measureList: any, scoreName: string){
  /**
   * Deletes all of the boxes in a measure and updates annotations accordingly
   * @param {number} measureNumber: The measure number of the measure to delete
   * @param {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList: The osmd measureList
   * @param {String} scoreName: The score name
   */
  cleanBox(measureNumber);
  annotateWholeMeasures(measureNumber, selectColor, measureList, scoreName)
}

export function renderBoxAndContinue(measureNumber: number, color: string, measureList: any, scoreName: string) {
  /**
   * Renders a bounding box and updates the current Box number to currentBox += 1
   * @param  {number} measureNumber:  The box number to highlight
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score's name.
   * @return {number} measureNumber: The updated box number.
   */
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;

  if (color === selectColor) {
    measureNumber -= 1;  // if color is select color, go back
  }

  renderBoundingBoxesAndAnnotateWholeMeasure([measureNumber], color, measureList, scoreName);

  measureNumber = min(measureNumber + 1, lastMeasureNumber);
  renderBoundingBoxesMeasures([measureNumber], selectColor, measureList)
  return measureNumber;
}


export function deleteBoxAndGoBack(boxNumber: number, measureList: any, scoreName: string) {
  /**
   * Deletes a bounding box, updates boxNumber and renders the selectBox.
   * @param  {number} boxNumber:  The box number to delete
   * @param  {OpenSheetMusicDisplay.GraphicSheet.measureList} measureList:  The osmd measure list.
   * @param  {String} scoreName:  The score's name.
   * @return {number} boxNumber: The updated box number.
   */
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  cleanBoxAndAnnotate(boxNumber, measureList, scoreName)
  cleanSelectBoxes();
  boxNumber = max(boxNumber - 1, firstMeasureNumber);
  renderBoundingBoxesMeasures([boxNumber], selectColor, measureList); // render select box
  return boxNumber;
}