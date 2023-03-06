import {
  checkAvailability,
  colorToDifficulty,
  convertUnitsToPixels,
  difficultyToColor,
  isFullyAnnotated,
  markAnnotated,
  max,
  min,
  recordAnnotationTime,
  selectColor
} from "./utils";
import {annotate, annotateWholeMeasures, areAllNotesAnnotatedWithSameDifficulty} from "./annotations";
import {render} from "react-dom";


export const renderBoundingBoxes = (measureNumbers: Array<number> | number, color: string, measureList: any, scoreName: string) => {
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
      if (color !== selectColor) {
        cleanBox(measureNumber, scoreName);  // clean previous boxes to avolid infiniteBoxes
      }
      for (let staff = 0; staff < measure.length; staff++) {
        const positionAndShape = measure[staff].PositionAndShape;
        const positionAndShape1 = measure[1].PositionAndShape;
        const height = convertUnitsToPixels(4);
        const width = convertUnitsToPixels(
          positionAndShape.BoundingRectangle.width
        );
        const x = convertUnitsToPixels(positionAndShape.AbsolutePosition.x);
        const yNew = convertUnitsToPixels(positionAndShape.AbsolutePosition.y);
        const yMiddle = yNew + height;
        const heightMiddle = max(convertUnitsToPixels(
          positionAndShape1.AbsolutePosition.y -
          positionAndShape.AbsolutePosition.y -
          4
        ), 0);

        const boundingBox = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        const boundingBoxMiddle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );

        // Staff's bounding box
        boundingBox.setAttribute("fill", color);
        boundingBox.setAttribute("fill-opacity", "0.25");
        boundingBox.setAttribute("x", x.toString());
        boundingBox.setAttribute("y", yNew.toString());
        boundingBox.setAttribute("height", height.toString());
        boundingBox.setAttribute("width", width.toString());
        boundingBox.classList.add("boundingBox");
        boundingBox.classList.add("box".concat(measureNumber.toString()));  // unique box id

        // Bounding box between staffs
        boundingBoxMiddle.setAttribute("fill", color);
        boundingBoxMiddle.setAttribute("fill-opacity", "0.25");
        boundingBoxMiddle.setAttribute("x", x.toString());
        boundingBoxMiddle.setAttribute("y", yMiddle.toString());
        boundingBoxMiddle.setAttribute("height", heightMiddle.toString());
        boundingBoxMiddle.setAttribute("width", width.toString());
        boundingBoxMiddle.classList.add("boundingBox");
        boundingBoxMiddle.classList.add("box".concat(measureNumber.toString()));

        document.querySelector("svg")!.append(boundingBox);
        document.querySelector("svg")!.append(boundingBoxMiddle);

        // if the color is the select color, identify it as erasable
        if (color === selectColor) {
          boundingBox.classList.add("erasableBoundingBox");
          boundingBoxMiddle.classList.add("erasableBoundingBox");
        }
      }
    }
  }
};

