export * from './bot/Bot';

export type ExtractedData = {
    screenshotBuffer?: Buffer;
    links?: Set<string>;
    filename?: string;
}