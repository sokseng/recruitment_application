import { Box, ClickAwayListener, Popper } from '@mui/material';
import EmojiPickerReact from 'emoji-picker-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const EmojiPicker = ({ 
  onSelect, 
  onClose,
  anchorEl = null,
  placement = 'top-start',
  width = 350,
  height = 400
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  const handleEmojiClick = (emojiData) => {
    onSelect(emojiData.emoji);
  };

  const handleClickAway = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={placement}
      style={{ zIndex: 9999 }}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 10],
          },
        },
      ]}
    >
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: '12px',
          boxShadow: 3,
          overflow: 'hidden'
        }}>
          <EmojiPickerReact
            onEmojiClick={handleEmojiClick}
            width={width}
            height={height}
            theme="light"
            previewConfig={{
              showPreview: false
            }}
            searchPlaceholder={t('search_emojis')}
            skinTonesDisabled
          />
        </Box>
      </ClickAwayListener>
    </Popper>
  );
};

export default EmojiPicker;