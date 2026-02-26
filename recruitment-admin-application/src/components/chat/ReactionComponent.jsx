import { Box, Tooltip } from "@mui/material";
import { useTranslation } from 'react-i18next';

function ReactionComponent({ messageId, reactionsData, onRemoveReact }) {
    const { t } = useTranslation();

    const reactionMap = {
        like: "👍",
        love: "❤️",
        laugh: "😂",
        wow: "😮",
        sad: "😢",
        angry: "😡",
    };

    const reactionNames = {
        like: t('like'),
        love: t('love'),
        laugh: t('laugh'),
        wow: t('wow'),
        sad: t('sad'),
        angry: t('angry'),
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
                        <Tooltip
                            key={reactionType}
                            title={isMine ? t('click_to_remove') : reactionNames[reactionType]}
                            arrow
                            placement="top"
                        >
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation();
                                    isMine && onRemoveReact(messageId)
                                }}
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
                        </Tooltip>
                    );
                }
            )}
        </Box>
    );
}

export default ReactionComponent;