import {checkAvailability, colorToDifficulty, convertUnitsToPixels, difficultyToColor, max, min} from "./utils";

const selectColor = "#b7bbbd";

export const renderBoundingBoxes = (numList: Array<number>, color: string, measureList: any, scoreName: string) => {
  /**
   * Renders a box on the score
   * @param  {Array<number>} numList:  A list of measure numbers to render boxes in
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList: The osmd measure list.
   * @param  {String} scoreName:  The score name.
   * @return None
   */
  let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName) as string);
  for (const measure of measureList) {
    let measureNumber = measure[0].MeasureNumber
    if (checkAvailability(numList, measureNumber)) {
      for (let staff = 0; staff < measure.length; staff++) {
        const positionAndShape = measure[staff].PositionAndShape;
        const positionAndShape1 = measure[1].PositionAndShape;
        const height = convertUnitsToPixels(4);
        const width = convertUnitsToPixels(
          positionAndShape.BoundingRectangle.width
        );
        const x = convertUnitsToPixels(positionAndShape.AbsolutePosition.x);
        const yNew = convertUnitsToPixels(positionAndShape.AbsolutePosition.y);
        const y1 = yNew + height;
        const height1 = max(convertUnitsToPixels(
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
        boundingBoxMiddle.setAttribute("y", y1.toString());
        boundingBoxMiddle.setAttribute("height", height1.toString());
        boundingBoxMiddle.setAttribute("width", width.toString());
        boundingBoxMiddle.classList.add("boundingBox");
        boundingBoxMiddle.classList.add("box".concat(measureNumber.toString()));

        document.querySelector("svg")!.append(boundingBox);
        document.querySelector("svg")!.append(boundingBoxMiddle);

        // if the color is the select color, identify it as erasable
        if (color === selectColor) {
          boundingBox.classList.add("erasableBoundingBox");
          boundingBoxMiddle.classList.add("erasableBoundingBox");

        } else {
          // @ts-ignore
          highlightedBoxes[measureNumber] = colorToDifficulty[color];
        }
      }
    }
  }
  window.localStorage.setItem(scoreName, JSON.stringify(highlightedBoxes));

};

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

export const renderBoxesFromLocalStorage = (measureList: any, scoreName: string) => {
  /**
   * Renders boxes as stored in localStorage
   * @param  {OpenSheetMusicDisplay.measureList} measureList:  OSMD's measure list
   * @param  {String} scoreName:  The score name.
   * @return The first available box.
   */
  let highlightedBoxes = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let coloredBoxes = [];

  for (let measure = 0; measure <= lastMeasureNumber; measure++) {
    let measureDifficulty = highlightedBoxes[measure];
    if (measureDifficulty && measureDifficulty !== "None") {
      // @ts-ignore
      let measureColor = difficultyToColor[measureDifficulty];
      renderBoundingBoxes([measure], measureColor, measureList, scoreName);
      coloredBoxes.push(measure);
    }
  }
  if (coloredBoxes.length === 0) {
    return measureList[0][0].MeasureNumber;
  }

  return min(coloredBoxes[coloredBoxes.length - 1] + 1, lastMeasureNumber);


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
  let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName) as string);
  highlightedBoxes[boxNumber] = "None";
  window.localStorage.setItem(scoreName, JSON.stringify(highlightedBoxes));
};


export function initLocalStorageToNone(measureList: any, scoreName: string, renderSelect = true) {
  /**
 * Initializes a localStorage with key scoreName and all score values set to "None"
 * @param  {number} firstMeasureNumber:  Score's first measure number
 * @param  {number} lastMeasureNumber:  Score's last measure number
 * @param  {String} scoreName:  The score name.
 * @param {boolean} renderSelect: If True, renders the select box.
 * @return {String} highlightedBoxes: The string (JSON format) containing the annotations set to None.
 */
  let highlightedBoxes = {};
  let firstMeasureNumber = measureList[0][0].MeasureNumber;
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;

  for (let staff = firstMeasureNumber; staff < lastMeasureNumber + 1; staff++) {
    // @ts-ignore
    highlightedBoxes[staff] = "None";
  }
  window.localStorage.setItem(scoreName, JSON.stringify(highlightedBoxes));

  if (renderSelect){
    renderBoundingBoxes([firstMeasureNumber], selectColor, measureList, scoreName);
  }

  return highlightedBoxes;
}

export function renderBoxAndContinue(boxNumber: number, color: string, measureList: any, scoreName: string) {
  /**
   * Renders a bouning boxes and updates the current Box number to currentBox += 1
   * @param  {number} boxNumber:  The box number to highlight
   * @param  {String} color:  The HEX code of the color
   * @param  {OpenSheetMusicDisplay.measureList} measureList:  OSMD's measure list.
   * @param  {String} scoreName:  The score's name.
   * @return {number} boxNumber: The updated box number.
   */
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName) as string);

  if (color === selectColor) {
    boxNumber -= 1;
  }
  cleanSelectBoxes();
  // @ts-ignore
  if (highlightedBoxes[boxNumber] !== colorToDifficulty[color]) {
    cleanBox(boxNumber, scoreName);
    renderBoundingBoxes([boxNumber], color, measureList, scoreName);
  }

  if (boxNumber < lastMeasureNumber) {
    boxNumber += 1;
  } else {
    boxNumber = lastMeasureNumber;
  }
  renderBoundingBoxes([boxNumber], selectColor, measureList, scoreName)
  return boxNumber;
}