export function renderBoxNote(measureNumber: number, color: string, osmd: any, scoreName: string, noteNum: number){
  let measureList = osmd.GraphicSheet.measureList;
  console.log(osmd)
  let measure = measureList[measureNumber];
  let noteBoundingBox = osmd.cursor.GNotesUnderCursor()[0].getSVGGElement().getBBox();
  console.log(noteBoundingBox)
  console.log("SVG element: ", osmd.cursor.GNotesUnderCursor()[0].getSVGGElement())

  if (color !== selectColor) {
    cleanBox(measureNumber, scoreName);  // clean previous boxes to avolid infiniteBoxes
  }
  for (let staff = 0; staff < measure.length; staff++) {
    const positionAndShape = measure[staff].PositionAndShape;
    const positionAndShape1 = measure[1].PositionAndShape;
    const height = convertUnitsToPixels(4);
    let width = convertUnitsToPixels(
      positionAndShape.BoundingRectangle.width
    );
    width = noteBoundingBox.width;
    let x = convertUnitsToPixels(positionAndShape.AbsolutePosition.x);
    x = noteBoundingBox.x
    const yNew = convertUnitsToPixels(positionAndShape.AbsolutePosition.y);
    const yMiddle = yNew + height;
    const heightMiddle = max(convertUnitsToPixels(
      positionAndShape1.AbsolutePosition.y -
      positionAndShape.AbsolutePosition.y -
      4
    ), 0);

    const boundingBox = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    const boundingBoxMiddle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );

    // Staff's bounding box
    boundingBox.setAttribute("fill", color);
    boundingBox.setAttribute("fill-opacity", "0.25");
    boundingBox.setAttribute("x", noteBoundingBox.x.toString());
    boundingBox.setAttribute("y", yNew.toString());
    boundingBox.setAttribute("height", height.toString());
    boundingBox.setAttribute("width", noteBoundingBox.width.toString());
    boundingBox.classList.add("boundingBox");
    boundingBox.classList.add("boxNote".concat(measureNumber.toString()));  // unique box id

    // Bounding box between staffs
    boundingBoxMiddle.setAttribute("fill", color);
    boundingBoxMiddle.setAttribute("fill-opacity", "0.25");
    boundingBoxMiddle.setAttribute("x", x.toString());
    boundingBoxMiddle.setAttribute("y", yMiddle.toString());
    boundingBoxMiddle.setAttribute("height", heightMiddle.toString());
    boundingBoxMiddle.setAttribute("width", width.toString());
    boundingBoxMiddle.classList.add("boundingBox");
    boundingBoxMiddle.classList.add("boxNote".concat(measureNumber.toString()));

    document.querySelector("svg")!.append(boundingBox);
    document.querySelector("svg")!.append(boundingBoxMiddle);

    // if the color is the select color, identify it as erasable
    if (color === selectColor) {
      boundingBox.classList.add("erasableBoundingBox");
      boundingBoxMiddle.classList.add("erasableBoundingBox");
    }
}
}

export const renderBoundingBoxesAndAnnotate = (measureNumbers: Array<number> | number, color: string, measureList: any, scoreName: string, measure = true) => {
  measureNumbers = Array.isArray(measureNumbers) ? measureNumbers : [measureNumbers]
  renderBoundingBoxes(measureNumbers, color, measureList, scoreName)
  if (measure){
    annotateWholeMeasures(measureNumbers, color, measureList, scoreName);
  } else {
    annotate(measureNumbers, color, measureList, scoreName) // todo modify
  }
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

export const renderBoxesFromLocalStorage = (measureList: any, scoreName: string, renderSelect = true) => {
  /**
   * Renders boxes as stored in localStorage
   * @param  {OpenSheetMusicDisplay.measureList} measureList:  OSMD's measure list
   * @param  {String} scoreName:  The score name.
   * @param {boolean} renderSelect: If True, renders the select box.
   * @return The first available box.
   */
  let annotations = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let coloredBoxes = [];

  for (let measure = 0; measure <= lastMeasureNumber; measure++) {
    if (areAllNotesAnnotatedWithSameDifficulty(measureList[measure], scoreName)) {
      let measureDifficulty = annotations[`measure-${measure}`][`staff-${0}`][`note-${0}`];

      if (measureDifficulty && measureDifficulty !== "None") {
        // @ts-ignore
        let measureColor = difficultyToColor[measureDifficulty];
        renderBoundingBoxes([measure], measureColor, measureList, scoreName);
        coloredBoxes.push(measure);
      }
    }
  }
  let firstAvailableBox = measureList[0][0].MeasureNumber;
  if (coloredBoxes.length !== 0) {
    firstAvailableBox = min(coloredBoxes[coloredBoxes.length - 1] + 1, lastMeasureNumber);
  }
  if (renderSelect){
    renderBoundingBoxes([firstAvailableBox], selectColor, measureList, scoreName);
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

export const cleanBox = (boxNumber: number, scoreName: string) => {
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
  renderBoundingBoxes([boxNumber], selectColor, measureList, scoreName)

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
  renderBoundingBoxes([boxNumber], selectColor, measureList, scoreName); // render select box
  return boxNumber;
}