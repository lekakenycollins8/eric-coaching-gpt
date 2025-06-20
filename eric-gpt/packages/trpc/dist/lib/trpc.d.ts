export declare const t: {
    _config: import("@trpc/server/dist/unstable-core-do-not-import").RootConfig<{
        ctx: {
            session: null;
        };
        meta: object;
        errorShape: import("@trpc/server/dist/unstable-core-do-not-import").DefaultErrorShape;
        transformer: false;
    }>;
    procedure: import("@trpc/server/dist/unstable-core-do-not-import").ProcedureBuilder<{
        session: null;
    }, object, object, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, false>;
    middleware: <$ContextOverrides>(fn: import("@trpc/server/dist/unstable-core-do-not-import").MiddlewareFunction<{
        session: null;
    }, object, object, $ContextOverrides, unknown>) => import("@trpc/server/dist/unstable-core-do-not-import").MiddlewareBuilder<{
        session: null;
    }, object, $ContextOverrides, unknown>;
    router: <TInput extends import("@trpc/server/dist/unstable-core-do-not-import").CreateRouterOptions>(input: TInput) => import("@trpc/server/dist/unstable-core-do-not-import").BuiltRouter<{
        ctx: {
            session: null;
        };
        meta: object;
        errorShape: import("@trpc/server/dist/unstable-core-do-not-import").DefaultErrorShape;
        transformer: false;
    }, import("@trpc/server/dist/unstable-core-do-not-import").DecorateCreateRouterOptions<TInput>>;
    mergeRouters: typeof import("@trpc/server/dist/unstable-core-do-not-import").mergeRouters;
    createCallerFactory: <TRecord extends import("@trpc/server").RouterRecord>(router: Pick<import("@trpc/server/dist/unstable-core-do-not-import").Router<{
        ctx: {
            session: null;
        };
        meta: object;
        errorShape: import("@trpc/server/dist/unstable-core-do-not-import").DefaultErrorShape;
        transformer: false;
    }, TRecord>, "_def">) => import("@trpc/server/dist/unstable-core-do-not-import").RouterCaller<{
        ctx: {
            session: null;
        };
        meta: object;
        errorShape: import("@trpc/server/dist/unstable-core-do-not-import").DefaultErrorShape;
        transformer: false;
    }, TRecord>;
};
export declare const router: <TInput extends import("@trpc/server/dist/unstable-core-do-not-import").CreateRouterOptions>(input: TInput) => import("@trpc/server/dist/unstable-core-do-not-import").BuiltRouter<{
    ctx: {
        session: null;
    };
    meta: object;
    errorShape: import("@trpc/server/dist/unstable-core-do-not-import").DefaultErrorShape;
    transformer: false;
}, import("@trpc/server/dist/unstable-core-do-not-import").DecorateCreateRouterOptions<TInput>>;
export declare const publicProcedure: import("@trpc/server/dist/unstable-core-do-not-import").ProcedureBuilder<{
    session: null;
}, object, object, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, typeof import("@trpc/server/dist/unstable-core-do-not-import").unsetMarker, false>;
//# sourceMappingURL=trpc.d.ts.map