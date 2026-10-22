// Firenook's terminal screen, recorded by scripts/terminal/ and drawn as text.
// The server draws the last frame; the browser plays the frames in between.

export type Run = [text: string, style: string];

export interface Recording {
  /** The release it was recorded from. */
  version: string;
  cols: number;
  rows: number;
  /** At each time (seconds from the first frame), the rows that changed. */
  frames: { t: number; d: [row: number, runs: Run[]][] }[];
}

/** The screen once every frame has played. */
export function lastScreen(recording: Recording): Run[][] {
  const rows: Run[][] = Array.from({ length: recording.rows }, () => []);
  for (const frame of recording.frames) for (const [y, runs] of frame.d) rows[y] = runs;
  return rows;
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * One row as HTML. Characters outside ASCII (box drawing, blocks, ticks) come
 * from whichever monospace font has them, so each stretch of them is held to
 * its width in columns and the grid lines up whatever the font.
 */
export function rowHtml(runs: Run[]): string {
  let html = '';
  for (const [text, style] of runs) {
    let inner = '';
    for (const part of text.match(/[\x00-\x7f]+|[^\x00-\x7f]+/g) ?? []) {
      if (/^[\x00-\x7f]/.test(part)) inner += escape(part);
      else {
        const columns = [...part].length;
        inner += `<span class="w" style="width:${columns}ch">${escape(part)}</span>`;
      }
    }
    html += style ? `<span class="${style}">${inner}</span>` : inner;
  }
  return html;
}

export const screenHtml = (rows: Run[][]) => rows.map((runs) => rowHtml(runs)).join('\n');
