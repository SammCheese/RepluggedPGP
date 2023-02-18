//import * as openpgp from "openpgp";

// @ts-expect-error SHUT UP
import * as openpgp from "https://unpkg.com/openpgp@5.5.0/dist/openpgp.min.mjs";

export const pgp = openpgp;
