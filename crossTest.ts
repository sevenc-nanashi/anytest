import { crossTestRegistrar } from "./runtimes/runner.ts";
import * as host from "./host.deno.ts";

/** Represents the runtime where the test should run. */
export type Runtime = "node" | "browser" | "deno" | "workerd" | "bun";

/** Options for initializing cross-test. */
export type TestOptions = {
  runtimes: Runtime[];
};

/** Register a cross-runtime test. */
export type CrossTestRegistrar = {
  (name: string, fn: Deno.TestDefinition["fn"]): void;
  (
    name: string,
    testOptions: Omit<Deno.TestDefinition, "name" | "fn" | "sanitizeOps">,
    fn: Deno.TestStepDefinition["fn"],
  ): void;
};

const calledFrom = new Set<string>();

/**
 * Create a cross-runtime test.
 *
 * > [!NOTE]
 * > You cannot call this function more than once in a file.
 *
 * @param file - The URL of the file where the test is created. You MUST set this to `import.meta.url`.
 * @param options - Options for initializing cross-test.
 *
 * @returns A function to register a test.
 */
export const createCrossTest = async (
  file: string,
  options: TestOptions,
): Promise<CrossTestRegistrar> => {
  if (calledFrom.has(file)) {
    throw new Error("createCrossTest can only be called once per file");
  }
  calledFrom.add(file);

  if (typeof Deno !== "undefined" && Deno.version) {
    const key = "crossTestHost" as string;
    // @ts-expect-error Some hack to remove esbuild warning
    return await host[key]({
      file,
      options,
    });
  }

  return crossTestRegistrar();
};
