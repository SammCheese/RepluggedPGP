import { types } from "replugged";

const patches: types.PlaintextPatch[] = [
  {
    replacements: [
      {
        // Chatbar Lock
        match: /,.=.\.activeCommand,.=.\.activeCommandOption,.{0,255},(.)=\[\];/,
        replace: "$&;try{$1.push(window.RPGP.PGPToggleButton)}catch{};",
      },
      {
        // Minipopover Lock
        match:
          /.\?(..)\(\{key:"reply-other",channel:(.{1,5}),message:(.{1,5}),label:.{1,50},icon:.{1,5},onClick:.{1,6}\}\):null/gm,
        replace: `$&,($3.content.match("-----BEGIN")||$3?.attachments[0]?.filename=="message.txt")?$1({key:"pgp-decrypt",label:"PGP Actions",icon:window.RPGP.popoverIcon,channel:$2,message:$3,onClick:()=>window.RPGP.receiver($3)}):null`,
      },
    ],
  },
];

export default patches;
