export async function createContext(req) {
    // No auth configured
    return {
        session: null,
    };
}
