// A measure drawn as a panel by Pairs.astro: a claim over two rows of blocks.

export interface Row {
  who: string;
  /** Where the row's name leads, such as a release's notes. */
  href?: string;
  text: string;
  /** The row's part of the panel's scale, from 0 to 1. */
  share: number;
}

export interface Panel {
  label: string;
  /** "40× faster": the multiple is lit, the words after it are not. */
  claim: string;
  /** The grey row, then the lit one. */
  rows: [Row, Row];
}
