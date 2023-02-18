interface KeyInfo {
  created: Date;
  user: {
    name: string;
    email: string;
    comment: string;
    userID: string;
  };
}

interface addFile {
  addFile: ({
    file: { file: File, platform: number },
    channelId: number,
    draftType: number,
  }) => void;
}
