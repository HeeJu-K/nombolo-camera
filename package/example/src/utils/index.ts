export const getCurrentFrameWithDecimalZeroes = (
    frameNumber: number,
    totalDecimalZeroes: number
  ) => {
    console.log("HERE see get current frame: ", ("0".repeat(totalDecimalZeroes) + frameNumber).slice(-totalDecimalZeroes ))
    return ("0".repeat(totalDecimalZeroes) + frameNumber).slice(
      -totalDecimalZeroes
    );
  };
  
  export const getFrameGaps = (number: number, limit: number): Array<number> => {
    return [...Array(Math.floor(limit / number))].map((_, i) => number * i + 1);
  };
  