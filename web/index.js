import { MusicSheet, OpenSheetMusicDisplay, PointF2D } from "./opensheetmusicdisplay.min.js";
import {
  renderBoundingBoxes,
  cleanSelectBoxes,
  cleanBox,
  cleanAllBoxes,
  initLocalStorageToNone,
  renderBoxAndContinue
} from "./boundingBoxes";
import { colorToDifficulty, keyToColor, mousePosition } from "./utils";

const selectColor = "#b7bbbd";
export const musicSheet = new OpenSheetMusicDisplay("musicSheet");
export let currentBox = 0; 
export let color = selectColor;
export const scoreName = "Minuet_in_G";
let hideBoundingBoxes = false;

function getLastMeasure(measureList){
  return measureList[measureList.length - 1][0].MeasureNumber;
}

(async () => {
  await musicSheet.load("./static/Minuet_in_G_Major.musicxml");
  musicSheet.render();
  let thisMeasureList = musicSheet.GraphicSheet.MeasureList;
  let lastMeasureNumber = getLastMeasure(thisMeasureList);
  initLocalStorageToNone(lastMeasureNumber);
  renderBoundingBoxes([currentBox], color);  // render box 0 in gray on start
})();


function selectNextBox() {
  color = selectColor;
  let thisMeasureList = musicSheet.GraphicSheet.MeasureList;
  let lastMeasureNumber = getLastMeasure(thisMeasureList);
  cleanSelectBoxes();
  
  currentBox += 1;
  console.log("Current box: ", currentBox);

  renderBoundingBoxes([currentBox], color);

  if (currentBox >= lastMeasureNumber) {
    currentBox = lastMeasureNumber;
  }

};

function selectPreviousBox() {
  color = selectColor;
  cleanSelectBoxes();
  currentBox -= 1;
  console.log("Current box: ", currentBox);
  if (currentBox <= 0) {
    currentBox = 0;
  }
  renderBoundingBoxes([currentBox], color);

};


window.onmousedown = function highlightBoxesWithMouse(event) {

  if (event.shiftKey && color != "#b7bbbd") {

    console.log(color);
    cleanSelectBoxes();

    let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName));
    let initPos = mousePosition(event);
    let maxDist = new PointF2D(5, 5);

    let initNearestNote = musicSheet.GraphicSheet.GetNearestNote(
      initPos,
      maxDist
    );
    let initMeasure = initNearestNote.sourceNote.SourceMeasure.MeasureNumber;

    onmouseup = (event) => {
      if (color == "#b7bbbd") {
        return
      }

      if (event.shiftKey) {

        let finalPos = mousePosition(event);
        let finalNearestNote = musicSheet.GraphicSheet.GetNearestNote(
          finalPos,
          maxDist
        );
        let finalMeasure =
          finalNearestNote.sourceNote.SourceMeasure.MeasureNumber;
        if (finalMeasure < initMeasure) {  // if selection is from right to left, swap init and final
          const previousFinalMeasure = finalMeasure;
          finalMeasure = initMeasure;
          initMeasure = previousFinalMeasure;
        }
        currentBox = finalMeasure;
        for (let measure = initMeasure; measure < finalMeasure + 1; measure++) {
          if (highlightedBoxes[measure] != colorToDifficulty[color]) {
            cleanBox(measure);
            renderBoundingBoxes([measure], color);            
          }
        }
      }
      
      currentBox += 1;
      renderBoundingBoxes([currentBox], selectColor)
    };
  } else {
    return;
  }
};


document.onkeydown = function (e) {
  let thisMeasureList = musicSheet.GraphicSheet.MeasureList;
  let lastMeasureNumber =
    thisMeasureList[thisMeasureList.length - 1][0].MeasureNumber;
  if (e.code == "ArrowLeft"){
    if (currentBox > -1) {
      selectPreviousBox();
      hideBoundingBoxes = false;
    }
  }
  else if (e.code == "ArrowRight"){
    if (currentBox < lastMeasureNumber) {
      selectNextBox();
      hideBoundingBoxes = false;

    }
      }
  else if (e.code == "Escape"){
    currentBox = 0;
    cleanAllBoxes();
    color = selectColor;
    let highlightedBoxes = initLocalStorageToNone(lastMeasureNumber);
    window.localStorage.setItem(scoreName, JSON.stringify( highlightedBoxes));
  }

  else if (e.code == "Backspace"){
    cleanBox(currentBox);
    if (currentBox > 0){
      cleanSelectBoxes();
      currentBox -= 1;
    } else {
      currentBox = 0;
    
    }

    color = selectColor;
    renderBoundingBoxes([currentBox], selectColor);
  }
  else if (e.code == "Digit1" || e.code == "Numpad1"){
    color = keyToColor["1"];
    if (currentBox <= lastMeasureNumber && !e.shiftKey){
      currentBox = renderBoxAndContinue(currentBox, color, lastMeasureNumber);
    }
  }
  else if (e.code == "Digit2" || e.code == "Numpad2"){
    color = keyToColor["2"];
    if (currentBox <= lastMeasureNumber && !e.shiftKey){
      currentBox = renderBoxAndContinue(currentBox, color, lastMeasureNumber);
    }
  }
  
  else if (e.code == "Digit3" || e.code == "Numpad3"){
    color = keyToColor["3"];
    if (currentBox <= lastMeasureNumber && !e.shiftKey){
      currentBox = renderBoxAndContinue(currentBox, color, lastMeasureNumber);
    }
  }

  else if (e.code == "KeyH"){
    hideBoundingBoxes = !hideBoundingBoxes;
    if (hideBoundingBoxes) {
      cleanSelectBoxes();
    } else {
      renderBoundingBoxes([currentBox], selectColor)
    }
  }
  
};