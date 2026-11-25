export function validPublishAt(value: unknown): value is string;
export function isScheduled(data: {publish_at?: string; publication_approved?: boolean; released_at?: string}): boolean;
export function productSlug(ref: unknown): string;
export function due(data: {publish_at?: string}, now: Date): boolean;
export function scheduleReady(data: any, now: Date, imageExists: (path:string)=>boolean): boolean;
export function publicProduct(data: any, now: Date, imageExists: (path:string)=>boolean): boolean;
export function publicPost(data: any, now: Date, imageExists: (path:string)=>boolean, productIds:Set<string>): boolean;
export function editorialDate(timestamp: string): string;
export function releaseQueue(records: any[], now:Date, imageExists:(path:string)=>boolean): {release:any[];blocked:any[];fields:Map<any,Record<string,unknown>>};
