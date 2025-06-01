namespace CNum {
    export const floorPow2 = (num: number) => {
        for (let k = 0; k < 1024; ++k) {
            let p = Math.pow(2, k)

            if (p > num) {
                return p/2;
            }
        }

        return Infinity;
    }

    export const lerp = (a: number, b: number, alpha: number) => {
        return a + alpha * (b-a);
    }

    export const clamp = (
        num: number, a: number, b: number
    ): number => {
        return Math.min(Math.max(num, a), b);
    }
};

export { CNum };
