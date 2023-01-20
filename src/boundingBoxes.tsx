import { convertUnitsToPixels, checkAvailability, colorToDifficulty, difficultyToColor, max } from "./utils";
import {eel} from "./App";


export const renderBoundingBoxes = (numList: Array<number>, color: string, thisMeasureList: any, scoreName: string, saveJson = true) => {
  let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName) as string);
  for (const measure of thisMeasureList) {
    let measureNumber =  measure[0].MeasureNumber
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
        boundingBox.setAttribute("fill", color);
        boundingBox.setAttribute("fill-opacity", "0.25");
        boundingBox.setAttribute("x", x.toString());
        boundingBox.setAttribute("y", yNew.toString());
        boundingBox.setAttribute("height", height.toString());
        boundingBox.setAttribute("width", width.toString());
        boundingBox.classList.add("boundingBox");
        boundingBox.classList.add("box".concat(measureNumber.toString()));

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

        if (color === "#b7bbbd") {
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
  if (saveJson) {
    console.log("placeholder")
    // eel.save_to_json(scoreName, highlightedBoxes);
  }
};

export const cleanSelectBoxes = () => {
  const boxes = document.querySelectorAll(".erasableBoundingBox");
  boxes.forEach((box) => {
    box.remove();
  });
 
};

export const renderBoxesFromLocalStorage = (measureList: any, scoreName: string) => {
  let highlightedBoxes = JSON.parse(window!.localStorage.getItem(scoreName) as string);
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let coloredBoxes = [];

  for (let measure = 0; measure <= lastMeasureNumber; measure++) {
    let measureDifficulty = highlightedBoxes[measure];
    if (measureDifficulty && measureDifficulty !== "None"){
      // @ts-ignore
      let measureColor = difficultyToColor[measureDifficulty];
      renderBoundingBoxes([measure], measureColor, measureList, scoreName, false);
      coloredBoxes.push(measure);
    }
  }
  if (coloredBoxes.length === 0){
    return measureList[0][0].MeasureNumber;

  }
  // eel.save_to_json(scoreName, highlightedBoxes); // todo if uncommented it is called forever nonstop

  return coloredBoxes[coloredBoxes.length - 1] + 1;

}

export const cleanAllBoxes = () => {
  const boxes = document.querySelectorAll(".boundingBox");
  boxes.forEach((box) => {
    box.remove();
  });

};

export const cleanBox = (boxNumber: number, scoreName: string) => {
  const boxes = document.querySelectorAll(".box".concat(boxNumber.toString()));
  if (boxes.length > 0){
  boxes.forEach((box) => {
    box.remove();
  });}
  let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName) as string);
  highlightedBoxes[boxNumber] = "None";
  window.localStorage.setItem(scoreName, JSON.stringify( highlightedBoxes));
};

export function initLocalStorageToNone(firstMeasureNumber: any, lastMeasureNumber: number, scoreName: string){
  let highlightedBoxes = {};

  for (let staff = firstMeasureNumber; staff < lastMeasureNumber + 1; staff++) {
    // @ts-ignore
    highlightedBoxes[staff] = "None";
  }
  window.localStorage.setItem(scoreName, JSON.stringify( highlightedBoxes));

  return highlightedBoxes;
}

export function renderBoxAndContinue(boxNumber: number, color: string, measureList: any, scoreName: string){
  let lastMeasureNumber = measureList[measureList.length - 1][0].MeasureNumber;
  let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName) as string);
  if (color === "#b7bbbd") {
    boxNumber -= 1;
  }
  cleanSelectBoxes();
  // @ts-ignore
  if (highlightedBoxes[boxNumber] !== colorToDifficulty[color]){
    cleanBox(boxNumber, scoreName);
    renderBoundingBoxes([boxNumber], color, measureList, scoreName);

  }
  if (boxNumber < lastMeasureNumber){
    boxNumber += 1;
  } else {
    boxNumber = lastMeasureNumber;
  }
  color = "#b7bbbd"
  renderBoundingBoxes([boxNumber], color, measureList, scoreName)
  return boxNumber;
}