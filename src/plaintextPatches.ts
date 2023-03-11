import { types } from "replugged";

const patches: types.PlaintextPatch[] = [
  {
    replacements: [
      {
        // Chatbar Lock
        match: /(.)\.push.{1,}\(.{1,3},\{.{1,30}\},"gift"\)\)/,
        replace: "$&;try{$1.push(window?.RPGP?.PGPToggleButton)}catch{}",
      },
    ],
  },
];

export default patches;
