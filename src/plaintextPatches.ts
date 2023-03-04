import { types } from "replugged";

const patches: types.PlaintextPatch[] = [
  {
    replacements: [
      {
        // Chatbar Lock
        match: /(.)\.push.{1,}\(.{1,3},\{.{1,30}\},"gift"\)\)/,
        replace: "$&;try{$1.push(window?.RPGP?.PGPToggleButton)}catch{}",
      },
      {
        // Minipopover Lock
        match:
          /.\?(..)\(\{key:"reply-other",channel:(.{1,5}),message:(.{1,5}),label:.{1,50},icon:.{1,5},onClick:.{1,6}\}\):null/gm,
        replace: `$&,window?.RPGP?.buildPopover($1, $2, $3)`,
      },
    ],
  },
];

export default patches;
