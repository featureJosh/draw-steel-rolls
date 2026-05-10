declare global {
    var ds:
        | {
              rolls?: {
                  PowerRoll?: new (...args: any[]) => Roll;
              };
              CONFIG?: {
                  characteristics?: Record<
                      string,
                      {
                          label: string;
                          hint: string;
                          rollKey: string;
                      }
                  >;
              };
              CONST?: {
                  testOutcomes?: Record<string, unknown>;
              };
          }
        | undefined;

    interface GlobalThis {
        ds: typeof ds;
    }
}

export {};
