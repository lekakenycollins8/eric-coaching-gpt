import type { NextRequest } from "next/server";
export declare function createContext(req: NextRequest): Promise<{
    session: null;
}>;
export type Context = Awaited<ReturnType<typeof createContext>>;
//# sourceMappingURL=context.d.ts.map