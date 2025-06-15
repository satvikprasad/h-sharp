const lerp = (a: number, b: number, alpha: number) => {
    return a + alpha * (b-a);
}

const clamp = (
    num: number, a: number, b: number
): number => {
    return Math.min(Math.max(num, a), b);
}

export { 
    lerp,
    clamp,
};
