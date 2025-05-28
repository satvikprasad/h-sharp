export namespace CMath {
    export interface CInt {
        real: number;
        imag: number;
    }

    export const fromRealArray = (
        x: Array<number>
    ): Array<CInt> => {
        return x.map((value: number, _index: number): CInt => {
            if (value == undefined) value = 0

            return fromReal(value);
        });
    }

    export const fromReal = (num: number): CInt => {
        return {
            real: num,
            imag: 0
        };
    }

    export const fromPolar = (mod: number, arg: number): CInt => {
        return {
            real: mod * Math.cos(arg),
            imag: mod * Math.sin(arg),
        };
    }

    export const multiply = (c1: CInt, c2: CInt): CInt => {
        return {
            real: c1.real * c2.real - c1.imag * c2.imag,
            imag: c1.real * c2.imag + c1.imag * c2.real,
        };
    }

    export const add = (c1: CInt, c2: CInt): CInt => {
        return {
            real: c1.real + c2.real,
            imag: c1.imag + c2.imag
        };
    }

    export const modSquared = (c1: CInt): number => {
        return c1.real*c1.real + c1.imag * c1.imag;
    }
    
    export const mod = (c1: CInt): number => {
        return Math.sqrt(modSquared(c1));
    }
}
