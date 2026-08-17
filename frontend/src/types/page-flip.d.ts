declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, setting: Record<string, any>);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    loadFromImages(imagesPaths: string[]): void;
    destroy(): void;
    turnToPage(pageNum: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(pageNum: number, corner?: 'top' | 'bottom'): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): 'portrait' | 'landscape';
    update(): void;
    on(event: string, callback: (e: any) => void): void;
    off(event: string): void;
  }
}

declare module 'react-pageflip';
