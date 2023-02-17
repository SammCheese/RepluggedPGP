import { types } from "replugged";

const patches: types.PlaintextPatch[] = [
  {
    replacements: [
      {
        // Chatbar Lock
        match: /,.=.\.activeCommand,.=.\.activeCommandOption,.{0,255},(.)=\[\];/,
        replace: "$&;try{$1.push(window.RPGP.PGPToggleButton)}catch{};",
      },
    ],
  },
];

export default patches;
