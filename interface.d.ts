export interface IElectronAPI {
    getSize: () => Promise<[Number, Number]>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}
