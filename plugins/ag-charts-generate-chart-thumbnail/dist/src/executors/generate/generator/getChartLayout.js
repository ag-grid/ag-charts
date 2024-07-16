"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getChartLayout", {
    enumerable: true,
    get: function() {
        return getChartLayout;
    }
});
const _jsdom = require("jsdom");
function getChartLayout(indexHtml) {
    const { window: { document } } = new _jsdom.JSDOM(`<html><head><style></style></head><body>${indexHtml}</body></html>`);
    const chartContainers = Array.from(document.querySelectorAll('[id]'));
    const chartPositions = chartContainers.map((container)=>{
        const gridArea = container.style.gridArea;
        if (gridArea === '') return {
            row: 0,
            column: 0
        };
        const match = gridArea.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (match == null) throw new Error(`Expected grid-area to match format of 1 / 1. Received "${gridArea}".`);
        return {
            row: +match[1] - 1,
            column: +match[2] - 1
        };
    });
    let rows = 1;
    let columns = 1;
    chartPositions.forEach(({ row, column })=>{
        rows = Math.max(row + 1, rows);
        columns = Math.max(column + 1, columns);
    });
    return {
        rows,
        columns,
        charts: chartContainers.map((container, index)=>({
                id: container.id,
                row: chartPositions[index].row,
                column: chartPositions[index].column
            }))
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL2dldENoYXJ0TGF5b3V0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEpTRE9NIH0gZnJvbSAnanNkb20nO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hhcnRMYXlvdXQoaW5kZXhIdG1sOiBzdHJpbmcpIHtcbiAgICBjb25zdCB7XG4gICAgICAgIHdpbmRvdzogeyBkb2N1bWVudCB9LFxuICAgIH0gPSBuZXcgSlNET00oYDxodG1sPjxoZWFkPjxzdHlsZT48L3N0eWxlPjwvaGVhZD48Ym9keT4ke2luZGV4SHRtbH08L2JvZHk+PC9odG1sPmApO1xuXG4gICAgY29uc3QgY2hhcnRDb250YWluZXJzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PignW2lkXScpKTtcbiAgICBjb25zdCBjaGFydFBvc2l0aW9ucyA9IGNoYXJ0Q29udGFpbmVycy5tYXAoKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBncmlkQXJlYSA9IGNvbnRhaW5lci5zdHlsZS5ncmlkQXJlYTtcbiAgICAgICAgaWYgKGdyaWRBcmVhID09PSAnJykgcmV0dXJuIHsgcm93OiAwLCBjb2x1bW46IDAgfTtcblxuICAgICAgICBjb25zdCBtYXRjaCA9IGdyaWRBcmVhLm1hdGNoKC9eKFxcZCspXFxzKlxcL1xccyooXFxkKykkLyk7XG4gICAgICAgIGlmIChtYXRjaCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGdyaWQtYXJlYSB0byBtYXRjaCBmb3JtYXQgb2YgMSAvIDEuIFJlY2VpdmVkIFwiJHtncmlkQXJlYX1cIi5gKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcm93OiArbWF0Y2hbMV0gLSAxLFxuICAgICAgICAgICAgY29sdW1uOiArbWF0Y2hbMl0gLSAxLFxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgbGV0IHJvd3MgPSAxO1xuICAgIGxldCBjb2x1bW5zID0gMTtcbiAgICBjaGFydFBvc2l0aW9ucy5mb3JFYWNoKCh7IHJvdywgY29sdW1uIH0pID0+IHtcbiAgICAgICAgcm93cyA9IE1hdGgubWF4KHJvdyArIDEsIHJvd3MpO1xuICAgICAgICBjb2x1bW5zID0gTWF0aC5tYXgoY29sdW1uICsgMSwgY29sdW1ucyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByb3dzLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBjaGFydHM6IGNoYXJ0Q29udGFpbmVycy5tYXAoKGNvbnRhaW5lciwgaW5kZXgpID0+ICh7XG4gICAgICAgICAgICBpZDogY29udGFpbmVyLmlkLFxuICAgICAgICAgICAgcm93OiBjaGFydFBvc2l0aW9uc1tpbmRleF0ucm93LFxuICAgICAgICAgICAgY29sdW1uOiBjaGFydFBvc2l0aW9uc1tpbmRleF0uY29sdW1uLFxuICAgICAgICB9KSksXG4gICAgfTtcbn1cbiJdLCJuYW1lcyI6WyJnZXRDaGFydExheW91dCIsImluZGV4SHRtbCIsIndpbmRvdyIsImRvY3VtZW50IiwiSlNET00iLCJjaGFydENvbnRhaW5lcnMiLCJBcnJheSIsImZyb20iLCJxdWVyeVNlbGVjdG9yQWxsIiwiY2hhcnRQb3NpdGlvbnMiLCJtYXAiLCJjb250YWluZXIiLCJncmlkQXJlYSIsInN0eWxlIiwicm93IiwiY29sdW1uIiwibWF0Y2giLCJFcnJvciIsInJvd3MiLCJjb2x1bW5zIiwiZm9yRWFjaCIsIk1hdGgiLCJtYXgiLCJjaGFydHMiLCJpbmRleCIsImlkIl0sIm1hcHBpbmdzIjoiOzs7OytCQUVnQkE7OztlQUFBQTs7O3VCQUZNO0FBRWYsU0FBU0EsZUFBZUMsU0FBaUI7SUFDNUMsTUFBTSxFQUNGQyxRQUFRLEVBQUVDLFFBQVEsRUFBRSxFQUN2QixHQUFHLElBQUlDLFlBQUssQ0FBQyxDQUFDLHdDQUF3QyxFQUFFSCxVQUFVLGNBQWMsQ0FBQztJQUVsRixNQUFNSSxrQkFBa0JDLE1BQU1DLElBQUksQ0FBQ0osU0FBU0ssZ0JBQWdCLENBQWM7SUFDMUUsTUFBTUMsaUJBQWlCSixnQkFBZ0JLLEdBQUcsQ0FBQyxDQUFDQztRQUN4QyxNQUFNQyxXQUFXRCxVQUFVRSxLQUFLLENBQUNELFFBQVE7UUFDekMsSUFBSUEsYUFBYSxJQUFJLE9BQU87WUFBRUUsS0FBSztZQUFHQyxRQUFRO1FBQUU7UUFFaEQsTUFBTUMsUUFBUUosU0FBU0ksS0FBSyxDQUFDO1FBQzdCLElBQUlBLFNBQVMsTUFBTSxNQUFNLElBQUlDLE1BQU0sQ0FBQyx1REFBdUQsRUFBRUwsU0FBUyxFQUFFLENBQUM7UUFFekcsT0FBTztZQUNIRSxLQUFLLENBQUNFLEtBQUssQ0FBQyxFQUFFLEdBQUc7WUFDakJELFFBQVEsQ0FBQ0MsS0FBSyxDQUFDLEVBQUUsR0FBRztRQUN4QjtJQUNKO0lBRUEsSUFBSUUsT0FBTztJQUNYLElBQUlDLFVBQVU7SUFDZFYsZUFBZVcsT0FBTyxDQUFDLENBQUMsRUFBRU4sR0FBRyxFQUFFQyxNQUFNLEVBQUU7UUFDbkNHLE9BQU9HLEtBQUtDLEdBQUcsQ0FBQ1IsTUFBTSxHQUFHSTtRQUN6QkMsVUFBVUUsS0FBS0MsR0FBRyxDQUFDUCxTQUFTLEdBQUdJO0lBQ25DO0lBRUEsT0FBTztRQUNIRDtRQUNBQztRQUNBSSxRQUFRbEIsZ0JBQWdCSyxHQUFHLENBQUMsQ0FBQ0MsV0FBV2EsUUFBVyxDQUFBO2dCQUMvQ0MsSUFBSWQsVUFBVWMsRUFBRTtnQkFDaEJYLEtBQUtMLGNBQWMsQ0FBQ2UsTUFBTSxDQUFDVixHQUFHO2dCQUM5QkMsUUFBUU4sY0FBYyxDQUFDZSxNQUFNLENBQUNULE1BQU07WUFDeEMsQ0FBQTtJQUNKO0FBQ0oifQ==