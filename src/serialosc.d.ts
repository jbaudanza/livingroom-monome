declare module 'serialosc' {
  export function start(): void;
  export function on(event: string, callback: (device: any) => void): void;
}