import { Box } from "@mui/material";

function ReactionComponent({ messageId, reactionsData, onRemoveReact }) {

    const reactionMap = {
        like: "👍",
        love: "❤️",
        laugh: "😂",
        wow: "😮",
        sad: "😢",
        angry: "😡",
    };

    const reactionColorMap = {
        like: "#1877F2",   // blue
        love: "#E0245E",   // red/pink
        laugh: "#F7B125",  // yellow
        wow: "#F7B125",    // yellow
        sad: "#F7B125",    // yellow
        angry: "#E9710F",  // orange
    };

    const messageReactions = reactionsData[messageId];

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 0.5
            }}
        >
            {Object.entries(messageReactions?.reactions || {}).map(
                ([reactionType, data]) => {

                    const isMine =
                        messageReactions?.my_reaction === reactionType;

                    return (
                        <Box
                            key={reactionType}
                            onClick={(e) => {
                                e.stopPropagation();
                                isMine && onRemoveReact(messageId)
                            }
                            }
                            sx={{
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 5,
                                fontSize: 13,
                                cursor: isMine ? 'pointer' : 'default',
                                bgcolor: isMine
                                    ? 'green'
                                    : 'grey.200',
                                color: isMine ? '#fff' : 'text.primary',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                transition: '0.2s',
                                '&:hover': {
                                    opacity: isMine ? 0.85 : 1
                                }
                            }}
                        >
                            <Box>{reactionMap[reactionType]}</Box>
                            <span>{data.count}</span>
                        </Box>
                    );
                }
            )}
        </Box>
    );
}

export default ReactionComponent;

