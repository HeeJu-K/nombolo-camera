export const getCurrentFrameWithDecimalZeroes = (
    frameNumber: number,
    totalDecimalZeroes: number
  ) => {
    return ("0".repeat(totalDecimalZeroes) + frameNumber).slice(
      -totalDecimalZeroes
    );
  };
  
  // export const getFrameGaps = (number: number, limit: number): Array<number> => {
  //   return [...Array(Math.floor(limit / number))].map((_, i) => number * i + 1);
  // };
  
  export function getFrameGaps(startValue: number, step: number, maxValue: number): number[] {
    const frameGapsArray = [];
    for (let i = startValue; i <= maxValue; i += step) {
      frameGapsArray.push(i);
    }
    return frameGapsArray;
  }