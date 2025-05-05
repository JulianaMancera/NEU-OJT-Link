
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

export interface TimeEntry {
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  task: string;
  remarks: string;
}

const mergeSplitTimes = (rowData: string[]): string[] => {
  const merged: string[] = [];
  for (let i = 0; i < rowData.length; i++) {
    if (rowData[i + 1] && /^(AM|PM)$/i.test(rowData[i + 1])) {
      merged.push(`${rowData[i]}${rowData[i + 1]}`);
      i++; // skip the next
    } else {
      merged.push(rowData[i]);
    }
  }
  return merged;
};

const normalizeRowData = (rowData: string[]): string[] => {
  const merged: string[] = [];

  for (let i = 0; i < rowData.length; i++) {
    const curr = rowData[i];
    const next = rowData[i + 1];

    // Fix merged date+time like "04/6/20258:00AM"
    const match = curr.match(/^(\d{1,2}\/\d{1,2}\/\d{4})(\d{1,2}:\d{2}[AP]M)$/);
    if (match) {
      merged.push(match[1], match[2]);
      continue;
    }

    // Fix broken dates: "04/", "7", "/2025" => "04/7/2025"
    if (
      i + 2 < rowData.length &&
      /^\d{1,2}\/?$/.test(curr) &&
      /^\d{1,2}$/.test(next) &&
      /^\/?\d{4}$/.test(rowData[i + 2])
    ) {
      const fullDate = `${curr.replace('/', '')}/${next}/${rowData[i + 2].replace('/', '')}`;
      merged.push(fullDate);
      i += 2;
      continue;
    }

    // Merge times: "9", ":00AM" => "9:00AM"
    if (next && /^\:\d{2}(AM|PM)$/i.test(next) && /^\d+$/.test(curr)) {
      merged.push(curr + next);
      i++;
      continue;
    }

    // Merge broken words: "De", "bugging" => "Debugging"
    if (next && /^[a-zA-Z]+$/.test(curr) && /^[a-zA-Z]+$/.test(next)) {
      merged.push(curr + next);
      i++;
      continue;
    }

    if (curr.trim()) merged.push(curr);
  }

  return merged;
};

const processTableRow = (rowItems: any[], entries: TimeEntry[]) => {
  if (rowItems.length < 5) return;

  let rowData = rowItems.map(item => item.text).filter(text => text.trim() !== '');
  rowData = normalizeRowData(mergeSplitTimes(rowData));

  // Improved date extraction
  let date = '';
  let dateIndex = -1;

  for (let i = 0; i < rowData.length; i++) {
    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(rowData[i])) {
      date = rowData[i];
      dateIndex = i;
      break;
    }
  }

  if (dateIndex !== -1) {
    rowData.splice(dateIndex, 1);
  }

  console.log('Cleaned rowData:', rowData);

  if (date) {
    let timeIn = '';
    let timeOut = '';
    let hours = 0;
    let task = '';
    let remarks = '';

    const timePattern = /\d{1,2}:\d{2}[AP]M/i;
    const timesFound = rowData.filter(text => text.match(timePattern));
    if (timesFound.length >= 2) {
      timeIn = timesFound[0];
      timeOut = timesFound[1];
    }

    const hoursPattern = /^\d+$/;
    const hoursText = rowData.find(text => text.match(hoursPattern));
    if (hoursText) {
      hours = parseInt(hoursText, 10);
    }

    const nonMatchingItems = rowData.filter(text =>
      !text.match(timePattern) &&
      !text.match(hoursPattern) &&
      text.trim().length > 0
    );

    if (nonMatchingItems.length > 0) {
      task = nonMatchingItems[0];
      remarks = nonMatchingItems.slice(1).join(' ');
    }

    if (date && hours) {
      entries.push({ date, timeIn, timeOut, hours, task, remarks });
    }
  }
};

export const extractTableFromPdf = async (file: File): Promise<{ entries: TimeEntry[], totalHours: number }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const entries: TimeEntry[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items.map((item: any) => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      height: item.height
    }));

    const sortedItems = items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 1) return b.y - a.y;
      return a.x - b.x;
    });

    let currentRow: any[] = [];
    let lastY = 0;

    sortedItems.forEach((item) => {
      if (currentRow.length === 0 || Math.abs(item.y - lastY) < 10) {
        currentRow.push(item);
      } else {
        console.log('Raw row:', currentRow.map(i => i.text));
        processTableRow(currentRow, entries);
        currentRow = [item];
      }
      lastY = item.y;
    });

    if (currentRow.length > 0) {
      console.log('Raw row:', currentRow.map(i => i.text));
      processTableRow(currentRow, entries);
    }
  }

  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  return { entries, totalHours };
};

