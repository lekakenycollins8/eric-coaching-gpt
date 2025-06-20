export declare const appRouter: import("@trpc/server/dist/unstable-core-do-not-import").BuiltRouter<{
    ctx: {
        session: null;
    };
    meta: object;
    errorShape: import("@trpc/server/dist/unstable-core-do-not-import").DefaultErrorShape;
    transformer: false;
}, import("@trpc/server/dist/unstable-core-do-not-import").DecorateCreateRouterOptions<{
    healthCheck: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: string;
    }>;
}>>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=routers.d.ts.map